"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Crown, Plus, Save, Trash2, X, Users, Shield, Tag, Check, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "@/components/ui/Toaster";
import { ALL_PERMISSIONS } from "@/lib/roles";
import { usePolling } from "@/lib/use-polling";

interface Role {
  id: string;
  name: string;
  description: string | null;
  type: string;
  level: number;
  discount: number;
  color: string;
  permissions: string[];
  isDefault: boolean;
  userCount: number;
  discordRoleId: string | null;
}

const COLORS = [
  { id: "gray", label: "Cinza", class: "bg-slate-900 text-slate-300" },
  { id: "blue", label: "Azul", class: "bg-blue-100 text-blue-700" },
  { id: "green", label: "Verde", class: "bg-green-100 text-green-700" },
  { id: "purple", label: "Roxo", class: "bg-purple-100 text-purple-700" },
  { id: "gold", label: "Dourado", class: "bg-yellow-100 text-yellow-800" },
  { id: "orange", label: "Laranja", class: "bg-orange-100 text-orange-700" },
  { id: "red", label: "Vermelho", class: "bg-red-100 text-red-700" },
];

export default function AdminRolesPage() {
  const { data: session, status } = useSession();
  const userPerms: string[] = (session?.user as any)?.role?.permissions || [];
  const canManageRoles = userPerms.includes("*") || userPerms.includes("roles.manage");

  const [editing, setEditing] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "CLIENT",
    level: 0,
    discount: 0,
    color: "gray",
    permissions: [] as string[],
    isDefault: false,
    discordRoleId: "",
  });

  const fetchRoles = useCallback(async () => {
    const res = await fetch("/api/roles");
    const data = await res.json();
    return data as Role[];
  }, []);

  const { data: roles, loading, refetch } = usePolling<Role[]>(fetchRoles, {
    interval: 10000,
  });

  const openCreate = () => {
    setForm({
      name: "",
      description: "",
      type: "CLIENT",
      level: 0,
      discount: 0,
      color: "gray",
      permissions: [],
      isDefault: false,
      discordRoleId: "",
    });
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (role: Role) => {
    setForm({
      name: role.name,
      description: role.description || "",
      type: role.type,
      level: role.level,
      discount: role.discount,
      color: role.color,
      permissions: role.permissions,
      isDefault: role.isDefault,
      discordRoleId: role.discordRoleId || "",
    });
    setEditing(role);
    setCreating(false);
  };

  const closeModal = () => {
    setEditing(null);
    setCreating(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      const url = editing ? "/api/roles" : "/api/roles";
      const method = editing ? "PUT" : "POST";
      const body = editing ? { ...form, id: editing.id } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editing ? "Cargo atualizado!" : "Cargo criado!");
        closeModal();
        refetch();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar");
      }
    } catch {
      toast.error("Erro ao salvar cargo");
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.isDefault) {
      toast.error("Não é possível remover o cargo padrão");
      return;
    }
    if (role.userCount > 0) {
      toast.error(`${role.userCount} usuário(s) possui(m) este cargo`);
      return;
    }
    if (!confirm(`Remover o cargo "${role.name}"?`)) return;

    try {
      const res = await fetch(`/api/roles?id=${role.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Cargo removido");
        refetch();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao remover");
      }
    } catch {
      toast.error("Erro ao remover cargo");
    }
  };

  const handleSyncDiscord = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/discord/sync-roles", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const parts: string[] = [];
        if (data.created?.length) parts.push(`${data.created.length} criado(s)`);
        if (data.updated?.length) parts.push(`${data.updated.length} atualizado(s)`);
        if (data.skipped?.length) parts.push(`${data.skipped.length} pulado(s)`);
        toast.success(`Cargos sincronizados com Discord! ${parts.join(", ")}`);
        refetch();
      } else {
        toast.error(data.error || "Erro ao sincronizar cargos");
      }
    } catch {
      toast.error("Erro ao sincronizar cargos com Discord");
    } finally {
      setSyncing(false);
    }
  };

  const togglePermission = (permId: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const clientRoles = (roles || []).filter((r) => r.type === "CLIENT");
  const teamRoles = (roles || []).filter((r) => r.type === "TEAM");

  const getColorClass = (color: string) =>
    COLORS.find((c) => c.id === color)?.class || COLORS[0].class;

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-800" />
      </div>
    );
  }

  if (!canManageRoles) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-100">Acesso Negado</h1>
          <p className="mt-2 text-slate-400">Você não tem permissão para gerenciar cargos.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-800" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-100">
            <Crown className="h-8 w-8 text-brand-600" /> Cargos
          </h1>
          <p className="mt-2 text-slate-400">Gerencie cargos de clientes e equipe</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSyncDiscord}
            disabled={syncing}
            className="btn-secondary flex items-center gap-2"
            title="Cria/atualiza os cargos do site no servidor do Discord automaticamente"
          >
            <RefreshCw className={`h-5 w-5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar Discord"}
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-5 w-5" /> Novo Cargo
          </button>
        </div>
      </div>

      {/* Cargos de Cliente */}
      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
          <Tag className="h-5 w-5 text-brand-600" /> Cargos de Cliente
          <span className="text-sm font-normal text-slate-500">
            ({clientRoles.length}) — desconto automático no checkout
          </span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientRoles.map((role) => (
            <div
              key={role.id}
              className="card group relative overflow-hidden p-5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`rounded-lg px-3 py-1.5 text-sm font-bold ${getColorClass(role.color)}`}>
                    {role.name}
                  </span>
                  {role.isDefault && (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                      Padrão
                    </span>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(role)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-900 hover:text-brand-600"
                    aria-label="Editar"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-500"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-400">{role.description || "Sem descrição"}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-bold text-brand-600">{role.discount}% OFF</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Users className="h-3 w-3" /> {role.userCount}
                  </span>
                </div>
                <span className="text-xs text-slate-500">Nível {role.level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cargos de Equipe */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
          <Shield className="h-5 w-5 text-red-600" /> Cargos de Equipe
          <span className="text-sm font-normal text-slate-500">
            ({teamRoles.length}) — permissões administrativas
          </span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teamRoles.map((role) => (
            <div
              key={role.id}
              className="card group relative overflow-hidden p-5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`rounded-lg px-3 py-1.5 text-sm font-bold ${getColorClass(role.color)}`}>
                    {role.name}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(role)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-900 hover:text-brand-600"
                    aria-label="Editar"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-500"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-400">{role.description || "Sem descrição"}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {(role.permissions || []).includes("*") ? (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                    Acesso Total
                  </span>
                ) : (
                  (role.permissions || []).slice(0, 3).map((p) => {
                    const perm = ALL_PERMISSIONS.find((ap) => ap.id === p);
                    return (
                      <span
                        key={p}
                        className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-slate-400"
                      >
                        {perm?.label || p}
                      </span>
                    );
                  })
                )}
                {role.permissions.length > 3 && !role.permissions.includes("*") && (
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-slate-400">
                    +{role.permissions.length - 3}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <Users className="h-3 w-3" /> {role.userCount} usuário(s)
                </span>
                <span className="text-xs text-slate-500">Nível {role.level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de criação/edição */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-slate-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100">
                {editing ? "Editar Cargo" : "Novo Cargo"}
              </h3>
              <button onClick={closeModal} className="rounded-lg p-1 text-slate-500 hover:bg-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-slate-300">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Prata, Ouro, Moderador..."
                  className="input mt-1"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-slate-300">Descrição</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descrição do cargo..."
                  className="input mt-1"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-slate-300">Tipo</label>
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => setForm({ ...form, type: "CLIENT", permissions: [] })}
                    className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      form.type === "CLIENT"
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-700 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <Tag className="mr-1 inline h-4 w-4" /> Cliente
                  </button>
                  <button
                    onClick={() => setForm({ ...form, type: "TEAM", discount: 0 })}
                    className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      form.type === "TEAM"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-700 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <Shield className="mr-1 inline h-4 w-4" /> Equipe
                  </button>
                </div>
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-medium text-slate-300">Cor do Badge</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setForm({ ...form, color: c.id })}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                        c.class
                      } ${form.color === c.id ? "ring-2 ring-offset-2 ring-gray-400" : ""}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nível + Desconto (cliente) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Nível</label>
                  <input
                    type="number"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || 0 })}
                    className="input mt-1"
                  />
                </div>
                {form.type === "CLIENT" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300">
                      Desconto (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                      className="input mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Cargo padrão */}
              {form.type === "CLIENT" && (
                <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-slate-900">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-100">Cargo padrão</p>
                    <p className="text-xs text-slate-400">Novos usuários recebem este cargo automaticamente</p>
                  </div>
                </label>
              )}

              {/* Permissões (equipe) */}
              {form.type === "TEAM" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300">
                    Permissões
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-slate-900"
                      >
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="h-4 w-4 rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-xs text-slate-300">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Discord Role ID — sincroniza cargo no servidor Discord */}
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  ID do Cargo no Discord <span className="text-slate-500 font-normal">(auto)</span>
                </label>
                <input
                  type="text"
                  value={form.discordRoleId}
                  onChange={(e) => setForm({ ...form, discordRoleId: e.target.value })}
                  placeholder="Preenchido automaticamente ao sincronizar"
                  className="input mt-1"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Preenchido automaticamente quando você clica em "Sincronizar Discord".
                  Só edite manualmente se quiser apontar para um cargo já existente.
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeModal} className="btn-outline">
                Cancelar
              </button>
              <button onClick={handleSave} className="btn-primary">
                <Check className="h-4 w-4" /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
