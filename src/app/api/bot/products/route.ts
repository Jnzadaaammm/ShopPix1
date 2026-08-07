import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBotAuth } from "@/lib/bot-auth";

/**
 * GET /api/bot/products — lista produtos (com busca e filtros).
 * Permissão: products.manage (ou *)
 */
export async function GET(request: Request) {
  const auth = await requireBotAuth(request, "products.manage");
  if (!auth.ok) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const categorySlug = searchParams.get("category");
  const featured = searchParams.get("featured") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const where: any = {
    ...(search && {
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
      ],
    }),
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(featured && { featured: true }),
  };

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      stock: true,
      stockMode: true,
      featured: true,
      categoryId: true,
      category: { select: { id: true, name: true, slug: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ products });
}

/**
 * POST /api/bot/products — cria um produto.
 * Permissão: products.manage (ou *)
 */
export async function POST(request: Request) {
  const auth = await requireBotAuth(request, "products.manage");
  if (!auth.ok) return auth.error;

  try {
    const body = await request.json();
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
      return NextResponse.json({ error: "Categoria (categoryId) é obrigatória" }, { status: 400 });
    }

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
        image: body.image || "",
        categoryId: body.categoryId,
        stock,
        featured: body.featured || false,
        stockMode,
        fileUrl: body.fileUrl || null,
        maxDownloads: body.maxDownloads || 5,
      },
      include: { category: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar produto via API:", error);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}
