/**
 * Helper de autenticação para os endpoints /api/bot/*.
 *
 * Valida o Bearer token (chave de API) e verifica permissões.
 * Retorna a chave validada ou uma resposta de erro pronta para usar.
 */
import { NextResponse } from "next/server";
import {
  extractBearerToken,
  validateApiKey,
  apiKeyHasPermission,
} from "@/lib/api-keys";

export interface BotAuthResult {
  ok: boolean;
  apiKey?: any;
  error?: NextResponse;
}

/**
 * Autentica a requisição por Bearer token e verifica a permissão.
 *
 * Uso em uma route handler:
 * ```ts
 * const auth = await requireBotAuth(request, "orders.view");
 * if (!auth.ok) return auth.error;
 * // auth.apiKey disponível
 * ```
 */
export async function requireBotAuth(
  request: Request,
  permission: string,
): Promise<BotAuthResult> {
  const token = extractBearerToken(request);
  if (!token) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Header Authorization Bearer ausente." },
        { status: 401 },
      ),
    };
  }

  const apiKey = await validateApiKey(token);
  if (!apiKey) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Chave de API inválida ou revogada." },
        { status: 401 },
      ),
    };
  }

  if (!apiKeyHasPermission(apiKey, permission)) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: `Chave sem permissão "${permission}".` },
        { status: 403 },
      ),
    };
  }

  return { ok: true, apiKey };
}
