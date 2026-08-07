import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import { FeaturesSection, CtaSection } from "@/components/HomeSections";
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
      <FeaturesSection />

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
      <CtaSection />
    </>
  );
}
