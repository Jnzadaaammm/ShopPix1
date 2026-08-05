import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { confirmPaymentIntent, createStripePayment } from "@/lib/stripe";
import { capturePayPalOrder } from "@/lib/paypal";
import { emit, REALTIME_EVENTS } from "@/lib/event-bus";
import { requireOwner } from "@/lib/owner";
import {
  markAwaitingApproval,
  approveAndDeliver,
  releaseReservedCredentials,
} from "@/lib/order-approval";
import { getStoreSettings } from "@/lib/settings";
import { decryptCredential } from "@/lib/crypto";

function safeDecryptCredential(content: string): string {
  try {
    return decryptCredential(content);
  } catch {
    return content;
  }
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          productName: true,
          productImage: true,
          product: { select: { id: true, name: true, image: true, stockMode: true } },
          credentials: { select: { id: true, content: true, status: true } },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const decryptedOrder = {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      credentials: item.credentials.map((c) => ({
        ...c,
        content: safeDecryptCredential(c.content),
      })),
    })),
  };

  return NextResponse.json(decryptedOrder);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { action, paymentMethodId, paypalOrderId, paymentProof, reason } = await request.json();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const ownerCheck = await requireOwner();
  const isOwner = ownerCheck.ok;
  const isOwnOrder = order.userId === session.user?.id;

  if (!isOwnOrder && !isOwner) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  if (action === "approve" && isOwner) {
    if (order.status !== "AWAITING_APPROVAL" && order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Só é possível aprovar pedidos pendentes ou aguardando aprovação" },
        { status: 400 }
      );
    }

    const approved = await approveAndDeliver(order.id, session.user?.email || "");
    return NextResponse.json(approved);
  }

  if (action === "reject" && isOwner) {
    if (order.status === "PAID" || order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Não é possível rejeitar este pedido" },
        { status: 400 }
      );
    }

    await releaseReservedCredentials(order.id);
    const rejected = await prisma.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        rejectionReason: reason || null,
      },
      include: { items: { include: { product: true } } },
    });
    emit(REALTIME_EVENTS.ORDER_UPDATED, { orderId: order.id });
    return NextResponse.json(rejected);
  }

  if (action === "process_stripe_payment" && order.paymentMethod === "stripe" && order.status === "PENDING") {
    if (!paymentMethodId) {
      return NextResponse.json({ error: "paymentMethodId é obrigatório" }, { status: 400 });
    }

    try {
      const result = await createStripePayment(order.total, order.id, undefined, paymentMethodId);

      if (result.status !== "succeeded") {
        return NextResponse.json(
          { error: "Pagamento recusado ou pendente de confirmação" },
          { status: 402 }
        );
      }

      // Verificar aprovação automática
      const store = await getStoreSettings();
      if (store.autoApproveStripe) {
        const approved = await approveAndDeliver(order.id, "auto-stripe");
        return NextResponse.json(approved);
      }

      const updated = await markAwaitingApproval(order.id);
      return NextResponse.json(updated);
    } catch (error) {
      console.error("Erro no process_stripe_payment:", error);
      return NextResponse.json(
        { error: "Erro ao processar pagamento" },
        { status: 500 }
      );
    }
  }

  if (action === "capture_paypal" && order.paymentMethod === "paypal" && order.status === "PENDING") {
    try {
      const payPalOrderId = paypalOrderId || order.paypalOrderId;
      if (!payPalOrderId) {
        return NextResponse.json({ error: "ID da ordem PayPal não encontrado" }, { status: 400 });
      }

      const result = await capturePayPalOrder(payPalOrderId);

      if (result.status !== "COMPLETED") {
        return NextResponse.json(
          { error: "Pagamento PayPal não completado" },
          { status: 402 }
        );
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { paypalCaptureId: result.paypalCaptureId },
      });

      // Verificar aprovação automática
      const store = await getStoreSettings();
      if (store.autoApprovePaypal) {
        const approved = await approveAndDeliver(order.id, "auto-paypal");
        return NextResponse.json(approved);
      }

      const updated = await markAwaitingApproval(order.id);
      return NextResponse.json(updated);
    } catch (error) {
      console.error("Erro no capture_paypal:", error);
      return NextResponse.json(
        { error: "Erro ao processar pagamento PayPal" },
        { status: 500 }
      );
    }
  }

  if (action === "submit_pix_proof" && isOwnOrder) {
    if (order.paymentMethod !== "pix" || order.status !== "PENDING") {
      return NextResponse.json({ error: "Pedido não aceita comprovante PIX" }, { status: 400 });
    }

    if (!paymentProof || typeof paymentProof !== "string") {
      return NextResponse.json({ error: "Comprovante é obrigatório" }, { status: 400 });
    }

    if (paymentProof.length > 3_000_000) {
      return NextResponse.json({ error: "Comprovante muito grande (máx. ~2MB)" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProof,
        status: "AWAITING_APPROVAL",
      },
      include: { items: { include: { product: true } } },
    });

    emit(REALTIME_EVENTS.ORDER_UPDATED, { orderId: order.id });
    return NextResponse.json(updated);
  }

  if (action === "expired" && isOwner) {
    await releaseReservedCredentials(order.id);
    const expired = await prisma.order.update({
      where: { id },
      data: { status: "EXPIRED" },
      include: { items: { include: { product: true } } },
    });
    emit(REALTIME_EVENTS.ORDER_UPDATED, { orderId: order.id });
    return NextResponse.json(expired);
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
