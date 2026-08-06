import { Client, GatewayIntentBits, ActivityType, Events, Message } from "discord.js";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const PREFIX = process.env.BOT_PREFIX || "!";

if (!TOKEN) {
  console.error("DISCORD_BOT_TOKEN não configurado");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Bot online como ${c.user.tag}`);
  c.user.setPresence({
    status: "online",
    activities: [{ name: "ShopPix", type: ActivityType.Watching }],
  });
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  if (command === "painel") {
    await message.reply(
      "🛒 **Painel ShopPix**\n`!produtos` — lista produtos\n`!pedidos` — lista pedidos\n`!ticket` — abre ticket"
    );
  }
});

client.on(Events.Error, (err) => console.error("Erro:", err));

client.login(TOKEN);
