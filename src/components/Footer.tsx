"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, ArrowUp } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="ShopPix"
                className="h-9 w-9 rounded-xl object-cover"
              />
              <span className="text-lg font-bold text-slate-100">ShopPix</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Sua loja online com produtos digitais e físicos. Pagamento via cartão (Stripe).
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-100">Ajuda</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li><Link href="/faq" className="hover:text-brand-400">Perguntas Frequentes</Link></li>
              <li><Link href="/envio" className="hover:text-brand-400">Política de Envio</Link></li>
              <li><Link href="/reembolso-politica" className="hover:text-brand-400">Política de Reembolso</Link></li>
              <li><a href="mailto:contato@shoppix.com.br" className="hover:text-brand-400">Contato</a></li>
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
            &copy; {new Date().getFullYear()} ShopPix. Todos os direitos reservados.
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
