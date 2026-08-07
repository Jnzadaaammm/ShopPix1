/**
 * Registra os comandos slash no Discord.
 * Rode uma vez (ou quando adicionar/remover comandos):
 *   npm run bot:deploy
 */
import "dotenv/config";
import { REST, Routes } from "discord.js";
import { loadCommands } from "./commands/index";

const { DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_BOT_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) {
  console.error(
    "❌ Defina DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID e DISCORD_GUILD_ID no .env",
  );
  process.exit(1);
}

async function main() {
  const commands = await loadCommands();
  const payload = commands.map((c) => c.data.toJSON());

  const rest = new REST({ version: "10" }).setToken(DISCORD_BOT_TOKEN!);

  console.log(
    `Registrando ${payload.length} comandos slash na guild ${DISCORD_GUILD_ID}...`,
  );
  await rest.put(
    Routes.applicationGuildCommands(DISCORD_CLIENT_ID!, DISCORD_GUILD_ID!),
    { body: payload },
  );
  console.log("✅ Comandos registrados com sucesso!");
  console.log("Comandos:", payload.map((c: any) => `/${c.name}`).join(", "));
}

main().catch((err) => {
  console.error("❌ Erro ao registrar comandos:", err);
  process.exit(1);
});
