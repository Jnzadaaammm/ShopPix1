import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface DigitalProductEmail {
  to: string;
  userName: string;
  orderId: string;
  products: Array<{
    name: string;
    downloadUrl?: string;
    expiresAt?: Date;
    maxDownloads?: number;
  }>;
}

export async function sendDigitalProductEmail({
  to,
  userName,
  orderId,
  products,
}: DigitalProductEmail) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP não configurado. Email não enviado. Configure SMTP_USER e SMTP_PASS no .env");
    return { sent: false, reason: "SMTP não configurado" };
  }

  const productsHtml = products
    .filter((p) => p.downloadUrl)
    .map(
      (p) => `
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 16px; background: #f9fafb;">
        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 18px;">${p.name}</h3>
        <a href="${p.downloadUrl}"
           style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 12px;">
          📥 Baixar Produto
        </a>
        <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 13px;">
          ${p.expiresAt ? `⏰ Link válido até: ${p.expiresAt.toLocaleDateString("pt-BR")} às ${p.expiresAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}<br/>` : ""}
          ${p.maxDownloads ? `🔢 Limite de downloads: ${p.maxDownloads}` : ""}
        </p>
      </div>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 32px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 28px;">🎉 Compra Confirmada!</h1>
            <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9);">Seus produtos digitais estão prontos</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: #374151; font-size: 16px;">Olá, <strong>${userName}</strong>!</p>
            <p style="color: #374151; font-size: 15px;">
              Seu pagamento do pedido <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> foi confirmado com sucesso! 
              Abaixo estão os links para acessar seus produtos:
            </p>
            
            ${productsHtml}
            
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="margin: 0; color: #92400e; font-size: 13px;">
                ⚠️ <strong>Importante:</strong> Os links de download são pessoais e possuem prazo de validade. 
                Você também pode acessar seus produtos a qualquer momento na área "Meus Downloads" do site.
              </p>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              ShopPix - Loja de Produtos Digitais<br/>
              Este é um email automático, não responda.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"ShopPix" <${process.env.SMTP_USER}>`,
      to,
      subject: `Seus produtos digitais chegaram! - Pedido #${orderId.slice(0, 8).toUpperCase()}`,
      html,
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return { sent: false, reason: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}
