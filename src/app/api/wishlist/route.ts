import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: lista wishlist do usuário autenticado com detalhes do produto
// Ou ?check=productId para verificar se um produto específico está na wishlist
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const checkProductId = searchParams.get("check");

    // Modo check: verifica se um produto específico está na wishlist
    if (checkProductId) {
      const item = await prisma.wishlistItem.findUnique({
        where: {
          productId_userId: {
            productId: checkProductId,
            userId: session.user.id,
          },
        },
        select: { id: true },
      });
      return NextResponse.json({ wishlisted: !!item });
    }

    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(wishlist);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar wishlist" },
      { status: 500 }
    );
  }
}

// POST: adiciona produto à wishlist (ignora se já existir)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "productId é obrigatório" },
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

    const item = await prisma.wishlistItem.upsert({
      where: {
        productId_userId: { productId, userId: session.user.id },
      },
      update: {}, // não altera nada se já existir
      create: {
        productId,
        userId: session.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao adicionar à wishlist" },
      { status: 500 }
    );
  }
}

// DELETE: remove produto da wishlist
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "productId é obrigatório" },
        { status: 400 }
      );
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        productId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao remover da wishlist" },
      { status: 500 }
    );
  }
}
