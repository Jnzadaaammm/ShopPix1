import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPaymentSettings, savePaymentSettings } from "@/lib/settings";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";

/**
 * GET — público, retorna quais métodos de pagamento estão ativos.
 * Usado pelo frontend no checkout para mostrar/esconder opções.
 */
export async function GET() {
  const settings = await getPaymentSettings();
  return NextResponse.json(settings);
}

/**
 * PUT — apenas admin, atualiza as configurações de pagamento.
 * Body: { stripeEnabled }
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
    const allowed = ["stripeEnabled", "paypalEnabled", "pixEnabled"];
    const updates: Record<string, boolean> = {};

    for (const key of allowed) {
      if (typeof body[key] === "boolean") {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nenhuma configuração válida" }, { status: 400 });
    }

    await savePaymentSettings(updates);

    const settings = await getPaymentSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
