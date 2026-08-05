import { prisma } from "./db";

/**
 * Envia uma notificação via Discord Webhook quando um pedido é criado.
 * Requer a variável de ambiente DISCORD_WEBHOOK_URL.
 */
export async function notifyOrderCreated(orderId: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { productName: true, quantity: true, price: true } },
      },
    });

    if (!order) return;

    const itemsList = order.items
      .map((i) => `• ${i.productName || "Produto"} x${i.quantity} — R$ ${(i.price * i.quantity).toFixed(2)}`)
      .join("\n");

    const methodLabel = {
      stripe: "Cartão (Stripe)",
      paypal: "PayPal",
      pix: "PIX Manual",
    }[order.paymentMethod] || order.paymentMethod;

    const embed = {
      title: `🛒 Novo Pedido #${order.id.slice(-8).toUpperCase()}`,
      description: `**Cliente:** ${order.user?.name || order.user?.email || "Desconhecido"}\n**Método:** ${methodLabel}\n**Status:** ${order.status}\n\n**Itens:**\n${itemsList}`,
      color: 0x00b894,
      fields: [
        {
          name: "💰 Total",
          value: `R$ ${order.total.toFixed(2)}`,
          inline: true,
        },
        {
          name: "📅 Data",
          value: new Date(order.createdAt).toLocaleString("pt-BR"),
          inline: true,
        },
      ],
      footer: { text: "ShopPix — Novo pedido recebido" },
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (error) {
    console.error("[Discord] Erro ao notificar pedido:", error);
  }
}
