"use client";

import { useState, useEffect } from "react";
import { Heart, Share2, Check } from "lucide-react";
import { toast } from "@/components/ui/Toaster";

export default function ProductDetailActions({ productId }: { productId: string }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Verificar se já está na wishlist
  useEffect(() => {
    fetch(`/api/wishlist?check=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.wishlisted) setWishlisted(true);
      })
      .catch(() => {});
  }, [productId]);

  const toggleWishlist = async () => {
    const wasWishlisted = wishlisted;
    setWishlisted(!wasWishlisted);
    toast.success(wasWishlisted ? "Removido dos favoritos" : "Adicionado aos favoritos");
    try {
      const res = await fetch("/api/wishlist", {
        method: wasWishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url,
        });
      } catch {
        // Usuário cancelou — ignorar
      }
    } else {
      // Fallback: copiar link
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copiado para a área de transferência");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Erro ao copiar link");
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleWishlist}
        aria-label={wishlisted ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all active:scale-90 ${
          wishlisted
            ? "border-red-500 bg-red-50 text-red-500"
            : "border-slate-700 bg-slate-950 text-slate-400 hover:border-red-300 hover:text-red-500"
        }`}
        title={wishlisted ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Heart className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`} />
      </button>

      <button
        onClick={handleShare}
        aria-label="Compartilhar produto"
        className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-700 bg-slate-950 text-slate-400 transition-all hover:border-brand-300 hover:text-brand-400 active:scale-90"
        title="Compartilhar"
      >
        {copied ? <Check className="h-5 w-5 text-green-600" /> : <Share2 className="h-5 w-5" />}
      </button>
    </div>
  );
}
