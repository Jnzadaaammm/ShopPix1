import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";
import { decryptCredential, encryptCredential } from "@/lib/crypto";

function safeDecrypt(content: string): string {
  try {
    return decryptCredential(content);
  } catch {
    return content;
  }
}

// GET - admin: lista credenciais de um produto
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!(await userHasPermission(session.user.id, "products.manage"))) {
    return forbiddenResponse("Sem permissão para gerenciar produtos");
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const status = searchParams.get("status"); // AVAILABLE, SOLD, ALL

  if (!productId) {
    return NextResponse.json({ error: "productId é obrigatório" }, { status: 400 });
  }

  const where: any = { productId };
  if (status && status !== "ALL") {
    where.status = status;
  }

  const credentials = await prisma.productCredential.findMany({
    where,
    include: {
      orderItem: {
        include: {
          order: {
            select: { id: true, user: { select: { name: true, email: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Estatísticas
  const stats = await prisma.productCredential.groupBy({
    by: ["status"],
    where: { productId },
    _count: true,
  });

  const available = stats.find((s) => s.status === "AVAILABLE")?._count || 0;
  const sold = stats.find((s) => s.status === "SOLD")?._count || 0;
  const reserved = stats.find((s) => s.status === "RESERVED")?._count || 0;

  const decryptedCredentials = credentials.map((c) => ({
    ...c,
    content: safeDecrypt(c.content),
  }));

  return NextResponse.json({
    credentials: decryptedCredentials,
    stats: { available, sold, reserved, total: available + sold + reserved },
  });
}

// POST - admin: adicionar credenciais (uma ou várias)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!(await userHasPermission(session.user.id, "products.manage"))) {
    return forbiddenResponse("Sem permissão para gerenciar produtos");
  }

  const body = await request.json();
  const { productId, credentials, mode } = body;

  if (!productId) {
    return NextResponse.json({ error: "productId é obrigatório" }, { status: 400 });
  }

  // Verificar se o produto existe
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  // mode: "BULK" = texto com várias linhas, "SINGLE" = uma credencial
  let lines: string[] = [];
  if (mode === "BULK") {
    // credentials é uma string com várias linhas
    lines = (credentials as string)
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  } else {
    // credentials é uma string única ou array
    if (Array.isArray(credentials)) {
      lines = credentials.map((c: string) => c.trim()).filter((c) => c.length > 0);
    } else {
      lines = [String(credentials).trim()].filter((c) => c.length > 0);
    }
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: "Nenhuma credencial válida fornecida" }, { status: 400 });
  }

  // Criptografar e criar
  const encrypted = lines.map((line) => ({
    productId,
    content: encryptCredential(line).content,
  }));

  await prisma.productCredential.createMany({
    data: encrypted,
  });

  // Atualizar stock do produto para refletir credenciais disponíveis
  if (product.stockMode === "CREDENTIALS") {
    const availableCount = await prisma.productCredential.count({
      where: { productId, status: "AVAILABLE" },
    });
    await prisma.product.update({
      where: { id: productId },
      data: { stock: availableCount },
    });
  }

  return NextResponse.json({
    success: true,
    added: lines.length,
    message: `${lines.length} credencial(is) adicionada(s)`,
  });
}

// DELETE - admin: remover credenciais (apenas disponíveis)
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!(await userHasPermission(session.user.id, "products.manage"))) {
    return forbiddenResponse("Sem permissão para gerenciar produtos");
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const productId = searchParams.get("productId");
  const all = searchParams.get("all") === "true";

  if (id) {
    // Deletar uma credencial específica
    const credential = await prisma.productCredential.findUnique({ where: { id } });
    if (!credential) {
      return NextResponse.json({ error: "Credencial não encontrada" }, { status: 404 });
    }
    if (credential.status === "SOLD") {
      return NextResponse.json({ error: "Não é possível remover uma credencial já vendida" }, { status: 400 });
    }
    await prisma.productCredential.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  if (productId && all) {
    // Deletar todas as credenciais disponíveis de um produto
    const result = await prisma.productCredential.deleteMany({
      where: { productId, status: "AVAILABLE" },
    });
    return NextResponse.json({ success: true, deleted: result.count });
  }

  return NextResponse.json({ error: "Especifique id ou productId+all" }, { status: 400 });
}
