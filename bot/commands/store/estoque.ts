import { SlashCommandBuilder } from "discord.js";
import { api } from "../../api-client";
import { isStoreAdmin } from "../../lib/helpers";

export const data = new SlashCommandBuilder()
  .setName("estoque")
  .setDescription("Atualiza o estoque de um produto (modo Credenciais). (admin)")
  .addStringOption((o) => o.setName("id").setDescription("ID do produto").setRequired(true))
  .addIntegerOption((o) =>
    o.setName("quantidade").setDescription("Novo valor de estoque").setRequired(true).setMinValue(0),
  );

export async function execute(interaction: any) {
  if (!isStoreAdmin(interaction.member)) {
    return interaction.reply({
      content: "❌ Você não tem permissão para alterar estoque.",
      ephemeral: true,
    });
  }

  const id = interaction.options.getString("id");
  const qty = interaction.options.getInteger("quantidade");

  await interaction.deferReply({ ephemeral: true });
  try {
    const updated = await api.updateProduct(id, { stock: qty });
    await interaction.editReply(
      `✅ Estoque de **${updated.name}** atualizado para ${updated.stock} credenciais.`,
    );
  } catch (err: any) {
    await interaction.editReply(`❌ ${err.message}`);
  }
}
