"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Clock, Loader2 } from "lucide-react";

function PendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const orderParam = searchParams.get("order_id");
    if (orderParam) {
      setOrderId(orderParam);
    }
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl border-2 border-yellow-200 bg-yellow-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <Clock className="h-8 w-8 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-yellow-800">Pagamento em Processamento</h1>
        <p className="mt-2 text-yellow-600">
          {orderId
            ? `Seu pedido #${orderId} está sendo processado.`
            : "Seu pagamento está sendo processado pelo Mercado Pago."}
        </p>
        <p className="mt-2 text-sm text-yellow-700">
          Você receberá uma confirmação assim que o pagamento for aprovado.
        </p>
        <button
          onClick={() => router.push("/pedidos")}
          className="btn-primary mt-6 w-full"
        >
          Ver Meus Pedidos
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        </div>
      }
    >
      <PendingContent />
    </Suspense>
  );
}
