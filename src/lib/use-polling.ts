"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UsePollingOptions {
  /** Intervalo em ms (padrão: 30000) */
  interval?: number;
  /** Se false, não executa (padrão: true) */
  enabled?: boolean;
  /** Função para comparar se houve mudança (padrão: JSON.stringify) */
  compare?: (prev: any, next: any) => boolean;
  /** Pausar polling quando a aba estiver em background (padrão: true) */
  pauseWhenHidden?: boolean;
}

/**
 * Hook de polling que busca dados em intervalos regulares.
 * - Só atualiza o state se os dados mudaram (evita re-renders desnecessários)
 * - Pausa o polling quando a aba está em background (economiza recursos)
 * - Re-busca imediatamente quando a aba volta a ter foco
 *
 * @param fetcher Função que retorna os dados (Promise)
 * @param options Configurações de polling
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  options: UsePollingOptions = {}
) {
  const { interval = 30000, enabled = true, compare, pauseWhenHidden = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  const compareRef = useRef(compare);
  const dataRef = useRef<T | null>(null);
  const intervalRef = useRef(interval);
  const pauseWhenHiddenRef = useRef(pauseWhenHidden);

  // Atualizar refs sem re-criar o effect
  useEffect(() => {
    fetcherRef.current = fetcher;
    compareRef.current = compare;
    intervalRef.current = interval;
    pauseWhenHiddenRef.current = pauseWhenHidden;
  });

  const refetch = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setError(null);

      // Só atualizar se mudou
      const hasChanged = compareRef.current
        ? compareRef.current(dataRef.current, result)
        : JSON.stringify(dataRef.current) !== JSON.stringify(result);

      if (hasChanged) {
        dataRef.current = result;
        setData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let id: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (id) clearInterval(id);
      id = setInterval(refetch, intervalRef.current);
    };

    const stopPolling = () => {
      if (id) {
        clearInterval(id);
        id = null;
      }
    };

    // Busca imediata
    refetch();
    startPolling();

    // Pausar quando aba em background, re-buscar quando volta
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refetch();
        startPolling();
      } else if (pauseWhenHiddenRef.current) {
        stopPolling();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refetch, interval, enabled]);

  return { data, loading, error, refetch };
}

/**
 * Hook de polling que busca dados de uma URL via fetch.
 * Versão simplificada do usePolling para casos comuns.
 */
export function usePollingFetch<T = any>(
  url: string | null,
  options: UsePollingOptions = {}
) {
  const { interval = 30000, enabled = true, compare, pauseWhenHidden = true } = options;

  const fetcher = useCallback(async () => {
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  }, [url]);

  return usePolling(url ? fetcher : (async () => null), {
    interval,
    enabled: enabled && !!url,
    compare,
    pauseWhenHidden,
  });
}
