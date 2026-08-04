import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";
import { emit, REALTIME_EVENTS } from "@/lib/event-bus";

// GET - público, retorna um produto com reviews e relacionados
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // Produtos relacionados (mesma categoria)
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      take: 4,
      include: {
        category: true,
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const reviews = product.reviews || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      ...product,
      avgRating,
      reviewCount: reviews.length,
      inStock: true,
      related,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Erro ao buscar produto" }, { status: 500 });
  }
}

// PUT - apenas admin
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (!(await userHasPermission(session.user.id, "products.manage"))) {
      return forbiddenResponse("Sem permissão para gerenciar produtos");
    }

    const { id } = await params;
    const body = await request.json();

    // Verificar se existe
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // Validação
    if (body.price !== undefined && body.price <= 0) {
      return NextResponse.json({ error: "Preço inválido" }, { status: 400 });
    }
    if (body.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: body.categoryId },
      });
      if (!category) {
        return NextResponse.json({ error: "Categoria não encontrada" }, { status: 400 });
      }
    }

    const stockMode = body.stockMode ?? existing.stockMode ?? "SIMPLE";
    const stock = stockMode === "CREDENTIALS" ? (body.stock ?? existing.stock) : 0;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description.trim() }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        stock,
        ...(body.featured !== undefined && { featured: body.featured }),
        stockMode,
        ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl || null }),
        ...(body.maxDownloads !== undefined && { maxDownloads: body.maxDownloads }),
      },
      include: {
        category: true,
      },
    });

    emit(REALTIME_EVENTS.PRODUCT_UPDATED, { productId: product.id });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}

// DELETE - apenas admin
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (!(await userHasPermission(session.user.id, "products.manage"))) {
      return forbiddenResponse("Sem permissão para gerenciar produtos");
    }

    const { id } = await params;

    // Verificar se existe
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // Preserva o histórico dos pedidos: grava um snapshot do produto nos itens
    // vendidos e desvincula o produto antes de excluí-lo.
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.updateMany({
        where: { productId: id },
        data: {
          productName: existing.name,
          productImage: existing.image,
          productId: null,
        },
      });

      await tx.product.delete({ where: { id } });
    });

    emit(REALTIME_EVENTS.PRODUCT_DELETED, { productId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Erro ao deletar produto" }, { status: 500 });
  }
}
