/**
 * Helpers compartilhados do bot.
 */
import type { GuildMember } from "discord.js";
import "dotenv/config";

/**
 * ID do cargo do Discord que tem permissão administrativa na loja.
 * Definido em .env (DISCORD_ADMIN_ROLE_ID). Se vazio, usa permissão
 * Administrator do Discord.
 */
const ADMIN_ROLE_ID = process.env.DISCORD_ADMIN_ROLE_ID || "";

/**
 * Verifica se um membro do Discord tem permissão para usar comandos
 * administrativos da loja (gerenciar produtos, pedidos, etc.).
 *
 * Critérios (qualquer um):
 *  - É o dono do servidor (Guild Owner)
 *  - Tem permissão Administrator no Discord
 *  - Tem o cargo configurado em DISCORD_ADMIN_ROLE_ID
 */
export function isStoreAdmin(member: GuildMember): boolean {
  if (member.id === member.guild.ownerId) return true;
  if (member.permissions.has("Administrator" as const)) return true;
  if (ADMIN_ROLE_ID && member.roles.cache.has(ADMIN_ROLE_ID)) return true;
  return false;
}

/**
 * Verifica se um membro do Discord tem permissão de equipe de suporte.
 * Por padrão, qualquer admin da loja também é staff de suporte.
 * Um cargo de suporte separado pode ser configurado em DISCORD_SUPPORT_ROLE_ID.
 */
const SUPPORT_ROLE_ID = process.env.DISCORD_SUPPORT_ROLE_ID || "";

export function isSupportStaff(member: GuildMember): boolean {
  if (isStoreAdmin(member)) return true;
  if (SUPPORT_ROLE_ID && member.roles.cache.has(SUPPORT_ROLE_ID)) return true;
  return false;
}

/**
 * Verifica se o membro do Discord é o dono da loja.
 *
 * Como o bot agora se comunica via HTTP API (não acessa o banco diretamente),
 * a verificação é baseada apenas na hierarquia do Discord:
 *  - Dono do servidor = dono da loja
 *  - Membros com o cargo em DISCORD_OWNER_ROLE_ID (opcional)
 */
const OWNER_ROLE_ID = process.env.DISCORD_OWNER_ROLE_ID || "";

export function isStoreOwner(member: GuildMember): boolean {
  if (member.id === member.guild.ownerId) return true;
  if (OWNER_ROLE_ID && member.roles.cache.has(OWNER_ROLE_ID)) return true;
  return false;
}

/**
 * Formata um valor monetário em R$.
 */
export function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/**
 * Formata uma data para exibição em pt-BR.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Trunca um texto para no máximo `max` caracteres, adicionando "…" se cortado.
 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}
