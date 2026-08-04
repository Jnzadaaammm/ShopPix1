import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const refund = await prisma.refund.findUnique({
      where: { id },
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
    });

    if (!refund) {
      return NextResponse.json({ error: "Reembolso não encontrado" }, { status: 404 });
    }

    // Verificar permissão
    if (refund.userId !== session.user.id && !(await userHasPermission(session.user.id, "refunds.manage"))) {
      return forbiddenResponse("Sem permissão para visualizar este reembolso");
    }

    return NextResponse.json(refund);
  } catch (error) {
    console.error("Erro ao buscar reembolso:", error);
    return NextResponse.json(
      { error: "Erro ao buscar reembolso" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (!(await userHasPermission(session.user.id, "refunds.manage"))) {
      return forbiddenResponse("Sem permissão para gerenciar reembolsos");
    }

    const { id } = await params;
    const body = await request.json();
    const { action, adminNote, pixKey } = body;

    const refund = await prisma.refund.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!refund) {
      return NextResponse.json({ error: "Reembolso não encontrado" }, { status: 404 });
    }

    if (action === "approve") {
      const updated = await prisma.refund.update({
        where: { id },
        data: {
          status: "APPROVED",
          adminNote,
          pixKey: pixKey || refund.pixKey,
        },
        include: {
          order: true,
          user: true,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "reject") {
      const updated = await prisma.refund.update({
        where: { id },
        data: {
          status: "REJECTED",
          adminNote,
        },
        include: {
          order: true,
          user: true,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "complete") {
      const updated = await prisma.$transaction([
        prisma.refund.update({
          where: { id },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
          },
        }),
        prisma.order.update({
          where: { id: refund.orderId },
          data: { status: "REFUNDED" },
        }),
      ]);

      return NextResponse.json({ 
        refund: updated[0], 
        order: updated[1] 
      });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao atualizar reembolso:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar reembolso" },
      { status: 500 }
    );
  }
}
