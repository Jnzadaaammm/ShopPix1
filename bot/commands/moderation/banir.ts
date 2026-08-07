import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("banir")
  .setDescription("Bane um membro do servidor.")
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addUserOption((o) => o.setName("usuario").setDescription("Usuário a banir").setRequired(true))
  .addStringOption((o) => o.setName("motivo").setDescription("Motivo do banimento").setRequired(false));

export async function execute(interaction: any) {
  const user = interaction.options.getUser("usuario");
  const motivo = interaction.options.getString("motivo") || "Não informado";
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    return interaction.reply({ content: "❌ Membro não encontrado.", ephemeral: true });
  }
  if (member.roles.highest.position >= interaction.member.roles.highest.position) {
    return interaction.reply({
      content: "❌ Você não pode banir alguém com cargo igual ou superior ao seu.",
      ephemeral: true,
    });
  }
  await member.ban({ reason: `${motivo} (por ${interaction.user.tag})` });
  await interaction.reply(`🔨 **${user.tag}** foi banido.\nMotivo: ${motivo}`);
}
