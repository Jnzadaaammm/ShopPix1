import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";
import { syncDiscordRoles } from "@/lib/discord-guild";

/**
 * GET /api/users/[id]/role
 * Retorna os cargos atuais do usuário (array).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id: userId } = await params;

    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          select: { id: true, name: true, type: true, color: true, discount: true },
        },
      },
    });

    return NextResponse.json(
      userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        type: ur.role.type,
        color: ur.role.color,
        discount: ur.role.discount,
      }))
    );
  } catch (error) {
    console.error("Erro ao buscar cargos do usuário:", error);
    return NextResponse.json({ error: "Erro ao buscar cargos" }, { status: 500 });
  }
}

/**
 * PUT /api/users/[id]/role
 * Altera os cargos de um usuário (N:N via UserRole).
 * Apenas admin com permissão "customers.manage" ou "roles.manage".
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Verificar permissão
  const canManageCustomers = await userHasPermission(session.user.id, "customers.manage");
  const canManageRoles = await userHasPermission(session.user.id, "roles.manage");
  if (!canManageCustomers && !canManageRoles) {
    return forbiddenResponse("Sem permissão");
  }

  try {
    const { id: userId } = await params;
    const { roleIds } = await request.json();

    if (!Array.isArray(roleIds)) {
      return NextResponse.json({ error: "roleIds deve ser um array" }, { status: 400 });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Validar que todos os cargos existem
    if (roleIds.length > 0) {
      const existingRoles = await prisma.role.findMany({
        where: { id: { in: roleIds } },
        select: { id: true, type: true },
      });
      if (existingRoles.length !== roleIds.length) {
        return NextResponse.json({ error: "Um ou mais cargos não foram encontrados" }, { status: 404 });
      }
    }

    // Buscar cargos atuais do usuário
    const currentUserRoles = await prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true },
    });
    const currentRoleIds = currentUserRoles.map((ur) => ur.roleId);

    // Cargos a adicionar (no novo array mas não nos atuais)
    const toAdd = roleIds.filter((id: string) => !currentRoleIds.includes(id));
    // Cargos a remover (nos atuais mas não no novo array)
    const toRemove = currentRoleIds.filter((id) => !roleIds.includes(id));

    // Adicionar novos cargos via upsert
    for (const roleId of toAdd) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId } },
        update: {},
        create: { userId, roleId },
      });
    }

    // Remover cargos que não estão mais na lista
    if (toRemove.length > 0) {
      await prisma.userRole.deleteMany({
        where: { userId, roleId: { in: toRemove } },
      });
    }

    // Buscar os cargos atualizados para determinar isAdmin
    const updatedRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: { select: { id: true, name: true, type: true, discount: true, permissions: true } } },
    });

    // Só marcar isAdmin se tiver cargo com permissão "*" (Dono)
    // Suporte e Administrador são TEAM; acesso depende das permissões
    const shouldBeAdmin = updatedRoles.some((ur) => {
      try {
        const perms = JSON.parse(ur.role.permissions as any);
        return Array.isArray(perms) && perms.includes("*");
      } catch {
        return false;
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: shouldBeAdmin },
    });

    // Sincronizar cargos no Discord (se o usuário tiver conta Discord vinculada)
    try {
      const discordAccount = await prisma.account.findFirst({
        where: { userId, provider: "discord" },
        select: { providerAccountId: true },
      });
      if (discordAccount?.providerAccountId) {
        const syncResult = await syncDiscordRoles(userId, discordAccount.providerAccountId);
        if (!syncResult.ok && syncResult.error !== "Nenhum cargo tem discordRoleId configurado") {
          console.warn("[role] syncDiscordRoles falhou:", syncResult.error);
        }
      }
    } catch (syncError) {
      console.error("[role] Erro ao sincronizar cargo Discord:", syncError);
    }

    return NextResponse.json({
      success: true,
      roles: updatedRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        type: ur.role.type,
        discount: ur.role.discount,
      })),
    });
  } catch (error) {
    console.error("Erro ao alterar cargos:", error);
    return NextResponse.json({ error: "Erro ao alterar cargos" }, { status: 500 });
  }
}
