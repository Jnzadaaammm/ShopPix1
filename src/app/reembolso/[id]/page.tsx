"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Check, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Order {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: Array<{
    product: {
      name: string;
      image: string;
    } | null;
    productName: string | null;
    productImage: string | null;
    quantity: number;
    price: number;
  }>;
}

export default function RefundRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    reason: "",
    pixKey: "",
  });

  useEffect(() => {
    const fetchOrder = async () => {
      const { id } = await params;
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
          setFormData({ ...formData, amount: data.total.toString() });
        } else {
          setError("Pedido não encontrado");
        }
      } catch (err) {
        setError("Erro ao carregar pedido");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const { id } = await params;

    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id,
          amount: formData.amount,
          reason: formData.reason,
          pixKey: formData.pixKey,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao solicitar reembolso");
      }
    } catch (err) {
      setError("Erro ao processar solicitação");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-800">
            Solicitação de Reembolso Enviada!
          </h2>
          <p className="mt-2 text-green-600">
            Sua solicitação foi enviada e será analisada pela equipe.
          </p>
          <button
            onClick={() => router.push("/pedidos")}
            className="mt-6 btn-primary"
          >
            Ver Meus Pedidos
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-4 text-xl font-bold text-red-800">Erro</h2>
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={() => router.push("/pedidos")}
            className="mt-6 btn-primary"
          >
            Voltar aos Pedidos
          </button>
        </div>
      </div>
    );
  }

  if (order.status !== "PAID") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-600" />
          <h2 className="mt-4 text-xl font-bold text-yellow-800">
            Reembolso Não Disponível
          </h2>
          <p className="mt-2 text-yellow-600">
            Apenas pedidos pagos podem ter reembolso solicitado.
          </p>
          <button
            onClick={() => router.push("/pedidos")}
            className="mt-6 btn-primary"
          >
            Voltar aos Pedidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <button
        onClick={() => router.push("/pedidos")}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos pedidos
      </button>

      <h1 className="text-3xl font-bold text-slate-100">Solicitar Reembolso</h1>
      <p className="mt-2 text-slate-400">
        Preencha o formulário abaixo para solicitar o reembolso via PIX
      </p>

      <div className="card mt-8 p-6">
        <h2 className="font-semibold text-slate-100">Detalhes do Pedido</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-slate-400">
                {item.product?.name || item.productName || "Produto removido"} x{item.quantity}
              </span>
              <span className="font-medium">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-slate-800 pt-4">
          <div className="flex justify-between">
            <span className="font-bold">Total do Pedido</span>
            <span className="text-xl font-bold text-brand-600">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card mt-6 p-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Valor do Reembolso
          </label>
          <input
            type="number"
            step="0.01"
            max={order.total}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="input"
            required
          />
          <p className="mt-1 text-xs text-slate-400">
            Máximo: {formatCurrency(order.total)}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Motivo do Reembolso
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={4}
            className="input"
            placeholder="Descreva o motivo do reembolso..."
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Chave PIX para Recebimento (Opcional)
          </label>
          <input
            type="text"
            value={formData.pixKey}
            onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
            className="input"
            placeholder="CPF, e-mail, telefone ou chave aleatória"
          />
          <p className="mt-1 text-xs text-slate-400">
            Informe para onde deseja receber o reembolso via PIX
          </p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">Informações Importantes</h3>
              <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>Reembolsos são processados via PIX</li>
                <li>O prazo de análise é de até 48 horas</li>
                <li>Após aprovado, o reembolso será feito para a chave PIX informada</li>
                <li>O valor do reembolso será creditado na conta informada</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? "Enviando..." : "Solicitar Reembolso"}
        </button>
      </form>
    </div>
  );
}
