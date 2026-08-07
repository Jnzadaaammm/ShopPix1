import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBotAuth } from "@/lib/bot-auth";

/**
 * GET /api/bot/products/[id] — detalhe de um produto.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireBotAuth(request, "products.manage");
  if (!auth.ok) return auth.error;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true } },
      reviews: { select: { rating: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }
  return NextResponse.json(product);
}

/**
 * PATCH /api/bot/products/[id] — atualiza um produto (campar estoque).
 * Body: { stock?: number, name?: string, price?: number, ... }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireBotAuth(request, "products.manage");
  if (!auth.ok) return auth.error;

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const data: any = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.price === "number" && body.price > 0) data.price = body.price;
  if (typeof body.stock === "number" && existing.stockMode === "CREDENTIALS") {
    data.stock = body.stock;
  }
  if (typeof body.featured === "boolean") data.featured = body.featured;
  if (typeof body.image === "string") data.image = body.image;

  const updated = await prisma.product.update({ where: { id }, data });
  return NextResponse.json(updated);
}
