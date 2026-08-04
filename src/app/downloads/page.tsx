"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Download, Loader2, RefreshCw, Clock, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { usePolling } from "@/lib/use-polling";
import ImageWithFallback from "@/components/ImageWithFallback";

interface DigitalDownload {
  id: string;
  downloadKey: string;
  expiresAt: string;
  downloadsUsed: number;
  maxDownloads: number;
  createdAt: string;
  product: {
    id: string;
    name: string;
    image: string;
    description: string;
  };
  order: {
    id: string;
    createdAt: string;
  };
}

export default function DownloadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [renewing, setRenewing] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/downloads");
    }
  }, [status, router]);

  const fetchDownloads = useCallback(async () => {
    const res = await fetch("/api/downloads");
    const data = await res.json();
    if (Array.isArray(data)) return data;
    return [];
  }, []);

  const { data: downloads, loading, refetch } = usePolling<DigitalDownload[]>(
    fetchDownloads,
    { enabled: !!session }
  );

  const handleRenew = async (downloadId: string) => {
    setRenewing(downloadId);
    try {
      const res = await fetch("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadId }),
      });
      if (res.ok) {
        await refetch();
      }
    } finally {
      setRenewing(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if ((downloads || []).length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <Download className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Nenhum download ainda</h1>
        <p className="mt-2 text-gray-500">
          Compre produtos digitais e eles aparecerão aqui!
        </p>
        <Link href="/produtos" className="btn-primary mt-8">
          Ver Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Meus Downloads</h1>
      <p className="mt-1 text-gray-500">{(downloads || []).length} produto(s) digital(is)</p>

      <div className="mt-8 space-y-4">
        {(downloads || []).map((download) => {
          const isExpired = new Date() > new Date(download.expiresAt);
          const limitReached = download.downloadsUsed >= download.maxDownloads;

          return (
            <div key={download.id} className="card p-6">
              <div className="flex flex-wrap items-center gap-4">
                <ImageWithFallback
                  src={download.product.image}
                  alt={download.product.name}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900">{download.product.name}</h2>
                  <p className="text-sm text-gray-500">
                    Pedido #{download.order.id.slice(-8).toUpperCase()} •{" "}
                    {formatDate(download.order.createdAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {download.downloadsUsed}/{download.maxDownloads} downloads
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {isExpired
                        ? "Link expirado"
                        : `Expira em ${formatDate(download.expiresAt)}`}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {isExpired ? (
                    <button
                      onClick={() => handleRenew(download.id)}
                      disabled={renewing === download.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
                    >
                      {renewing === download.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Renovar Link
                    </button>
                  ) : limitReached ? (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Limite atingido
                    </span>
                  ) : (
                    <a
                      href={`/api/download/${download.downloadKey}`}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Baixar
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
