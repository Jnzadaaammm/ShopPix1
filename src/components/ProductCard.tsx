"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingCart, Heart, Download, Star, KeyRound } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toaster";
import ImageWithFallback from "@/components/ImageWithFallback";

import { memo } from "react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: { name: string } | string;
  stockMode?: string;
  rating?: number;
  reviewCount?: number;
}

function ProductCard({
  id,
  name,
  price,
  image,
  category,
  stockMode,
  rating,
  reviewCount,
}: ProductCardProps) {
  const categoryName = typeof category === "string" ? category : category.name;
  const { addItem } = useCart();
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    fetch(`/api/wishlist?check=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.wishlisted) setWishlisted(true);
      })
      .catch(() => {});
  }, [id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasWishlisted = wishlisted;
    setWishlisted(!wasWishlisted);
    toast.success(wasWishlisted ? "Removido dos favoritos" : "Adicionado aos favoritos");
    try {
      const res = await fetch("/api/wishlist", {
        method: wasWishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      if (!res.ok) {
        setWishlisted(wasWishlisted);
        if (res.status === 401) {
          toast.error("Faça login para favoritar");
        } else {
          toast.error("Erro ao atualizar favoritos");
        }
      }
    } catch {
      setWishlisted(wasWishlisted);
      toast.error("Erro ao atualizar favoritos");
    }
  };

  const handleAddCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ productId: id, name, price, image });
    toast.success(`${name} adicionado ao carrinho`);
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-slate-700 hover:bg-slate-900 hover:shadow-2xl hover:shadow-brand-900/20">
      <Link href={`/produtos/${id}`}>
        <div className="relative aspect-square overflow-hidden bg-slate-950">
          <ImageWithFallback
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <span className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-md">
              {categoryName}
            </span>
            <span className="flex w-fit items-center gap-1 rounded-full border border-white/10 bg-brand-600/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
              {stockMode === "CREDENTIALS" ? (
                <><KeyRound className="h-3 w-3" /> Credencial</>
              ) : (
                <><Download className="h-3 w-3" /> Digital</>
              )}
            </span>
          </div>

          <button
            onClick={toggleWishlist}
            aria-label={wishlisted ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-90 ${
              wishlisted
                ? "border-red-500/50 bg-red-500 text-white"
                : "border-slate-700 bg-slate-950/80 text-slate-300 hover:text-red-400 hover:border-red-500/30"
            }`}
            title="Favoritar"
          >
            <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
          </button>
        </div>
      </Link>
      <div className="p-5">
        <Link href={`/produtos/${id}`}>
          <h3 className="font-semibold text-slate-100 line-clamp-2 transition-colors hover:text-brand-400">
            {name}
          </h3>
        </Link>
        {rating !== undefined && rating > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= Math.round(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">({reviewCount || 0})</span>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-brand-400">
            {formatCurrency(price)}
          </span>
          <button
            onClick={handleAddCart}
            aria-label={`Adicionar ${name} ao carrinho`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white transition-all hover:bg-brand-500 hover:scale-110 active:scale-90"
            title="Adicionar ao carrinho"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ProductCard);
