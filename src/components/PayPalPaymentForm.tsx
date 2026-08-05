"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface PayPalPaymentFormProps {
  orderId: string;
  paypalOrderId: string;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

export default function PayPalPaymentForm({
  orderId,
  paypalOrderId,
  onPaymentSuccess,
  onPaymentError,
}: PayPalPaymentFormProps) {
  const [loading, setLoading] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
        PayPal não configurado. Contate o administrador.
      </div>
    );
  }

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "capture_paypal",
          paypalOrderId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Erro ao capturar pagamento PayPal");
      }

      onPaymentSuccess();
    } catch (err) {
      onPaymentError(err instanceof Error ? err.message : "Erro no pagamento PayPal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-100">Pagamento com PayPal</h1>

      <div className="card p-6">
        <p className="mb-4 text-sm text-slate-400">
          Escolha pagar com sua conta PayPal ou cartão de crédito/débito através do PayPal.
        </p>

        {loading && (
          <div className="mb-4 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Confirmando pagamento...
          </div>
        )}

        <PayPalScriptProvider
          options={{
            clientId,
            currency: "BRL",
            intent: "capture",
          }}
        >
          <PayPalButtons
            style={{ layout: "vertical", color: "blue", shape: "rect" }}
            disabled={loading}
            createOrder={() => Promise.resolve(paypalOrderId)}
            onApprove={handleApprove}
            onError={(err) => onPaymentError(err.toString?.() || "Erro no PayPal")}
            onCancel={() => onPaymentError("Pagamento cancelado")}
          />
        </PayPalScriptProvider>
      </div>
    </div>
  );
}
