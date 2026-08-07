/**
 * Carrega dinamicamente todos os comandos slash das subpastas de ./commands.
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { SlashCommandBuilder } from "discord.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// index.ts já está dentro de commands/, então as subpastas estão aqui mesmo
const COMMANDS_DIR = __dirname;

export interface BotCommand {
  data: SlashCommandBuilder;
  execute: (interaction: any) => Promise<void> | void;
}

export async function loadCommands(): Promise<BotCommand[]> {
  const commands: BotCommand[] = [];
  const folders = readdirSync(COMMANDS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const folder of folders) {
    const files = readdirSync(join(COMMANDS_DIR, folder)).filter((f) =>
      f.endsWith(".ts"),
    );
    for (const file of files) {
      const filePath = pathToFileURL(join(COMMANDS_DIR, folder, file)).href;
      const mod = await import(filePath);
      if (mod.data && typeof mod.execute === "function") {
        commands.push(mod);
      } else {
        console.warn(`[comandos] ${folder}/${file} ignorado: faltam "data" ou "execute".`);
      }
    }
  }
  return commands;
}
