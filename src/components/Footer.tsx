"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, ArrowUp, MessageCircle, Instagram, Twitter, Youtube, Music } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppearanceSettings } from "@/lib/settings";

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
  features: [],
  ctaTitle: "",
  ctaSubtitle: "",
  ctaButtonText: "",
  ctaButtonLink: "",
  footerAbout:
    "Sua loja online com produtos digitais e físicos. Pagamento via cartão (Stripe).",
  footerContactEmail: "",
  socialDiscord: "",
  socialInstagram: "",
  socialTwitter: "",
  socialYoutube: "",
  socialTiktok: "",
  brandColor: "#7c3aed",
};

export default function Footer() {
  const pathname = usePathname();
  const [s, setS] = useState<AppearanceSettings>(DEFAULTS);
  const [storeName, setStoreName] = useState("ShopPix");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.appearance) setS({ ...DEFAULTS, ...data.appearance });
        if (data.storeName) setStoreName(data.storeName);
      })
      .catch(() => {});
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  const socials = [
    { url: s.socialDiscord, icon: MessageCircle, label: "Discord" },
    { url: s.socialInstagram, icon: Instagram, label: "Instagram" },
    { url: s.socialTwitter, icon: Twitter, label: "Twitter" },
    { url: s.socialYoutube, icon: Youtube, label: "YouTube" },
    { url: s.socialTiktok, icon: Music, label: "TikTok" },
  ].filter((x) => x.url);

  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <img
                src="/logo.svg"
                alt={storeName}
                className="h-9 w-9 rounded-xl object-cover"
              />
              <span className="text-lg font-bold text-slate-100">{storeName}</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">{s.footerAbout}</p>
            {socials.length > 0 && (
              <div className="mt-4 flex gap-3">
                {socials.map((soc) => {
                  const Icon = soc.icon;
                  return (
                    <a
                      key={soc.label}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={soc.label}
                      className="rounded-lg border border-slate-700 p-2 text-slate-400 transition-colors hover:bg-slate-900 hover:text-brand-400"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-100">Ajuda</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><Link href="/faq" className="hover:text-brand-400">Perguntas Frequentes</Link></li>
              <li><Link href="/envio" className="hover:text-brand-400">Política de Envio</Link></li>
              <li><Link href="/reembolso-politica" className="hover:text-brand-400">Política de Reembolso</Link></li>
              <li>
                {s.footerContactEmail ? (
                  <a href={`mailto:${s.footerContactEmail}`} className="hover:text-brand-400">Contato</a>
                ) : (
                  <Link href="/tickets" className="hover:text-brand-400">Contato</Link>
                )}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-100">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><Link href="/termos" className="hover:text-brand-400">Termos de Uso</Link></li>
              <li><Link href="/privacidade" className="hover:text-brand-400">Política de Privacidade</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-100">Pagamento</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-xs text-slate-300" title="Cartão via Stripe">
                <CreditCard className="h-3 w-3" /> Cartão
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-xs text-slate-500">
              <Link href="/termos" className="hover:text-brand-400">Termos</Link>
              <Link href="/privacidade" className="hover:text-brand-400">Privacidade</Link>
              <Link href="/reembolso-politica" className="hover:text-brand-400">Reembolso</Link>
              <Link href="/faq" className="hover:text-brand-400">FAQ</Link>
            </div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Voltar ao topo"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition-colors hover:bg-slate-900 hover:text-brand-400"
              title="Voltar ao topo"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
