import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from "discord.js";
import painel from "./painel";
import pedidos from "./pedidos";
import produtos from "./produtos";
import ticket from "./ticket";

export interface BotCommand {
  data: SlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void>;
}

export const commands: Record<string, BotCommand> = {
  painel,
  pedidos,
  produtos,
  ticket,
};
