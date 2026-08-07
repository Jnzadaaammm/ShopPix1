import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";
import { isOwnerEmail } from "@/lib/owner";
import { listApiKeys, createApiKey } from "@/lib/api-keys";

/**
 * GET /api/api-keys — lista todas as chaves (ativas e revogadas).
 * Apenas dono ou admin com settings.manage.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Apenas o dono pode gerenciar chaves de API (segurança extra)
  if (!isOwnerEmail(session.user.email)) {
    return NextResponse.json(
      { error: "Apenas o dono da loja pode gerenciar chaves de API." },
      { status: 403 },
    );
  }

  const keys = await listApiKeys();
  return NextResponse.json({ keys });
}

/**
 * POST /api/api-keys — cria uma nova chave de API.
 * Apenas dono. Retorna a chave bruta UMA ÚNICA VEZ.
 *
 * Body: { name: string, permissions?: string[] }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!isOwnerEmail(session.user.email)) {
    return NextResponse.json(
      { error: "Apenas o dono da loja pode criar chaves de API." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const permissions = Array.isArray(body.permissions) ? body.permissions : ["*"];
    const { rawKey, apiKey } = await createApiKey(body.name.trim(), permissions);

    // Retorna a chave bruta UMA vez. Nas próximas chamadas só vem o prefixo.
    return NextResponse.json(
      {
        success: true,
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          permissions: apiKey.permissions,
          createdAt: apiKey.createdAt,
        },
        // A chave bruta — o usuário DEVE copiar agora, não aparece de novo
        rawKey,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar chave de API:", error);
    return NextResponse.json({ error: "Erro ao criar chave" }, { status: 500 });
  }
}
