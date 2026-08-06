import { Client, GatewayIntentBits, Partials, ActivityType, Events, Message } from "discord.js";
import { setupDiscordRoles } from "../lib/discord-guild";
import { handleCommand } from "./commands";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const PREFIX = ".";

if (!TOKEN) {
  console.warn("[bot] DISCORD_BOT_TOKEN não configurado — bot não vai iniciar.");
  process.exit(0);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
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

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  if (!command) return;

  try {
    await handleCommand(command, args, message, client);
  } catch (error) {
    console.error(`[bot] Erro no comando .${command}:`, error);
    await message.reply("Erro ao executar comando.").catch(() => {});
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  if (member.user.bot) return;
});

client.on(Events.Error, (error) => console.error("[bot] Erro do cliente:", error));
client.on(Events.ShardError, (error) => console.error("[bot] Erro de shard:", error));

client.login(TOKEN).catch((error) => {
  console.error("[bot] Falha ao fazer login:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  client.destroy();
  process.exit(0);
});
