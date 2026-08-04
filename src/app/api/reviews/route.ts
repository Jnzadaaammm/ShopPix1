import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: lista reviews de um produto (público)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId é obrigatório" },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar reviews" },
      { status: 500 }
    );
  }
}

// POST: cria ou atualiza review (apenas compradores com pedido PAID)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, rating, comment } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId é obrigatório" },
        { status: 400 }
      );
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Avaliação deve ser entre 1 e 5" },
        { status: 400 }
      );
    }

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem um pedido PAID contendo este produto
    const paidOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "PAID",
        items: { some: { productId } },
      },
      select: { id: true },
    });

    if (!paidOrder) {
      return NextResponse.json(
        { error: "Apenas compradores podem avaliar este produto" },
        { status: 403 }
      );
    }

    // Upsert: um review por usuário por produto (atualiza se existir)
    const review = await prisma.review.upsert({
      where: {
        productId_userId: { productId, userId: session.user.id },
      },
      update: {
        rating,
        comment: comment ?? null,
      },
      create: {
        productId,
        userId: session.user.id,
        rating,
        comment: comment ?? null,
      },
      include: {
        user: {
          select: { name: true, image: true },
        },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao salvar review" },
      { status: 500 }
    );
  }
}
