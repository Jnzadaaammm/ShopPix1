import Link from "next/link";
import { ArrowRight, Zap, Shield, CreditCard, Download } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import { prisma } from "@/lib/db";
import { calculateRating } from "@/lib/rating";

// Sempre buscar dados em tempo real, sem cache
export const revalidate = 0;

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true },
      take: 4,
      include: {
        category: true,
        reviews: { select: { rating: true } },
      },
    }),
    prisma.category.findMany({
      include: {
        products: {
          where: { featured: true },
          take: 4,
          orderBy: { createdAt: "desc" },
          include: {
            category: true,
            reviews: { select: { rating: true } },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const productsWithRating = featuredProducts.map((p) => ({
    ...p,
    ...calculateRating(p.reviews),
  }));

  const categoriesWithProducts = (categories as any[])
    .filter((c) => c.products.length > 0)
    .map((c) => ({
      ...c,
      products: c.products.map((p: any) => ({
        ...p,
        ...calculateRating(p.reviews),
      })),
    }));

  return (
    <>
      <HeroSection />

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card group flex items-start gap-4 p-6 hover:-translate-y-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/30 transition-transform group-hover:scale-110">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Pagamento com Cartão</h3>
              <p className="mt-1 text-sm text-gray-500">Pague em segundos com cartão via Stripe e receba confirmação imediata.</p>
            </div>
          </div>
          <div className="card group flex items-start gap-4 p-6 hover:-translate-y-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Cartão via Stripe</h3>
              <p className="mt-1 text-sm text-gray-500">Pague com cartão (Visa, Master, Elo) via Stripe com segurança.</p>
            </div>
          </div>
          <div className="card group flex items-start gap-4 p-6 hover:-translate-y-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg shadow-purple-500/30 transition-transform group-hover:scale-110">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Entrega Imediata</h3>
              <p className="mt-1 text-sm text-gray-500">Produtos digitais disponíveis logo após o pagamento.</p>
            </div>
          </div>
          <div className="card group flex items-start gap-4 p-6 hover:-translate-y-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30 transition-transform group-hover:scale-110">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Compra Segura</h3>
              <p className="mt-1 text-sm text-gray-500">Login via Google ou Discord. Dados protegidos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Produtos em Destaque */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between border-b-2 border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1.5 rounded-full bg-gradient-to-b from-brand-400 to-brand-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Produtos em Destaque</h2>
                <p className="mt-1 text-gray-500">Os mais populares da nossa loja</p>
              </div>
            </div>
            <Link href="/produtos" className="btn-outline hidden sm:inline-flex">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {productsWithRating.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.image}
                category={product.category}
                stockMode={product.stockMode}
                rating={product.rating}
                reviewCount={product.reviewCount}
              />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/produtos" className="btn-outline">
              Ver todos os produtos
            </Link>
          </div>
        </div>
      </section>

      {/* Seções por Categoria */}
      {categoriesWithProducts.map((cat, idx) => (
        <section key={cat.id} className={`py-16 ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between border-b-2 border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-1.5 rounded-full bg-gradient-to-b from-brand-400 to-brand-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{cat.name}</h2>
                  {cat.description && (
                    <p className="mt-1 text-sm text-gray-500">{cat.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {cat._count.products} {cat._count.products === 1 ? "produto" : "produtos"}
                  </p>
                </div>
              </div>
              <Link
                href={`/produtos#categoria-${cat.slug}`}
                className="hidden items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-brand-600 transition-all hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
              >
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {cat.products.map((product: any) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.image}
                  category={product.category}
                  stockMode={product.stockMode}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                />
              ))}
            </div>
            <div className="mt-6 text-center sm:hidden">
              <Link
                href={`/produtos#categoria-${cat.slug}`}
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Ver todos de {cat.name}
              </Link>
            </div>
          </div>
        </section>
      ))}


      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 py-20 animate-gradient">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggIGQ9Ik0zNiAzNGg2djZoLTZ6TTAgMzRoNnY2SDB6TTAgMGg2djZIMHptMzYgMGg2djZoLTZ6TTAgMzRoNnY2SDB6TTM2IDM0aDZ2NmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-brand-400/20 blur-3xl animate-float" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Pronto para começar?</h2>
          <p className="mt-3 text-brand-100">
            Explore nosso catálogo de produtos digitais e receba seus arquivos imediatamente após o pagamento.
          </p>
          <Link
            href="/produtos"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-brand-600 shadow-xl shadow-brand-900/20 transition-all hover:bg-brand-50 hover:shadow-2xl active:scale-[0.98]"
          >
            Ver Produtos <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
