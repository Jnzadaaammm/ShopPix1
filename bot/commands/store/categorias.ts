import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { api } from "../../api-client";
import { isStoreAdmin } from "../../lib/helpers";

export const data = new SlashCommandBuilder()
  .setName("categorias")
  .setDescription("Lista as categorias da loja. (admin)");

export async function execute(interaction: any) {
  if (!isStoreAdmin(interaction.member)) {
    return interaction.reply({
      content: "❌ Você não tem permissão para ver categorias.",
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const { categories } = await api.listCategories();
    if (!categories.length) {
      return interaction.editReply("Nenhuma categoria encontrada.");
    }

    const embed = new EmbedBuilder()
      .setTitle("📁 Categorias da loja")
      .setColor(0x3498db)
      .setDescription(`Total: ${categories.length}`)
      .addFields(
        categories.map((c: any) => ({
          name: c.name,
          value: `ID: \`${c.id}\`\nSlug: ${c.slug}${c.description ? `\n${c.description}` : ""}`,
          inline: false,
        })),
      )
      .setFooter({ text: "Use o ID no comando /produto-add" });

    await interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    await interaction.editReply(`❌ ${err.message}`);
  }
}
