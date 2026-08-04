import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";
import { emit, REALTIME_EVENTS } from "@/lib/event-bus";

// GET - público, retorna categorias com contagem de produtos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const withProducts = searchParams.get("withProducts") === "true";

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
        ...(withProducts && {
          products: {
            include: {
              category: true,
              reviews: { select: { rating: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        }),
      },
      orderBy: { name: "asc" },
    });

    // Adicionar info de estoque por categoria
    const categoriesWithStats = await Promise.all(
      categories.map(async (cat) => {
        if (withProducts) {
          const products = (cat as any).products || [];
          const inStock = products.length;
          return {
            ...cat,
            productCount: cat._count.products,
            inStockCount: inStock,
          };
        }
        return {
          ...cat,
          productCount: cat._count.products,
        };
      })
    );

    const response = NextResponse.json(categoriesWithStats);
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return response;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}

// POST - apenas admin com permissão
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (!(await userHasPermission(session.user.id, "categories.manage"))) {
      return forbiddenResponse("Sem permissão para gerenciar categorias");
    }

    const body = await request.json();
    const { name, slug, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    // Gerar slug automaticamente se não fornecido
    const finalSlug = (slug || name).trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!finalSlug) {
      return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
    }

    // Verificar se já existe
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: name.trim() }, { slug: finalSlug }],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Categoria ou slug já existe" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
      },
    });

    emit(REALTIME_EVENTS.CATEGORY_CHANGED, {});

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}
