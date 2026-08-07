import { NextResponse } from "next/server";
import { requireBotAuth } from "@/lib/bot-auth";
import { getStoreSettings } from "@/lib/settings";

/**
 * GET /api/bot/settings — configurações públicas da loja (nome, descrição, contato).
 * Permissão: qualquer chave válida.
 */
export async function GET(request: Request) {
  const auth = await requireBotAuth(request, "orders.view");
  if (!auth.ok) return auth.error;

  const settings = await getStoreSettings();
  return NextResponse.json({
    storeName: settings.storeName,
    storeDescription: settings.storeDescription,
    supportEmail: settings.supportEmail,
    siteUrl: process.env.NEXT_PUBLIC_APP_URL || "",
  });
}
