import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { api } from "../../api-client";
import { formatBRL, formatDate, truncate } from "../../lib/helpers";

export const data = new SlashCommandBuilder()
  .setName("produto")
  .setDescription("Mostra detalhes de um produto.")
  .addStringOption((o) =>
    o.setName("id").setDescription("ID do produto").setRequired(true),
  );

export async function execute(interaction: any) {
  const id = interaction.options.getString("id");
  await interaction.deferReply();

  try {
    const p = await api.getProduct(id);

    const avgRating =
      p.reviews && p.reviews.length > 0
        ? (p.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / p.reviews.length).toFixed(1)
        : "Sem avaliações";

    const embed = new EmbedBuilder()
      .setTitle(p.featured ? `⭐ ${p.name}` : p.name)
      .setColor(0x2ecc71)
      .setDescription(p.description || "—")
      .addFields(
        { name: "Preço", value: formatBRL(p.price), inline: true },
        {
          name: "Estoque",
          value: p.stockMode === "CREDENTIALS" ? `${p.stock} credenciais` : "Ilimitado (digital)",
          inline: true,
        },
        { name: "Categoria", value: p.category?.name || "—", inline: true },
        { name: "Avaliação", value: `⭐ ${avgRating}`, inline: true },
        { name: "ID", value: `\`${p.id}\``, inline: false },
      )
      .setFooter({ text: `Criado em ${formatDate(p.createdAt)}` });

    await interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    await interaction.editReply(`❌ ${err.message}`);
  }
}
