import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBotAuth } from "@/lib/bot-auth";
import { approveAndDeliver, releaseReservedCredentials } from "@/lib/order-approval";

/**
 * POST /api/bot/orders/[id]/approve — aprova e entrega um pedido.
 * Permissão: orders.manage (ou *)
 *
 * Requer que o pedido esteja PENDING ou AWAITING_APPROVAL.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireBotAuth(request, "orders.manage");
  if (!auth.ok) return auth.error;

  const { id } = await params;
  let order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    order = await prisma.order.findFirst({ where: { id: { endsWith: id } } });
  }
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  if (order.status !== "PENDING" && order.status !== "AWAITING_APPROVAL") {
    return NextResponse.json(
      { error: `Pedido está com status ${order.status}. Só é possível aprovar PENDING ou AWAITING_APPROVAL.` },
      { status: 400 },
    );
  }

  try {
    const approved = await approveAndDeliver(order.id, `bot:${auth.apiKey.name}`);
    return NextResponse.json({
      success: true,
      order: {
        id: approved.id,
        status: approved.status,
        total: approved.total,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Erro ao aprovar: ${error.message}` },
      { status: 500 },
    );
  }
}
