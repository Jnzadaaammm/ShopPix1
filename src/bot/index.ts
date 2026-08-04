/**
 * Bot do Discord — mantém o bot online no servidor da loja.
 *
 * Roda como processo separado do Next.js:
 *   npm run bot
 *
 * Funcionalidades:
 *  - Mantém presença "online" no Discord
 *  - Sincroniza cargos automaticamente quando o bot inicia
 *  - Loga eventos importantes (membros entrando/saindo, etc.)
 *  - Pode ser estendido para responder comandos no futuro
 */

import { Client, GatewayIntentBits, Partials, ActivityType } from "discord.js";
import { setupDiscordRoles } from "../lib/discord-guild";
import { prisma } from "../lib/db";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN) {
  console.warn("[bot] DISCORD_BOT_TOKEN não configurado — bot não vai iniciar.");
  console.warn("[bot] O site funciona normalmente sem o bot.");
  process.exit(0);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.GuildMember],
});

client.once("ready", async () => {
  console.log(`[bot] ✅ Online como ${client.user?.tag}`);

  // Definir presença: "online" com atividade personalizada
  client.user?.setPresence({
    status: "online",
    activities: [
      {
        name: "a loja 🛒",
        type: ActivityType.Watching,
      },
    ],
  });

  // Sincronizar cargos automaticamente ao iniciar
  if (GUILD_ID) {
    console.log("[bot] Sincronizando cargos com o site...");
    try {
      const result = await setupDiscordRoles();
      if (result.ok) {
        const parts: string[] = [];
        if (result.created?.length) parts.push(`${result.created.length} criados`);
        if (result.updated?.length) parts.push(`${result.updated.length} atualizados`);
        if (result.skipped?.length) parts.push(`${result.skipped.length} pulados`);
        console.log(`[bot] Cargos sincronizados: ${parts.join(", ") || "nada a fazer"}`);
      } else {
        console.warn("[bot] Falha ao sincronizar cargos:", result.error);
      }
    } catch (error) {
      console.error("[bot] Erro ao sincronizar cargos:", error);
    }
  }

  console.log("[bot] Pronto para receber eventos!");
});

// Logar quando um membro entra no servidor
client.on("guildMemberAdd", (member) => {
  console.log(`[bot] 👋 ${member.user.tag} entrou no servidor ${member.guild.name}`);
});

// Logar quando um membro sai
client.on("guildMemberRemove", (member) => {
  console.log(`[bot] 👋 ${member.user.tag} saiu do servidor ${member.guild.name}`);
});

// Logar mudanças de cargo
client.on("guildMemberUpdate", (oldMember, newMember) => {
  const oldRoles = oldMember.roles.cache.map((r) => r.name);
  const newRoles = newMember.roles.cache.map((r) => r.name);
  const added = newRoles.filter((r) => !oldRoles.includes(r));
  const removed = oldRoles.filter((r) => !newRoles.includes(r));

  if (added.length > 0) {
    console.log(`[bot] ⬆️ ${newMember.user.tag} recebeu cargo(s): ${added.join(", ")}`);
  }
  if (removed.length > 0) {
    console.log(`[bot] ⬇️ ${newMember.user.tag} perdeu cargo(s): ${removed.join(", ")}`);
  }
});

// Tratar erros para não derrubar o bot
client.on("error", (error) => {
  console.error("[bot] Erro do cliente Discord:", error);
});

client.on("warn", (warning) => {
  console.warn("[bot] Aviso do Discord:", warning);
});

client.on("shardError", (error) => {
  console.error("[bot] Erro de shard:", error);
});

client.on("shardDisconnect", (event) => {
  console.warn(`[bot] Desconectado do Discord: ${event.reason} (código ${event.code})`);
});

client.on("shardReconnecting", () => {
  console.log("[bot] Reconectando ao Discord...");
});

client.on("shardResume", () => {
  console.log("[bot] Reconexão bem-sucedida!");
});

// Login
client.login(TOKEN).catch((error) => {
  console.error("[bot] Falha ao fazer login:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("[bot] Desligando...");
  client.destroy();
  prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("[bot] SIGTERM recebido, desligando...");
  client.destroy();
  prisma.$disconnect();
  process.exit(0);
});
