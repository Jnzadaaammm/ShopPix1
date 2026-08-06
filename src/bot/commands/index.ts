import { Client, Message } from "discord.js";
import painel from "./painel";
import pedidos from "./pedidos";
import produtos from "./produtos";
import ticket from "./ticket";

export interface BotCommand {
  name: string;
  description: string;
  execute(args: string[], message: Message, client: Client): Promise<void>;
}

const commands: BotCommand[] = [painel, pedidos, produtos, ticket];

const commandsByName = new Map<string, BotCommand>();
for (const cmd of commands) {
  commandsByName.set(cmd.name, cmd);
}

export async function handleCommand(
  name: string,
  args: string[],
  message: Message,
  client: Client
): Promise<void> {
  const cmd = commandsByName.get(name);
  if (!cmd) {
    await message.reply(`Comando não encontrado. Use **.painel** para ver os comandos.`);
    return;
  }
  await cmd.execute(args, message, client);
}
