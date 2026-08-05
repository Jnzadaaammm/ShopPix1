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
import { setupDiscordRoles, syncDiscordRoles } from "../lib/discord-guild";
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
  // console.log(`[bot] ✅ Online como ${client.user?.tag}`);

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
    // console.log("[bot] Sincronizando cargos com o site...");
    try {
      const result = await setupDiscordRoles();
      if (result.ok) {
        const parts: string[] = [];
        if (result.created?.length) parts.push(`${result.created.length} criados`);
        if (result.updated?.length) parts.push(`${result.updated.length} atualizados`);
        if (result.skipped?.length) parts.push(`${result.skipped.length} pulados`);
        // console.log(`[bot] Cargos sincronizados: ${parts.join(", ") || "nada a fazer"}`);
      } else {
        console.warn("[bot] Falha ao sincronizar cargos:", result.error);
      }
    } catch (error) {
      console.error("[bot] Erro ao sincronizar cargos:", error);
    }
  }

  // console.log("[bot] Pronto para receber eventos!");
});

// Sincroniza cargos do site quando um membro entra no servidor
client.on("guildMemberAdd", async (member) => {
  if (member.user.bot) return;
  try {
    const user = await prisma.user.findFirst({
      where: { accounts: { some: { provider: "discord", providerAccountId: member.id } } },
      include: { accounts: { where: { provider: "discord" } } },
    });
    if (user?.accounts[0]?.providerAccountId) {
      await syncDiscordRoles(user.id, user.accounts[0].providerAccountId);
    }
  } catch (error) {
    console.error("[bot] Erro ao sincronizar cargos no member add:", error);
  }
});

// Sincroniza mudanças de cargo do Discord com o site
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  if (newMember.user.bot) return;
  const oldRoleIds = new Set(oldMember.roles.cache.map((r) => r.id));
  const newRoleIds = new Set(newMember.roles.cache.map((r) => r.id));

  // Se não houve mudança de cargos, não faz nada
  const added = [...newRoleIds].filter((id) => !oldRoleIds.has(id));
  const removed = [...oldRoleIds].filter((id) => !newRoleIds.has(id));
  if (added.length === 0 && removed.length === 0) return;

  try {
    const user = await prisma.user.findFirst({
      where: { accounts: { some: { provider: "discord", providerAccountId: newMember.id } } },
    });
    if (user) {
      await syncDiscordRoles(user.id, newMember.id);
    }
  } catch (error) {
    console.error("[bot] Erro ao sincronizar cargos no member update:", error);
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
  // console.log("[bot] Reconectando ao Discord...");
});

client.on("shardResume", () => {
  // console.log("[bot] Reconexão bem-sucedida!");
});

// Login
client.login(TOKEN).catch((error) => {
  console.error("[bot] Falha ao fazer login:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  // console.log("[bot] Desligando...");
  client.destroy();
  prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", () => {
  // console.log("[bot] SIGTERM recebido, desligando...");
  client.destroy();
  prisma.$disconnect();
  process.exit(0);
});
