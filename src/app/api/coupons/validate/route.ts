import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST: valida um cupom e calcula o desconto
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { code, orderTotal } = await request.json();

    if (!code || typeof orderTotal !== "number" || orderTotal < 0) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json(
        { valid: false, error: "Cupom inválido ou inativo" },
        { status: 200 }
      );
    }

    const now = new Date();

    // Verificar validade (validFrom <= now e validUntil nulo ou > now)
    if (coupon.validFrom > now) {
      return NextResponse.json(
        { valid: false, error: "Cupom ainda não é válido" },
        { status: 200 }
      );
    }

    if (coupon.validUntil && coupon.validUntil <= now) {
      return NextResponse.json(
        { valid: false, error: "Cupom expirado" },
        { status: 200 }
      );
    }

    // Verificar limite de usos
    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
      return NextResponse.json(
        { valid: false, error: "Cupom esgotado" },
        { status: 200 }
      );
    }

    // Verificar pedido mínimo
    if (coupon.minOrder !== null && orderTotal < coupon.minOrder) {
      return NextResponse.json(
        {
          valid: false,
          error: `Pedido mínimo de R$ ${coupon.minOrder.toFixed(2)}`,
        },
        { status: 200 }
      );
    }

    // Calcular desconto
    let discount = 0;
    if (coupon.type === "PERCENTAGE") {
      discount = orderTotal * (coupon.value / 100);
    } else if (coupon.type === "FIXED") {
      discount = Math.min(coupon.value, orderTotal);
    } else {
      return NextResponse.json(
        { valid: false, error: "Tipo de cupom inválido" },
        { status: 200 }
      );
    }

    // Garantir que o desconto não ultrapasse o total do pedido
    discount = Math.min(discount, orderTotal);

    return NextResponse.json({
      valid: true,
      discount,
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao validar cupom" },
      { status: 500 }
    );
  }
}
