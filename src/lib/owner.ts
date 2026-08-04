import { auth } from "./auth";

/**
 * Emails do dono da loja, definidos em OWNER_EMAIL (separados por vírgula).
 * Só o dono pode aprovar pedidos e alterar status manualmente.
 *
 * A lista vive no .env de propósito: nem um admin com acesso ao painel
 * consegue se promover a dono.
 */
function getOwnerEmails(): string[] {
  return (process.env.OWNER_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const owners = getOwnerEmails();
  if (owners.length === 0) return false;
  return owners.includes(email.toLowerCase());
}

/**
 * Verifica se a requisição atual é do dono.
 * Retorna a sessão junto para evitar uma segunda chamada a auth().
 */
export async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, status: 401, error: "Não autenticado", session: null };
  }
  if (!isOwnerEmail(session.user.email)) {
    return {
      ok: false as const,
      status: 403,
      error: "Apenas o dono da loja pode executar esta ação",
      session,
    };
  }
  return { ok: true as const, session };
}
