import { prisma } from "./db";
import { deliverDigitalProducts } from "./digital-delivery";
import { checkAndUpgradeRole } from "./roles";
import { emit, REALTIME_EVENTS } from "./event-bus";

/**
 * Pagamento confirmado pelo gateway. NÃO entrega o produto: o pedido fica
 * aguardando a aprovação manual do dono da loja.
 */
export async function markAwaitingApproval(orderId: string) {
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "AWAITING_APPROVAL" },
    include: { items: { include: { product: true } } },
  });
  emit(REALTIME_EVENTS.ORDER_PAID, { orderId });
  return updated;
}

/**
 * Aprovação do dono: libera o pedido, entrega os produtos digitais e
 * atualiza o cargo do cliente.
 */
export async function approveAndDeliver(orderId: string, ownerEmail: string) {
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      approvedAt: new Date(),
      approvedBy: ownerEmail,
      rejectedAt: null,
      rejectionReason: null,
    },
    include: { items: { include: { product: true } } },
  });
  emit(REALTIME_EVENTS.ORDER_PAID, { orderId });
  try {
    await deliverDigitalProducts(orderId);
  } catch (error) {
    console.error("Erro ao entregar produtos digitais:", error);
  }
  // Verificar promoção de cargo automática
  try {
    const result = await checkAndUpgradeRole(updated.userId);
    if (result.upgraded) {
      console.log(
        `Cargo atualizado: ${result.oldRoleName} → ${result.newRoleName} (user ${updated.userId})`
      );
    }
  } catch (error) {
    console.error("Erro ao verificar promoção de cargo:", error);
  }
  return updated;
}

/**
 * Libera as credenciais reservadas quando um pedido é cancelado/expirado.
 * Atualiza o estoque de produtos do tipo CREDENTIALS.
 */
export async function releaseReservedCredentials(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  for (const item of order.items) {
    await prisma.productCredential.updateMany({
      where: { orderItemId: item.id, status: "RESERVED" },
      data: { status: "AVAILABLE", orderItemId: null },
    });
    if (!item.productId) continue;
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });
    if (product && product.stockMode === "CREDENTIALS") {
      const available = await prisma.productCredential.count({
        where: { productId: item.productId, status: "AVAILABLE" },
      });
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: available },
      });
    }
  }
}
