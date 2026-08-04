"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Zap, Shield, Download, Sparkles } from "lucide-react";

export default function HeroSection() {
  const { data: session } = useSession();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 animate-gradient">
      {/* Padrão de pontos de fundo */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggIGQ9Ik0zNiAzNGg2djZoLTZ6TTAgMzRoNnY2SDB6TTAgMGg2djZIMHptMzYgMGg2djZoLTZ6TTAgMzRoNnY2SDB6TTM2IDM0aDZ2NmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

      {/* Blobs decorativos flutuantes */}
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl animate-float" />
      <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-brand-300/10 blur-3xl" style={{ animationDelay: "2s" }} />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="max-w-2xl">
          {/* Badge animado */}
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md ring-1 ring-white/20 animate-fade-in-up">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            Pagamento instantâneo: Cartão via Stripe
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
            Compre online com{" "}
            <span className="bg-gradient-to-r from-brand-200 to-yellow-200 bg-clip-text text-transparent">
              facilidade
            </span>
          </h1>
          <p className="mt-6 text-lg text-brand-100 animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            Produtos selecionados com os melhores preços. Pague com cartão via Stripe e receba seus produtos digitais imediatamente.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-brand-700 shadow-xl shadow-brand-900/20 transition-all hover:bg-brand-50 hover:shadow-2xl active:scale-[0.98]"
            >
              Ver Produtos <ArrowRight className="h-4 w-4" />
            </Link>
            {!session ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3.5 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 active:scale-[0.98]"
              >
                Criar Conta
              </Link>
            ) : (
              <Link
                href="/pedidos"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3.5 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 active:scale-[0.98]"
              >
                Meus Pedidos
              </Link>
            )}
          </div>

          {/* Mini stats */}
          <div className="mt-12 flex flex-wrap gap-8 animate-fade-in-up" style={{ animationDelay: "0.4s", opacity: 0 }}>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-300" />
              <span className="text-sm text-brand-100">Entrega imediata</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-300" />
              <span className="text-sm text-brand-100">Compra 100% segura</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-purple-300" />
              <span className="text-sm text-brand-100">Download instantâneo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Onda decorativa na parte inferior */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" className="h-12 w-full sm:h-20" preserveAspectRatio="none">
          <path d="M0,40 C320,80 640,0 960,40 C1280,80 1440,40 1440,40 L1440,80 L0,80 Z" fill="rgb(249, 250, 251)" />
        </svg>
      </div>
    </section>
  );
}
