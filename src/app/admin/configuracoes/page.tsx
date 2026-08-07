"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  Store, CreditCard, Save, Check, QrCode, AlertCircle,
  Bell, Clock, Zap, LayoutTemplate, MessageCircle,
  Instagram, Twitter, Youtube, Music, Palette, Plus, Trash2,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";
import type { AppearanceSettings, FeatureItem } from "@/lib/settings";

interface AllSettings {
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  pixEnabled: boolean;
  pixKey: string;
  storeName: string;
  storeDescription: string;
  supportEmail: string;
  discordWebhookUrl: string;
  pixExpirationHours: string;
  autoApproveStripe: boolean;
  autoApprovePaypal: boolean;
  appearance: AppearanceSettings;
}

const DEFAULT_APPEARANCE: AppearanceSettings = {
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
    { icon: "zap", title: "Pagamento com Cartão", desc: "Pague em segundos com cartão via Stripe.", from: "from-yellow-500", to: "to-yellow-700" },
    { icon: "creditcard", title: "Cartão via Stripe", desc: "Pague com cartão via Stripe com segurança.", from: "from-blue-500", to: "to-blue-700" },
    { icon: "download", title: "Entrega Imediata", desc: "Produtos digitais disponíveis logo após o pagamento.", from: "from-purple-500", to: "to-purple-700" },
    { icon: "shield", title: "Compra Segura", desc: "Login via Google ou Discord. Dados protegidos.", from: "from-emerald-500", to: "to-emerald-700" },
  ],
  ctaTitle: "Pronto para começar?",
  ctaSubtitle: "Explore nosso catálogo de produtos digitais e receba seus arquivos imediatamente após o pagamento.",
  ctaButtonText: "Ver Produtos",
  ctaButtonLink: "/produtos",
  footerAbout: "Sua loja online com produtos digitais e físicos. Pagamento via cartão (Stripe).",
  footerContactEmail: "",
  socialDiscord: "",
  socialInstagram: "",
  socialTwitter: "",
  socialYoutube: "",
  socialTiktok: "",
  brandColor: "#7c3aed",
};

const ICON_OPTIONS = [
  { value: "zap", label: "Raio (Zap)" },
  { value: "creditcard", label: "Cartão" },
  { value: "download", label: "Download" },
  { value: "shield", label: "Escudo" },
  { value: "headsets", label: "Fone" },
  { value: "star", label: "Estrela" },
  { value: "gift", label: "Presente" },
  { value: "lock", label: "Cadeado" },
];

const COLOR_OPTIONS = [
  { from: "from-yellow-500", to: "to-yellow-700", label: "Amarelo" },
  { from: "from-blue-500", to: "to-blue-700", label: "Azul" },
  { from: "from-purple-500", to: "to-purple-700", label: "Roxo" },
  { from: "from-emerald-500", to: "to-emerald-700", label: "Esmeralda" },
  { from: "from-red-500", to: "to-red-700", label: "Vermelho" },
  { from: "from-pink-500", to: "to-pink-700", label: "Rosa" },
  { from: "from-indigo-500", to: "to-indigo-700", label: "Índigo" },
  { from: "from-orange-500", to: "to-orange-700", label: "Laranja" },
];

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AllSettings>({
    stripeEnabled: true,
    paypalEnabled: true,
    pixEnabled: true,
    pixKey: "",
    storeName: "ShopPix",
    storeDescription: "",
    supportEmail: "",
    discordWebhookUrl: "",
    pixExpirationHours: "24",
    autoApproveStripe: false,
    autoApprovePaypal: false,
    appearance: DEFAULT_APPEARANCE,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          stripeEnabled: data.stripeEnabled ?? true,
          paypalEnabled: data.paypalEnabled ?? true,
          pixEnabled: data.pixEnabled ?? true,
          pixKey: data.pixKey || "",
          storeName: data.storeName || "ShopPix",
          storeDescription: data.storeDescription || "",
          supportEmail: data.supportEmail || "",
          discordWebhookUrl: data.discordWebhookUrl || "",
          pixExpirationHours: data.pixExpirationHours || "24",
          autoApproveStripe: data.autoApproveStripe ?? false,
          autoApprovePaypal: data.autoApprovePaypal ?? false,
          appearance: data.appearance
            ? { ...DEFAULT_APPEARANCE, ...data.appearance }
            : DEFAULT_APPEARANCE,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const updateAppearance = (patch: Partial<AppearanceSettings>) => {
    setSettings({ ...settings, appearance: { ...settings.appearance, ...patch } });
  };

  const updateFeature = (idx: number, patch: Partial<FeatureItem>) => {
    const features = [...settings.appearance.features];
    features[idx] = { ...features[idx], ...patch };
    updateAppearance({ features });
  };

  const addFeature = () => {
    const features = [...settings.appearance.features, {
      icon: "star", title: "Nova Feature", desc: "Descrição...", from: "from-purple-500", to: "to-purple-700",
    }];
    updateAppearance({ features });
  };

  const removeFeature = (idx: number) => {
    const features = settings.appearance.features.filter((_, i) => i !== idx);
    updateAppearance({ features });
  };

  const paymentMethods = [
    { key: "stripeEnabled" as const, label: "Cartão de Crédito/Débito (Stripe)", desc: "Cartões via Stripe — internacional", color: "green" },
    { key: "paypalEnabled" as const, label: "PayPal / Cartão (PayPal)", desc: "Pagamento via PayPal ou cartão pelo PayPal", color: "blue" },
    { key: "pixEnabled" as const, label: "PIX Manual", desc: "O cliente transfere via PIX e envia o comprovante.", color: "green" },
  ];

  const colorMap: Record<string, string> = {
    green: "bg-green-900/40 text-green-400",
    blue: "bg-blue-900/40 text-blue-400",
    purple: "bg-purple-900/40 text-purple-400",
    orange: "bg-orange-900/40 text-orange-400",
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20";
  const labelClass = "block text-sm font-medium text-slate-300";

  const socials: { key: keyof AppearanceSettings; label: string; icon: typeof Instagram }[] = [
    { key: "socialDiscord", label: "Discord", icon: MessageCircle },
    { key: "socialInstagram", label: "Instagram", icon: Instagram },
    { key: "socialTwitter", label: "Twitter / X", icon: Twitter },
    { key: "socialYoutube", label: "YouTube", icon: Youtube },
    { key: "socialTiktok", label: "TikTok", icon: Music },
  ];

  return (
    <PermissionGuard permission="settings.manage">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Configurações</h1>
          <p className="mt-2 text-slate-400">Gerencie as configurações da sua loja</p>
        </div>

        {/* === Informações da Loja === */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-slate-800 p-2">
              <Store className="h-5 w-5 text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Informações da Loja</h2>
              <p className="text-sm text-slate-400">Nome, descrição e contato exibidos no site</p>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-900" />)}</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nome da Loja</label>
                <input type="text" value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} className={inputClass} placeholder="ShopPix" />
              </div>
              <div>
                <label className={labelClass}>Descrição</label>
                <textarea value={settings.storeDescription} onChange={(e) => setSettings({ ...settings, storeDescription: e.target.value })} className={inputClass} rows={2} placeholder="Compre produtos digitais com segurança. Entrega imediata." />
              </div>
              <div>
                <label className={labelClass}>Email de Suporte</label>
                <input type="email" value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} className={inputClass} placeholder="suporte@sualoja.com" />
                <p className="mt-1 text-xs text-slate-400">Email exibido para clientes em caso de dúvidas.</p>
              </div>
            </div>
          )}
        </div>

        {/* === Aparência: Hero === */}
        <div className="mt-6 card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-purple-900/40 p-2">
              <LayoutTemplate className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Seção Hero (Topo do site)</h2>
              <p className="text-sm text-slate-400">O banner principal que aparece no topo da homepage</p>
            </div>
          </div>
          {loading ? (
            <div className="h-32 animate-pulse rounded-lg bg-slate-900" />
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Badge (texto da pílula)</label>
                <input type="text" value={settings.appearance.heroBadge} onChange={(e) => updateAppearance({ heroBadge: e.target.value })} className={inputClass} placeholder="Entrega Rápida Garantida" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Título — linha 1</label>
                  <input type="text" value={settings.appearance.heroTitleLine1} onChange={(e) => updateAppearance({ heroTitleLine1: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Palavra em destaque</label>
                  <input type="text" value={settings.appearance.heroTitleHighlight} onChange={(e) => updateAppearance({ heroTitleHighlight: e.target.value })} className={inputClass} />
                  <p className="mt-1 text-xs text-slate-400">Aparece na cor da marca</p>
                </div>
                <div>
                  <label className={labelClass}>Título — linha 2</label>
                  <input type="text" value={settings.appearance.heroTitleLine2} onChange={(e) => updateAppearance({ heroTitleLine2: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Subtítulo</label>
                <textarea value={settings.appearance.heroSubtitle} onChange={(e) => updateAppearance({ heroSubtitle: e.target.value })} className={inputClass} rows={2} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Botão primário — texto</label>
                  <input type="text" value={settings.appearance.heroPrimaryButtonText} onChange={(e) => updateAppearance({ heroPrimaryButtonText: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Botão primário — link</label>
                  <input type="text" value={settings.appearance.heroPrimaryButtonLink} onChange={(e) => updateAppearance({ heroPrimaryButtonLink: e.target.value })} className={inputClass} placeholder="/produtos" />
                </div>
                <div>
                  <label className={labelClass}>Botão secundário — texto</label>
                  <input type="text" value={settings.appearance.heroSecondaryButtonText} onChange={(e) => updateAppearance({ heroSecondaryButtonText: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Botão secundário — link</label>
                  <input type="text" value={settings.appearance.heroSecondaryButtonLink} onChange={(e) => updateAppearance({ heroSecondaryButtonLink: e.target.value })} className={inputClass} placeholder="/faq" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* === Aparência: Features === */}
        <div className="mt-6 card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-blue-900/40 p-2">
              <Zap className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Cards de Features</h2>
              <p className="text-sm text-slate-400">Os 4 cards de destaque abaixo do hero</p>
            </div>
          </div>
          {loading ? (
            <div className="h-32 animate-pulse rounded-lg bg-slate-900" />
          ) : (
            <div className="space-y-4">
              {settings.appearance.features.map((f, idx) => (
                <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Feature {idx + 1}</span>
                    {settings.appearance.features.length > 1 && (
                      <button onClick={() => removeFeature(idx)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-900/30 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Ícone</label>
                      <select value={f.icon} onChange={(e) => updateFeature(idx, { icon: e.target.value })} className={inputClass}>
                        {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Cor do gradiente</label>
                      <select value={`${f.from}|${f.to}`} onChange={(e) => {
                        const [from, to] = e.target.value.split("|");
                        updateFeature(idx, { from, to });
                      }} className={inputClass}>
                        {COLOR_OPTIONS.map((c) => <option key={c.label} value={`${c.from}|${c.to}`}>{c.label}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Título</label>
                      <input type="text" value={f.title} onChange={(e) => updateFeature(idx, { title: e.target.value })} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Descrição</label>
                      <input type="text" value={f.desc} onChange={(e) => updateFeature(idx, { desc: e.target.value })} className={inputClass} />
                    </div>
                  </div>
                </div>
              ))}
              {settings.appearance.features.length < 8 && (
                <button onClick={addFeature} className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                  <Plus className="h-4 w-4" /> Adicionar feature
                </button>
              )}
            </div>
          )}
        </div>

        {/* === Aparência: CTA === */}
        <div className="mt-6 card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-orange-900/40 p-2">
              <LayoutTemplate className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Seção CTA (Chamada final)</h2>
              <p className="text-sm text-slate-400">O banner "Pronto para começar?" no fim da homepage</p>
            </div>
          </div>
          {loading ? (
            <div className="h-24 animate-pulse rounded-lg bg-slate-900" />
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Título</label>
                <input type="text" value={settings.appearance.ctaTitle} onChange={(e) => updateAppearance({ ctaTitle: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Subtítulo</label>
                <textarea value={settings.appearance.ctaSubtitle} onChange={(e) => updateAppearance({ ctaSubtitle: e.target.value })} className={inputClass} rows={2} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Texto do botão</label>
                  <input type="text" value={settings.appearance.ctaButtonText} onChange={(e) => updateAppearance({ ctaButtonText: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Link do botão</label>
                  <input type="text" value={settings.appearance.ctaButtonLink} onChange={(e) => updateAppearance({ ctaButtonLink: e.target.value })} className={inputClass} placeholder="/produtos" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* === Aparência: Footer e Social === */}
        <div className="mt-6 card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-green-900/40 p-2">
              <MessageCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Rodapé e Redes Sociais</h2>
              <p className="text-sm text-slate-400">Texto do rodapé e links para suas redes</p>
            </div>
          </div>
          {loading ? (
            <div className="h-24 animate-pulse rounded-lg bg-slate-900" />
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Texto sobre a loja (rodapé)</label>
                <textarea value={settings.appearance.footerAbout} onChange={(e) => updateAppearance({ footerAbout: e.target.value })} className={inputClass} rows={2} />
              </div>
              <div>
                <label className={labelClass}>Email de contato do rodapé</label>
                <input type="email" value={settings.appearance.footerContactEmail} onChange={(e) => updateAppearance({ footerContactEmail: e.target.value })} className={inputClass} placeholder="contato@sualoja.com" />
                <p className="mt-1 text-xs text-slate-400">Se vazio, o link &quot;Contato&quot; leva para a página de tickets.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {socials.map((soc) => {
                  const Icon = soc.icon;
                  return (
                    <div key={soc.key}>
                      <label className={labelClass}>{soc.label}</label>
                      <div className="relative mt-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                          <Icon className="h-4 w-4" />
                        </div>
                        <input
                          type="url"
                          value={(settings.appearance[soc.key] as string) || ""}
                          onChange={(e) => updateAppearance({ [soc.key]: e.target.value } as any)}
                          className={`${inputClass} pl-9`}
                          placeholder={`https://${soc.label.toLowerCase()}.com/...`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* === Aparência: Cor da marca === */}
        <div className="mt-6 card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-pink-900/40 p-2">
              <Palette className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Cor da Marca</h2>
              <p className="text-sm text-slate-400">Cor primária usada em botões, links e destaques</p>
            </div>
          </div>
          {loading ? (
            <div className="h-16 animate-pulse rounded-lg bg-slate-900" />
          ) : (
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={settings.appearance.brandColor}
                onChange={(e) => updateAppearance({ brandColor: e.target.value })}
                className="h-12 w-16 cursor-pointer rounded-lg border border-slate-700 bg-slate-900"
              />
              <div>
                <input
                  type="text"
                  value={settings.appearance.brandColor}
                  onChange={(e) => updateAppearance({ brandColor: e.target.value })}
                  className={`${inputClass} w-32 font-mono`}
                  placeholder="#7c3aed"
                />
                <p className="mt-1 text-xs text-slate-400">Formato hex: #RRGGBB</p>
              </div>
              <div
                className="ml-auto h-12 w-32 rounded-lg border border-slate-700"
                style={{ backgroundColor: settings.appearance.brandColor }}
              />
            </div>
          )}
        </div>

        {/* === Métodos de Pagamento === */}
        <div className="mt-6 card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-green-900/40 p-2">
              <CreditCard className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Métodos de Pagamento</h2>
              <p className="text-sm text-slate-400">Ative ou desative as formas de pagamento do checkout</p>
            </div>
          </div>
          {loading ? (
            <div className="h-16 animate-pulse rounded-lg bg-slate-900" />
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const enabled = settings[method.key];
                return (
                  <label key={method.key} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 p-4 transition-colors hover:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${colorMap[method.color]}`}>
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-100">{method.label}</p>
                        <p className="text-sm text-slate-400">{method.desc}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => setSettings({ ...settings, [method.key]: !enabled })}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${enabled ? "bg-brand-600" : "bg-slate-600"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </label>
                );
              })}
            </div>
          )}
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-medium text-slate-300">Chave PIX</p>
            {settings.pixKey ? (
              <p className="mt-1 break-all font-mono text-sm text-slate-100">{settings.pixKey}</p>
            ) : (
              <p className="mt-1 flex items-center gap-2 text-sm text-amber-300">
                <AlertCircle className="h-4 w-4" /> Chave PIX não configurada no arquivo .env
              </p>
            )}
          </div>
        </div>

        {/* === Configurações de Pedido === */}
        <div className="mt-6 card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-orange-900/40 p-2">
              <Clock className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Configurações de Pedido</h2>
              <p className="text-sm text-slate-400">Aprovação automática e expiração de PIX</p>
            </div>
          </div>
          {loading ? (
            <div className="h-16 animate-pulse rounded-lg bg-slate-900" />
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Expiração de PIX (horas)</label>
                <input type="number" min="1" max="168" value={settings.pixExpirationHours} onChange={(e) => setSettings({ ...settings, pixExpirationHours: e.target.value })} className={`${inputClass} w-32`} />
              </div>
              {[
                { key: "autoApproveStripe" as const, label: "Aprovar Stripe automaticamente", desc: "Pula a aprovação manual para pagamentos Stripe confirmados", color: "green" },
                { key: "autoApprovePaypal" as const, label: "Aprovar PayPal automaticamente", desc: "Pula a aprovação manual para pagamentos PayPal capturados", color: "blue" },
              ].map((item) => (
                <label key={item.key} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 p-4 transition-colors hover:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${colorMap[item.color]}`}>
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-100">{item.label}</p>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings[item.key]}
                    onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key] })}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${settings[item.key] ? "bg-brand-600" : "bg-slate-600"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${settings[item.key] ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* === Notificações Discord === */}
        <div className="mt-6 card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-purple-900/40 p-2">
              <Bell className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Notificações Discord</h2>
              <p className="text-sm text-slate-400">Receba um alerta no Discord quando chegar um pedido novo</p>
            </div>
          </div>
          {loading ? (
            <div className="h-12 animate-pulse rounded-lg bg-slate-900" />
          ) : (
            <div>
              <label className={labelClass}>URL do Webhook do Discord</label>
              <input type="url" value={settings.discordWebhookUrl} onChange={(e) => setSettings({ ...settings, discordWebhookUrl: e.target.value })} className={inputClass} placeholder="https://discord.com/api/webhooks/..." />
              <p className="mt-2 text-xs text-slate-400">
                Crie um Webhook em: Configurações do Servidor &gt; Integrações &gt; Webhooks. Se vazio, usa a variável <code className="rounded bg-slate-800 px-1">DISCORD_ORDERS_WEBHOOK_URL</code> do .env.
              </p>
            </div>
          )}
        </div>

        {/* === Botão Salvar === */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? (
              <>Salvando...</>
            ) : saved ? (
              <><Check className="h-5 w-5" /> Salvo!</>
            ) : (
              <><Save className="h-5 w-5" /> Salvar Configurações</>
            )}
          </button>
        </div>
      </div>
    </PermissionGuard>
  );
}
