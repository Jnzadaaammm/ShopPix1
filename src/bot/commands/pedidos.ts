import { ChatInputCommandInteraction, Client, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { prisma } from "@/lib/db";
import type { BotCommand } from "./index";

const pedidos: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("pedidos")
    .setDescription("Lista os 10 últimos pedidos"),

  async execute(interaction: ChatInputCommandInteraction) {
    const orders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: true, items: true },
    });

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle("🛍️ Últimos Pedidos");

    if (orders.length === 0) {
      embed.setDescription("Nenhum pedido encontrado.");
    } else {
      const lines = orders.map((o) => {
        const user = o.user?.email || o.user?.name || "Anônimo";
        const total = `R$ ${o.total.toFixed(2)}`;
        return `**#${o.id.slice(-6)}** · ${user} · ${total} · ${o.status}`;
      });
      embed.setDescription(lines.join("\n"));
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default pedidos;
