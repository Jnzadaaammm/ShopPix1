"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, Download, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { usePolling } from "@/lib/use-polling";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stockMode: string;
  category: { id: string; name: string; slug: string };
  reviews: { rating: number }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

type SortOption = "newest" | "price_low" | "price_high" | "rating";

export default function ProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/produtos");
    }
  }, [status, router]);

  const fetcher = useCallback(async () => {
    const [p, c] = await Promise.all([
      fetch("/api/products?limit=100").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    return {
      products: (p.products || p) as Product[],
      categories: c as Category[],
    };
  }, []);

  const { data, loading } = usePolling(fetcher, {
    enabled: status === "authenticated",
  });

  const products = data?.products || [];
  const categories = data?.categories || [];

  // Atualizar range de preço quando os produtos carregarem
  useEffect(() => {
    if (data && data.products.length > 0) {
      const max = Math.ceil(Math.max(...data.products.map((prod: Product) => prod.price)));
      setPriceRange([0, max || 1000]);
    }
  }, [data]);

  // Filtra e ordena produtos
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.name.toLowerCase().includes(q)
      );
    }

    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case "price_low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => {
          const aReviews = a.reviews || [];
          const bReviews = b.reviews || [];
          const aR = aReviews.length > 0 ? aReviews.reduce((s, r) => s + r.rating, 0) / aReviews.length : 0;
          const bR = bReviews.length > 0 ? bReviews.reduce((s, r) => s + r.rating, 0) / bReviews.length : 0;
          return bR - aR;
        });
        break;
      default:
        break;
    }

    return result;
  }, [products, search, sortBy, priceRange]);

  // Agrupa produtos por categoria
  const productsByCategory = useMemo(() => {
    const groups: Record<string, { category: Category; products: Product[] }> = {};
    for (const cat of categories) {
      const catProducts = filteredProducts.filter((p) => p.category.id === cat.id);
      if (catProducts.length > 0) {
        groups[cat.id] = { category: cat, products: catProducts };
      }
    }
    // Produtos sem categoria (não deveria acontecer, mas por segurança)
    const uncategorized = filteredProducts.filter(
      (p) => !categories.some((c) => c.id === p.category.id)
    );
    if (uncategorized.length > 0) {
      groups["uncategorized"] = {
        category: { id: "uncategorized", name: "Outros", slug: "outros" },
        products: uncategorized,
      };
    }
    return groups;
  }, [filteredProducts, categories]);

  const categoryGroups = Object.values(productsByCategory);

  const clearFilters = () => {
    setSearch("");
    setSortBy("newest");
    if (products.length > 0) {
      setPriceRange([0, Math.ceil(Math.max(...products.map((p) => p.price)))]);
    }
  };

  const hasActiveFilters =
    search || sortBy !== "newest";

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const el = sectionRefs.current[categoryId];
    if (el) {
      const headerOffset = 140;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  // Tela de login necessário
  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100">
          <Lock className="h-8 w-8 text-brand-600" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-100">Conta necessária</h1>
        <p className="mt-2 text-slate-400">
          Você precisa estar logado para ver os produtos disponíveis.
        </p>
        <Link href="/login?callbackUrl=/produtos" className="btn-primary mt-8">
          Entrar / Criar Conta
        </Link>
      </div>
    );
  }

  if (loading || status === "loading") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 w-64 animate-pulse rounded bg-slate-800" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-slate-800" />
        </div>
        <ProductGridSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Todos os Produtos</h1>
        <p className="mt-2 text-slate-400">
          {filteredProducts.length} {filteredProducts.length === 1 ? "produto" : "produtos"} em {categoryGroups.length} {categoryGroups.length === 1 ? "categoria" : "categorias"}
        </p>
      </div>

      {/* Barra de busca + ordenação */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-700 pl-10 pr-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="newest">Mais Recentes</option>
            <option value="price_low">Menor Preço</option>
            <option value="price_high">Maior Preço</option>
            <option value="rating">Melhor Avaliados</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              showFilters ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-700 text-slate-400 hover:bg-slate-900"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filtros
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="mb-6 rounded-xl border bg-slate-950 p-5 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-1">
            {/* Preço */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-100">
                Preço: R$ {priceRange[0]} - R$ {priceRange[1]}
              </h3>
              <div className="space-y-2">
                <input
                  type="range"
                  min={0}
                  max={Math.ceil(Math.max(...products.map((p) => p.price), 1000))}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-brand-600"
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
            >
              <X className="h-4 w-4" /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Chips de filtros ativos */}
      {!showFilters && hasActiveFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-slate-300">
            Limpar tudo
          </button>
        </div>
      )}

      {/* Navegação por categorias (sticky) */}
      {categoryGroups.length > 0 && (
        <div className="sticky top-[72px] z-30 mb-8 -mx-4 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur-lg sm:mx-0 sm:rounded-xl sm:border sm:px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setActiveCategory("all");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-brand-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              Todas
            </button>
            {categoryGroups.map((group) => (
              <button
                key={group.category.id}
                onClick={() => scrollToCategory(group.category.id)}
                className={`flex items-center gap-1 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === group.category.id
                    ? "bg-brand-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {group.category.name}
                <span className={`text-xs ${activeCategory === group.category.id ? "text-brand-100" : "text-slate-500"}`}>
                  ({group.products.length})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seções por categoria */}
      {categoryGroups.length === 0 ? (
        <div className="rounded-xl border bg-slate-950 py-20 text-center">
          <p className="text-slate-400">Nenhum produto encontrado com esses filtros.</p>
          <button onClick={clearFilters} className="mt-3 text-sm text-brand-600 hover:underline">
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {categoryGroups.map((group) => (
            <section
              key={group.category.id}
              ref={(el: HTMLDivElement | null) => { sectionRefs.current[group.category.id] = el; }}
              id={`categoria-${group.category.slug}`}
              className="scroll-mt-32"
            >
              {/* Header da categoria */}
              <div className="mb-6 flex items-end justify-between border-b border-slate-700 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-100">{group.category.name}</h2>
                  {group.category.description && (
                    <p className="mt-1 text-sm text-slate-400">{group.category.description}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {group.products.length} {group.products.length === 1 ? "produto" : "produtos"}
                  </p>
                </div>
              </div>

              {/* Grid de produtos da categoria */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.products.map((product) => {
                  const reviews = product.reviews || [];
                  const rating = reviews.length > 0
                    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                    : 0;
                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.image}
                      category={product.category}
                      stockMode={product.stockMode}
                      rating={rating}
                      reviewCount={reviews.length}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
