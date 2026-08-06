import { ChatInputCommandInteraction, Client, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { prisma } from "@/lib/db";
import type { BotCommand } from "./index";

const produtos: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("produtos")
    .setDescription("Lista os produtos da loja"),

  async execute(interaction: ChatInputCommandInteraction) {
    const products = await prisma.product.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle("📦 Produtos");

    if (products.length === 0) {
      embed.setDescription("Nenhum produto cadastrado.");
    } else {
      const lines = products.map((p) => {
        const cat = p.category?.name || "Sem categoria";
        const price = `R$ ${p.price.toFixed(2)}`;
        return `**${p.name}** · ${cat} · ${price}`;
      });
      embed.setDescription(lines.join("\n"));
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default produtos;
