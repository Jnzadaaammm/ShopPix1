import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const downloads = await prisma.digitalDownload.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: { id: true, name: true, image: true, description: true },
        },
        order: {
          select: { id: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(downloads);
  } catch (error) {
    console.error("Erro ao buscar downloads:", error);
    return NextResponse.json({ error: "Erro ao buscar downloads" }, { status: 500 });
  }
}

// Renovar link expirado
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { downloadId } = await request.json();

    const download = await prisma.digitalDownload.findFirst({
      where: { id: downloadId, userId: session.user.id },
    });

    if (!download) {
      return NextResponse.json({ error: "Download não encontrado" }, { status: 404 });
    }

    const renewed = await prisma.digitalDownload.update({
      where: { id: download.id },
      data: {
        downloadKey: randomBytes(32).toString("hex"),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json(renewed);
  } catch (error) {
    console.error("Erro ao renovar link:", error);
    return NextResponse.json({ error: "Erro ao renovar link" }, { status: 500 });
  }
}
