import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("limpar")
  .setDescription("Apaga um número de mensagens recentes no canal.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addIntegerOption((o) =>
    o
      .setName("quantidade")
      .setDescription("Quantas mensagens apagar (1–100)")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100),
  );

export async function execute(interaction: any) {
  const qtd = interaction.options.getInteger("quantidade");
  await interaction.deferReply({ ephemeral: true });
  const deleted = await interaction.channel.bulkDelete(qtd, true).catch(() => null);
  if (deleted === null) {
    return interaction.editReply(
      "❌ Não foi possível apagar as mensagens (mensagens com mais de 14 dias não podem ser apagadas em lote).",
    );
  }
  await interaction.editReply(`🧹 ${deleted.size} mensagens apagadas.`);
}
