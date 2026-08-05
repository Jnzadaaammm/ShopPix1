import Link from "next/link";
import { ArrowRight, Zap, CreditCard, Download, Shield } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import { prisma } from "@/lib/db";
import { calculateRating } from "@/lib/rating";

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
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Zap className="h-6 w-6" />,
              title: "Pagamento com Cartão",
              desc: "Pague em segundos com cartão via Stripe e receba confirmação imediata.",
              from: "from-yellow-500",
              to: "to-yellow-700",
            },
            {
              icon: <CreditCard className="h-6 w-6" />,
              title: "Cartão via Stripe",
              desc: "Pague com cartão (Visa, Master, Elo) via Stripe com segurança.",
              from: "from-blue-500",
              to: "to-blue-700",
            },
            {
              icon: <Download className="h-6 w-6" />,
              title: "Entrega Imediata",
              desc: "Produtos digitais disponíveis logo após o pagamento.",
              from: "from-purple-500",
              to: "to-purple-700",
            },
            {
              icon: <Shield className="h-6 w-6" />,
              title: "Compra Segura",
              desc: "Login via Google ou Discord. Dados protegidos.",
              from: "from-emerald-500",
              to: "to-emerald-700",
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className={`group animate-fade-in-up rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900 hover:shadow-2xl hover:shadow-brand-900/20`}
              style={{ animationDelay: `${i * 100}ms`, opacity: 0 }}
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${f.from} ${f.to} text-white shadow-lg transition-transform group-hover:scale-110`}
              >
                {f.icon}
              </div>
              <h3 className="mt-4 font-semibold text-slate-100">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Produtos em Destaque */}
      <section className="bg-slate-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between border-b border-slate-800 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-100">Produtos em Destaque</h2>
              <p className="mt-1 text-slate-400">Os mais populares da nossa loja</p>
            </div>
            <Link href="/produtos" className="btn-outline hidden sm:inline-flex">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {productsWithRating.map((product, i) => (
              <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms`, opacity: 0 }}>
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.image}
                  category={product.category}
                  stockMode={product.stockMode}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                />
              </div>
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
        <section key={cat.id} className={`py-20 ${idx % 2 === 0 ? "bg-slate-900" : "bg-slate-950"}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-100">{cat.name}</h2>
                {cat.description && <p className="mt-1 text-sm text-slate-400">{cat.description}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  {cat._count.products} {cat._count.products === 1 ? "produto" : "produtos"}
                </p>
              </div>
              <Link
                href={`/produtos#categoria-${cat.slug}`}
                className="btn-outline hidden sm:inline-flex"
              >
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {cat.products.map((product: any, i: number) => (
                <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms`, opacity: 0 }}>
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image}
                    category={product.category}
                    stockMode={product.stockMode}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 text-center sm:hidden">
              <Link
                href={`/produtos#categoria-${cat.slug}`}
                className="btn-outline"
              >
                Ver todos de {cat.name}
              </Link>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="relative overflow-hidden bg-slate-900 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(124,58,237,0.08)_1px,transparent_0)] bg-[length:32px_32px]" />
        <div className="absolute -right-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-brand-600/15 blur-[100px]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Pronto para começar?</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Explore nosso catálogo de produtos digitais e receba seus arquivos imediatamente após o pagamento.
          </p>
          <Link href="/produtos" className="btn-primary mt-8 px-8 py-4 text-base">
            Ver Produtos <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
