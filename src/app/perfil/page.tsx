"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Calendar,
  Package,
  Download,
  RefreshCw,
  Shield,
  LogOut,
  Save,
  Check,
  Loader2,
  ShoppingBag,
  TrendingUp,
  Edit2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toaster";
import { usePolling } from "@/lib/use-polling";
import ImageWithFallback from "@/components/ImageWithFallback";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isAdmin: boolean;
  createdAt: string;
  stats: {
    totalOrders: number;
    paidOrders: number;
    totalSpent: number;
    refunds: number;
    downloads: number;
  };
}

interface Order {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: { id: string; product: { name: string; image: string } | null; productName: string | null; productImage: string | null; quantity: number; price: number }[];
}

interface Download {
  id: string;
  downloadKey: string;
  expiresAt: string;
  downloadsUsed: number;
  maxDownloads: number;
  product: { id: string; name: string; image: string };
}

interface Refund {
  id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  order: { id: string };
}

type Tab = "overview" | "orders" | "downloads" | "refunds" | "settings";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Edição
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/perfil");
    }
  }, [status, router]);

  // Polling dos dados do perfil (30s)
  const { data: profile, refetch: refetchProfile } = usePolling<Profile>(
    useCallback(() => fetch("/api/profile").then(r => r.json()), []),
    { enabled: status === "authenticated" }
  );
  const { data: ordersData } = usePolling<Order[]>(
    useCallback(() => fetch("/api/orders").then(r => r.json()), []),
    { enabled: status === "authenticated" }
  );
  const { data: downloadsData } = usePolling<Download[]>(
    useCallback(() => fetch("/api/downloads").then(r => r.json()), []),
    { enabled: status === "authenticated" }
  );
  const { data: refundsData } = usePolling<Refund[]>(
    useCallback(() => fetch("/api/refunds").then(r => r.json()), []),
    { enabled: status === "authenticated" }
  );

  const orders = ordersData || [];
  const downloads = downloadsData || [];
  const refunds = refundsData || [];
  const loading = !profile;

  // Sincronizar nome/imagem quando o perfil carregar
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setImage(profile.image || "");
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      });
      if (res.ok) {
        setSaved(true);
        setEditing(false);
        toast.success("Perfil atualizado com sucesso!");
        setTimeout(() => setSaved(false), 2000);
        await update({ name, image });
        refetchProfile();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar perfil");
      }
    } catch {
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!profile) {
    return <div className="py-12 text-center text-gray-500">Erro ao carregar perfil</div>;
  }

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "overview", label: "Visão Geral", icon: User },
    { id: "orders", label: "Pedidos", icon: Package },
    { id: "downloads", label: "Downloads", icon: Download },
    { id: "refunds", label: "Reembolsos", icon: RefreshCw },
    { id: "settings", label: "Configurações", icon: Shield },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header do perfil */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            {profile.image ? (
              <ImageWithFallback
                src={profile.image ?? ""}
                alt=""
                width={96}
                height={96}
                className="rounded-full ring-4 ring-brand-100"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 ring-4 ring-brand-50">
                <User className="h-10 w-10 text-brand-600" />
              </div>
            )}
            {profile.isAdmin && (
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 ring-2 ring-white">
                <Shield className="h-4 w-4 text-white" />
              </span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{profile.name || "Sem nome"}</h1>
            <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1 mt-1">
              <Mail className="h-4 w-4" /> {profile.email}
            </p>
            <p className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-1 mt-1">
              <Calendar className="h-3 w-3" /> Membro desde {new Date(profile.createdAt).toLocaleDateString("pt-BR")}
            </p>
            {profile.isAdmin && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                <Shield className="h-3 w-3" /> Administrador
              </span>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <ShoppingBag className="mx-auto h-6 w-6 text-blue-500 mb-1" />
          <p className="text-2xl font-bold text-gray-900">{profile.stats.totalOrders}</p>
          <p className="text-xs text-gray-500">Pedidos</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <TrendingUp className="mx-auto h-6 w-6 text-green-500 mb-1" />
          <p className="text-xl font-bold text-gray-900">{formatCurrency(profile.stats.totalSpent)}</p>
          <p className="text-xs text-gray-500">Total Gasto</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <Download className="mx-auto h-6 w-6 text-purple-500 mb-1" />
          <p className="text-2xl font-bold text-gray-900">{profile.stats.downloads}</p>
          <p className="text-xs text-gray-500">Downloads</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <RefreshCw className="mx-auto h-6 w-6 text-orange-500 mb-1" />
          <p className="text-2xl font-bold text-gray-900">{profile.stats.refunds}</p>
          <p className="text-xs text-gray-500">Reembolsos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto rounded-xl border bg-white p-1.5 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-brand-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo das tabs */}
      <div className="mt-6">
        {/* Visão Geral */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Pedidos Recentes</h2>
              {orders.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum pedido ainda. <Link href="/produtos" className="text-brand-600 hover:underline">Começar a comprar →</Link></p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <Link
                      key={order.id}
                      href={`/pedidos`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-gray-900">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")} · {order.items.length} itens
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total)}</p>
                        <span className={`text-xs ${
                          order.status === "PAID" ? "text-green-600" :
                          order.status === "PENDING" ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {orders.length > 3 && (
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="text-sm text-brand-600 hover:underline"
                    >
                      Ver todos os {orders.length} pedidos →
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Ações Rápidas</h2>
                <div className="space-y-2">
                  <Link href="/produtos" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
                    <ShoppingBag className="h-5 w-5 text-brand-600" />
                    <span className="text-sm font-medium">Continuar comprando</span>
                  </Link>
                  <Link href="/downloads" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
                    <Download className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">Meus downloads</span>
                  </Link>
                  <Link href="/pedidos" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Histórico de pedidos</span>
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Resumo da Conta</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Email</dt>
                    <dd className="font-medium text-gray-900 truncate ml-2">{profile.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Conta criada</dt>
                    <dd className="font-medium text-gray-900">{new Date(profile.createdAt).toLocaleDateString("pt-BR")}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Tipo de conta</dt>
                    <dd className="font-medium text-gray-900">{profile.isAdmin ? "Administrador" : "Cliente"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Pedidos pagos</dt>
                    <dd className="font-medium text-gray-900">{profile.stats.paidOrders} de {profile.stats.totalOrders}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* Pedidos */}
        {activeTab === "orders" && (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Histórico de Pedidos</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum pedido realizado. <Link href="/produtos" className="text-brand-600 hover:underline">Ver produtos →</Link></p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} · {order.paymentMethod.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(order.total)}</p>
                        <span className={`text-xs font-medium ${
                          order.status === "PAID" ? "text-green-600" :
                          order.status === "PENDING" ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1">
                          <ImageWithFallback src={item.product?.image || item.productImage || ""} alt="" width={24} height={24} className="rounded object-cover" />
                          <span className="text-xs text-gray-600">{item.product?.name || item.productName || "Produto removido"} x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    {order.status === "PAID" && (
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/reembolso/${order.id}`}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Solicitar reembolso
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Downloads */}
        {activeTab === "downloads" && (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Meus Downloads</h2>
            {downloads.length === 0 ? (
              <p className="text-sm text-gray-500">
                Nenhum download disponível. Após comprar produtos digitais, os links aparecerão aqui.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {downloads.map((dl) => {
                  const expired = new Date(dl.expiresAt) < new Date();
                  const exhausted = dl.downloadsUsed >= dl.maxDownloads;
                  return (
                    <div key={dl.id} className="rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback src={dl.product.image} alt="" width={48} height={48} className="rounded object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{dl.product.name}</p>
                          <p className="text-xs text-gray-500">
                            {dl.downloadsUsed}/{dl.maxDownloads} usados
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`text-xs ${expired || exhausted ? "text-red-500" : "text-gray-500"}`}>
                          {expired ? "Expirado" : exhausted ? "Esgotado" : `Expira em ${new Date(dl.expiresAt).toLocaleDateString("pt-BR")}`}
                        </span>
                        {!expired && !exhausted && (
                          <a
                            href={`/api/download/${dl.downloadKey}`}
                            className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs text-white hover:bg-brand-700"
                          >
                            <Download className="h-3 w-3" /> Baixar
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reembolsos */}
        {activeTab === "refunds" && (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Solicitações de Reembolso</h2>
            {refunds.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma solicitação de reembolso.</p>
            ) : (
              <div className="space-y-3">
                {refunds.map((refund) => (
                  <div key={refund.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Pedido #{refund.order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(refund.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(refund.amount)}</p>
                        <span className={`text-xs font-medium ${
                          refund.status === "COMPLETED" ? "text-green-600" :
                          refund.status === "APPROVED" ? "text-blue-600" :
                          refund.status === "REJECTED" ? "text-red-600" : "text-yellow-600"
                        }`}>
                          {refund.status}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{refund.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Configurações */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Dados Pessoais</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1 text-sm text-brand-600 hover:underline"
                  >
                    <Edit2 className="h-4 w-4" /> Editar
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">URL da Foto</label>
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://..."
                      className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Para alterar a foto via Google, faça logout e login novamente.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={profile.email || ""}
                      disabled
                      className="mt-1 w-full rounded-lg border bg-gray-50 px-3 py-2 text-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">O email não pode ser alterado.</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                      ) : saved ? (
                        <><Check className="h-4 w-4" /> Salvo!</>
                      ) : (
                        <><Save className="h-4 w-4" /> Salvar</>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setName(profile.name || "");
                        setImage(profile.image || "");
                      }}
                      className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-gray-500">Nome</dt>
                    <dd className="font-medium text-gray-900">{profile.name || "—"}</dd>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-gray-500">Email</dt>
                    <dd className="font-medium text-gray-900">{profile.email}</dd>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-gray-500">Foto</dt>
                    <dd className="font-medium text-gray-900 truncate max-w-[200px]">
                      {profile.image ? "Definida" : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Tipo de conta</dt>
                    <dd className="font-medium text-gray-900">{profile.isAdmin ? "Administrador" : "Cliente"}</dd>
                  </div>
                </dl>
              )}
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Sessão</h2>
              <p className="text-sm text-gray-500 mb-4">
                Encerre sua sessão neste dispositivo. Você precisará fazer login novamente para acessar sua conta.
              </p>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Encerrar sessão
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <h2 className="mb-2 text-sm font-semibold text-gray-900">Links Úteis</h2>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link href="/termos" className="text-brand-600 hover:underline">Termos de Uso</Link>
                <Link href="/privacidade" className="text-brand-600 hover:underline">Política de Privacidade</Link>
                <Link href="/reembolso-politica" className="text-brand-600 hover:underline">Política de Reembolso</Link>
                <Link href="/faq" className="text-brand-600 hover:underline">FAQ</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
