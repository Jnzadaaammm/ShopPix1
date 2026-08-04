import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ALL_PERMISSIONS, userHasPermission, forbiddenResponse, parsePermissions } from "@/lib/roles";
import { emit, REALTIME_EVENTS } from "@/lib/event-bus";

/**
 * GET — retorna todos os cargos.
 * Público: retorna apenas nome, cor, tipo e descrição.
 * Admin: retorna tudo incluindo permissões.
 */
export async function GET() {
  const session = await auth();
  const canManageRoles = session?.user?.id
    ? await userHasPermission(session.user.id, "roles.manage")
    : false;

  const roles = await prisma.role.findMany({
    orderBy: [{ type: "asc" }, { level: "asc" }],
  });

  // Contar usuários por cargo via tabela UserRole (N:N)
  const userCounts = await Promise.all(
    roles.map((r) => prisma.userRole.count({ where: { roleId: r.id } }))
  );

  if (canManageRoles) {
    return NextResponse.json(
      roles.map((r, i) => ({
        ...r,
        permissions: parsePermissions(r.permissions),
        userCount: userCounts[i],
      }))
    );
  }

  // Público: apenas info básica
  return NextResponse.json(
    roles.map((r, i) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      type: r.type,
      level: r.level,
      discount: r.discount,
      color: r.color,
      isDefault: r.isDefault,
      userCount: userCounts[i],
    }))
  );
}

/**
 * POST — apenas admin com permissão roles.manage.
 * Cria um novo cargo.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!(await userHasPermission(session.user.id, "roles.manage"))) {
    return forbiddenResponse("Sem permissão para gerenciar cargos");
  }

  try {
    const body = await request.json();
    const { name, description, type, level, discount, color, permissions, discordRoleId } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Já existe um cargo com este nome" }, { status: 400 });
    }

    // Validar permissões
    const validPermIds = ALL_PERMISSIONS.map((p) => p.id) as readonly string[];
    const perms = Array.isArray(permissions) ? permissions.filter((p: string) => validPermIds.includes(p)) : [];

    const role = await prisma.role.create({
      data: {
        name,
        description: description || null,
        type: type || "CLIENT",
        level: level || 0,
        discount: discount || 0,
        color: color || "gray",
        permissions: JSON.stringify(perms),
        discordRoleId: discordRoleId || null,
      },
    });

    emit(REALTIME_EVENTS.ROLE_CHANGED, {});
    emit(REALTIME_EVENTS.CARGO_CHANGED, {});

    return NextResponse.json(role);
  } catch (error) {
    console.error("Erro ao criar cargo:", error);
    return NextResponse.json({ error: "Erro ao criar cargo" }, { status: 500 });
  }
}

/**
 * PUT — apenas admin com permissão roles.manage.
 * Atualiza um cargo existente.
 */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!(await userHasPermission(session.user.id, "roles.manage"))) {
    return forbiddenResponse("Sem permissão para gerenciar cargos");
  }

  try {
    const body = await request.json();
    const { id, name, description, type, level, discount, color, permissions, isDefault, discordRoleId } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Cargo não encontrado" }, { status: 404 });
    }

    // Validar permissões
    const validPermIds = ALL_PERMISSIONS.map((p) => p.id) as readonly string[];
    const perms = Array.isArray(permissions) ? permissions.filter((p: string) => validPermIds.includes(p)) : [];

    // Se estiver definindo como padrão, remover o padrão dos outros
    if (isDefault) {
      await prisma.role.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        type: type || existing.type,
        level: level !== undefined ? level : existing.level,
        discount: discount !== undefined ? discount : existing.discount,
        color: color || existing.color,
        permissions: JSON.stringify(perms),
        isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
        discordRoleId: discordRoleId !== undefined ? (discordRoleId || null) : existing.discordRoleId,
      },
    });

    emit(REALTIME_EVENTS.ROLE_CHANGED, {});
    emit(REALTIME_EVENTS.CARGO_CHANGED, {});

    return NextResponse.json(role);
  } catch (error) {
    console.error("Erro ao atualizar cargo:", error);
    return NextResponse.json({ error: "Erro ao atualizar cargo" }, { status: 500 });
  }
}

/**
 * DELETE — apenas admin com permissão roles.manage.
 * Remove um cargo (não pode remover o cargo padrão ou se tiver usuários).
 */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!(await userHasPermission(session.user.id, "roles.manage"))) {
    return forbiddenResponse("Sem permissão para gerenciar cargos");
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const role = await prisma.role.findUnique({ where: { id } });

    if (!role) {
      return NextResponse.json({ error: "Cargo não encontrado" }, { status: 404 });
    }

    if (role.isDefault) {
      return NextResponse.json({ error: "Não é possível remover o cargo padrão" }, { status: 400 });
    }

    // Contar usuários via tabela UserRole (N:N)
    const userCount = await prisma.userRole.count({ where: { roleId: id } });
    if (userCount > 0) {
      return NextResponse.json(
        { error: `Não é possível remover: ${userCount} usuário(s) possui(m) este cargo` },
        { status: 400 }
      );
    }

    await prisma.role.delete({ where: { id } });

    emit(REALTIME_EVENTS.ROLE_CHANGED, {});
    emit(REALTIME_EVENTS.CARGO_CHANGED, {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover cargo:", error);
    return NextResponse.json({ error: "Erro ao remover cargo" }, { status: 500 });
  }
}
