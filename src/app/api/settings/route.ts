import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getPaymentSettings,
  savePaymentSettings,
  getStoreSettings,
  saveStoreSettings,
  getAppearanceSettings,
  saveAppearanceSettings,
} from "@/lib/settings";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";

/**
 * GET — público, retorna quais métodos de pagamento estão ativos + config da loja + aparência.
 */
export async function GET() {
  const [payment, store, appearance] = await Promise.all([
    getPaymentSettings(),
    getStoreSettings(),
    getAppearanceSettings(),
  ]);
  return NextResponse.json({ ...payment, ...store, appearance });
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

    // Salvar aparência (objeto JSON)
    if (body.appearance && typeof body.appearance === "object") {
      await saveAppearanceSettings(body.appearance);
    }

    const [payment, store, appearance] = await Promise.all([
      getPaymentSettings(),
      getStoreSettings(),
      getAppearanceSettings(),
    ]);
    return NextResponse.json({ success: true, settings: { ...payment, ...store, appearance } });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
