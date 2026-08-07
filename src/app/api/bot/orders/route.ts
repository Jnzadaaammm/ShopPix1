import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBotAuth } from "@/lib/bot-auth";

/**
 * GET /api/bot/orders — lista pedidos (com filtro de status).
 * Permissão: orders.view (ou *)
 */
export async function GET(request: Request) {
  const auth = await requireBotAuth(request, "orders.view");
  if (!auth.ok) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const orders = await prisma.order.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { productName: true, quantity: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ orders });
}
