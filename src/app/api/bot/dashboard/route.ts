import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBotAuth } from "@/lib/bot-auth";

/**
 * GET /api/bot/dashboard — resumo da loja (faturamento, contagens, pedidos recentes).
 * Permissão: orders.view (ou *)
 */
export async function GET(request: Request) {
  const auth = await requireBotAuth(request, "orders.view");
  if (!auth.ok) return auth.error;

  const [
    totalProducts,
    pendingOrders,
    awaitingOrders,
    paidOrders,
    cancelledOrders,
    totalUsers,
    revenueAgg,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "AWAITING_APPROVAL" } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.user.count(),
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, status: true, total: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    revenue: revenueAgg._sum.total || 0,
    counts: {
      products: totalProducts,
      users: totalUsers,
      ordersPending: pendingOrders,
      ordersAwaitingApproval: awaitingOrders,
      ordersPaid: paidOrders,
      ordersCancelled: cancelledOrders,
    },
    recentOrders,
  });
}
