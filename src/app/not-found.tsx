import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-brand-400">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-slate-100">
          Página não encontrada
        </h2>
        <p className="mt-2 text-slate-400">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="btn-primary inline-flex items-center justify-center gap-2">
            <Home className="h-5 w-5" />
            Voltar para Home
          </Link>
          <Link href="/produtos" className="btn-secondary inline-flex items-center justify-center gap-2">
            <Search className="h-5 w-5" />
            Ver Produtos
          </Link>
        </div>
      </div>
    </div>
  );
}
