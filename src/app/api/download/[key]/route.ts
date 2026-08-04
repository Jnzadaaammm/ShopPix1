import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const download = await prisma.digitalDownload.findUnique({
      where: { downloadKey: key },
      include: { product: true },
    });

    if (!download) {
      return NextResponse.json({ error: "Link de download inválido" }, { status: 404 });
    }

    if (new Date() > download.expiresAt) {
      return NextResponse.json(
        { error: "Link de download expirado. Acesse Meus Downloads para gerar um novo link." },
        { status: 410 }
      );
    }

    if (download.downloadsUsed >= download.maxDownloads) {
      return NextResponse.json(
        { error: "Limite de downloads atingido para este produto." },
        { status: 403 }
      );
    }

    if (!download.product.fileUrl) {
      return NextResponse.json(
        { error: "Arquivo do produto não configurado. Entre em contato com o suporte." },
        { status: 404 }
      );
    }

    await prisma.digitalDownload.update({
      where: { id: download.id },
      data: { downloadsUsed: { increment: 1 } },
    });

    // Redirecionar para o arquivo (URL externa ou local)
    return NextResponse.redirect(download.product.fileUrl);
  } catch (error) {
    console.error("Erro no download:", error);
    return NextResponse.json({ error: "Erro ao processar download" }, { status: 500 });
  }
}
