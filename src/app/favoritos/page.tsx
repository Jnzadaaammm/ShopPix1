"use client";

import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { toast } from "@/components/ui/Toaster";
import { usePolling } from "@/lib/use-polling";
import ImageWithFallback from "@/components/ImageWithFallback";

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    stockMode: string;
    category: { name: string };
  };
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addItem } = useCart();

  const fetchWishlist = useCallback(async () => {
    const res = await fetch("/api/wishlist");
    return (await res.json()) as WishlistItem[];
  }, []);

  const { data, loading, refetch } = usePolling<WishlistItem[]>(fetchWishlist, {
    enabled: status === "authenticated",
  });

  const items = data || [];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/favoritos");
    }
  }, [status, router]);

  const handleRemove = async (productId: string) => {
    toast.success("Removido dos favoritos");
    try {
      const res = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        toast.error("Erro ao remover");
      }
      refetch();
    } catch {
      toast.error("Erro ao remover");
      refetch();
    }
  };

  const handleAddCart = (item: WishlistItem) => {
    addItem({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image,
    });
    toast.success("Adicionado ao carrinho");
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <Heart className="h-8 w-8 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Meus Favoritos</h1>
          <p className="mt-1 text-slate-400">{items.length} itens salvos</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border bg-slate-950 py-20 text-center">
          <Heart className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-slate-400">Você ainda não tem favoritos.</p>
          <Link href="/produtos" className="mt-4 inline-block text-brand-600 hover:underline">
            Explorar produtos →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl border bg-slate-950 p-4 shadow-sm transition-all hover:shadow-md"
            >
              <Link href={`/produtos/${item.product.id}`} className="flex-shrink-0">
                <ImageWithFallback
                  src={item.product.image}
                  alt={item.product.name}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/produtos/${item.product.id}`}>
                  <h3 className="font-semibold text-slate-100 truncate hover:text-brand-600">
                    {item.product.name}
                  </h3>
                </Link>
                <p className="text-sm text-slate-400">{item.product.category.name}</p>
                <p className="mt-1 text-lg font-bold text-brand-600">
                  {formatCurrency(item.product.price)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddCart(item)}
                  className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="hidden sm:inline">Carrinho</span>
                </button>
                <button
                  onClick={() => handleRemove(item.product.id)}
                  className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
                  title="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
