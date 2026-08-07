"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  Key, Plus, Trash2, Ban, Copy, Check, AlertCircle, Loader2, Clock,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export default function ApiGeneratorPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPermissions, setNewPermissions] = useState<string>("*");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      } else if (res.status === 403) {
        setError("Apenas o dono da loja pode gerenciar chaves de API.");
      }
    } catch {
      setError("Erro ao carregar chaves.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const perms =
        newPermissions === "*" ? ["*"] : newPermissions.split(",").map((p) => p.trim()).filter(Boolean);
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), permissions: perms }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedKey(data.rawKey);
        setNewName("");
        setNewPermissions("*");
        setShowCreateForm(false);
        fetchKeys();
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao criar chave.");
      }
    } catch {
      setError("Erro ao criar chave.");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Tem certeza? A chave será revogada e não funcionará mais.")) return;
    try {
      await fetch(`/api/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });
      fetchKeys();
    } catch {
      setError("Erro ao revogar chave.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar permanentemente esta chave? Esta ação não pode ser desfeita.")) return;
    try {
      await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      fetchKeys();
    } catch {
      setError("Erro ao deletar chave.");
    }
  };

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const parsePerms = (permsStr: string): string[] => {
    try { return JSON.parse(permsStr); } catch { return []; }
  };

  return (
    <PermissionGuard permission="settings.manage">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Gerador de API</h1>
          <p className="mt-2 text-slate-400">
            Crie chaves de API para conectar o bot do Discord ou outros serviços externos à sua loja.
          </p>
        </div>

        {/* Aviso de segurança */}
        <div className="mb-6 rounded-lg border border-yellow-800/50 bg-yellow-900/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
            <div className="text-sm text-yellow-200">
              <p className="font-medium">Importante:</p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-yellow-200/80">
                <li>A chave bruta é exibida <strong>apenas uma vez</strong> na criação. Copie e guarde com segurança.</li>
                <li>Quem tiver a chave pode acessar os dados da sua loja conforme as permissões concedidas.</li>
                <li>Use a permissão <code className="rounded bg-yellow-950/50 px-1">{"*"}</code> apenas para serviços confiáveis (como seu bot).</li>
                <li>Revogue imediatamente se uma chave for comprometida.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Chave recém-criada — banner de cópia */}
        {generatedKey && (
          <div className="mb-6 rounded-lg border border-green-800/50 bg-green-900/20 p-6">
            <div className="mb-2 flex items-center gap-2">
              <Check className="h-5 w-5 text-green-400" />
              <h2 className="text-lg font-semibold text-green-100">Chave criada com sucesso!</h2>
            </div>
            <p className="mb-3 text-sm text-green-200/80">
              Copie esta chave agora — ela não será exibida novamente:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-lg border border-green-800/50 bg-green-950/50 px-4 py-3 text-sm text-green-100">
                {generatedKey}
              </code>
              <button
                onClick={copyKey}
                className="flex shrink-0 items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-500"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <button
              onClick={() => setGeneratedKey(null)}
              className="mt-3 text-sm text-green-300/70 hover:text-green-200"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Botão criar / formulário */}
        <div className="mb-6">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-500"
            >
              <Plus className="h-4 w-4" />
              Gerar nova chave
            </button>
          ) : (
            <div className="card p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-100">Nova chave de API</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Nome</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Ex: Bot Discord, Integração XYZ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Permissões</label>
                  <input
                    type="text"
                    value={newPermissions}
                    onChange={(e) => setNewPermissions(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder="* (acesso total) ou products.manage,orders.view,..."
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Use <code className="rounded bg-slate-800 px-1">*</code> para acesso total, ou liste permissões separadas por vírgula.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={creating || !newName.trim()}
                    className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500 disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                    Gerar chave
                  </button>
                  <button
                    onClick={() => { setShowCreateForm(false); setNewName(""); setNewPermissions("*"); }}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-800/50 bg-red-900/20 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Lista de chaves */}
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Chaves de API</h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-900" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <p className="py-8 text-center text-slate-400">
              Nenhuma chave criada ainda. Clique em &quot;Gerar nova chave&quot; para começar.
            </p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => {
                const perms = parsePerms(key.permissions);
                const isRevoked = !!key.revokedAt;
                return (
                  <div
                    key={key.id}
                    className={`rounded-lg border p-4 ${
                      isRevoked ? "border-red-900/50 bg-red-950/20" : "border-slate-800 bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="font-medium text-slate-100">{key.name}</span>
                          {isRevoked && (
                            <span className="rounded bg-red-900/50 px-2 py-0.5 text-xs text-red-300">
                              Revogada
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <code className="rounded bg-slate-800 px-1.5 py-0.5">{key.keyPrefix}...</code>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Criada: {formatDate(key.createdAt)}
                          </span>
                          {key.lastUsedAt && (
                            <span className="flex items-center gap-1">
                              • Último uso: {formatDate(key.lastUsedAt)}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {perms.map((p) => (
                            <span
                              key={p}
                              className={`rounded px-2 py-0.5 text-xs ${
                                p === "*" ? "bg-purple-900/40 text-purple-300" : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {!isRevoked && (
                          <button
                            onClick={() => handleRevoke(key.id)}
                            title="Revogar"
                            className="rounded-lg border border-slate-700 p-2 text-slate-400 transition hover:bg-red-900/30 hover:text-red-300"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(key.id)}
                          title="Deletar"
                          className="rounded-lg border border-slate-700 p-2 text-slate-400 transition hover:bg-red-900/30 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Documentação rápida */}
        <div className="mt-6 card p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Como usar</h2>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              Após gerar uma chave, use-a no header <code className="rounded bg-slate-800 px-1">Authorization: Bearer sk_...</code> das
              requisições para os endpoints <code className="rounded bg-slate-800 px-1">/api/bot/*</code>:
            </p>
            <div className="rounded-lg bg-slate-950 p-4 font-mono text-xs text-slate-300">
              <div className="text-slate-500"># Exemplo: listar produtos</div>
              <div>curl -H &quot;Authorization: Bearer sk_sua_chave_aqui&quot; \</div>
              <div className="pl-4">https://shop-pix.com/api/bot/products</div>
              <div className="mt-2 text-slate-500"># Aprovar pedido</div>
              <div>curl -X POST -H &quot;Authorization: Bearer sk_...&quot; \</div>
              <div className="pl-4">https://shop-pix.com/api/bot/orders/ID/approve</div>
            </div>
            <p className="text-slate-400">
              No bot do Discord, defina <code className="rounded bg-slate-800 px-1">SHOPPIX_API_KEY</code> no{" "}
              <code className="rounded bg-slate-800 px-1">.env</code> com a chave gerada.
            </p>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
