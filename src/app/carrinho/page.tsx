"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, CreditCard } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toaster";
import ImageWithFallback from "@/components/ImageWithFallback";

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCart();

  const handleRemove = (productId: string, name: string) => {
    removeItem(productId);
    toast.success(`${name} removido do carrinho`);
  };

  const handleDecrease = (productId: string, quantity: number) => {
    if (quantity > 1) updateQuantity(productId, quantity - 1);
  };

  const handleIncrease = (productId: string, quantity: number) => {
    // Limite razoável: 99 unidades por item
    if (quantity >= 99) {
      toast.error("Quantidade máxima atingida");
      return;
    }
    updateQuantity(productId, quantity + 1);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Carrinho vazio</h1>
        <p className="mt-2 text-gray-500">Adicione produtos para continuar comprando.</p>
        <Link href="/produtos" className="btn-primary mt-8">
          Ver Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Carrinho</h1>
      <p className="mt-1 text-gray-500">{items.length} item(s) no carrinho</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="card flex gap-4 p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <ImageWithFallback
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/produtos/${item.productId}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-brand-600 transition-colors">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-brand-600 font-medium">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.productId, item.name)}
                    aria-label={`Remover ${item.name} do carrinho`}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDecrease(item.productId, item.quantity)}
                    aria-label="Diminuir quantidade"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 transition-transform hover:bg-gray-50 active:scale-90"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => handleIncrease(item.productId, item.quantity)}
                    aria-label="Aumentar quantidade"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 transition-transform hover:bg-gray-50 active:scale-90"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <span className="ml-auto font-semibold text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card h-fit p-6">
          <h2 className="text-lg font-bold text-gray-900">Resumo do Pedido</h2>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Frete</span>
              <span className="font-medium text-green-600">Grátis</span>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-brand-600">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Métodos de pagamento aceitos */}
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="mb-2 text-center text-xs font-medium text-gray-600">
              Formas de pagamento
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-xs text-gray-500" title="Cartão via Stripe">
                <CreditCard className="h-4 w-4" /> Cartão
              </div>
            </div>
          </div>

          <Link href="/checkout" className="btn-primary mt-6 w-full">
            Finalizar Compra <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
