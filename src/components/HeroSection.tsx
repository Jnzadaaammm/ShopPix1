"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Zap, Shield, Download, Sparkles } from "lucide-react";

export default function HeroSection() {
  const { data: session } = useSession();

  return (
    <section className="relative overflow-hidden bg-slate-950">
      {/* Grade de pontos sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(124,58,237,0.12)_1px,transparent_0)] bg-[length:32px_32px]" />

      {/* Blobs decorativos */}
      <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="max-w-3xl text-center lg:text-left">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300 backdrop-blur-md animate-fade-in-up">
            <Sparkles className="h-3.5 w-3.5" />
            Entrega Instantânea
          </span>

          <h1
            className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl animate-fade-in-up"
            style={{ animationDelay: "0.1s", opacity: 0 }}
          >
            Produtos Digitais <br className="hidden sm:block" />
            <span className="text-brand-500">Licenças</span> sem Enrolação
          </h1>
          <p
            className="mt-6 text-lg text-slate-400 animate-fade-in-up"
            style={{ animationDelay: "0.2s", opacity: 0 }}
          >
            Licenças, softwares, games e assinaturas com entrega na hora.
            <br className="hidden sm:block" />
            <span className="text-slate-200 font-medium">Pagou? Recebeu.</span>
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start animate-fade-in-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-500 hover:shadow-xl active:scale-[0.98]"
            >
              Ver Catálogo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 font-semibold text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800 active:scale-[0.98]"
            >
              Saber Mais
            </Link>
          </div>

          {/* Mini badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 lg:justify-start animate-fade-in-up" style={{ animationDelay: "0.4s", opacity: 0 }}>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Zap className="h-4 w-4 text-brand-400" />
              Entrega na Hora
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Shield className="h-4 w-4 text-brand-400" />
              Compra Segura
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Download className="h-4 w-4 text-brand-400" />
              Suporte Real
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
