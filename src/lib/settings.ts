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

/* ============================================================
 * Configurações de Aparência (Hero, Features, CTA, Footer, Social)
 * Salvas como um único JSON na key "appearanceSettings".
 * ============================================================ */

export interface FeatureItem {
  icon: string; // chave do ícone (zap, creditcard, download, shield, headsets, star, gift, lock)
  title: string;
  desc: string;
  from: string; // cor gradiente início (ex: "from-yellow-500")
  to: string; // cor gradiente fim (ex: "to-yellow-700")
}

export interface AppearanceSettings {
  // Hero
  heroBadge: string;
  heroTitleLine1: string;
  heroTitleHighlight: string; // palavra em destaque (cor brand)
  heroTitleLine2: string;
  heroSubtitle: string;
  heroPrimaryButtonText: string;
  heroPrimaryButtonLink: string;
  heroSecondaryButtonText: string;
  heroSecondaryButtonLink: string;
  // Features (4 cards)
  features: FeatureItem[];
  // CTA final
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  // Footer
  footerAbout: string;
  footerContactEmail: string;
  // Redes sociais (URLs — vazio = não exibir)
  socialDiscord: string;
  socialInstagram: string;
  socialTwitter: string;
  socialYoutube: string;
  socialTiktok: string;
  // Cor da marca (hex) — aplicada via CSS variable --color-brand
  brandColor: string;
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  heroBadge: "Entrega Rápida Garantida",
  heroTitleLine1: "Focadas em",
  heroTitleHighlight: "Velocidade",
  heroTitleLine2: "e Praticidade",
  heroSubtitle:
    "Receba seus produtos em segundos, 100% automático. Compre e use agora mesmo.",
  heroPrimaryButtonText: "Ver Catálogo",
  heroPrimaryButtonLink: "/produtos",
  heroSecondaryButtonText: "Saber Mais",
  heroSecondaryButtonLink: "/faq",
  features: [
    {
      icon: "zap",
      title: "Pagamento com Cartão",
      desc: "Pague em segundos com cartão via Stripe e receba confirmação imediata.",
      from: "from-yellow-500",
      to: "to-yellow-700",
    },
    {
      icon: "creditcard",
      title: "Cartão via Stripe",
      desc: "Pague com cartão (Visa, Master, Elo) via Stripe com segurança.",
      from: "from-blue-500",
      to: "to-blue-700",
    },
    {
      icon: "download",
      title: "Entrega Imediata",
      desc: "Produtos digitais disponíveis logo após o pagamento.",
      from: "from-purple-500",
      to: "to-purple-700",
    },
    {
      icon: "shield",
      title: "Compra Segura",
      desc: "Login via Google ou Discord. Dados protegidos.",
      from: "from-emerald-500",
      to: "to-emerald-700",
    },
  ],
  ctaTitle: "Pronto para começar?",
  ctaSubtitle:
    "Explore nosso catálogo de produtos digitais e receba seus arquivos imediatamente após o pagamento.",
  ctaButtonText: "Ver Produtos",
  ctaButtonLink: "/produtos",
  footerAbout:
    "Sua loja online com produtos digitais e físicos. Pagamento via cartão (Stripe).",
  footerContactEmail: "",
  socialDiscord: "",
  socialInstagram: "",
  socialTwitter: "",
  socialYoutube: "",
  socialTiktok: "",
  brandColor: "#7c3aed",
};

/**
 * Lê as configurações de aparência do banco.
 */
export async function getAppearanceSettings(): Promise<AppearanceSettings> {
  const row = await prisma.setting.findUnique({
    where: { key: "appearanceSettings" },
  });
  if (!row) return { ...DEFAULT_APPEARANCE_SETTINGS };
  try {
    const parsed = JSON.parse(row.value);
    // Merge para garantir que novas chaves tenham defaults
    return {
      ...DEFAULT_APPEARANCE_SETTINGS,
      ...parsed,
      features:
        Array.isArray(parsed.features) && parsed.features.length > 0
          ? parsed.features.map((f: FeatureItem, i: number) => ({
              ...DEFAULT_APPEARANCE_SETTINGS.features[i % 4],
              ...f,
            }))
          : DEFAULT_APPEARANCE_SETTINGS.features,
    };
  } catch {
    return { ...DEFAULT_APPEARANCE_SETTINGS };
  }
}

/**
 * Salva as configurações de aparência no banco (JSON único).
 */
export async function saveAppearanceSettings(
  settings: Partial<AppearanceSettings>,
): Promise<void> {
  const current = await getAppearanceSettings();
  const merged = { ...current, ...settings };
  await prisma.setting.upsert({
    where: { key: "appearanceSettings" },
    update: { value: JSON.stringify(merged) },
    create: { key: "appearanceSettings", value: JSON.stringify(merged) },
  });
}
