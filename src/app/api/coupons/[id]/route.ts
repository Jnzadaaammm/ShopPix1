import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";

// PATCH: atualiza um cupom (admin)
export async function PATCH(
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

    if (!(await userHasPermission(session.user.id, "coupons.manage"))) {
      return forbiddenResponse("Sem permissão para gerenciar cupons");
    }

    const { id } = await params;
    const body = await request.json();
    const { active, code, type, value, minOrder, maxUses, validUntil } = body;

    // Montar apenas os campos fornecidos
    const data: Record<string, unknown> = {};
    if (typeof active === "boolean") data.active = active;
    if (code) data.code = code.toUpperCase();
    if (type === "PERCENTAGE" || type === "FIXED") data.type = type;
    if (typeof value === "number") data.value = value;
    if (minOrder !== undefined) data.minOrder = minOrder;
    if (maxUses !== undefined) data.maxUses = maxUses;
    if (validUntil !== undefined) {
      data.validUntil = validUntil ? new Date(validUntil) : null;
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar cupom" },
      { status: 500 }
    );
  }
}

// DELETE: remove um cupom (admin)
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

    if (!(await userHasPermission(session.user.id, "coupons.manage"))) {
      return forbiddenResponse("Sem permissão para gerenciar cupons");
    }

    const { id } = await params;

    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao deletar cupom" },
      { status: 500 }
    );
  }
}
