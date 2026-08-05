"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Package, Search, Filter, Check, X, Loader2, ChevronLeft, ChevronRight,
  Clock, AlertCircle,
} from "lucide-react";
import { usePolling } from "@/lib/use-polling";
import { toast } from "@/components/ui/Toaster";
import {
  formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
} from "@/lib/utils";
import ImageWithFallback from "@/components/ImageWithFallback";
import PermissionGuard from "@/components/admin/PermissionGuard";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    image: string;
  } | null;
  productName: string | null;
  productImage: string | null;
}

interface Order {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentProof: string | null;
  createdAt: string;
  items: OrderItem[];
  user?: {
    name: string | null;
    email: string | null;
  };
}

const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Polling de pedidos (15s)
  const { data: orders, loading, refetch } = usePolling<Order[]>(
    useCallback(() => fetch("/api/orders?admin=true").then(r => r.json()), []),
    { interval: 15000 }
  );

  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || "";
  const isOwner = session?.user?.email?.toLowerCase() === ownerEmail.toLowerCase();

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setActionLoading(`status-${newStatus}`);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Status alterado para ${ORDER_STATUS_LABELS[newStatus] || newStatus}`);
        refetch();
        setSelectedOrder(null);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Erro ao atualizar status");
      }
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setActionLoading(null);
    }
  };

  const approveOrder = async (orderId: string) => {
    setActionLoading("approve");
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (response.ok) {
        toast.success("Pedido aprovado e produtos entregues!");
        refetch();
        setSelectedOrder(null);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Erro ao aprovar pedido");
      }
    } catch {
      toast.error("Erro ao aprovar pedido");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectOrder = async (orderId: string, reason: string) => {
    setActionLoading("reject");
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason }),
      });

      if (response.ok) {
        toast.success("Pedido rejeitado");
        refetch();
        setSelectedOrder(null);
        setRejectMode(false);
        setRejectReason("");
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Erro ao rejeitar pedido");
      }
    } catch {
      toast.error("Erro ao rejeitar pedido");
    } finally {
      setActionLoading(null);
    }
  };

  const orderList: Order[] = (orders as any)?.orders || (Array.isArray(orders) ? orders : []) || [];

  const filteredOrders = useMemo(() => {
    return orderList.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orderList, searchTerm, statusFilter]);

  // Paginação
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE)), [filteredOrders]);
  const currentPageSafe = useMemo(() => Math.min(currentPage, totalPages), [currentPage, totalPages]);
  const paginatedOrders = useMemo(() => filteredOrders.slice(
    (currentPageSafe - 1) * PAGE_SIZE,
    currentPageSafe * PAGE_SIZE
  ), [filteredOrders, currentPageSafe]);

  // Contagem de pedidos aguardando aprovação
  const awaitingApprovalCount = useMemo(() => orderList.filter(o => o.status === "AWAITING_APPROVAL").length, [orderList]);

  const getStatusColor = (status: string) =>
    ORDER_STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  const getStatusLabel = (status: string) =>
    ORDER_STATUS_LABELS[status] || status;

  if (loading) {
    return (
      <PermissionGuard permission="orders.view">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="orders.view">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos</h1>
        <p className="mt-2 text-gray-600">
          {orderList.length} pedidos cadastrados
          {filteredOrders.length !== orderList.length && (
            <span className="text-gray-400"> · {filteredOrders.length} filtrados</span>
          )}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ID, email ou nome..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-lg border pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="PENDING">Aguardando pagamento</option>
            <option value="AWAITING_APPROVAL">Aguardando aprovação</option>
            <option value="PAID">Pago</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="EXPIRED">Expirado</option>
          </select>
        </div>
      </div>

      {/* Banner: pedidos aguardando aprovação (só dono vê) */}
      {isOwner && awaitingApprovalCount > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <Clock className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">
              {awaitingApprovalCount} pedido(s) aguardando sua aprovação
            </p>
            <p className="text-sm text-blue-700">
              Abra o pedido e clique em "Aprovar" para liberar os produtos ao cliente.
            </p>
          </div>
          <button
            onClick={() => setStatusFilter("AWAITING_APPROVAL")}
            className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Ver pedidos
          </button>
        </div>
      )}

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pedido</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Data</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-gray-500">Nenhum pedido encontrado com estes filtros.</p>
                  </td>
                </tr>
              ) : paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">#{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">{order.items.length} itens</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{order.user?.name || "Cliente"}</p>
                    <p className="text-sm text-gray-500">{order.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    {order.status === "AWAITING_APPROVAL" && (
                      <span className="ml-1 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                        ⚡
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-lg border px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-3">
            <p className="text-sm text-gray-500">
              Página {currentPageSafe} de {totalPages} · {filteredOrders.length} pedido(s)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPageSafe === 1}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPageSafe === totalPages}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !actionLoading && setSelectedOrder(null)}>
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalhes do Pedido #{selectedOrder.id.slice(0, 8)}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium text-gray-900">{selectedOrder.user?.name || "Cliente"}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Método de Pagamento</p>
                  <p className="font-medium text-gray-900">{selectedOrder.paymentMethod.toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Aviso aguardando aprovação */}
            {selectedOrder.status === "AWAITING_APPROVAL" && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Pagamento confirmado — aguardando sua aprovação</p>
                  <p className="text-sm text-blue-700">
                    Aprove para entregar os produtos ao cliente, ou rejeite para cancelar o pedido.
                  </p>
                </div>
              </div>
            )}

            {/* Comprovante PIX */}
            {selectedOrder.paymentMethod === "pix" && (
              <div className="mb-6 rounded-lg border bg-gray-50 p-4">
                <h3 className="mb-3 font-semibold text-gray-900">Comprovante PIX</h3>
                {selectedOrder.paymentProof ? (
                  <img
                    src={selectedOrder.paymentProof}
                    alt="Comprovante de pagamento PIX"
                    className="max-h-96 rounded-lg border"
                  />
                ) : (
                  <p className="text-sm text-gray-600">Comprovante ainda não enviado.</p>
                )}
              </div>
            )}

            <div className="mb-6">
              <h3 className="mb-3 font-semibold text-gray-900">Itens</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center">
                      <ImageWithFallback
                        src={item.product?.image || item.productImage || ""}
                        alt={item.product?.name || item.productName || "Produto removido"}
                        width={48}
                        height={48}
                        className="rounded object-cover"
                      />
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">
                          {item.product?.name || item.productName || "Produto removido"}
                        </p>
                        <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <p className="text-xl font-bold text-gray-900">
                  Total: {formatCurrency(selectedOrder.total)}
                </p>
              </div>
            </div>

            {/* === Ações exclusivas do dono: Aprovar / Rejeitar === */}
            {isOwner && selectedOrder.status === "AWAITING_APPROVAL" && (
              <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-blue-900">
                  <Check className="h-5 w-5" /> Aprovação do Dono
                </h3>

                {!rejectMode ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => approveOrder(selectedOrder.id)}
                      disabled={actionLoading === "approve"}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === "approve" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Aprovar e Entregar
                    </button>
                    <button
                      onClick={() => setRejectMode(true)}
                      disabled={actionLoading !== null}
                      className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Rejeitar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Motivo da rejeição (opcional)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Ex: Pagamento suspeito, estoque insuficiente..."
                      className="w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={2}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => rejectOrder(selectedOrder.id, rejectReason)}
                        disabled={actionLoading === "reject"}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoading === "reject" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Confirmar Rejeição
                      </button>
                      <button
                        onClick={() => { setRejectMode(false); setRejectReason(""); }}
                        disabled={actionLoading !== null}
                        className="rounded-lg border px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mudança manual de status (só dono) */}
            {isOwner && (
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-gray-900">Alterar Status Manualmente</h3>
                <div className="flex flex-wrap gap-2">
                  {["PENDING", "AWAITING_APPROVAL", "PAID", "CANCELLED", "EXPIRED"].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      disabled={actionLoading === `status-${status}`}
                      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                        selectedOrder.status === status
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {actionLoading === `status-${status}` && <Loader2 className="h-3 w-3 animate-spin" />}
                      {ORDER_STATUS_LABELS[status] || status}
                    </button>
                  ))}
                </div>
                {!isOwner && (
                  <p className="mt-2 text-xs text-gray-400">Apenas o dono pode alterar status manualmente.</p>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}
