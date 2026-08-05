"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  Store, Mail, CreditCard, Save, Check, QrCode, AlertCircle,
  Bell, Clock, Settings, Zap,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";

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
}

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

  const paymentMethods = [
    {
      key: "stripeEnabled" as const,
      label: "Cartão de Crédito/Débito (Stripe)",
      desc: "Cartões via Stripe — internacional",
      icon: CreditCard,
      color: "green",
    },
    {
      key: "paypalEnabled" as const,
      label: "PayPal / Cartão (PayPal)",
      desc: "Pagamento via PayPal ou cartão pelo PayPal",
      icon: CreditCard,
      color: "blue",
    },
    {
      key: "pixEnabled" as const,
      label: "PIX Manual",
      desc: "O cliente transfere via PIX e envia o comprovante para aprovação.",
      icon: QrCode,
      color: "green",
    },
  ];

  const colorMap: Record<string, string> = {
    brand: "bg-brand-100 text-brand-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <PermissionGuard permission="settings.manage">
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Configurações</h1>
        <p className="mt-2 text-slate-400">Gerencie as configurações da sua loja</p>
      </div>

      {/* === Informações da Loja === */}
      <div className="rounded-xl border bg-slate-950 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-brand-100 p-2">
            <Store className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Informações da Loja</h2>
            <p className="text-sm text-slate-400">Nome, descrição e contato exibidos no site</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-900" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Nome da Loja</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="ShopPix"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Descrição</label>
              <textarea
                value={settings.storeDescription}
                onChange={(e) => setSettings({ ...settings, storeDescription: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={2}
                placeholder="Compre produtos digitais com segurança. Entrega imediata."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Email de Suporte</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="suporte@sualoja.com"
              />
              <p className="mt-1 text-xs text-slate-400">Email exibido para clientes em caso de dúvidas.</p>
            </div>
          </div>
        )}
      </div>

      {/* === Métodos de Pagamento === */}
      <div className="mt-6 rounded-xl border bg-slate-950 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-green-100 p-2">
            <CreditCard className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Métodos de Pagamento</h2>
            <p className="text-sm text-slate-400">Ative ou desative as formas de pagamento do checkout</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-900" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const enabled = settings[method.key];
              return (
                <label
                  key={method.key}
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${colorMap[method.color]}`}>
                      <Icon className="h-5 w-5" />
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
                    onClick={() =>
                      setSettings({
                        ...settings,
                        [method.key]: !enabled,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      enabled ? "bg-brand-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                        enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              );
            })}
          </div>
        )}

        <div className="mt-4 rounded-lg border bg-slate-900 p-4">
          <p className="text-sm font-medium text-slate-300">Chave PIX</p>
          {settings.pixKey ? (
            <p className="mt-1 break-all font-mono text-sm text-slate-100">{settings.pixKey}</p>
          ) : (
            <p className="mt-1 flex items-center gap-2 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4" /> Chave PIX não configurada no arquivo .env
            </p>
          )}
          <p className="mt-2 text-xs text-slate-400">
            Configure a variável <code className="rounded bg-slate-800 px-1">PIX_KEY</code> no arquivo .env e faça o redeploy para alterar.
          </p>
        </div>

        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <strong>Atenção:</strong> Para que um método funcione, além de ativá-lo aqui,
          as credenciais correspondentes devem estar configuradas no arquivo{" "}
          <code className="bg-amber-100 px-1 rounded">.env</code>.
        </div>
      </div>

      {/* === Configurações de Pedido === */}
      <div className="mt-6 rounded-xl border bg-slate-950 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-orange-100 p-2">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Configurações de Pedido</h2>
            <p className="text-sm text-slate-400">Aprovação automática e expiração de PIX</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded-lg bg-slate-900" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Expiração de PIX (horas)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={settings.pixExpirationHours}
                onChange={(e) => setSettings({ ...settings, pixExpirationHours: e.target.value })}
                className="mt-1 w-32 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Pedidos PIX pendentes expiram automaticamente após este período.
              </p>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-100">Aprovar Stripe automaticamente</p>
                  <p className="text-sm text-slate-400">Pula a aprovação manual para pagamentos Stripe confirmados</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.autoApproveStripe}
                onClick={() => setSettings({ ...settings, autoApproveStripe: !settings.autoApproveStripe })}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  settings.autoApproveStripe ? "bg-brand-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                    settings.autoApproveStripe ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-100">Aprovar PayPal automaticamente</p>
                  <p className="text-sm text-slate-400">Pula a aprovação manual para pagamentos PayPal capturados</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.autoApprovePaypal}
                onClick={() => setSettings({ ...settings, autoApprovePaypal: !settings.autoApprovePaypal })}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  settings.autoApprovePaypal ? "bg-brand-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                    settings.autoApprovePaypal ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>
        )}
      </div>

      {/* === Notificações Discord === */}
      <div className="mt-6 rounded-xl border bg-slate-950 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-purple-100 p-2">
            <Bell className="h-5 w-5 text-purple-600" />
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
            <label className="block text-sm font-medium text-slate-300">URL do Webhook do Discord</label>
            <input
              type="url"
              value={settings.discordWebhookUrl}
              onChange={(e) => setSettings({ ...settings, discordWebhookUrl: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="https://discord.com/api/webhooks/..."
            />
            <p className="mt-2 text-xs text-slate-400">
              Crie um Webhook em: Configurações do Servidor &gt; Integrações &gt; Webhooks.
              Copie a URL e cole aqui. Se vazio, usa a variável <code className="rounded bg-slate-800 px-1">DISCORD_ORDERS_WEBHOOK_URL</code> do .env.
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
            <>
              <Check className="h-5 w-5" /> Salvo!
            </>
          ) : (
            <>
              <Save className="h-5 w-5" /> Salvar Configurações
            </>
          )}
        </button>
      </div>
    </div>
    </PermissionGuard>
  );
}
