import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import "dotenv/config";

const TICKET_CATEGORY = process.env.DISCORD_TICKET_CATEGORY_ID || null;
const STAFF_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID || process.env.DISCORD_SUPPORT_ROLE_ID || "";

export const data = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("Abre um canal de suporte privado com a equipe da loja.")
  .addStringOption((o) =>
    o.setName("assunto").setDescription("Descreva resumidamente seu problema").setRequired(true),
  );

export async function execute(interaction: any) {
  const assunto = interaction.options.getString("assunto");
  const member = interaction.member;
  const guild = interaction.guild;

  const channelName = `ticket-${member.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 50);

  // Verifica se já existe um ticket aberto
  const existing = guild.channels.cache.find(
    (c: any) => c.name === channelName && c.type === ChannelType.GuildText,
  );
  if (existing) {
    return interaction.reply({
      content: `Você já tem um ticket aberto: ${existing}`,
      ephemeral: true,
    });
  }

  const permissionOverwrites: any[] = [
    { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: member.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    },
    {
      id: guild.members.me.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
      ],
    },
  ];

  // Staff pode ver o ticket
  if (STAFF_ROLE_ID) {
    permissionOverwrites.push({
      id: STAFF_ROLE_ID,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    });
  }

  const options: any = {
    name: channelName,
    type: ChannelType.GuildText,
    permissionOverwrites,
  };
  if (TICKET_CATEGORY) options.parent = TICKET_CATEGORY;

  const channel = await guild.channels.create(options);

  const embed = new EmbedBuilder()
    .setTitle("🎫 Ticket de Suporte")
    .setColor(0x2ecc71)
    .setDescription(`Olá ${member}! 👋`)
    .addFields(
      { name: "Assunto", value: assunto, inline: false },
      { name: "Como funciona", value: "Descreva seu problema em detalhes. A equipe vai te responder aqui.\nUse `/fechar` quando o problema for resolvido.", inline: false },
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] });

  await interaction.reply({
    content: `✅ Ticket criado: ${channel}`,
    ephemeral: true,
  });
}
