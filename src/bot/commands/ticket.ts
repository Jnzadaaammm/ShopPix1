import { Client, EmbedBuilder, Message, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { prisma } from "@/lib/db";
import type { BotCommand } from "./index";

const ticket: BotCommand = {
  name: "ticket",
  description: "Abre um canal de suporte",

  async execute(_args, message) {
    const guild = message.guild;
    if (!guild) {
      await message.reply("Esse comando só funciona em servidores.");
      return;
    }

    const channelName = `ticket-${message.author.username}`.toLowerCase().replace(/\s+/g, "-");

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: ["ViewChannel"] },
        { id: message.author.id, allow: ["ViewChannel", "SendMessages"] },
      ],
    });

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle("🎫 Novo Ticket")
      .setDescription(`Ticket aberto por <@${message.author.id}>.\nAguarde um administrador responder.`);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("fechar_ticket").setLabel("Fechar Ticket").setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [row] });

    await prisma.ticket.create({
      data: {
        subject: `Ticket Discord - ${message.author.username}`,
        category: "general",
        status: "OPEN",
        userId: message.author.id,
      },
    });

    await message.reply(`Ticket criado: <#${channel.id}>`);
  },
};

export default ticket;
