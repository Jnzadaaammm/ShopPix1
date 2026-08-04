import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!(await userHasPermission(session.user.id, "customers.view"))) {
    return forbiddenResponse("Sem permissão para visualizar clientes");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isAdmin: true,
      createdAt: true,
      roles: {
        include: {
          role: {
            select: { id: true, name: true, type: true, color: true, discount: true },
          },
        },
      },
      _count: {
        select: { orders: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!(await userHasPermission(session.user.id, "customers.manage"))) {
    return forbiddenResponse("Sem permissão para gerenciar clientes");
  }

  const body = await request.json();
  const { userId, isAdmin } = body;

  if (!userId || typeof isAdmin !== "boolean") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Não permitir que o usuário remova seu próprio admin
  if (userId === session.user.id && !isAdmin) {
    return NextResponse.json(
      { error: "Você não pode remover seu próprio acesso de admin" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isAdmin },
    select: { id: true, name: true, email: true, isAdmin: true },
  });

  return NextResponse.json(updated);
}
