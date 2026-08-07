/**
 * Gerenciamento de chaves de API.
 *
 * As chaves brutas têm formato `sk_<prefix>_<random>` e só são exibidas
 * uma vez na criação. No banco armazenamos apenas o hash SHA-256.
 */
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./db";

/**
 * Prefixo de todas as chaves de API geradas pelo sistema.
 */
export const API_KEY_PREFIX = "sk";

/**
 * Gera uma chave de API aleatória no formato `sk_xxxx...xxxx`.
 * Retorna a chave bruta (para mostrar uma vez) e o hash + prefixo (para salvar).
 */
export function generateApiKey(): {
  rawKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  // 24 bytes aleatórios -> 48 chars hex
  const random = randomBytes(24).toString("hex");
  const rawKey = `${API_KEY_PREFIX}_${random}`;
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 11); // "sk_" + 8 chars
  return { rawKey, keyHash, keyPrefix };
}

/**
 * Calcula o hash SHA-256 de uma chave bruta.
 */
export function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Cria uma nova chave de API no banco.
 * @param name Nome descritivo (ex: "Bot Discord")
 * @param permissions Lista de permissões (["*"] para acesso total)
 * @returns A chave bruta (mostrar uma vez) + o registro criado
 */
export async function createApiKey(
  name: string,
  permissions: string[] = ["*"],
): Promise<{ rawKey: string; apiKey: any }> {
  // Revoga todas as chaves ativas anteriores para que só a nova funcione
  await prisma.apiKey.updateMany({
    where: { revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const { rawKey, keyHash, keyPrefix } = generateApiKey();
  const apiKey = await prisma.apiKey.create({
    data: {
      name: name.trim(),
      keyHash,
      keyPrefix,
      permissions: JSON.stringify(permissions),
    },
  });
  return { rawKey, apiKey };
}

/**
 * Valida uma chave bruta e retorna o registro se for válida e ativa.
 * Atualiza `lastUsedAt` em background.
 *
 * @param rawKey Chave bruta no formato `sk_...`
 * @returns O registro ApiKey ou null se inválida/revogada
 */
export async function validateApiKey(rawKey: string): Promise<any | null> {
  if (!rawKey.startsWith(`${API_KEY_PREFIX}_`)) return null;
  const keyHash = hashKey(rawKey);
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
  });
  if (!apiKey) return null;
  if (apiKey.revokedAt) return null;

  // Atualizar lastUsedAt (não bloqueia a resposta)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return apiKey;
}

/**
 * Extrai a chave Bearer do header Authorization.
 * @returns a chave bruta ou null se o header estiver ausente/inválido
 */
export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/**
 * Verifica se uma chave de API tem uma permissão específica.
 * A permissão "*" concede acesso total.
 */
export function apiKeyHasPermission(apiKey: any, permission: string): boolean {
  try {
    const perms: string[] = JSON.parse(apiKey.permissions);
    if (perms.includes("*")) return true;
    return perms.includes(permission);
  } catch {
    return false;
  }
}

/**
 * Lista todas as chaves de API (ativas e revogadas), sem expor o hash.
 */
export async function listApiKeys(): Promise<any[]> {
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
  });
  return keys.map(({ keyHash, ...rest }) => rest);
}

/**
 * Revoga uma chave de API (não deleta — mantém histórico).
 */
export async function revokeApiKey(id: string): Promise<any | null> {
  const existing = await prisma.apiKey.findUnique({ where: { id } });
  if (!existing) return null;
  return prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

/**
 * Deleta permanentemente uma chave de API.
 */
export async function deleteApiKey(id: string): Promise<any | null> {
  const existing = await prisma.apiKey.findUnique({ where: { id } });
  if (!existing) return null;
  return prisma.apiKey.delete({ where: { id } });
}
