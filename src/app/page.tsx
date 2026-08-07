import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import { FeaturesSection, CtaSection } from "@/components/HomeSections";
import { prisma } from "@/lib/db";
import { calculateRating } from "@/lib/rating";

export const revalidate = 0;

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { featured: true },
    take: 4,
    include: {
      category: true,
      reviews: { select: { rating: true } },
    },
  });

  const productsWithRating = featuredProducts.map((p) => ({
    ...p,
    ...calculateRating(p.reviews),
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

      {/* CTA */}
      <CtaSection />
    </>
  );
}
