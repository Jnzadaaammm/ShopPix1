import { SlashCommandBuilder } from "discord.js";
import { api } from "../../api-client";
import { isStoreOwner, formatBRL } from "../../lib/helpers";

export const data = new SlashCommandBuilder()
  .setName("rejeitar")
  .setDescription("Rejeita/cancela um pedido pendente. (dono)")
  .addStringOption((o) => o.setName("id").setDescription("ID do pedido").setRequired(true))
  .addStringOption((o) => o.setName("motivo").setDescription("Motivo da rejeição").setRequired(false));

export async function execute(interaction: any) {
  const isOwner = isStoreOwner(interaction.member);
  if (!isOwner) {
    return interaction.reply({
      content: "❌ Apenas o dono da loja pode rejeitar pedidos.",
      ephemeral: true,
    });
  }

  const id = interaction.options.getString("id");
  const reason = interaction.options.getString("motivo") || undefined;
  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await api.rejectOrder(id, reason);
    await interaction.editReply(
      `❌ Pedido **#${result.order.id.slice(-8).toUpperCase()}** rejeitado.\nTotal: ${formatBRL(result.order.total)}${result.order.rejectionReason ? `\nMotivo: ${result.order.rejectionReason}` : ""}`,
    );
  } catch (err: any) {
    await interaction.editReply(`❌ ${err.message}`);
  }
}
