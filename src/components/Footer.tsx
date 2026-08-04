"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { CreditCard, ArrowUp } from "lucide-react";

export default function Footer() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.isAdmin;

  return (
    <footer className="mt-auto border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                S
              </div>
              <span className="text-lg font-bold">ShopPix</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Sua loja online com produtos digitais e físicos. Pagamento via cartão (Stripe).
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">Navegação</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li><Link href="/produtos" className="hover:text-brand-600">Produtos</Link></li>
              <li><Link href="/carrinho" className="hover:text-brand-600">Carrinho</Link></li>
              <li><Link href="/pedidos" className="hover:text-brand-600">Meus Pedidos</Link></li>
              <li><Link href="/downloads" className="hover:text-brand-600">Meus Downloads</Link></li>
              <li><Link href="/favoritos" className="hover:text-brand-600">Favoritos</Link></li>
              {isAdmin && (
                <li><Link href="/admin" className="hover:text-brand-600">Admin</Link></li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">Ajuda</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li><Link href="/faq" className="hover:text-brand-600">Perguntas Frequentes</Link></li>
              <li><Link href="/envio" className="hover:text-brand-600">Política de Envio</Link></li>
              <li><Link href="/reembolso-politica" className="hover:text-brand-600">Política de Reembolso</Link></li>
              <li><a href="mailto:contato@shoppix.com.br" className="hover:text-brand-600">Contato</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li><Link href="/termos" className="hover:text-brand-600">Termos de Uso</Link></li>
              <li><Link href="/privacidade" className="hover:text-brand-600">Política de Privacidade</Link></li>
            </ul>
            <h3 className="mt-4 font-semibold text-gray-900">Pagamento</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-xs text-gray-600" title="Cartão via Stripe">
                <CreditCard className="h-3 w-3" /> Cartão
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} ShopPix. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-xs text-gray-400">
              <Link href="/termos" className="hover:text-brand-600">Termos</Link>
              <Link href="/privacidade" className="hover:text-brand-600">Privacidade</Link>
              <Link href="/reembolso-politica" className="hover:text-brand-600">Reembolso</Link>
              <Link href="/faq" className="hover:text-brand-600">FAQ</Link>
            </div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Voltar ao topo"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:bg-gray-50 hover:text-brand-600"
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
