import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setupDiscordRoles } from "@/lib/discord-guild";
import { emit, REALTIME_EVENTS } from "@/lib/event-bus";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";

/**
 * POST /api/discord/sync-roles
 * Cria/atualiza os cargos do site no servidor do Discord automaticamente.
 * Apenas admin com permissão "roles.manage".
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!(await userHasPermission(session.user.id, "roles.manage"))) {
    return forbiddenResponse("Sem permissão para gerenciar cargos");
  }

  const result = await setupDiscordRoles();

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  emit(REALTIME_EVENTS.ROLE_CHANGED, {});
  emit(REALTIME_EVENTS.CARGO_CHANGED, {});

  return NextResponse.json({
    success: true,
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
  });
}
