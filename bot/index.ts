/**
 * Bot do Discord — ShopPix
 *
 * Gerencia a loja (produtos, pedidos, aprovações), suporte ao cliente
 * (tickets) e moderação do servidor. Acessa o mesmo banco de dados do
 * site via Prisma, garantindo que tudo esteja sempre sincronizado.
 *
 * Como rodar:
 *   npm run bot          # produção
 *   npm run bot:dev      # desenvolvimento (auto-reload)
 *   npm run bot:deploy   # registrar comandos slash
 */
import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Events,
  ActivityType,
  Partials,
} from "discord.js";
import { loadCommands } from "./commands/index";

const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!TOKEN) {
  console.error("❌ DISCORD_BOT_TOKEN não configurado no .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Channel],
});

let commandMap = new Map<string, any>();

async function initBot() {
  const commands = await loadCommands();
  commandMap = new Map(commands.map((c) => [c.data.name, c]));
  console.log(
    `Comandos carregados (${commands.length}): ${[...commandMap.keys()].join(", ")}`,
  );

  client.once(Events.ClientReady, (c) => {
    console.log(`✅ Bot online como ${c.user.tag}`);
    c.user.setPresence({
      status: "online",
      activities: [{ name: "ShopPix", type: ActivityType.Watching }],
    });
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = commandMap.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err: any) {
      console.error(`Erro no comando /${interaction.commandName}:`, err);
      const payload = {
        content: `❌ Erro ao executar o comando: ${err.message}`,
        ephemeral: true,
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  });

  client.on(Events.Error, (err) => console.error("Erro no cliente:", err));

  await client.login(TOKEN);
}

initBot();
