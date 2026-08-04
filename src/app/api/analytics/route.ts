import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!(await userHasPermission(session.user.id, "reports.view"))) {
    return forbiddenResponse("Sem permissão para visualizar relatórios");
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "30"; // dias

  const days = parseInt(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Agregações em paralelo — muito mais leve que carregar todos os pedidos
  const [
    totalRevenueAgg,
    totalOrders,
    paidOrdersCount,
    statusCountsRaw,
    paymentMethodsRaw,
    dailyOrders,
    topItems,
  ] = await Promise.all([
    // Receita total (só PAID)
    prisma.order.aggregate({
      where: { createdAt: { gte: startDate }, status: "PAID" },
      _sum: { total: true },
    }),

    // Total de pedidos no período
    prisma.order.count({ where: { createdAt: { gte: startDate } } }),

    // Pedidos pagos
    prisma.order.count({ where: { createdAt: { gte: startDate }, status: "PAID" } }),

    // Contagem por status (group by)
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: startDate } },
      _count: { _all: true },
    }),

    // Vendas por método de pagamento
    prisma.order.groupBy({
      by: ["paymentMethod"],
      where: { createdAt: { gte: startDate }, status: "PAID" },
      _count: { _all: true },
      _sum: { total: true },
    }),

    // Pedidos pagos agrupados por dia (para o gráfico)
    prisma.order.findMany({
      where: { createdAt: { gte: startDate }, status: "PAID" },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    // Top produtos vendidos (itens de pedidos pagos)
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: startDate }, status: "PAID" } },
      select: {
        quantity: true,
        price: true,
        productName: true,
        product: { select: { name: true, category: { select: { name: true } } } },
      },
    }),
  ]);

  const totalRevenue = totalRevenueAgg._sum.total || 0;

  // Receita por dia
  const dailyData: { date: string; revenue: number; orders: number }[] = [];
  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  for (const o of dailyOrders) {
    const dateKey = new Date(o.createdAt).toISOString().split("T")[0];
    const existing = dailyMap.get(dateKey) || { revenue: 0, orders: 0 };
    existing.revenue += o.total;
    existing.orders += 1;
    dailyMap.set(dateKey, existing);
  }
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    const data = dailyMap.get(key) || { revenue: 0, orders: 0 };
    dailyData.push({ date: key, ...data });
  }

  // Vendas por categoria
  const categorySales = new Map<string, { name: string; revenue: number; qty: number }>();
  topItems.forEach((item) => {
    const catName = item.product?.category?.name || "Sem categoria";
    const existing = categorySales.get(catName) || { name: catName, revenue: 0, qty: 0 };
    existing.revenue += item.price * item.quantity;
    existing.qty += item.quantity;
    categorySales.set(catName, existing);
  });

  // Vendas por produto
  const productSales = new Map<string, { name: string; revenue: number; qty: number }>();
  topItems.forEach((item) => {
    const prodName = item.product?.name || item.productName || "Produto removido";
    const existing = productSales.get(prodName) || { name: prodName, revenue: 0, qty: 0 };
    existing.revenue += item.price * item.quantity;
    existing.qty += item.quantity;
    productSales.set(prodName, existing);
  });

  // Status counts
  const statusCounts: Record<string, number> = {};
  statusCountsRaw.forEach((s) => { statusCounts[s.status] = s._count._all; });

  // Payment methods
  const paymentMethods = paymentMethodsRaw.map((pm) => ({
    method: pm.paymentMethod,
    count: pm._count._all,
    revenue: pm._sum.total || 0,
  }));

  return NextResponse.json({
    period: days,
    summary: {
      totalRevenue,
      totalOrders,
      paidOrders: paidOrdersCount,
      avgTicket: paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0,
      conversionRate: totalOrders > 0 ? (paidOrdersCount / totalOrders) * 100 : 0,
    },
    dailyData,
    categorySales: Array.from(categorySales.values()).sort((a, b) => b.revenue - a.revenue),
    productSales: Array.from(productSales.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    paymentMethods,
    statusCounts,
  });
}
