import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("mutar")
  .setDescription("Muta um membro temporariamente (timeout).")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((o) => o.setName("usuario").setDescription("Usuário a mutar").setRequired(true))
  .addIntegerOption((o) =>
    o.setName("minutos").setDescription("Duração em minutos (máx 40320)").setRequired(true).setMinValue(1).setMaxValue(40320),
  )
  .addStringOption((o) => o.setName("motivo").setDescription("Motivo").setRequired(false));

export async function execute(interaction: any) {
  const user = interaction.options.getUser("usuario");
  const minutos = interaction.options.getInteger("minutos");
  const motivo = interaction.options.getString("motivo") || "Não informado";
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    return interaction.reply({ content: "❌ Membro não encontrado.", ephemeral: true });
  }
  if (member.roles.highest.position >= interaction.member.roles.highest.position) {
    return interaction.reply({
      content: "❌ Você não pode mutar alguém com cargo igual ou superior ao seu.",
      ephemeral: true,
    });
  }
  await member.timeout(minutos * 60_000, `${motivo} (por ${interaction.user.tag})`);
  await interaction.reply(`🔇 **${user.tag}** mutado por ${minutos} min.\nMotivo: ${motivo}`);
}
