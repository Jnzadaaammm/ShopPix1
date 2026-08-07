import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("desmutar")
  .setDescription("Remove o timeout de um membro.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((o) => o.setName("usuario").setDescription("Usuário a desmutar").setRequired(true));

export async function execute(interaction: any) {
  const user = interaction.options.getUser("usuario");
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    return interaction.reply({ content: "❌ Membro não encontrado.", ephemeral: true });
  }
  await member.timeout(null);
  await interaction.reply(`🔊 **${user.tag}** foi desmutado.`);
}
