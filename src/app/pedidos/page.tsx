"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Package, Loader2, ArrowRight, RefreshCw, Key, Copy, Check, Download, Clock, Upload,
} from "lucide-react";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { toast } from "@/components/ui/Toaster";
import { usePolling } from "@/lib/use-polling";
import PixProofModal from "@/components/PixProofModal";

interface Credential {
  id: string;
  content: string;
  status: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string; image: string; stockMode: string } | null;
  productName: string | null;
  productImage: string | null;
  credentials: Credential[];
}

interface Order {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

type StatusFilter = "all" | "PENDING" | "AWAITING_APPROVAL" | "PAID" | "CANCELLED" | "EXPIRED";

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [proofOrderId, setProofOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/pedidos");
    }
  }, [status, router]);

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (!res.ok) throw new Error("Falha ao carregar pedidos");
    const data = await res.json();
    return Array.isArray(data) ? (data as Order[]) : [];
  }, []);

  const { data: orders, loading, error, refetch } = usePolling<Order[]>(fetchOrders, {
    enabled: !!session,
  });

  useEffect(() => {
    if (error) {
      toast.error("Erro ao carregar pedidos. Tente novamente.");
    }
  }, [error]);

  const ordersList = orders || [];

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return ordersList;
    return ordersList.filter((o) => o.status === statusFilter);
  }, [ordersList, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of ordersList) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [ordersList]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Credencial copiada!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (ordersList.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <Package className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-6 text-2xl font-bold text-slate-100">Nenhum pedido ainda</h1>
        <p className="mt-2 text-slate-400">Faça sua primeira compra!</p>
        <Link href="/produtos" className="btn-primary mt-8">
          Ver Produtos
        </Link>
      </div>
    );
  }

  const filterOptions: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "PENDING", label: "Pendentes" },
    { id: "AWAITING_APPROVAL", label: "Aguardando aprovação" },
    { id: "PAID", label: "Pagos" },
    { id: "CANCELLED", label: "Cancelados" },
    { id: "EXPIRED", label: "Expirados" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-100">Meus Pedidos</h1>
      <p className="mt-1 text-slate-400">{ordersList.length} pedido(s) no total</p>

      {/* Filtro por status */}
      <div className="mt-6 flex flex-wrap gap-2">
        {filterOptions.map((opt) => {
          const count = opt.id === "all" ? ordersList.length : (statusCounts[opt.id] || 0);
          if (opt.id !== "all" && count === 0) return null;
          return (
            <button
              key={opt.id}
              onClick={() => setStatusFilter(opt.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === opt.id
                  ? "bg-brand-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {opt.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Lista de pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-slate-950 py-16 text-center">
          <p className="text-slate-400">Nenhum pedido com este status.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">
                    Pedido #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] || "bg-slate-900 text-slate-200"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                  </span>
                  <span className="text-lg font-bold text-brand-400">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>

              {/* Aviso: aguardando aprovação do dono */}
              {order.status === "AWAITING_APPROVAL" && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Pagamento confirmado! Seu pedido está sendo analisado pela loja e será liberado em breve.
                  </span>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        {item.product?.name || item.productName || "Produto removido"} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>

                    {/* Credenciais entregues */}
                    {order.status === "PAID" && item.credentials.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-green-600">
                          <Key className="h-3 w-3" />
                          {item.credentials.length} {item.credentials.length === 1 ? "credencial entregue" : "credenciais entregues"}
                        </div>
                        {item.credentials.map((cred, idx) => (
                          <div
                            key={cred.id}
                            className="flex items-center gap-2 rounded-lg bg-slate-900 p-2"
                          >
                            <span className="text-xs text-slate-500">#{idx + 1}</span>
                            <code className="flex-1 truncate font-mono text-sm text-slate-200">
                              {cred.content}
                            </code>
                            <button
                              onClick={() => copyToClipboard(cred.content, cred.id)}
                              aria-label="Copiar credencial"
                              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                                copiedId === cred.id
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-950 text-slate-400 hover:bg-slate-900 border"
                              }`}
                            >
                              {copiedId === cred.id ? (
                                <><Check className="h-3 w-3" /> Copiado</>
                              ) : (
                                <><Copy className="h-3 w-3" /> Copiar</>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Link de download para produtos com arquivo */}
                    {order.status === "PAID" && item.product?.stockMode !== "CREDENTIALS" && (
                      <Link
                        href="/downloads"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline"
                      >
                        <Download className="h-3 w-3" /> Baixar arquivo
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {order.status === "PENDING" && (
                <>
                  {order.paymentMethod === "pix" ? (
                    <button
                      onClick={() => setProofOrderId(order.id)}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:underline"
                    >
                      Já paguei <Upload className="h-3 w-3" />
                    </button>
                  ) : (
                    <Link
                      href={`/checkout/${order.id}`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-400 hover:underline"
                    >
                      Finalizar Pagamento <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </>
              )}

              {order.status === "PAID" && (
                <Link
                  href={`/reembolso/${order.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:underline"
                >
                  Solicitar Reembolso <RefreshCw className="h-3 w-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {proofOrderId && (
        <PixProofModal
          orderId={proofOrderId}
          onClose={() => setProofOrderId(null)}
          onSubmitted={() => {
            setProofOrderId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
