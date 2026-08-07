import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ajuda")
  .setDescription("Mostra todos os comandos disponíveis do bot.");

export async function execute(interaction: any) {
  const embed = new EmbedBuilder()
    .setTitle("🤖 Central de Ajuda — ShopPix")
    .setColor(0x5865f2)
    .addFields(
      {
        name: "🛍️ Loja",
        value: [
          "`/produtos [busca]` — lista produtos",
          "`/produto <id>` — detalhes de um produto",
          "`/produto-add` — cadastra produto (admin)",
          "`/estoque <id> <qtd>` — atualiza estoque (admin)",
          "`/pedidos [status]` — lista pedidos (admin)",
          "`/pedido <id>` — detalhes de um pedido (admin)",
          "`/aprovar <id>` — aprova e entrega pedido (dono)",
          "`/rejeitar <id> [motivo]` — rejeita pedido (dono)",
          "`/painel` — resumo da loja (admin)",
        ].join("\n"),
      },
      {
        name: "🎧 Suporte",
        value: [
          "`/ticket <assunto>` — abre um canal de suporte privado",
          "`/fechar` — fecha o ticket atual",
          "`/contato` — infos de contato da loja",
        ].join("\n"),
      },
      {
        name: "🛡️ Moderação",
        value: [
          "`/banir <user> [motivo]` — bane um membro",
          "`/expulsar <user> [motivo]` — expulsa um membro",
          "`/mutar <user> <min> [motivo]` — muta temporariamente",
          "`/desmutar <user>` — remove o mute",
          "`/limpar <qtd>` — apaga mensagens",
        ].join("\n"),
      },
    )
    .setFooter({ text: "Comandos (admin) exigem cargo de admin. (dono) exige ser dono da loja." });
  await interaction.reply({ embeds: [embed], ephemeral: true });
}
