import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { api } from "../../api-client";
import { isStoreAdmin, formatBRL, formatDate } from "../../lib/helpers";

export const data = new SlashCommandBuilder()
  .setName("pedido")
  .setDescription("Mostra detalhes de um pedido. (admin)")
  .addStringOption((o) => o.setName("id").setDescription("ID do pedido").setRequired(true));

export async function execute(interaction: any) {
  if (!isStoreAdmin(interaction.member)) {
    return interaction.reply({
      content: "❌ Você não tem permissão para ver pedidos.",
      ephemeral: true,
    });
  }

  const id = interaction.options.getString("id");
  await interaction.deferReply({ ephemeral: true });

  try {
    const order = await api.getOrder(id);

    const embed = new EmbedBuilder()
      .setTitle(`Pedido #${order.id.slice(-8).toUpperCase()}`)
      .setColor(0x3498db)
      .addFields(
        { name: "Status", value: order.status, inline: true },
        { name: "Pagamento", value: order.paymentMethod, inline: true },
        { name: "Total", value: formatBRL(order.total), inline: true },
        { name: "Cliente", value: `${order.user?.name || "—"}\n${order.user?.email || "—"}`, inline: false },
        {
          name: "Itens",
          value: order.items
            .map((i: any) => `${i.quantity}x ${i.productName} — ${formatBRL(i.price * i.quantity)}`)
            .join("\n"),
          inline: false,
        },
        { name: "Criado em", value: formatDate(order.createdAt), inline: false },
      )
      .setFooter({ text: `ID completo: ${order.id}` });

    await interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    await interaction.editReply(`❌ ${err.message}`);
  }
}
