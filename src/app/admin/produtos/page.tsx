"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback, useMemo } from "react";
import { Plus, Edit, Trash2, Search, Key, Package, Boxes, KeyRound, InfinityIcon, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePolling } from "@/lib/use-polling";
import { toast } from "@/components/ui/Toaster";
import ImageWithFallback from "@/components/ImageWithFallback";
import PermissionGuard from "@/components/admin/PermissionGuard";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
  stock: number;
  featured: boolean;
  stockMode: string;
  fileUrl: string | null;
  maxDownloads: number;
}

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"produtos" | "excluir">("produtos");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<Product[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    categoryId: "",
    featured: false,
    stockMode: "SIMPLE",
    fileUrl: "",
    maxDownloads: "5",
  });

  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    const response = await fetch("/api/products?limit=100");
    const data = await response.json();
    return data.products || data;
  }, []);

  const fetchCategories = useCallback(async (): Promise<Category[]> => {
    const response = await fetch("/api/categories");
    const data = await response.json();
    return data;
  }, []);

  const { data: productsData, loading, refetch: refetchProducts } = usePolling<Product[]>(
    fetchProducts
  );

  const { data: categoriesData } = usePolling<Category[]>(fetchCategories);

  const products = productsData || [];
  const categories = categoriesData || [];

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          categoryId: formData.categoryId,
          maxDownloads: parseInt(formData.maxDownloads) || 5,
        }),
      });

      if (response.ok) {
        toast.success(editingProduct ? "Produto atualizado!" : "Produto criado!");
        refetchProducts();
        closeModal();
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Erro ao salvar produto");
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.error("Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  };

  // Abre o modal de confirmação de exclusão
  const requestDelete = (ids: string[]) => {
    setDeleteTargets(products.filter((p) => ids.includes(p.id)));
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const results = await Promise.all(
        deleteTargets.map(async (p) => {
          const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
          const data = await res.json().catch(() => ({}));
          return { product: p, ok: res.ok, data };
        })
      );

      const failed = results.filter((r) => !r.ok);
      const deletedIds = results.filter((r) => r.ok).map((r) => r.product.id);

      if (deletedIds.length > 0) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          deletedIds.forEach((id) => next.delete(id));
          return next;
        });
      }

      refetchProducts();

      if (failed.length === 0) {
        setDeleteTargets([]);
      } else {
        setDeleteError(
          failed.map((f) => `${f.product.name}: ${f.data?.error || "erro"}`).join("\n")
        );
      }
    } catch (error) {
      setDeleteError("Erro de conexão ao deletar.");
      console.error("Erro ao deletar produtos:", error);
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteTargets([]);
    setDeleteError(null);
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
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        image: product.image,
        categoryId: product.category.id,
        featured: product.featured,
        stockMode: product.stockMode || "SIMPLE",
        fileUrl: product.fileUrl || "",
        maxDownloads: (product.maxDownloads ?? 5).toString(),
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        image: "",
        categoryId: "",
        featured: false,
        stockMode: "SIMPLE",
        fileUrl: "",
        maxDownloads: "5",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const filteredProducts = useMemo(() => products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [products, searchTerm]);

  if (loading) {
    return (
      <PermissionGuard permission="products.manage">
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Carregando...</div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="products.manage">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Gerenciar Produtos</h1>
          <p className="mt-2 text-slate-400">
            {products.length} produtos cadastrados
          </p>
        </div>
        {activeTab === "produtos" && (
          <button
            onClick={() => openModal()}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="mr-2 h-5 w-5" />
            Novo Produto
          </button>
        )}
      </div>

      {/* Abas */}
      <div className="mb-6 flex gap-1 border-b border-slate-700">
        <button
          onClick={() => setActiveTab("produtos")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "produtos"
              ? "border-b-2 border-brand-600 text-brand-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Package className="h-4 w-4" />
          Produtos
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

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar produtos por nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ABA: PRODUTOS (listagem padrão) */}
      {activeTab === "produtos" && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Destaque
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-900">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <ImageWithFallback
                          src={product.image}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="rounded object-cover"
                        />
                        <div className="ml-4">
                          <p className="font-medium text-slate-100">{product.name}</p>
                          <p className="text-sm text-slate-400">{product.description.slice(0, 50)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{product.category.name}</td>
                    <td className="px-6 py-4 font-medium text-slate-100">
                      R$ {product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {product.stockMode === "SIMPLE" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          <InfinityIcon className="h-3 w-3" /> Ilimitado
                        </span>
                      )}
                      {product.stockMode === "CREDENTIALS" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                          <KeyRound className="h-3 w-3" /> {product.stock} cred.
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {product.featured ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Sim
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-900 px-2 py-1 text-xs font-medium text-slate-200">
                          Não
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openModal(product)}
                        className="mr-2 rounded p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {product.stockMode === "CREDENTIALS" && (
                        <Link
                          href={`/admin/produtos/${product.id}/credenciais`}
                          className="mr-2 rounded p-2 text-purple-600 hover:bg-purple-50"
                          title="Gerenciar Credenciais"
                        >
                          <Key className="h-5 w-5" />
                        </Link>
                      )}
                      <button
                        onClick={() => requestDelete([product.id])}
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
                  checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-700 text-red-600 focus:ring-red-500"
                />
                Selecionar todos
              </label>
              <span className="text-sm text-slate-400">
                {selectedIds.size} selecionado(s)
              </span>
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={() => requestDelete(Array.from(selectedIds))}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Deletar {selectedIds.size} produto(s)
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-slate-900">
                <tr>
                  <th className="w-12 px-6 py-3"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        selectedIds.has(product.id) ? "bg-red-50" : "hover:bg-slate-900"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="h-4 w-4 rounded border-slate-700 text-red-600 focus:ring-red-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <ImageWithFallback
                            src={product.image}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded object-cover"
                          />
                          <div className="ml-3">
                            <p className="font-medium text-slate-100">{product.name}</p>
                            <p className="text-xs text-slate-400">{product.description.slice(0, 40)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{product.category.name}</td>
                      <td className="px-6 py-4 font-medium text-slate-100">
                        R$ {product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {product.stockMode === "SIMPLE" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            <InfinityIcon className="h-3 w-3" /> Ilimitado
                          </span>
                        )}
                        {product.stockMode === "CREDENTIALS" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                            <KeyRound className="h-3 w-3" /> {product.stock} cred.
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => requestDelete([product.id])}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-slate-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-100">
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-400">
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {/* Nome + Categoria */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-400">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input mt-1"
                    placeholder="Nome do produto"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400">Categoria</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="input mt-1"
                  >
                    <option value="">Selecione...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-medium text-slate-400">Descrição</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="input mt-1 resize-none"
                  placeholder="Breve descrição do produto"
                />
              </div>

              {/* Preço + Destaque */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input mt-1"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400">Destaque</label>
                  <label className="mt-1 flex h-[46px] cursor-pointer items-center gap-2 rounded-xl border border-slate-700 px-4 hover:bg-slate-900">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-700 text-brand-400 focus:ring-brand-500"
                    />
                    <span className="text-sm text-slate-300">Mostrar na home</span>
                  </label>
                </div>
              </div>

              {/* URL da Imagem */}
              <div>
                <label className="block text-xs font-medium text-slate-400">URL da Imagem</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="input flex-1"
                    placeholder="https://..."
                  />
                  {formData.image && (
                    <ImageWithFallback
                      src={formData.image}
                      alt="Preview"
                      width={44}
                      height={44}
                      className="shrink-0 rounded-lg border border-slate-700 object-cover"
                    />
                  )}
                </div>
              </div>

              {/* TIPO DE PRODUTO DIGITAL */}
              <div>
                <label className="block text-xs font-medium text-slate-400">Tipo de Produto Digital</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, stockMode: "SIMPLE" })}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                      formData.stockMode === "SIMPLE"
                        ? "border-brand-500 bg-slate-900/60 ring-2 ring-brand-500/20"
                        : "border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <InfinityIcon className="h-5 w-5 text-brand-400" />
                    <span className="text-xs font-medium text-slate-100">Download Ilimitado</span>
                    <span className="text-[10px] text-slate-500">Arquivo único</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, stockMode: "CREDENTIALS" })}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                      formData.stockMode === "CREDENTIALS"
                        ? "border-brand-500 bg-slate-900/60 ring-2 ring-brand-500/20"
                        : "border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <KeyRound className="h-5 w-5 text-brand-400" />
                    <span className="text-xs font-medium text-slate-100">Credenciais</span>
                    <span className="text-[10px] text-slate-500">Uma por cliente</span>
                  </button>
                </div>
              </div>

              {/* CONFIGURAÇÕES POR TIPO */}
              {/* Download Ilimitado: URL do arquivo + limite de downloads */}
              {formData.stockMode === "SIMPLE" && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-400">URL do Arquivo</label>
                    <input
                      type="url"
                      value={formData.fileUrl}
                      onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                      placeholder="https://drive.google.com/..."
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400">Limite de Downloads</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxDownloads}
                      onChange={(e) => setFormData({ ...formData, maxDownloads: e.target.value })}
                      className="input mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Credenciais: link para gerenciar */}
              {formData.stockMode === "CREDENTIALS" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  {editingProduct ? (
                    <Link
                      href={`/admin/produtos/${editingProduct.id}/credenciais`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline"
                    >
                      <Key className="h-4 w-4" /> Gerenciar Credenciais →
                    </Link>
                  ) : (
                    <p className="text-sm text-amber-700">
                      Salve o produto para adicionar credenciais (senhas/logins individuais).
                    </p>
                  )}
                </div>
              )}

              {/* Botões */}
              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingProduct ? "Atualizar" : "Criar Produto"}
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
                  Excluir {deleteTargets.length > 1 ? `${deleteTargets.length} produtos` : "produto"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="mb-4 max-h-40 space-y-2 overflow-y-auto rounded-xl bg-slate-900 p-3">
              {deleteTargets.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <ImageWithFallback src={p.image} alt="" width={32} height={32} className="rounded object-cover" />
                  <span className="font-medium text-slate-100">{p.name}</span>
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
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}