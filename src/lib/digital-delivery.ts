import { randomBytes } from "crypto";
import { prisma } from "./db";
import { sendDigitalProductEmail } from "./email";

const DOWNLOAD_LINK_VALIDITY_DAYS = 7;

export async function deliverDigitalProducts(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: { include: { product: true } },
      downloads: true,
    },
  });

  if (!order) throw new Error("Pedido não encontrado");

  // Evitar entrega duplicada
  if (order.downloads.length > 0) {
    return { delivered: false, reason: "Produtos já entregues" };
  }

  // Atribuir credenciais para produtos no modo CREDENTIALS
  // (itens cujo produto foi excluído são ignorados)
  const credentialItems = order.items.filter(
    (item) => item.product?.stockMode === "CREDENTIALS"
  );

  let assignedCredentials = 0;
  if (credentialItems.length > 0) {
    for (const item of credentialItems) {
      // Buscar credenciais disponíveis suficientes
      const available = await prisma.productCredential.findMany({
        where: { productId: item.productId!, status: "AVAILABLE" },
        take: item.quantity,
        orderBy: { createdAt: "asc" }, // FIFO — primeiro a entrar, primeiro a sair
      });

      if (available.length < item.quantity) {
        throw new Error(
          `Estoque insuficiente de credenciais para ${item.product!.name}. ` +
          `Disponível: ${available.length}, necessário: ${item.quantity}`
        );
      }

      // Marcar como vendidas e vincular ao item do pedido
      await prisma.productCredential.updateMany({
        where: { id: { in: available.map((c) => c.id) } },
        data: {
          status: "SOLD",
          orderItemId: item.id,
          soldAt: new Date(),
        },
      });
      assignedCredentials += available.length;

      // Atualizar estoque do produto
      const remaining = await prisma.productCredential.count({
        where: { productId: item.productId!, status: "AVAILABLE" },
      });
      await prisma.product.update({
        where: { id: item.productId! },
        data: { stock: remaining },
      });
    }
  }

  // Criar links de download para produtos com fileUrl (modo SIMPLES)
  const fileDownloadItems = order.items.filter(
    (item) =>
      item.product?.stockMode !== "CREDENTIALS" &&
      item.product?.fileUrl
  );

  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
  const expiresAt = new Date(Date.now() + DOWNLOAD_LINK_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

  const downloads = await Promise.all(
    fileDownloadItems.map((item) =>
      prisma.digitalDownload.create({
        data: {
          orderId: order.id,
          productId: item.productId!,
          userId: order.userId,
          downloadKey: randomBytes(32).toString("hex"),
          expiresAt,
          maxDownloads: item.product!.maxDownloads,
        },
        include: { product: true },
      })
    )
  );

  // Enviar email
  let emailResult: { sent: boolean; reason?: string } = { sent: false, reason: "Sem email" };

  if (order.user.email) {
    const products = [
      // Produtos com credenciais
      ...credentialItems.flatMap((item) =>
        Array.from({ length: item.quantity }, () => ({
          name: item.product?.name || item.productName || "Produto",
          type: "credential" as const,
        }))
      ),
      // Produtos com download
      ...downloads.map((d) => ({
        name: d.product.name,
        type: "download" as const,
        downloadUrl: `${baseUrl}/download/${d.downloadKey}`,
        expiresAt: d.expiresAt,
        maxDownloads: d.maxDownloads,
      })),
    ];

    if (products.length > 0 || assignedCredentials > 0) {
      emailResult = await sendDigitalProductEmail({
        to: order.user.email,
        userName: order.user.name || "Cliente",
        orderId: order.id,
        products: products.map((p) => ({
          name: p.name,
          downloadUrl: "downloadUrl" in p ? p.downloadUrl : undefined,
          expiresAt: "expiresAt" in p ? p.expiresAt : undefined,
          maxDownloads: "maxDownloads" in p ? p.maxDownloads : undefined,
        })),
      });
    }
  }

  return {
    delivered: true,
    downloads: downloads.length,
    credentialsAssigned: assignedCredentials,
    emailSent: emailResult.sent,
  };
}
