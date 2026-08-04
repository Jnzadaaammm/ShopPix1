"use client";

import { useState, useCallback } from "react";
import { Plus, Edit, Trash2, Ticket, Power, PowerOff } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toaster";
import { usePolling } from "@/lib/use-polling";
import PermissionGuard from "@/components/admin/PermissionGuard";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrder: number | null;
  maxUses: number | null;
  usesCount: number;
  validFrom: string;
  validUntil: string | null;
  active: boolean;
}

export default function AdminCouponsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    value: "",
    minOrder: "",
    maxUses: "",
    validUntil: "",
  });

  const fetchCoupons = useCallback(async () => {
    const res = await fetch("/api/coupons");
    if (!res.ok) throw new Error("Erro ao carregar cupons");
    return (await res.json()) as Coupon[];
  }, []);

  const { data: coupons, loading, refetch } = usePolling<Coupon[]>(fetchCoupons, {
    interval: 10000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: any = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        minOrder: form.minOrder ? parseFloat(form.minOrder) : null,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
      };

      const url = editing ? `/api/coupons/${editing.id}` : "/api/coupons";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editing ? "Cupom atualizado!" : "Cupom criado!");
        refetch();
        closeModal();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar cupom");
      }
    } catch {
      toast.error("Erro ao salvar cupom");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cupom?")) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Cupom excluído");
        refetch();
      }
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !coupon.active }),
      });
      if (res.ok) {
        refetch();
        toast.success(coupon.active ? "Cupom desativado" : "Cupom ativado");
      }
    } catch {
      toast.error("Erro");
    }
  };

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditing(coupon);
      setForm({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value.toString(),
        minOrder: coupon.minOrder?.toString() || "",
        maxUses: coupon.maxUses?.toString() || "",
        validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split("T")[0] : "",
      });
    } else {
      setEditing(null);
      setForm({ code: "", type: "PERCENTAGE", value: "", minOrder: "", maxUses: "", validUntil: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  if (loading) {
    return (
      <PermissionGuard permission="coupons.manage">
        <div className="flex items-center justify-center py-12 text-gray-500">Carregando...</div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="coupons.manage">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cupons de Desconto</h1>
          <p className="mt-2 text-gray-600">{(coupons || []).length} cupons cadastrados</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
        >
          <Plus className="h-5 w-5" /> Novo Cupom
        </button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Pedido Mín.</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Usos</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Validade</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(coupons || []).map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-brand-600" />
                      <span className="font-mono font-bold text-gray-900">{coupon.code}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {coupon.type === "PERCENTAGE" ? "Percentual" : "Fixo"}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : formatCurrency(coupon.value)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {coupon.minOrder ? formatCurrency(coupon.minOrder) : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {coupon.usesCount}{coupon.maxUses ? `/${coupon.maxUses}` : ""}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString("pt-BR") : "Ilimitado"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(coupon)}
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        coupon.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {coupon.active ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                      {coupon.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openModal(coupon)} className="mr-2 rounded p-2 text-blue-600 hover:bg-blue-50">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(coupon.id)} className="rounded p-2 text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {(coupons || []).length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Nenhum cupom cadastrado. Clique em "Novo Cupom" para criar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              {editing ? "Editar Cupom" : "Novo Cupom"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Código</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="EX: PROMO10"
                  className="mt-1 w-full rounded-lg border px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as "PERCENTAGE" | "FIXED" })}
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="PERCENTAGE">Percentual (%)</option>
                    <option value="FIXED">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {form.type === "PERCENTAGE" ? "Percentual (%)" : "Valor (R$)"}
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pedido Mínimo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.minOrder}
                    onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                    placeholder="Opcional"
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Máximo de Usos</label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    placeholder="Ilimitado"
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Válido Até</label>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
                  {editing ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}
