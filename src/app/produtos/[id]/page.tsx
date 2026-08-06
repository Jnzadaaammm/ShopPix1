import Image from "next/image";
import Link from "next/link";
import { Download, Star, Shield, Zap, ChevronRight, Package, Lock, Check, HelpCircle, ShoppingCart } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { auth } from "@/lib/auth";
import AddToCartButton from "@/components/AddToCartButton";
import ProductReviews from "@/components/ProductReviews";
import ProductCard from "@/components/ProductCard";
import ProductDetailActions from "@/components/ProductDetailActions";
import { notFound } from "next/navigation";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true, description: true, image: true, price: true, category: { select: { name: true } } },
  });

  if (!product) {
    return { title: "Produto não encontrado" };
  }

  const title = `${product.name} - ${formatCurrency(product.price)}`;
  const description = product.description.slice(0, 160);

  return {
    title: product.name,
    description,
    alternates: { canonical: `${baseUrl}/produtos/${id}` },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      title,
      description,
      url: `${baseUrl}/produtos/${id}`,
      siteName: "ShopPix",
      images: [{ url: product.image, width: 500, height: 500, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image],
    },
    keywords: [product.name, product.category?.name, "produto digital", "comprar", "download"],
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
          <Lock className="h-8 w-8 text-brand-400" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-100">Conta necessária</h1>
        <p className="mt-2 text-slate-400">
          Você precisa estar logado para ver os detalhes dos produtos.
        </p>
        <Link href="/login" className="btn-primary mt-8">
          Entrar / Criar Conta
        </Link>
      </div>
    );
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      reviews: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) notFound();

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 4,
    include: {
      category: true,
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

  const steps = [
    { icon: ShoppingCart, title: "Pague o pagamento", desc: "Escolha PIX, cartão ou PayPal." },
    { icon: Package, title: "Receba imediatamente", desc: "Após a confirmação, o produto fica disponível." },
    { icon: Download, title: "Ative o produto", desc: "Siga as instruções enviadas por email e no painel." },
    { icon: Shield, title: "Suporte incluso", desc: "Abra um ticket se tiver qualquer dúvida." },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-1 text-sm text-slate-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-400 transition-colors">Início</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/produtos" className="hover:text-brand-400 transition-colors">Produtos</Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/produtos#categoria-${product.category.slug}`}
          className="hover:text-brand-400 transition-colors"
        >
          {product.category.name}
        </Link>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Imagem */}
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-brand-400 backdrop-blur">
            <Download className="h-3.5 w-3.5" /> Produto Digital
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="inline-flex w-fit rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-sm font-medium text-brand-400">
            {product.category.name}
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-100">{product.name}</h1>

          {product.reviews.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-slate-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-slate-400">
                {avgRating.toFixed(1)} ({product.reviews.length} avaliações)
              </span>
            </div>
          )}

          <div className="mt-6">
            <span className="text-4xl font-bold text-brand-400">{formatCurrency(product.price)}</span>
            <p className="mt-2 text-sm text-slate-400">
              {product.stockMode === "CREDENTIALS"
                ? "Disponível para entrega imediata após o pagamento"
                : "Disponível para download imediato após o pagamento"}
            </p>
          </div>

          <p className="mt-6 text-slate-400 leading-relaxed">{product.description}</p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-900/30 text-green-400">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-300">PIX Instantâneo</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-900/30 text-blue-400">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-300">Compra Segura</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-900/30 text-purple-400">
                <Download className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-300">Entrega Digital</span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <AddToCartButton product={product} />
            <ProductDetailActions productId={product.id} />
          </div>
        </div>
      </div>

      {/* Como Funciona */}
      <section className="mt-16 rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-10">
        <h2 className="text-2xl font-bold text-slate-100">Como Funciona</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-brand-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">{i + 1}. {step.title}</p>
                  <p className="text-sm text-slate-400">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Reviews */}
      <div className="mt-16">
        <ProductReviews productId={product.id} />
      </div>

      {/* Produtos Relacionados */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Produtos Relacionados</h2>
              <p className="mt-1 text-sm text-slate-400">Outros produtos de {product.category.name}</p>
            </div>
            <Link href="/produtos" className="text-sm font-medium text-brand-400 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => {
              const reviews = p.reviews || [];
              const rating = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;
              return <ProductCard key={p.id} product={{ ...p, rating }} />;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
