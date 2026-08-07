import { SlashCommandBuilder } from "discord.js";
import { api } from "../../api-client";
import { isStoreOwner, formatBRL } from "../../lib/helpers";

export const data = new SlashCommandBuilder()
  .setName("aprovar")
  .setDescription("Aprova um pedido pendente e entrega os produtos. (dono)")
  .addStringOption((o) => o.setName("id").setDescription("ID do pedido").setRequired(true));

export async function execute(interaction: any) {
  const isOwner = isStoreOwner(interaction.member);
  if (!isOwner) {
    return interaction.reply({
      content: "❌ Apenas o dono da loja pode aprovar pedidos.",
      ephemeral: true,
    });
  }

  const id = interaction.options.getString("id");
  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await api.approveOrder(id);
    await interaction.editReply(
      `✅ Pedido **#${result.order.id.slice(-8).toUpperCase()}** aprovado!\nTotal: ${formatBRL(result.order.total)} • Status: ${result.order.status}\nProdutos digitais entregues ao cliente.`,
    );
  } catch (err: any) {
    await interaction.editReply(`❌ ${err.message}`);
  }
}
