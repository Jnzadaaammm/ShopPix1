import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";
import { emit, REALTIME_EVENTS } from "@/lib/event-bus";

// GET - público, retorna categoria com produtos
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            category: true,
            reviews: { select: { rating: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    // Adicionar info de estoque
    const productsWithStats = category.products.map((p) => {
      const reviews = p.reviews || [];
      return {
        ...p,
        avgRating:
          reviews.length > 0
            ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
            : 0,
        reviewCount: reviews.length,
        inStock: true,
      };
    });

    return NextResponse.json({
      ...category,
      products: productsWithStats,
      productCount: category._count.products,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Erro ao buscar categoria" }, { status: 500 });
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
    if (!(await userHasPermission(session.user.id, "categories.manage"))) {
      return forbiddenResponse("Sem permissão para gerenciar categorias");
    }

    const { id } = await params;
    const body = await request.json();
    const { name, slug, description } = body;

    // Verificar se existe
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    // Gerar slug se não fornecido
    const finalSlug = slug
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      : undefined;

    // Verificar unicidade do slug/nome (se alterado)
    if (finalSlug && finalSlug !== existing.slug) {
      const dup = await prisma.category.findUnique({ where: { slug: finalSlug } });
      if (dup) {
        return NextResponse.json({ error: "Slug já existe" }, { status: 400 });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(finalSlug !== undefined && { slug: finalSlug }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    emit(REALTIME_EVENTS.CATEGORY_CHANGED, {});

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 });
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
    if (!(await userHasPermission(session.user.id, "categories.manage"))) {
      return forbiddenResponse("Sem permissão para gerenciar categorias");
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    if (category._count.products > 0 && !force) {
      return NextResponse.json(
        {
          error: `Existem ${category._count.products} produtos nesta categoria.`,
          productCount: category._count.products,
          needsForce: true,
        },
        { status: 409 }
      );
    }

    // Exclusão forçada: remove os produtos da categoria antes
    if (force && category._count.products > 0) {
      const productsToDelete = await prisma.product.findMany({
        where: { categoryId: id },
        select: { id: true, name: true, image: true },
      });

      await prisma.$transaction(async (tx) => {
        // Preserva o histórico dos pedidos com snapshot do produto
        for (const p of productsToDelete) {
          await tx.orderItem.updateMany({
            where: { productId: p.id },
            data: { productName: p.name, productImage: p.image, productId: null },
          });
        }
        await tx.product.deleteMany({ where: { categoryId: id } });
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    emit(REALTIME_EVENTS.CATEGORY_CHANGED, {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Erro ao deletar categoria" }, { status: 500 });
  }
}
