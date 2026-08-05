"use client";

import Link from "next/link";
import { ArrowRight, Zap, Shield, Headphones, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-slate-950 pt-24">
      {/* Efeitos de fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(124,58,237,0.08)_1px,transparent_0)] bg-[length:40px_40px]" />
      <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/15 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-[600px] w-[600px] translate-x-1/4 translate-y-1/4 rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-slate-900/600/10 px-4 py-1.5 text-sm font-medium text-brand-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" />
          Entrega Instantânea
        </span>

        <h1 className="mt-8 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Produtos Digitais
          <br />
          <span className="text-brand-500">Licenças</span> sem Enrolação
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
          Licenças, softwares, games e assinaturas com entrega na hora.
          <br className="hidden sm:block" />
          <span className="font-medium text-slate-200">Pagou? Recebeu.</span>
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-8 py-4 font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-slate-900/600 hover:shadow-xl active:scale-[0.98]"
          >
            Ver Catálogo <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/50 px-8 py-4 font-semibold text-slate-200 backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-800 active:scale-[0.98]"
          >
            Saber Mais
          </Link>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-400" />
            Entrega na Hora
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand-400" />
            Compra Segura
          </div>
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-brand-400" />
            Suporte Real
          </div>
        </div>
      </div>
    </section>
  );
}
