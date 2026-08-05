"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Key, Plus, Trash2, Loader2, Upload, AlertCircle, CheckCircle,
} from "lucide-react";
import { toast } from "@/components/ui/Toaster";

interface Credential {
  id: string;
  content: string;
  status: string;
  soldAt: string | null;
  orderItem: {
    order: {
      id: string;
      user: { name: string | null; email: string | null };
    };
  } | null;
}

interface Product {
  id: string;
  name: string;
  stockMode: string;
}

export default function AdminCredentialsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [stats, setStats] = useState({ available: 0, sold: 0, reserved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [singleCred, setSingleCred] = useState("");
  const [addMode, setAddMode] = useState<"BULK" | "SINGLE">("BULK");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "AVAILABLE" | "SOLD">("ALL");

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      const [prodRes, credRes] = await Promise.all([
        fetch(`/api/products/${productId}`).then((r) => r.json()),
        fetch(`/api/credentials?productId=${productId}&status=${filter}`).then((r) => r.json()),
      ]);
      setProduct(prodRes);
      setCredentials(credRes.credentials || []);
      setStats(credRes.stats || { available: 0, sold: 0, reserved: 0, total: 0 });
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      const body: any = { productId, mode: addMode };
      if (addMode === "BULK") {
        body.credentials = bulkText;
      } else {
        body.credentials = singleCred;
      }

      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Credenciais adicionadas!");
        setBulkText("");
        setSingleCred("");
        setShowAddModal(false);
        fetchData();
      } else {
        toast.error(data.error || "Erro ao adicionar");
      }
    } catch {
      toast.error("Erro ao adicionar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta credencial?")) return;
    try {
      await fetch(`/api/credentials?id=${id}`, { method: "DELETE" });
      toast.success("Credencial removida");
      fetchData();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const handleClearAvailable = async () => {
    if (!confirm("Remover TODAS as credenciais disponíveis?")) return;
    try {
      const res = await fetch(`/api/credentials?productId=${productId}&all=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      toast.success(`${data.deleted} credenciais removidas`);
      fetchData();
    } catch {
      toast.error("Erro");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!product) {
    return <div className="py-12 text-center text-slate-400">Produto não encontrado</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin/produtos"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar a Produtos
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <Key className="h-8 w-8 text-purple-400" />
            Credenciais
          </h1>
          <p className="mt-2 text-slate-400">{product.name}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          <Plus className="h-5 w-5" /> Adicionar
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4 text-center">
          <CheckCircle className="mx-auto h-6 w-6 text-green-500 mb-1" />
          <p className="text-2xl font-bold text-slate-100">{stats.available}</p>
          <p className="text-xs text-slate-400">Disponíveis</p>
        </div>
        <div className="card p-4 text-center">
          <Key className="mx-auto h-6 w-6 text-blue-500 mb-1" />
          <p className="text-2xl font-bold text-slate-100">{stats.sold}</p>
          <p className="text-xs text-slate-400">Vendidas</p>
        </div>
        <div className="card p-4 text-center">
          <AlertCircle className="mx-auto h-6 w-6 text-yellow-500 mb-1" />
          <p className="text-2xl font-bold text-slate-100">{stats.reserved}</p>
          <p className="text-xs text-slate-400">Reservadas</p>
        </div>
        <div className="card p-4 text-center">
          <Key className="mx-auto h-6 w-6 text-slate-500 mb-1" />
          <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          {(["ALL", "AVAILABLE", "SOLD"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-brand-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {f === "ALL" ? "Todas" : f === "AVAILABLE" ? "Disponíveis" : "Vendidas"}
            </button>
          ))}
        </div>
        {stats.available > 0 && (
          <button
            onClick={handleClearAvailable}
            className="text-sm text-red-500 hover:text-red-400"
          >
            Limpar disponíveis
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        {credentials.length === 0 ? (
          <div className="py-16 text-center">
            <Key className="mx-auto h-12 w-12 text-slate-500" />
            <p className="mt-4 text-slate-400">Nenhuma credencial cadastrada.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-purple-400 hover:underline"
            >
              Adicionar credenciais →
            </button>
          </div>
        ) : (
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {credentials.map((cred, idx) => (
              <div key={cred.id} className="flex items-center gap-3 p-4 hover:bg-slate-900">
                <span className="w-8 text-xs text-slate-500">#{idx + 1}</span>
                <code className="flex-1 truncate font-mono text-sm text-slate-200">
                  {cred.content}
                </code>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    cred.status === "AVAILABLE"
                      ? "bg-green-900/40 text-green-300"
                      : cred.status === "SOLD"
                      ? "bg-blue-900/40 text-blue-300"
                      : "bg-yellow-100 text-yellow-300"
                  }`}
                >
                  {cred.status === "AVAILABLE" ? "Disponível" : cred.status === "SOLD" ? "Vendida" : "Reservada"}
                </span>
                {cred.status === "SOLD" && cred.orderItem && (
                  <span className="hidden text-xs text-slate-500 sm:inline">
                    {cred.orderItem.order.user?.email || "—"}
                  </span>
                )}
                {cred.status === "AVAILABLE" && (
                  <button
                    onClick={() => handleDelete(cred.id)}
                    className="rounded p-1.5 text-red-500 hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de adicionar */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-slate-950 p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-100">Adicionar Credenciais</h2>

            {/* Toggle de modo */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setAddMode("BULK")}
                className={`flex-1 rounded-lg border p-3 text-sm font-medium transition-colors ${
                  addMode === "BULK" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-slate-700 text-slate-400"
                }`}
              >
                <Upload className="mx-auto mb-1 h-5 w-5" />
                Em Massa (uma por linha)
              </button>
              <button
                onClick={() => setAddMode("SINGLE")}
                className={`flex-1 rounded-lg border p-3 text-sm font-medium transition-colors ${
                  addMode === "SINGLE" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-slate-700 text-slate-400"
                }`}
              >
                <Plus className="mx-auto mb-1 h-5 w-5" />
                Individual
              </button>
            </div>

            {addMode === "BULK" ? (
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Cole as credenciais (uma por linha)
                </label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={10}
                  placeholder={"senha1\nsenha2\nsenha3\nuser:pass\nlogin@email.com:123456"}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  {bulkText.split("\n").filter((l) => l.trim()).length} credencial(is) detectada(s)
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Credencial (senha, login:senha, etc)
                </label>
                <input
                  type="text"
                  value={singleCred}
                  onChange={(e) => setSingleCred(e.target.value)}
                  placeholder="ex: senha123 ou user:pass"
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setBulkText("");
                  setSingleCred("");
                }}
                className="rounded-lg border px-4 py-2 text-slate-300 hover:bg-slate-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || (addMode === "BULK" ? !bulkText.trim() : !singleCred.trim())}
                className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
