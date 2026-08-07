import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("fechar")
  .setDescription("Fecha o ticket de suporte atual. (use dentro do canal do ticket)");

export async function execute(interaction: any) {
  const channel = interaction.channel;
  if (!channel || !channel.name?.startsWith("ticket-")) {
    return interaction.reply({
      content: "❌ Este comando só pode ser usado dentro de um canal de ticket.",
      ephemeral: true,
    });
  }
  await interaction.reply("🔒 Fechando o ticket em 5 segundos...");
  setTimeout(() => channel.delete().catch(() => {}), 5000);
}
