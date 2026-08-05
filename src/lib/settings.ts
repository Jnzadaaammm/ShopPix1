import { prisma } from "@/lib/db";

/**
 * Configurações de pagamento padrão.
 * Usado quando não há configuração salva no banco ainda.
 */
export const DEFAULT_PAYMENT_SETTINGS = {
  stripeEnabled: true,
  paypalEnabled: true,
  pixEnabled: true,
};

export interface PaymentSettings {
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  pixEnabled: boolean;
  pixKey: string;
}

/**
 * Lê as configurações de pagamento do banco (Setting key-value).
 * Retorna os defaults se não houver configuração salva.
 */
export async function getPaymentSettings(): Promise<PaymentSettings> {
  const rows = await prisma.setting.findMany({
    where: {
      key: {
        in: Object.keys(DEFAULT_PAYMENT_SETTINGS),
      },
    },
  });

  const settings: PaymentSettings = { ...DEFAULT_PAYMENT_SETTINGS, pixKey: "" };
  for (const row of rows) {
    if ((settings as unknown as Record<string, boolean | string>)[row.key] !== undefined) {
      (settings as unknown as Record<string, boolean | string>)[row.key] = row.value === "true";
    }
  }
  settings.pixKey = process.env.PIX_KEY || "";
  return settings;
}

/**
 * Salva as configurações de pagamento no banco.
 */
export async function savePaymentSettings(settings: Partial<PaymentSettings>): Promise<void> {
  const entries = Object.entries(settings).filter(([key]) =>
    key in DEFAULT_PAYMENT_SETTINGS
  );

  await Promise.all(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );
}
