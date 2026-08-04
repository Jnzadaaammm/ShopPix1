"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard, Lock, Loader2, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface StripeCardFormProps {
  orderId: string;
  total: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

type CardType = "credit" | "debit";

function CardForm({
  orderId,
  total,
  onPaymentSuccess,
  onPaymentError,
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardType, setCardType] = useState<CardType>("credit");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      onPaymentError("Stripe não foi carregado corretamente");
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onPaymentError("Elemento do cartão não encontrado");
      setLoading(false);
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      setError(error.message || "Erro ao processar cartão");
      onPaymentError(error.message || "Erro ao processar cartão");
      setLoading(false);
      return;
    }

    try {
      // Chamar a API para processar o pagamento (server-side confirmation)
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process_stripe_payment",
          paymentMethodId: paymentMethod.id,
          cardType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao processar pagamento");
        onPaymentError(data.error || "Erro ao processar pagamento");
        setLoading(false);
        return;
      }

      // Se o pagamento já foi confirmado (succeeded), finalizamos
      if (data.stripeStatus === "succeeded" || data.status === "PAID") {
        onPaymentSuccess();
        return;
      }

      // Se requires_action (3D Secure), precisamos confirmar no frontend
      // usando o clientSecret retornado pela API
      if (data.stripeStatus === "requires_action" && data.stripeClientSecret && stripe) {
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          data.stripeClientSecret
        );

        if (confirmError) {
          setError(confirmError.message || "Falha na autenticação 3D Secure");
          onPaymentError(confirmError.message || "Falha na autenticação 3D Secure");
          setLoading(false);
          return;
        }

        if (paymentIntent && paymentIntent.status === "succeeded") {
          onPaymentSuccess();
          return;
        }

        // Ainda pendente após 3DS
        setError(
          `Pagamento não confirmado. Status: ${paymentIntent?.status || "desconhecido"}`
        );
        onPaymentError(
          `Pagamento não confirmado. Status: ${paymentIntent?.status || "desconhecido"}`
        );
        return;
      }

      // Outros status (processing, requires_payment_method, etc.)
      setError(
        `Pagamento não confirmado. Status: ${data.stripeStatus || "desconhecido"}`
      );
      onPaymentError(
        `Pagamento não confirmado. Status: ${data.stripeStatus || "desconhecido"}`
      );
    } catch (err) {
      setError("Erro ao processar pagamento");
      onPaymentError("Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6 text-center">
        <p className="text-sm text-gray-500">Valor a pagar</p>
        <p className="text-3xl font-bold text-brand-600">{formatCurrency(total)}</p>
      </div>

      {/* Seletor Crédito / Débito */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Tipo de Cartão
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCardType("credit")}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
              cardType === "credit"
                ? "border-brand-500 bg-brand-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              cardType === "credit" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Crédito</p>
              <p className="text-xs text-gray-500">Pague em até 12x</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setCardType("debit")}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
              cardType === "debit"
                ? "border-brand-500 bg-brand-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              cardType === "debit" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              <Banknote className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Débito</p>
              <p className="text-xs text-gray-500">À vista</p>
            </div>
          </button>
        </div>
      </div>

      {/* Campos do cartão */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Dados do Cartão
        </label>
        <div className="rounded-lg border border-gray-300 p-4 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
                invalid: {
                  color: "#9e2146",
                },
              },
            }}
          />
        </div>
      </div>

      {/* Aviso para débito */}
      {cardType === "debit" && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
          Cartões de débito podem exigir autenticação do banco (3D Secure). Tenha o app do seu banco em mãos.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pagar com {cardType === "credit" ? "Crédito" : "Débito"}
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Pagamento seguro processado via Stripe
      </p>
    </form>
  );
}

export default function StripeCardForm({
  orderId,
  total,
  onPaymentSuccess,
  onPaymentError,
}: StripeCardFormProps) {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-800">
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não configurado
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <CreditCard className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Cartão de Crédito/Débito</h2>
          <p className="text-sm text-gray-500">Pagamento seguro via Stripe</p>
        </div>
      </div>

      <Elements stripe={stripePromise}>
        <CardForm
          orderId={orderId}
          total={total}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
        />
      </Elements>
    </div>
  );
}
