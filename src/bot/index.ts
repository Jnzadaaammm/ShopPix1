import { Client, GatewayIntentBits, Partials, ActivityType, Events, Interaction } from "discord.js";
import { setupDiscordRoles } from "../lib/discord-guild";
import { commands } from "./commands";
import { prisma } from "../lib/db";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN) {
  console.warn("[bot] DISCORD_BOT_TOKEN não configurado — bot não vai iniciar.");
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

client.once(Events.ClientReady, async (clientInstance) => {
  console.info(`[bot] Online como ${clientInstance.user?.tag}`);

  clientInstance.user?.setPresence({
    status: "online",
    activities: [{ name: "a loja 🛒", type: ActivityType.Watching }],
  });

  if (GUILD_ID) {
    try {
      const result = await setupDiscordRoles();
      if (!result.ok) {
        console.warn("[bot] Falha ao sincronizar cargos:", result.error);
      }
    } catch (error) {
      console.error("[bot] Erro ao sincronizar cargos:", error);
    }
  }
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = commands[interaction.commandName];
    if (command) {
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`[bot] Erro no comando ${interaction.commandName}:`, error);
        await interaction.reply({ content: "Erro ao executar comando.", ephemeral: true }).catch(() => {});
      }
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === "fechar_ticket") {
      if (!interaction.channel || interaction.channel.isDMBased()) return;
      await interaction.channel.delete().catch(() => {});
    }
    if (interaction.customId === "painel_produtos") {
      const cmd = commands["produtos"];
      if (cmd) await cmd.execute(interaction as any, client);
    }
    if (interaction.customId === "painel_pedidos") {
      const cmd = commands["pedidos"];
      if (cmd) await cmd.execute(interaction as any, client);
    }
    if (interaction.customId === "painel_ticket") {
      const cmd = commands["ticket"];
      if (cmd) await cmd.execute(interaction as any, client);
    }
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  if (member.user.bot) return;
  // sincronia de cargos no login
});

client.on(Events.Error, (error) => console.error("[bot] Erro do cliente:", error));
client.on(Events.ShardError, (error) => console.error("[bot] Erro de shard:", error));

client.login(TOKEN).catch((error) => {
  console.error("[bot] Falha ao fazer login:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  client.destroy();
  prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", () => {
  client.destroy();
  prisma.$disconnect();
  process.exit(0);
});
