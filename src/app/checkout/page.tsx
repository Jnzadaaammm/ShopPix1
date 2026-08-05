"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/utils";
import ImageWithFallback from "@/components/ImageWithFallback";
import StripeCardForm from "@/components/StripeCardForm";
import PayPalPaymentForm from "@/components/PayPalPaymentForm";
import PixProofModal from "@/components/PixProofModal";
import { Loader2, Ticket, X, CreditCard, Copy, Check, QrCode } from "lucide-react";
import { toast } from "@/components/ui/Toaster";

interface Order {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentProof: string | null;
  pixQrCode: string | null;
  pixCopyPaste: string | null;
  stripeClientSecret: string | null;
  paypalOrderId: string | null;
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal" | "pix">("stripe");
  const [settings, setSettings] = useState<{ stripeEnabled: boolean; paypalEnabled: boolean; pixEnabled: boolean; pixKey: string } | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixKeyCopied, setPixKeyCopied] = useState(false);
  const [pixPasteCopied, setPixPasteCopied] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => setSettings(null));
  }, []);

  // Desconto do cargo do usuário
  const roleDiscount = (session?.user as any)?.role?.discount || 0;
  const roleDiscountAmount = roleDiscount > 0 ? (total * roleDiscount) / 100 : 0;
  const totalAfterRoleDiscount = Math.max(0, total - roleDiscountAmount);

  // Cupom aplica sobre o total já com desconto do cargo
  const finalTotal = appliedCoupon
    ? Math.max(0, totalAfterRoleDiscount - appliedCoupon.discount)
    : totalAfterRoleDiscount;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  useEffect(() => {
    if (items.length === 0 && !order) {
      router.push("/carrinho");
    }
  }, [items, order, router]);

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          paymentMethod,
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
        throw new Error(data.error || "Erro ao criar pedido");
      }

      const newOrder = await res.json();
      setOrder(newOrder);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), orderTotal: total }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({ code: data.code, discount: data.discount });
        toast.success(`Cupom aplicado! Desconto de ${formatCurrency(data.discount)}`);
      } else {
        toast.error(data.error || "Cupom inválido");
      }
    } catch {
      toast.error("Erro ao validar cupom");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (order) {
    if (order.paymentMethod === "pix") {
      return (
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">Pagamento via PIX</h1>
          <div className="card p-6">
            <div className="mb-6">
              <p className="text-sm text-gray-500">Valor a transferir</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(order.total)}</p>
            </div>

            {order.status === "AWAITING_APPROVAL" ? (
              <div className="rounded-lg bg-blue-50 p-4 text-blue-700">
                <p className="font-medium">Comprovante enviado!</p>
                <p className="text-sm">Seu pedido está aguardando aprovação.</p>
              </div>
            ) : (
              <>
                {order.pixQrCode ? (
                  <div className="mb-4 flex flex-col items-center">
                    <p className="text-sm text-gray-500">Escaneie o QR Code</p>
                    <img
                      src={order.pixQrCode}
                      alt="QR Code PIX"
                      className="mt-2 h-56 w-56 rounded-lg border"
                    />
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Chave PIX</p>
                    <div className="mt-1 flex items-center gap-2 rounded-lg border bg-gray-50 p-3">
                      <p className="flex-1 break-all font-mono text-sm text-gray-900">
                        {settings?.pixKey || "Chave PIX não configurada"}
                      </p>
                      {settings?.pixKey && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(settings.pixKey);
                            setPixKeyCopied(true);
                            setTimeout(() => setPixKeyCopied(false), 2000);
                          }}
                          className="rounded-lg bg-brand-100 p-2 text-brand-600 hover:bg-brand-200"
                          title="Copiar chave"
                        >
                          {pixKeyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-sm text-gray-500">Pix Copia e Cola</p>
                  <div className="mt-1 flex items-center gap-2 rounded-lg border bg-gray-50 p-3">
                    <p className="flex-1 break-all font-mono text-xs text-gray-900">
                      {order.pixCopyPaste || "---"}
                    </p>
                    {order.pixCopyPaste && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(order.pixCopyPaste!);
                          setPixPasteCopied(true);
                          setTimeout(() => setPixPasteCopied(false), 2000);
                        }}
                        className="rounded-lg bg-brand-100 p-2 text-brand-600 hover:bg-brand-200"
                        title="Copiar código"
                      >
                        {pixPasteCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Faça o pagamento e depois clique no botão abaixo para anexar o comprovante.
                </p>

                <button
                  onClick={() => setShowPixModal(true)}
                  disabled={!settings?.pixKey}
                  className="btn-primary mt-6 w-full disabled:opacity-50"
                >
                  Já paguei
                </button>

                {showPixModal && (
                  <PixProofModal
                    orderId={order.id}
                    onClose={() => setShowPixModal(false)}
                    onSubmitted={() => router.push("/pedidos")}
                  />
                )}
              </>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link href="/pedidos" className="text-sm text-brand-600 hover:underline">
              Ver meus pedidos
            </Link>
          </div>
        </div>
      );
    }

    if (order.paymentMethod === "paypal" && order.paypalOrderId) {
      return (
        <PayPalPaymentForm
          orderId={order.id}
          paypalOrderId={order.paypalOrderId}
          onPaymentSuccess={() => {
            setOrder({ ...order, status: "AWAITING_APPROVAL" });
            router.push("/pedidos");
          }}
          onPaymentError={(err) => setError(err)}
        />
      );
    }

    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Pagamento</h1>
        <StripeCardForm
          orderId={order.id}
          total={order.total}
          onPaymentSuccess={() => {
            setOrder({ ...order, status: "AWAITING_APPROVAL" });
            router.push("/pedidos");
          }}
          onPaymentError={(err) => setError(err)}
        />
        <div className="mt-6 text-center">
          <Link href="/pedidos" className="text-sm text-brand-600 hover:underline">
            Ver meus pedidos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900">Itens do Carrinho</h2>
            <div className="mt-4 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t pt-6">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Código do cupom"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <button
                    onClick={removeCoupon}
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-100 disabled:opacity-50"
                  >
                    {couponLoading ? "..." : "Aplicar"}
                  </button>
                )}
              </div>
              {appliedCoupon && (
                <p className="mt-2 text-sm text-green-600">
                  Cupom {appliedCoupon.code} aplicado: -{formatCurrency(appliedCoupon.discount)}
                </p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900">Forma de Pagamento</h2>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => setPaymentMethod("stripe")}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                  paymentMethod === "stripe"
                    ? "border-brand-600 bg-brand-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <CreditCard className="h-5 w-5 text-brand-600" />
                <div>
                  <p className="font-medium text-gray-900">Cartão de Crédito/Débito (Stripe)</p>
                  <p className="text-sm text-gray-500">Pagamento processado com segurança pelo Stripe.</p>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod("paypal")}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                  paymentMethod === "paypal"
                    ? "border-brand-600 bg-brand-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#003087">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.629h6.69c2.884 0 5.108.558 6.006 2.885.396 1.028.477 2.104.093 3.168-.53 1.473-1.617 2.504-3.067 2.98h.002c1.246.337 2.095.94 2.617 1.865.52.924.66 2.107.36 3.38-.328 1.38-1.002 2.48-1.995 3.26-1.19.94-2.78 1.383-4.578 1.383H9.84a.77.77 0 0 0-.757.63l-.003-.001-.002.006c-.002.004-.002.008-.002.012L7.076 21.337z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">PayPal ou Cartão (PayPal)</p>
                  <p className="text-sm text-gray-500">Pague com conta PayPal ou cartão via PayPal.</p>
                </div>
              </button>

              {(settings?.pixEnabled !== false) && (
                <button
                  onClick={() => setPaymentMethod("pix")}
                  className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                    paymentMethod === "pix"
                      ? "border-brand-600 bg-brand-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <QrCode className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">PIX Manual</p>
                    <p className="text-sm text-gray-500">Transfira via PIX e envie o comprovante.</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {session && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900">Conta</h2>
              <div className="mt-3 flex items-center gap-3">
                {session.user?.image && (
                  <ImageWithFallback src={session.user.image} alt="" width={40} height={40} className="rounded-full" />
                )}
                <div>
                  <p className="font-medium">{session.user?.name}</p>
                  <p className="text-sm text-gray-500">{session.user?.email}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn-primary mt-8 w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Processando...
              </>
            ) : (
              paymentMethod === "stripe"
                ? "Confirmar e Pagar via Cartão"
                : paymentMethod === "paypal"
                ? "Confirmar e Pagar via PayPal"
                : "Confirmar e Pagar via PIX"
            )}
          </button>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900">Resumo</h2>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {roleDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto do cargo ({roleDiscount}%)</span>
                  <span>-{formatCurrency(roleDiscountAmount)}</span>
                </div>
              )}
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Cupom {appliedCoupon.code}</span>
                  <span>-{formatCurrency(appliedCoupon.discount)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
