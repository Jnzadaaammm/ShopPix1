"use client";

import { useState } from "react";
import { ShoppingCart, Check, Minus, Plus, Download, AlertCircle } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { toast } from "@/components/ui/Toaster";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
    stockMode?: string;
  };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem, items, updateQuantity } = useCart();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const inCart = items.find((i) => i.productId === product.id);
  const isCredentials = product.stockMode === "CREDENTIALS";
  const maxQuantity = isCredentials ? product.stock : 99;

  const handleAdd = () => {
    if (isCredentials && product.stock <= 0) {
      toast.error("Credenciais esgotadas");
      return;
    }
    if (inCart && inCart.quantity + quantity > maxQuantity) {
      toast.error(`Quantidade máxima disponível: ${maxQuantity}`);
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
    }
    setAdded(true);
    toast.success(`${quantity}x ${product.name} adicionado ao carrinho`);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isCredentials && product.stock <= 0) {
    return (
      <div className="space-y-3">
        <button disabled className="btn-primary w-full cursor-not-allowed opacity-50 sm:w-auto">
          <AlertCircle className="h-5 w-5" /> Esgotado
        </button>
        <p className="text-sm text-gray-500">
          As credenciais deste produto acabaram. Volte em breve!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seletor de quantidade */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Quantidade:</span>
        <div className="flex items-center rounded-lg border">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50"
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
            className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50"
            disabled={quantity >= maxQuantity}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {isCredentials && (
          <span className="text-sm text-gray-500">
            {product.stock} {product.stock === 1 ? "credencial" : "credenciais"} disponível{product.stock === 1 ? "" : "is"}
          </span>
        )}
      </div>

      {/* Botão de adicionar */}
      <button onClick={handleAdd} className="btn-primary w-full sm:w-auto">
        {added ? (
          <>
            <Check className="h-5 w-5" /> Adicionado!
          </>
        ) : (
          <>
            <Download className="h-5 w-5" /> Comprar Agora
          </>
        )}
      </button>

      {/* Aviso se já está no carrinho */}
      {inCart && (
        <p className="text-sm text-brand-600">
          ✓ {inCart.quantity} {inCart.quantity === 1 ? "unidade" : "unidades"} no carrinho
        </p>
      )}
    </div>
  );
}
