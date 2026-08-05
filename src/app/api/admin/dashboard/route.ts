import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Qualquer pessoa da equipe (TEAM) pode ver o dashboard
  const role = (session.user as any)?.role;
  if (role?.type !== "TEAM") {
    return forbiddenResponse("Acesso restrito à equipe");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

  const [
    totalRevenue,
    totalOrders,
    paidOrdersCount,
    pendingOrdersCount,
    cancelledOrdersCount,
    todayRevenue,
    yesterdayRevenue,
    productCount,
    lowStockCount,
    userCount,
    adminCount,
    recentOrders,
    topProducts,
    dailyRevenue,
    monthRevenue,
    lastMonthRevenue,
    awaitingApprovalCount,
  ] = await Promise.all([
    // Receita total
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { total: true },
    }),

    // Total de pedidos
    prisma.order.count(),

    // Pedidos pagos
    prisma.order.count({ where: { status: "PAID" } }),

    // Pendentes
    prisma.order.count({ where: { status: "PENDING" } }),

    // Cancelados
    prisma.order.count({ where: { status: "CANCELLED" } }),

    // Receita hoje
    prisma.order.aggregate({
      where: { status: "PAID", createdAt: { gte: today } },
      _sum: { total: true },
    }),

    // Receita ontem
    prisma.order.aggregate({
      where: {
        status: "PAID",
        createdAt: { gte: yesterday, lt: today },
      },
      _sum: { total: true },
    }),

    // Produtos
    prisma.product.count(),

    // Estoque baixo
    prisma.product.count({
      where: { stockMode: "CREDENTIALS", stock: { lte: 5 } },
    }),

    // Usuários
    prisma.user.count(),

    // Admins
    prisma.user.count({ where: { isAdmin: true } }),

    // Últimos 5 pedidos
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        paymentMethod: true,
        user: { select: { name: true, email: true } },
        items: { select: { productName: true, quantity: true, price: true } },
      },
    }),

    // Top 5 produtos vendidos
    prisma.orderItem.findMany({
      where: { order: { status: "PAID" } },
      select: {
        productName: true,
        quantity: true,
        price: true,
        product: { select: { id: true, name: true } },
      },
    }),

    // Receita por dia (últimos 7)
    prisma.order.findMany({
      where: { status: "PAID", createdAt: { gte: last7Days } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    // Receita do mês atual
    prisma.order.aggregate({
      where: { status: "PAID", createdAt: { gte: startOfMonth } },
      _sum: { total: true },
    }),

    // Receita do mês passado
    prisma.order.aggregate({
      where: { status: "PAID", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { total: true },
    }),

    // Pedidos aguardando aprovação
    prisma.order.count({ where: { status: "AWAITING_APPROVAL" } }),
  ]);

  // Agregar top produtos
  const productSales = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const item of topProducts) {
    const name = item.product?.name || item.productName || "Produto removido";
    const existing = productSales.get(name) || { name, qty: 0, revenue: 0 };
    existing.qty += item.quantity;
    existing.revenue += item.price * item.quantity;
    productSales.set(name, existing);
  }
  const topProductsList = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Agregar receita por dia
  const dailyMap = new Map<string, number>();
  for (const order of dailyRevenue) {
    const dateKey = new Date(order.createdAt).toISOString().split("T")[0];
    const existing = dailyMap.get(dateKey) || 0;
    dailyMap.set(dateKey, existing + order.total);
  }

  const dailyData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyData.push({ date: d, revenue: dailyMap.get(key) || 0 });
  }

  return NextResponse.json({
    totalRevenue: totalRevenue._sum.total || 0,
    totalOrders,
    paidOrders: paidOrdersCount,
    pendingOrders: pendingOrdersCount,
    cancelledOrders: cancelledOrdersCount,
    awaitingApproval: awaitingApprovalCount,
    todayRevenue: todayRevenue._sum.total || 0,
    yesterdayRevenue: yesterdayRevenue._sum.total || 0,
    monthRevenue: monthRevenue._sum.total || 0,
    lastMonthRevenue: lastMonthRevenue._sum.total || 0,
    conversionRate: totalOrders > 0 ? (paidOrdersCount / totalOrders) * 100 : 0,
    productCount,
    lowStockCount,
    userCount,
    adminCount,
    recentOrders,
    topProducts: topProductsList,
    dailyRevenue: dailyData,
  });
}
