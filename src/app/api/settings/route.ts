import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getPaymentSettings,
  savePaymentSettings,
  getStoreSettings,
  saveStoreSettings,
} from "@/lib/settings";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";

/**
 * GET — público, retorna quais métodos de pagamento estão ativos + config da loja.
 */
export async function GET() {
  const [payment, store] = await Promise.all([
    getPaymentSettings(),
    getStoreSettings(),
  ]);
  return NextResponse.json({ ...payment, ...store });
}

/**
 * PUT — apenas admin, atualiza as configurações.
 */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!(await userHasPermission(session.user.id, "settings.manage"))) {
    return forbiddenResponse("Sem permissão para gerenciar configurações");
  }

  try {
    const body = await request.json();

    // Salvar configurações de pagamento (booleans)
    const paymentKeys = ["stripeEnabled", "paypalEnabled", "pixEnabled"];
    const paymentUpdates: Record<string, boolean> = {};
    for (const key of paymentKeys) {
      if (typeof body[key] === "boolean") {
        paymentUpdates[key] = body[key];
      }
    }
    if (Object.keys(paymentUpdates).length > 0) {
      await savePaymentSettings(paymentUpdates);
    }

    // Salvar configurações da loja (strings + booleans)
    const storeStringKeys = ["storeName", "storeDescription", "supportEmail", "discordWebhookUrl", "pixExpirationHours"];
    const storeBoolKeys = ["autoApproveStripe", "autoApprovePaypal"];
    const storeUpdates: Record<string, string | boolean> = {};
    for (const key of storeStringKeys) {
      if (typeof body[key] === "string") {
        storeUpdates[key] = body[key].trim();
      }
    }
    for (const key of storeBoolKeys) {
      if (typeof body[key] === "boolean") {
        storeUpdates[key] = body[key];
      }
    }
    if (Object.keys(storeUpdates).length > 0) {
      await saveStoreSettings(storeUpdates);
    }

    const [payment, store] = await Promise.all([
      getPaymentSettings(),
      getStoreSettings(),
    ]);
    return NextResponse.json({ success: true, settings: { ...payment, ...store } });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
