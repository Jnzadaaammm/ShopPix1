"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
import { Check, X, DollarSign, Clock, CheckCircle, XCircle, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePolling } from "@/lib/use-polling";
import { toast } from "@/components/ui/Toaster";
import PermissionGuard from "@/components/admin/PermissionGuard";

interface Refund {
  id: string;
  amount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  pixKey: string | null;
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
  order: {
    id: string;
    total: number;
    status: string;
    user: {
      name: string;
      email: string;
    };
  };
  user: {
    name: string;
    email: string;
  };
}

export default function AdminRefundsPage() {
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchRefunds = useCallback(async () => {
    const res = await fetch("/api/refunds?admin=true");
    if (res.ok) {
      return (await res.json()) as Refund[];
    }
    throw new Error(`HTTP ${res.status}`);
  }, []);

  const { data: refunds, loading, refetch } = usePolling<Refund[]>(fetchRefunds, {
    interval: 10000,
  });

  const handleApprove = async () => {
    if (!selectedRefund) return;
    setProcessing(true);

    try {
      const res = await fetch(`/api/refunds/${selectedRefund.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          adminNote,
          pixKey: pixKey || selectedRefund.pixKey,
        }),
      });

      if (res.ok) {
        toast.success("Reembolso aprovado!");
        refetch();
        setSelectedRefund(null);
        setAdminNote("");
        setPixKey("");
      } else {
        toast.error("Erro ao aprovar reembolso");
      }
    } catch (error) {
      toast.error("Erro ao aprovar reembolso");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRefund) return;
    setProcessing(true);

    try {
      const res = await fetch(`/api/refunds/${selectedRefund.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          adminNote,
        }),
      });

      if (res.ok) {
        toast.success("Reembolso rejeitado");
        refetch();
        setSelectedRefund(null);
        setAdminNote("");
      } else {
        toast.error("Erro ao rejeitar reembolso");
      }
    } catch (error) {
      toast.error("Erro ao rejeitar reembolso");
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async (refund: Refund) => {
    if (!confirm("Confirmar que o reembolso foi processado via PIX?")) return;
    setProcessing(true);

    try {
      const res = await fetch(`/api/refunds/${refund.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
        }),
      });

      if (res.ok) {
        toast.success("Reembolso concluído!");
        refetch();
      } else {
        toast.error("Erro ao concluir reembolso");
      }
    } catch (error) {
      toast.error("Erro ao concluir reembolso");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      APPROVED: { bg: "bg-blue-100", text: "text-blue-800", icon: Check },
      REJECTED: { bg: "bg-red-100", text: "text-red-800", icon: X },
      COMPLETED: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <PermissionGuard permission="refunds.manage">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="refunds.manage">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Reembolsos</h1>
        <p className="mt-2 text-gray-600">
          {(refunds || []).length} solicitações de reembolso
        </p>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Chave PIX
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(refunds || []).map((refund) => (
                <tr key={refund.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        #{refund.order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(refund.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{refund.user.name}</p>
                      <p className="text-sm text-gray-500">{refund.user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {formatCurrency(refund.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="max-w-xs truncate text-sm text-gray-600">
                      {refund.reason}
                    </p>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(refund.status)}</td>
                  <td className="px-6 py-4">
                    <p className="max-w-xs truncate text-sm text-gray-600">
                      {refund.pixKey || "Não informada"}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {refund.status === "PENDING" && (
                      <button
                        onClick={() => setSelectedRefund(refund)}
                        className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                      >
                        Analisar
                      </button>
                    )}
                    {refund.status === "APPROVED" && (
                      <button
                        onClick={() => handleComplete(refund)}
                        className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                      >
                        Concluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Analisar Reembolso
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Valor</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(selectedRefund.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Motivo</p>
                <p className="text-gray-900">{selectedRefund.reason}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Chave PIX do Cliente</p>
                <p className="text-gray-900">{selectedRefund.pixKey || "Não informada"}</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Chave PIX para Reembolso
                </label>
                <input
                  type="text"
                  value={pixKey || selectedRefund.pixKey || ""}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="input"
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nota do Admin
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  className="input"
                  placeholder="Observações sobre a decisão..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedRefund(null);
                  setAdminNote("");
                  setPixKey("");
                }}
                className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                {processing ? "Processando..." : "Rejeitar"}
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                {processing ? "Processando..." : "Aprovar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}
