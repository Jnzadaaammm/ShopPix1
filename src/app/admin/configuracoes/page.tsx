"use client";

import { useState, useEffect } from "react";
import { Store, Mail, CreditCard, Save, Check } from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";

interface PaymentSettings {
  stripeEnabled: boolean;
  paypalEnabled: boolean;
}

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    stripeEnabled: true,
    paypalEnabled: true,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setPaymentSettings({
          stripeEnabled: data.stripeEnabled ?? true,
          paypalEnabled: data.paypalEnabled ?? true,
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
        body: JSON.stringify(paymentSettings),
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
  ];

  const colorMap: Record<string, string> = {
    brand: "bg-brand-100 text-brand-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <PermissionGuard permission="settings.manage">
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-2 text-gray-600">Gerencie as configurações da sua loja</p>
      </div>

      {/* Métodos de Pagamento */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-green-100 p-2">
            <CreditCard className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Métodos de Pagamento</h2>
            <p className="text-sm text-gray-500">Ative ou desative as formas de pagamento do checkout</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const enabled = paymentSettings[method.key];
              return (
                <label
                  key={method.key}
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${colorMap[method.color]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{method.label}</p>
                      <p className="text-sm text-gray-500">{method.desc}</p>
                    </div>
                  </div>
                  {/* Toggle switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() =>
                      setPaymentSettings({
                        ...paymentSettings,
                        [method.key]: !enabled,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      enabled ? "bg-brand-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              );
            })}
          </div>
        )}

        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <strong>Atenção:</strong> Para que um método funcione, além de ativá-lo aqui,
          as credenciais correspondentes devem estar configuradas no arquivo{" "}
          <code className="bg-amber-100 px-1 rounded">.env</code>.
        </div>
      </div>

      {/* Botão Salvar */}
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
