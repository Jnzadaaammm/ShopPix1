import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBotAuth } from "@/lib/bot-auth";
import { releaseReservedCredentials } from "@/lib/order-approval";

/**
 * POST /api/bot/orders/[id]/reject — rejeita/cancela um pedido.
 * Permissão: orders.manage (ou *)
 *
 * Body: { reason?: string }
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

  if (order.status === "PAID" || order.status === "CANCELLED") {
    return NextResponse.json(
      { error: `Não é possível rejeitar um pedido com status ${order.status}.` },
      { status: 400 },
    );
  }

  let reason: string | null = null;
  try {
    const body = await request.json();
    reason = body.reason || null;
  } catch {
    // body opcional
  }

  await releaseReservedCredentials(order.id);
  const rejected = await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED", rejectionReason: reason },
  });

  return NextResponse.json({
    success: true,
    order: {
      id: rejected.id,
      status: rejected.status,
      rejectionReason: rejected.rejectionReason,
    },
  });
}
