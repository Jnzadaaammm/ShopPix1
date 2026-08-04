import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, amount, reason, pixKey } = body;

    if (!orderId || !amount || !reason) {
      return NextResponse.json(
        { error: "Campos obrigatórios: orderId, amount, reason" },
        { status: 400 }
      );
    }

    // Verificar se o pedido existe e pertence ao usuário
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    if (order.status !== "PAID") {
      return NextResponse.json(
        { error: "Apenas pedidos pagos podem ter reembolso" },
        { status: 400 }
      );
    }

    // Verificar se já existe reembolso para este pedido
    const existingRefund = await prisma.refund.findFirst({
      where: { orderId },
    });

    if (existingRefund) {
      return NextResponse.json(
        { error: "Já existe uma solicitação de reembolso para este pedido" },
        { status: 400 }
      );
    }

    // Criar solicitação de reembolso
    const refund = await prisma.refund.create({
      data: {
        orderId,
        userId: session.user.id,
        amount: parseFloat(amount),
        reason,
        pixKey: pixKey || null,
        status: "PENDING",
      },
      include: {
        order: true,
        user: true,
      },
    });

    return NextResponse.json(refund, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar reembolso:", error);
    return NextResponse.json(
      { error: "Erro ao criar solicitação de reembolso" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin");

    if (admin === "true" && (await userHasPermission(session.user.id, "refunds.manage"))) {
      // Admin: ver todos os reembolsos
      const refunds = await prisma.refund.findMany({
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(refunds);
    }

    // Usuário: ver apenas seus reembolsos
    const refunds = await prisma.refund.findMany({
      where: { userId: session.user.id },
      include: {
        order: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(refunds);
  } catch (error) {
    console.error("Erro ao buscar reembolsos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar reembolsos" },
      { status: 500 }
    );
  }
}
