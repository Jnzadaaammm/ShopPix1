import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";
import { emit, REALTIME_EVENTS } from "@/lib/event-bus";

// GET - público, com busca, filtros e paginação
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const categorySlug = searchParams.get("category");
  const featured = searchParams.get("featured");
  const search = searchParams.get("search") || "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sortBy = searchParams.get("sortBy") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  // Construir where
  const where: any = {
    ...(categoryId && { categoryId }),
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(featured === "true" && { featured: true }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
      ],
    }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      },
    }),
  };

  // Ordenação
  const orderBy: any = {
    newest: { createdAt: "desc" },
    price_low: { price: "asc" },
    price_high: { price: "desc" },
    oldest: { createdAt: "asc" },
  }[sortBy] || { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        stock: true,
        stockMode: true,
        fileUrl: true,
        featured: true,
        createdAt: true,
        updatedAt: true,
        categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
        reviews: { select: { rating: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // Adicionar campos calculados
  const productsWithStats = products.map((p) => {
    const reviews = p.reviews || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;
    return {
      ...p,
      avgRating,
      reviewCount: reviews.length,
      inStock: true,
      effectiveStock: p.stockMode === "CREDENTIALS" ? p.stock : null,
    };
  });

  const response = NextResponse.json({
    products: productsWithStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
  // Cache público por 30 segundos (SWR — revalida em background)
  response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  return response;
}

// POST - apenas admin com permissão
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (!(await userHasPermission(session.user.id, "products.manage"))) {
      return forbiddenResponse("Sem permissão para gerenciar produtos");
    }

    const body = await request.json();

    // Validação básica
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }
    if (!body.description?.trim()) {
      return NextResponse.json({ error: "Descrição é obrigatória" }, { status: 400 });
    }
    if (!body.price || body.price <= 0) {
      return NextResponse.json({ error: "Preço inválido" }, { status: 400 });
    }
    if (!body.categoryId) {
      return NextResponse.json({ error: "Categoria é obrigatória" }, { status: 400 });
    }

    // Verificar se a categoria existe
    const category = await prisma.category.findUnique({
      where: { id: body.categoryId },
    });
    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 400 });
    }

    const stockMode = body.stockMode || "SIMPLE";
    const stock = stockMode === "CREDENTIALS" ? (body.stock ?? 0) : 0;

    const product = await prisma.product.create({
      data: {
        name: body.name.trim(),
        description: body.description.trim(),
        price: parseFloat(body.price),
        image: body.image,
        categoryId: body.categoryId,
        stock,
        featured: body.featured || false,
        stockMode,
        fileUrl: body.fileUrl || null,
        maxDownloads: body.maxDownloads || 5,
      },
      include: {
        category: true,
      },
    });

    emit(REALTIME_EVENTS.PRODUCT_CREATED, { productId: product.id });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}
