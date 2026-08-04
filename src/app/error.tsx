"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500">Oops!</h1>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">
          Algo deu errado
        </h2>
        <p className="mt-2 text-gray-600">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-gray-400">
            Código: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Tentar novamente
          </button>
          <Link href="/" className="btn-secondary inline-flex items-center justify-center gap-2">
            <Home className="h-5 w-5" />
            Voltar para Home
          </Link>
        </div>
      </div>
    </div>
  );
}
