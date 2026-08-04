"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";

function FailureContent() {
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
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-red-800">Pagamento Recusado</h1>
        <p className="mt-2 text-red-600">
          O pagamento não foi processado. Tente novamente ou use outro método de pagamento.
        </p>
        <div className="mt-6 space-y-3">
          <button
            onClick={() => router.push("/checkout")}
            className="btn-primary w-full"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => router.push("/carrinho")}
            className="btn-outline w-full"
          >
            Voltar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailurePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      }
    >
      <FailureContent />
    </Suspense>
  );
}
