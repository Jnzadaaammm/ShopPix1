"use client";

import Link from "next/link";
import { ArrowRight, Zap, CreditCard, Download, Shield, Headphones, Star, Gift, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppearanceSettings, FeatureItem } from "@/lib/settings";

const ICONS: Record<string, typeof Zap> = {
  zap: Zap,
  creditcard: CreditCard,
  download: Download,
  shield: Shield,
  headsets: Headphones,
  star: Star,
  gift: Gift,
  lock: Lock,
};

const DEFAULTS: AppearanceSettings = {
  heroBadge: "",
  heroTitleLine1: "",
  heroTitleHighlight: "",
  heroTitleLine2: "",
  heroSubtitle: "",
  heroPrimaryButtonText: "",
  heroPrimaryButtonLink: "",
  heroSecondaryButtonText: "",
  heroSecondaryButtonLink: "",
  features: [
    { icon: "zap", title: "Pagamento com Cartão", desc: "Pague em segundos com cartão via Stripe e receba confirmação imediata.", from: "from-yellow-500", to: "to-yellow-700" },
    { icon: "creditcard", title: "Cartão via Stripe", desc: "Pague com cartão (Visa, Master, Elo) via Stripe com segurança.", from: "from-blue-500", to: "to-blue-700" },
    { icon: "download", title: "Entrega Imediata", desc: "Produtos digitais disponíveis logo após o pagamento.", from: "from-purple-500", to: "to-purple-700" },
    { icon: "shield", title: "Compra Segura", desc: "Login via Google ou Discord. Dados protegidos.", from: "from-emerald-500", to: "to-emerald-700" },
  ],
  ctaTitle: "Pronto para começar?",
  ctaSubtitle: "Explore nosso catálogo de produtos digitais e receba seus arquivos imediatamente após o pagamento.",
  ctaButtonText: "Ver Produtos",
  ctaButtonLink: "/produtos",
  footerAbout: "",
  footerContactEmail: "",
  socialDiscord: "",
  socialInstagram: "",
  socialTwitter: "",
  socialYoutube: "",
  socialTiktok: "",
  brandColor: "#7c3aed",
};

export function FeaturesSection() {
  const [s, setS] = useState<AppearanceSettings>(DEFAULTS);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.appearance) setS({ ...DEFAULTS, ...data.appearance });
      })
      .catch(() => {});
  }, []);

  const features = s.features && s.features.length > 0 ? s.features : DEFAULTS.features;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f: FeatureItem, i: number) => {
          const Icon = ICONS[f.icon] || Zap;
          return (
            <div
              key={i}
              className="group animate-fade-in-up rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900 hover:shadow-2xl hover:shadow-brand-900/20"
              style={{ animationDelay: `${i * 100}ms`, opacity: 0 }}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${f.from} ${f.to} text-white shadow-lg transition-transform group-hover:scale-110`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-100">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CtaSection() {
  const [s, setS] = useState<AppearanceSettings>(DEFAULTS);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.appearance) setS({ ...DEFAULTS, ...data.appearance });
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative overflow-hidden bg-slate-900 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(124,58,237,0.04)_1px,transparent_0)] bg-[length:32px_32px]" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">{s.ctaTitle}</h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">{s.ctaSubtitle}</p>
        <Link
          href={s.ctaButtonLink || "/produtos"}
          className="btn-primary mt-8 px-8 py-4 text-base"
        >
          {s.ctaButtonText || "Ver Produtos"} <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}
