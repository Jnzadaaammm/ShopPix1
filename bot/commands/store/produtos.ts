import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { api } from "../../api-client";
import { formatBRL, truncate } from "../../lib/helpers";

export const data = new SlashCommandBuilder()
  .setName("produtos")
  .setDescription("Lista os produtos da loja.")
  .addStringOption((o) =>
    o.setName("busca").setDescription("Filtrar por nome").setRequired(false),
  )
  .addStringOption((o) =>
    o.setName("categoria").setDescription("Filtrar por slug da categoria").setRequired(false),
  )
  .addBooleanOption((o) =>
    o.setName("destaque").setDescription("Apenas produtos em destaque").setRequired(false),
  );

export async function execute(interaction: any) {
  await interaction.deferReply();
  try {
    const { products } = await api.listProducts({
      search: interaction.options.getString("busca") || undefined,
      category: interaction.options.getString("categoria") || undefined,
      featured: interaction.options.getBoolean("destaque") || undefined,
    });

    if (!products.length) {
      return interaction.editReply("Nenhum produto encontrado.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🛍️ Produtos da loja")
      .setColor(0x5865f2)
      .setDescription(`Encontrados: ${products.length}`)
      .addFields(
        products.slice(0, 10).map((p: any) => ({
          name: `${p.featured ? "⭐ " : ""}${p.name} — ${formatBRL(p.price)}`,
          value: `ID: \`${p.id}\`\nCategoria: ${p.category?.name || "—"}\nEstoque: ${
            p.stockMode === "CREDENTIALS" ? `${p.stock} credenciais` : "Ilimitado"
          }\n${truncate(p.description || "", 100)}`,
          inline: false,
        })),
      );

    await interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    await interaction.editReply(`❌ ${err.message}`);
  }
}
