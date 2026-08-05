"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, CreditCard, QrCode } from "lucide-react";
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
        <h1 className="mt-6 text-2xl font-bold text-slate-100">Carrinho vazio</h1>
        <p className="mt-2 text-slate-400">Adicione produtos para continuar comprando.</p>
        <Link href="/produtos" className="btn-primary mt-8">
          Ver Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-100">Carrinho</h1>
      <p className="mt-1 text-slate-400">{items.length} item(s) no carrinho</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="card flex gap-4 p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-900">
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
                      <h3 className="font-semibold text-slate-100 hover:text-brand-400 transition-colors">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-brand-400 font-medium">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.productId, item.name)}
                    aria-label={`Remover ${item.name} do carrinho`}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDecrease(item.productId, item.quantity)}
                    aria-label="Diminuir quantidade"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 transition-transform hover:bg-slate-900 active:scale-90"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => handleIncrease(item.productId, item.quantity)}
                    aria-label="Aumentar quantidade"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 transition-transform hover:bg-slate-900 active:scale-90"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <span className="ml-auto font-semibold text-slate-100">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card h-fit p-6">
          <h2 className="text-lg font-bold text-slate-100">Resumo do Pedido</h2>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-medium">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Frete</span>
              <span className="font-medium text-green-600">Grátis</span>
            </div>
            <div className="border-t border-slate-800 pt-3">
              <div className="flex justify-between">
                <span className="font-bold text-slate-100">Total</span>
                <span className="text-xl font-bold text-brand-400">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Métodos de pagamento aceitos */}
          <div className="mt-4 rounded-lg bg-slate-900 p-3">
            <p className="mb-2 text-center text-xs font-medium text-slate-400">
              Formas de pagamento
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-xs text-slate-400" title="Cartão via Stripe">
                <CreditCard className="h-4 w-4" /> Cartão
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1 text-xs text-slate-400" title="PayPal ou cartão via PayPal">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="#003087">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.629h6.69c2.884 0 5.108.558 6.006 2.885.396 1.028.477 2.104.093 3.168-.53 1.473-1.617 2.504-3.067 2.98h.002c1.246.337 2.095.94 2.617 1.865.52.924.66 2.107.36 3.38-.328 1.38-1.002 2.48-1.995 3.26-1.19.94-2.78 1.383-4.578 1.383H9.84a.77.77 0 0 0-.757.63l-.003-.001-.002.006c-.002.004-.002.008-.002.012L7.076 21.337z" />
                </svg>
                PayPal
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1 text-xs text-slate-400" title="PIX manual">
                <QrCode className="h-3 w-3" /> PIX
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
