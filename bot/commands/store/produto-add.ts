import { SlashCommandBuilder } from "discord.js";
import { api } from "../../api-client";
import { isStoreAdmin } from "../../lib/helpers";

export const data = new SlashCommandBuilder()
  .setName("produto-add")
  .setDescription("Cadastra um novo produto. (admin)")
  .addStringOption((o) => o.setName("nome").setDescription("Nome do produto").setRequired(true))
  .addStringOption((o) => o.setName("descricao").setDescription("Descrição do produto").setRequired(true))
  .addNumberOption((o) => o.setName("preco").setDescription("Preço (R$)").setRequired(true).setMinValue(0.01))
  .addStringOption((o) => o.setName("categoria_id").setDescription("ID da categoria (use /categorias para listar)").setRequired(true))
  .addStringOption((o) =>
    o
      .setName("modo")
      .setDescription("Modo de estoque")
      .setRequired(false)
      .addChoices(
        { name: "Simples (download ilimitado)", value: "SIMPLE" },
        { name: "Credenciais (senhas individuais)", value: "CREDENTIALS" },
      ),
  )
  .addIntegerOption((o) => o.setName("estoque").setDescription("Estoque (apenas modo Credenciais)").setRequired(false).setMinValue(0))
  .addStringOption((o) => o.setName("imagem").setDescription("URL da imagem").setRequired(false))
  .addBooleanOption((o) => o.setName("destaque").setDescription("Produto em destaque?").setRequired(false));

export async function execute(interaction: any) {
  if (!isStoreAdmin(interaction.member)) {
    return interaction.reply({
      content: "❌ Você não tem permissão para cadastrar produtos.",
      ephemeral: true,
    });
  }

  const productData = {
    name: interaction.options.getString("nome"),
    description: interaction.options.getString("descricao"),
    price: interaction.options.getNumber("preco"),
    categoryId: interaction.options.getString("categoria_id"),
    image: interaction.options.getString("imagem") || "",
    stockMode: (interaction.options.getString("modo") as "SIMPLE" | "CREDENTIALS") || "SIMPLE",
    stock: interaction.options.getInteger("estoque") ?? 0,
    featured: interaction.options.getBoolean("destaque") || false,
  };

  await interaction.deferReply({ ephemeral: true });
  try {
    const product = await api.createProduct(productData);
    await interaction.editReply(
      `✅ Produto criado: **${product.name}** (ID \`${product.id}\`)\nModo: ${product.stockMode}`,
    );
  } catch (err: any) {
    await interaction.editReply(`❌ ${err.message}`);
  }
}
