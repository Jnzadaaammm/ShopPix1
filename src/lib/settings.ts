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
 * Configurações gerais da loja (salvas no banco).
 */
export const DEFAULT_STORE_SETTINGS = {
  storeName: "ShopPix",
  storeDescription: "Compre produtos digitais com segurança. Entrega imediata.",
  supportEmail: "",
  discordWebhookUrl: "",
  pixExpirationHours: "24",
  autoApproveStripe: false,
  autoApprovePaypal: false,
};

export interface StoreSettings {
  storeName: string;
  storeDescription: string;
  supportEmail: string;
  discordWebhookUrl: string;
  pixExpirationHours: string;
  autoApproveStripe: boolean;
  autoApprovePaypal: boolean;
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

/**
 * Lê as configurações gerais da loja do banco.
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  const rows = await prisma.setting.findMany({
    where: {
      key: {
        in: Object.keys(DEFAULT_STORE_SETTINGS),
      },
    },
  });

  const settings: StoreSettings = { ...DEFAULT_STORE_SETTINGS };
  const rowMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  for (const key of Object.keys(DEFAULT_STORE_SETTINGS) as (keyof StoreSettings)[]) {
    if (rowMap[key] !== undefined) {
      if (key === "autoApproveStripe" || key === "autoApprovePaypal") {
        (settings as any)[key] = rowMap[key] === "true";
      } else {
        (settings as any)[key] = rowMap[key];
      }
    }
  }
  // Discord webhook vem do env se não estiver no banco
  if (!settings.discordWebhookUrl) {
    settings.discordWebhookUrl = process.env.DISCORD_ORDERS_WEBHOOK_URL || "";
  }
  return settings;
}

/**
 * Salva as configurações gerais da loja no banco.
 */
export async function saveStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  const entries = Object.entries(settings).filter(([key]) =>
    key in DEFAULT_STORE_SETTINGS
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
