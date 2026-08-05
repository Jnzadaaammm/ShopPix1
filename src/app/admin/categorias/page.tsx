"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
import { Plus, Edit, Trash2, Tag, AlertTriangle } from "lucide-react";
import { usePolling } from "@/lib/use-polling";
import PermissionGuard from "@/components/admin/PermissionGuard";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: {
    products: number;
  };
}

export default function AdminCategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"categorias" | "excluir">("categorias");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<Category[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [needsForce, setNeedsForce] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const fetchCategories = useCallback(async () => {
    const response = await fetch("/api/categories");
    const data = await response.json();
    return data as Category[];
  }, []);

  const { data: categories, loading, refetch } = usePolling<Category[]>(
    fetchCategories,
    { interval: 10000 }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        refetch();
        closeModal();
      }
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
    }
  };

  // Abre o modal de confirmação de exclusão (uma ou várias categorias)
  const requestDelete = (ids: string[]) => {
    const cats = (categories || []).filter((c) => ids.includes(c.id));
    setDeleteTargets(cats);
    setDeleteError(null);
  };

  const confirmDelete = async (force: boolean) => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const results = await Promise.all(
        deleteTargets.map(async (cat) => {
          const res = await fetch(
            `/api/categories/${cat.id}${force ? "?force=true" : ""}`,
            { method: "DELETE" }
          );
          const data = await res.json().catch(() => ({}));
          return { cat, ok: res.ok, status: res.status, data };
        })
      );

      const failed = results.filter((r) => !r.ok);
      const deletedIds = results.filter((r) => r.ok).map((r) => r.cat.id);

      // Remove os deletados da seleção
      if (deletedIds.length > 0) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          deletedIds.forEach((id) => next.delete(id));
          return next;
        });
      }

      refetch();

      if (failed.length === 0) {
        setDeleteTargets([]);
        setNeedsForce(false);
        return;
      }

      // Se falhou só por causa de produtos vinculados, oferece exclusão forçada
      const needsForce = failed.every((f) => f.data?.needsForce);
      if (needsForce && !force) {
        setDeleteTargets(failed.map((f) => f.cat));
        setDeleteError(null);
        setNeedsForce(true);
      } else {
        setDeleteError(failed.map((f) => `${f.cat.name}: ${f.data?.error || "erro"}`).join("\n"));
      }
    } catch (error) {
      setDeleteError("Erro de conexão ao deletar.");
      console.error("Erro ao deletar categorias:", error);
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteTargets([]);
    setDeleteError(null);
    setNeedsForce(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const cats = categories || [];
    if (selectedIds.size === cats.length && cats.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cats.map((c) => c.id)));
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  if (loading) {
    return (
      <PermissionGuard permission="categories.manage">
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Carregando...</div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="categories.manage">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Gerenciar Categorias</h1>
          <p className="mt-2 text-slate-400">
            {(categories || []).length} categorias cadastradas
          </p>
        </div>
        {activeTab === "categorias" && (
          <button
            onClick={() => openModal()}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nova Categoria
          </button>
        )}
      </div>

      {/* Abas */}
      <div className="mb-6 flex gap-1 border-b border-slate-700">
        <button
          onClick={() => setActiveTab("categorias")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "categorias"
              ? "border-b-2 border-brand-600 text-brand-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Tag className="h-4 w-4" />
          Categorias
        </button>
        <button
          onClick={() => setActiveTab("excluir")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "excluir"
              ? "border-b-2 border-red-600 text-red-600"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Trash2 className="h-4 w-4" />
          Excluir
          {selectedIds.size > 0 && (
            <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              {selectedIds.size}
            </span>
          )}
        </button>
      </div>

      {/* ABA: CATEGORIAS (listagem padrão) */}
      {activeTab === "categorias" && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Produtos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(categories || []).map((category) => (
                  <tr key={category.id} className="hover:bg-slate-900">
                    <td className="px-6 py-4 font-medium text-slate-100">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{category.slug}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {category.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {category._count?.products || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openModal(category)}
                        className="mr-2 rounded p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => requestDelete([category.id])}
                        className="rounded p-2 text-red-600 hover:bg-red-950"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA: EXCLUIR (deletar em lote) */}
      {activeTab === "excluir" && (
        <div className="card">
          {/* Barra de ações em lote */}
          <div className="flex items-center justify-between border-b bg-slate-900 px-6 py-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <input
                  type="checkbox"
                  checked={selectedIds.size === (categories || []).length && (categories || []).length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-700 text-red-600 focus:ring-red-500"
                />
                Selecionar todas
              </label>
              <span className="text-sm text-slate-400">
                {selectedIds.size} selecionada(s)
              </span>
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={() => requestDelete(Array.from(selectedIds))}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Deletar {selectedIds.size} categoria(s)
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-slate-900">
                <tr>
                  <th className="w-12 px-6 py-3"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Produtos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(categories || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Nenhuma categoria encontrada.
                    </td>
                  </tr>
                ) : (
                  (categories || []).map((category) => (
                    <tr
                      key={category.id}
                      className={`transition-colors ${
                        selectedIds.has(category.id) ? "bg-red-50" : "hover:bg-slate-900"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(category.id)}
                          onChange={() => toggleSelect(category.id)}
                          className="h-4 w-4 rounded border-slate-700 text-red-600 focus:ring-red-500"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-100">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{category.slug}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          (category._count?.products || 0) > 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-900 text-slate-400"
                        }`}>
                          {category._count?.products || 0} produto(s)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => requestDelete([category.id])}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-slate-950 p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-100">
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Slug
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border px-4 py-2 text-slate-300 hover:bg-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  {editingCategory ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteTargets.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeDeleteModal}>
          <div
            className="w-full max-w-md rounded-2xl bg-slate-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-full bg-red-100 p-2.5">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  {needsForce ? "Categoria com produtos" : "Excluir categoria"}
                  {deleteTargets.length > 1 ? "s" : ""}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {needsForce
                    ? "Esta ação também excluirá os produtos dentro dela."
                    : "Esta ação não pode ser desfeita."}
                </p>
              </div>
            </div>

            {/* Lista de categorias a excluir */}
            <div className="mb-4 max-h-40 space-y-1.5 overflow-y-auto rounded-xl bg-slate-900 p-3">
              {deleteTargets.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-100">{cat.name}</span>
                  {(cat._count?.products || 0) > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {cat._count?.products} produto(s)
                    </span>
                  )}
                </div>
              ))}
            </div>

            {deleteError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="whitespace-pre-line text-sm text-red-700">{deleteError}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(needsForce)}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting
                  ? "Excluindo..."
                  : needsForce
                  ? "Excluir com os produtos"
                  : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}
