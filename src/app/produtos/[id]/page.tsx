import Image from "next/image";
import Link from "next/link";
import { Download, Star, Shield, Zap, ChevronRight, Package, Lock } from "lucide-react";
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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100">
          <Lock className="h-8 w-8 text-brand-600" />
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

  // Produtos relacionados (mesma categoria)
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

  const inStock = true;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-slate-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-600">Início</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/produtos" className="hover:text-brand-600">Produtos</Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/produtos#categoria-${product.category.slug}`}
          className="hover:text-brand-600"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate font-medium text-slate-100">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Imagem */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-900">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1.5 text-sm font-medium text-white">
            <Download className="h-4 w-4" /> Produto Digital
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="inline-flex w-fit rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
            {product.category.name}
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-100">{product.name}</h1>

          {/* Rating */}
          {product.reviews.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-slate-400">
                {avgRating.toFixed(1)} ({product.reviews.length} avaliações)
              </span>
            </div>
          )}

          <p className="mt-4 text-slate-400 leading-relaxed">{product.description}</p>

          {/* Preço */}
          <div className="mt-6">
            <span className="text-4xl font-bold text-brand-600">
              {formatCurrency(product.price)}
            </span>
            <p className="mt-1 text-sm text-slate-400">
              {product.stockMode === "CREDENTIALS"
                ? "Disponível para entrega imediata após o pagamento"
                : "Disponível para download imediato após o pagamento"}
            </p>
          </div>

          {/* Features */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-900 p-3">
              <Zap className="h-5 w-5 text-green-600" />
              <span className="text-xs font-medium text-slate-300">PIX Instantâneo</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900 p-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium text-slate-300">Compra Segura</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900 p-3">
              <Download className="h-5 w-5 text-purple-600" />
              <span className="text-xs font-medium text-slate-300">Entrega Digital</span>
            </div>
          </div>

          {/* CTAs — AddToCart + Wishlist + Share */}
          <div className="mt-8 flex items-center gap-3">
            <AddToCartButton product={product} />
            <ProductDetailActions productId={product.id} />
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16">
        <ProductReviews productId={product.id} />
      </div>

      {/* Produtos Relacionados */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 border-b border-slate-700 pb-4">
            <h2 className="text-2xl font-bold text-slate-100">Produtos Relacionados</h2>
            <p className="mt-1 text-sm text-slate-400">
              Outros produtos de {product.category.name}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => {
              const reviews = p.reviews || [];
              const rating = reviews.length > 0
                ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                : 0;
              return (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  image={p.image}
                  category={p.category}
                  stockMode={p.stockMode}
                  rating={rating}
                  reviewCount={reviews.length}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
