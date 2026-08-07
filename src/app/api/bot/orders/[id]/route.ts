import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBotAuth } from "@/lib/bot-auth";

/**
 * GET /api/bot/orders/[id] — detalhe de um pedido.
 * Aceita ID completo ou sufixo.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireBotAuth(request, "orders.view");
  if (!auth.ok) return auth.error;

  const { id } = await params;
  let order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { productName: true, quantity: true, price: true, productId: true } },
    },
  });

  if (!order) {
    order = await prisma.order.findFirst({
      where: { id: { endsWith: id } },
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { productName: true, quantity: true, price: true, productId: true } },
      },
    });
  }

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }
  return NextResponse.json(order);
}
