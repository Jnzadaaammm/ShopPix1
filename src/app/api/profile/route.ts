import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isAdmin: true,
      createdAt: true,
      _count: {
        select: { orders: true, refunds: true, downloads: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  // Estatísticas resumidas
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    select: { total: true, status: true },
  });

  const totalSpent = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + o.total, 0);
  const paidOrders = orders.filter((o) => o.status === "PAID").length;

  return NextResponse.json({
    ...user,
    stats: {
      totalOrders: orders.length,
      paidOrders,
      totalSpent,
      refunds: user._count.refunds,
      downloads: user._count.downloads,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { name, image } = body;

  const data: { name?: string; image?: string | null } = {};
  if (typeof name === "string" && name.trim().length > 0) {
    data.name = name.trim();
  }
  if (typeof image === "string") {
    data.image = image.trim() || null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isAdmin: true,
    },
  });

  return NextResponse.json(updated);
}
