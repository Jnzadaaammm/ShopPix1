"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

function SuccessContent() {
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
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl border-2 border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-green-800">Pagamento Aprovado!</h1>
        <p className="mt-2 text-green-600">
          {orderId ? `Pedido #${orderId} confirmado com sucesso.` : "Seu pedido foi confirmado."}
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

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
