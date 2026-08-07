import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isOwnerEmail } from "@/lib/owner";
import { revokeApiKey, deleteApiKey } from "@/lib/api-keys";

async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false as const,
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
  if (!isOwnerEmail(session.user.email)) {
    return {
      ok: false as const,
      error: NextResponse.json(
        { error: "Apenas o dono da loja pode gerenciar chaves de API." },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const };
}

/**
 * PATCH /api/api-keys/[id] — revoga uma chave (não deleta).
 * Body: { action: "revoke" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.error;

  const { id } = await params;
  try {
    const body = await request.json();
    if (body.action === "revoke") {
      const revoked = await revokeApiKey(id);
      if (!revoked) {
        return NextResponse.json({ error: "Chave não encontrada" }, { status: 404 });
      }
      return NextResponse.json({ success: true, revoked: true });
    }
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
}

/**
 * DELETE /api/api-keys/[id] — deleta permanentemente uma chave.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const owner = await requireOwner();
  if (!owner.ok) return owner.error;

  const { id } = await params;
  const deleted = await deleteApiKey(id);
  if (!deleted) {
    return NextResponse.json({ error: "Chave não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ success: true, deleted: true });
}
