import { Message } from "discord.js";
import type { BotCommand } from "./index";

const painel: BotCommand = {
  name: "painel",
  description: "Mostra o painel de comandos",

  async execute(_args, message) {
    const text = [
      "🛒 **Painel ShopPix**",
      "",
      "`.produtos` — lista produtos",
      "`.pedidos` — lista pedidos",
      "`.ticket` — abre um ticket",
    ].join("\n");

    await message.reply(text);
  },
};

export default painel;
