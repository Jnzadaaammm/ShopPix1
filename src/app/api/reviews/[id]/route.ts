import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/roles";

// DELETE: remove review (apenas autor ou staff)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review não encontrado" },
        { status: 404 }
      );
    }

    const isAuthor = review.userId === session.user.id;
    const isStaff = await userHasPermission(session.user.id, "products.manage");

    if (!isAuthor && !isStaff) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    await prisma.review.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao deletar review" },
      { status: 500 }
    );
  }
}
