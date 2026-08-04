import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";

// GET: lista todos os cupons (admin)
export async function GET() {
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

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar cupons" },
      { status: 500 }
    );
  }
}

// POST: cria um cupom (admin)
export async function POST(request: Request) {
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

    const body = await request.json();
    const { code, type, value, minOrder, maxUses, validUntil } = body;

    if (!code || !type || typeof value !== "number") {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    if (type !== "PERCENTAGE" && type !== "FIXED") {
      return NextResponse.json(
        { error: "Tipo deve ser PERCENTAGE ou FIXED" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        minOrder: minOrder ?? null,
        maxUses: maxUses ?? null,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar cupom" },
      { status: 500 }
    );
  }
}
