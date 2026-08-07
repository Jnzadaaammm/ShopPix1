import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("expulsar")
  .setDescription("Expulsa um membro do servidor.")
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  .addUserOption((o) => o.setName("usuario").setDescription("Usuário a expulsar").setRequired(true))
  .addStringOption((o) => o.setName("motivo").setDescription("Motivo").setRequired(false));

export async function execute(interaction: any) {
  const user = interaction.options.getUser("usuario");
  const motivo = interaction.options.getString("motivo") || "Não informado";
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    return interaction.reply({ content: "❌ Membro não encontrado.", ephemeral: true });
  }
  if (member.roles.highest.position >= interaction.member.roles.highest.position) {
    return interaction.reply({
      content: "❌ Você não pode expulsar alguém com cargo igual ou superior ao seu.",
      ephemeral: true,
    });
  }
  await member.kick(`${motivo} (por ${interaction.user.tag})`);
  await interaction.reply(`👢 **${user.tag}** foi expulso.\nMotivo: ${motivo}`);
}
