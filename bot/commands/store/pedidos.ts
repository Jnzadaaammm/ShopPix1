import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { api } from "../../api-client";
import { isStoreAdmin, formatBRL, formatDate } from "../../lib/helpers";

export const data = new SlashCommandBuilder()
  .setName("pedidos")
  .setDescription("Lista os pedidos da loja. (admin)")
  .addStringOption((o) =>
    o
      .setName("status")
      .setDescription("Filtrar por status")
      .setRequired(false)
      .addChoices(
        { name: "Pendente", value: "PENDING" },
        { name: "Aguardando aprovação", value: "AWAITING_APPROVAL" },
        { name: "Pago", value: "PAID" },
        { name: "Cancelado", value: "CANCELLED" },
        { name: "Expirado", value: "EXPIRED" },
        { name: "Reembolsado", value: "REFUNDED" },
      ),
  );

export async function execute(interaction: any) {
  if (!isStoreAdmin(interaction.member)) {
    return interaction.reply({
      content: "❌ Você não tem permissão para ver pedidos.",
      ephemeral: true,
    });
  }

  const status = interaction.options.getString("status");
  await interaction.deferReply({ ephemeral: true });

  try {
    const { orders } = await api.listOrders(status || undefined);
    if (!orders.length) {
      return interaction.editReply("Nenhum pedido encontrado.");
    }

    const statusEmoji: Record<string, string> = {
      PENDING: "⏳",
      AWAITING_APPROVAL: "🔔",
      PAID: "✅",
      CANCELLED: "❌",
      EXPIRED: "⌛",
      REFUNDED: "↩️",
    };

    const embed = new EmbedBuilder()
      .setTitle("📦 Pedidos")
      .setColor(0xe67e22)
      .setDescription(`Total: ${orders.length}${status ? ` (status: ${status})` : ""}`)
      .addFields(
        orders.slice(0, 10).map((o: any) => ({
          name: `${statusEmoji[o.status] || "•"} #${o.id.slice(-8).toUpperCase()} — ${o.status}`,
          value: `Cliente: ${o.user?.name || o.user?.email || "—"}\nTotal: ${formatBRL(o.total)} • ${o.items.length} item(ns)\n${formatDate(o.createdAt)}`,
          inline: false,
        })),
      )
      .setFooter({ text: "Use /pedido <id> para ver detalhes" });

    await interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    await interaction.editReply(`❌ ${err.message}`);
  }
}
