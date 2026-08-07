import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireBotAuth } from "@/lib/bot-auth";

/**
 * GET /api/bot/categories — lista categorias.
 * Permissão: products.manage (ou *)
 */
export async function GET(request: Request) {
  const auth = await requireBotAuth(request, "products.manage");
  if (!auth.ok) return auth.error;

  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, description: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ categories });
}
