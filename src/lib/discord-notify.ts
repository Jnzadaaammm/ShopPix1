import { prisma } from "./db";
import { getStoreSettings } from "./settings";

async function getWebhookUrl(): Promise<string | undefined> {
  let webhookUrl = process.env.DISCORD_ORDERS_WEBHOOK_URL;
  try {
    const store = await getStoreSettings();
    if (store.discordWebhookUrl) webhookUrl = store.discordWebhookUrl;
  } catch {}
  return webhookUrl;
}

function formatItems(items: { productName: string | null; quantity: number; price: number }[]) {
  return items
    .map((i) => `• ${i.productName || "Produto"} x${i.quantity} — R$ ${(i.price * i.quantity).toFixed(2)}`)
    .join("\n");
}

function methodLabel(method: string) {
  return (
    {
      stripe: "Cartão (Stripe)",
      paypal: "PayPal",
      pix: "PIX Manual",
    }[method] || method
  );
}

async function loadOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { productName: true, quantity: true, price: true } },
    },
  });
}

async function sendWebhook(embed: any) {
  const webhookUrl = await getWebhookUrl();
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (error) {
    console.error("[Discord] Erro ao enviar webhook:", error);
  }
}

/**
 * Notifica quando um pedido é criado.
 */
export async function notifyOrderCreated(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return;

  await sendWebhook({
    title: `🛒 Novo Pedido #${order.id.slice(-8).toUpperCase()}`,
    description: `**Cliente:** ${order.user?.name || order.user?.email || "Desconhecido"}\n**Método:** ${methodLabel(order.paymentMethod)}\n**Status:** ${order.status}\n\n**Itens:**\n${formatItems(order.items)}`,
    color: 0x00b894,
    fields: [
      { name: "💰 Total", value: `R$ ${order.total.toFixed(2)}`, inline: true },
      { name: "📅 Data", value: new Date(order.createdAt).toLocaleString("pt-BR"), inline: true },
    ],
    footer: { text: "ShopPix — Novo pedido recebido" },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Notifica quando um pedido é pago/aprovado.
 */
export async function notifyOrderPaid(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return;

  await sendWebhook({
    title: `💰 Pagamento Confirmado #${order.id.slice(-8).toUpperCase()}`,
    description: `**Cliente:** ${order.user?.name || order.user?.email || "Desconhecido"}\n**Método:** ${methodLabel(order.paymentMethod)}\n\n**Itens:**\n${formatItems(order.items)}`,
    color: 0x2ecc71,
    fields: [
      { name: "💰 Total", value: `R$ ${order.total.toFixed(2)}`, inline: true },
      { name: "✅ Status", value: order.status, inline: true },
    ],
    footer: { text: "ShopPix — Pagamento confirmado" },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Notifica quando um pedido é entregue (produtos digitais).
 */
export async function notifyOrderDelivered(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return;

  await sendWebhook({
    title: `📦 Pedido Entregue #${order.id.slice(-8).toUpperCase()}`,
    description: `**Cliente:** ${order.user?.name || order.user?.email || "Desconhecido"}\n**Itens:**\n${formatItems(order.items)}`,
    color: 0x3498db,
    fields: [
      { name: "💰 Total", value: `R$ ${order.total.toFixed(2)}`, inline: true },
      { name: "✅ Status", value: order.status, inline: true },
    ],
    footer: { text: "ShopPix — Produtos entregues" },
    timestamp: new Date().toISOString(),
  });
}
