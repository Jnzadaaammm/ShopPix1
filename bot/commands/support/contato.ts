import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { api } from "../../api-client";

export const data = new SlashCommandBuilder()
  .setName("contato")
  .setDescription("Mostra as informações de contato da loja.");

export async function execute(interaction: any) {
  try {
    const settings = await api.getSettings();

    const embed = new EmbedBuilder()
      .setTitle(`📞 Contato — ${settings.storeName}`)
      .setColor(0x2ecc71)
      .setDescription(settings.storeDescription)
      .addFields(
        { name: "🌐 Site", value: settings.siteUrl || "—", inline: false },
        { name: "📧 E-mail", value: settings.supportEmail || "Contate via ticket", inline: false },
        { name: "🎫 Suporte", value: "Abra um ticket com `/ticket <assunto>`", inline: false },
      )
      .setFooter({ text: "Horário de atendimento: Seg–Sex, 9h às 18h" });

    await interaction.reply({ embeds: [embed] });
  } catch (err: any) {
    await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
  }
}
