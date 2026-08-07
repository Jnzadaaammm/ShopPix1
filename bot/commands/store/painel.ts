import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { api } from "../../api-client";
import { isStoreAdmin, formatBRL, formatDate } from "../../lib/helpers";

export const data = new SlashCommandBuilder()
  .setName("painel")
  .setDescription("Mostra um resumo da loja: faturamento, pedidos, produtos. (admin)");

export async function execute(interaction: any) {
  if (!isStoreAdmin(interaction.member)) {
    return interaction.reply({
      content: "❌ Você não tem permissão para ver o painel.",
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const data = await api.getDashboard();

    const embed = new EmbedBuilder()
      .setTitle("📊 Painel da Loja")
      .setColor(0x5865f2)
      .addFields(
        { name: "💰 Faturamento", value: formatBRL(data.revenue), inline: true },
        { name: "📦 Produtos", value: `${data.counts.products}`, inline: true },
        { name: "👥 Usuários", value: `${data.counts.users}`, inline: true },
        { name: "⏳ Pendentes", value: `${data.counts.ordersPending}`, inline: true },
        { name: "🔔 Aguardando aprovação", value: `${data.counts.ordersAwaitingApproval}`, inline: true },
        { name: "✅ Pagos", value: `${data.counts.ordersPaid}`, inline: true },
        { name: "❌ Cancelados", value: `${data.counts.ordersCancelled}`, inline: true },
      );

    if (data.recentOrders && data.recentOrders.length > 0) {
      embed.addFields({
        name: "🕒 Pedidos recentes",
        value: data.recentOrders
          .map((o: any) => `#${o.id.slice(-8).toUpperCase()} — ${o.status} — ${formatBRL(o.total)}`)
          .join("\n"),
        inline: false,
      });
    }

    if (data.counts.ordersAwaitingApproval > 0) {
      embed.setDescription(`🔔 **${data.counts.ordersAwaitingApproval} pedido(s) aguardando aprovação!** Use \`/aprovar <id>\` para liberar.`);
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    await interaction.editReply(`❌ ${err.message}`);
  }
}
