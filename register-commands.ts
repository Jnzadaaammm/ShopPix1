import { REST, Routes } from "discord.js";
import { commands } from "./src/bot/commands";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("DISCORD_BOT_TOKEN e DISCORD_CLIENT_ID precisam estar no .env");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

const body = Object.values(commands).map((c) => c.data.toJSON());

(async () => {
  try {
    console.log("Registrando comandos...");
    const route = GUILD_ID
      ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      : Routes.applicationCommands(CLIENT_ID);
    await rest.put(route, { body });
    console.log("Comandos registrados.");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
