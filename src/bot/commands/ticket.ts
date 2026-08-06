import { ChatInputCommandInteraction, Client, SlashCommandBuilder, TextChannel, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { prisma } from "@/lib/db";
import type { BotCommand } from "./index";

const ticket: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Cria um canal de ticket de suporte"),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: "Esse comando só funciona em servidores.", ephemeral: true });
      return;
    }

    const member = guild.members.cache.get(interaction.user.id);
    const channelName = `ticket-${interaction.user.username}`;

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: ["ViewChannel"] },
        { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] },
      ],
    });

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle("🎫 Novo Ticket")
      .setDescription(`Ticket aberto por <@${interaction.user.id}>.\nAguarde um administrador responder.`);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("fechar_ticket").setLabel("Fechar Ticket").setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [row] });
    await prisma.ticket.create({
      data: {
        title: `Ticket Discord - ${interaction.user.username}`,
        description: "Aberto via bot do Discord",
        status: "OPEN",
        userId: interaction.user.id,
      },
    });

    await interaction.reply({ content: `Ticket criado: <#${channel.id}>`, ephemeral: true });
  },
};

export default ticket;
