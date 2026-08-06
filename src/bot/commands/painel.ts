import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Client, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "./index";

const painel: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("painel")
    .setDescription("Abre o painel de controle da loja"),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle("🛒 Painel ShopPix")
      .setDescription("Gerencie sua loja diretamente pelo Discord.")
      .addFields(
        { name: "📦 Produtos", value: "Liste e gerencie produtos", inline: true },
        { name: "🛍️ Pedidos", value: "Veja pedidos recentes", inline: true },
        { name: "🎫 Suporte", value: "Abra um ticket de ajuda", inline: true }
      );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("painel_produtos").setLabel("Produtos").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("painel_pedidos").setLabel("Pedidos").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("painel_ticket").setLabel("Suporte").setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};

export default painel;
