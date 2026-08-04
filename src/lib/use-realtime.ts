"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseRealtimeOptions {
  /** Eventos SSE que devem disparar refetch (ex: ["tickets:created", "tickets:message"]) */
  events: string[];
  /** Se false, não conecta (padrão: true) */
  enabled?: boolean;
}

/**
 * Hook de tempo real usando Server-Sent Events (SSE).
 *
 * - Conecta automaticamente a /api/realtime
 * - Quando recebe um dos eventos monitorados, chama `refetch`
 * - Mantém uma única conexão SSE compartilhada entre todos os hooks
 * - Reconecta automaticamente se a conexão cair
 *
 * @param fetcher Função que busca os dados iniciais e após cada evento
 * @param options Eventos para monitorar
 *
 * @example
 * const { data, loading, refetch } = useRealtime(
 *   () => fetch("/api/tickets").then(r => r.json()),
 *   { events: ["tickets:created", "tickets:updated", "tickets:message"] }
 * );
 */
export function useRealtime<T>(
  fetcher: () => Promise<T>,
  options: UseRealtimeOptions
) {
  const { events, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const fetcherRef = useRef(fetcher);
  const eventsRef = useRef(events);

  useEffect(() => {
    fetcherRef.current = fetcher;
    eventsRef.current = events;
  });

  const refetch = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      console.error("[useRealtime] Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca inicial
  useEffect(() => {
    if (enabled) refetch();
  }, [refetch, enabled]);

  // SSE — usa conexão global compartilhada
  useEffect(() => {
    if (!enabled) return;

    const es = getSharedEventSource();
    let mounted = true;

    const onConnected = () => {
      if (mounted) setConnected(true);
    };

    const handler = (e: MessageEvent) => {
      if (!mounted) return;
      // Verificar se este evento está na lista de eventos monitorados
      if (eventsRef.current.includes(e.type)) {
        refetch();
      }
    };

    es.addEventListener("connected", onConnected);
    for (const event of events) {
      es.addEventListener(event, handler as EventListener);
    }

    return () => {
      mounted = false;
      es.removeEventListener("connected", onConnected);
      for (const event of events) {
        es.removeEventListener(event, handler as EventListener);
      }
    };
  }, [enabled, refetch, events.join(",")]);

  return { data, loading, connected, refetch };
}

// === Conexão SSE global compartilhada ===
// Todos os hooks useRealtime compartilham a mesma conexão EventSource
// para evitar múltiplas conexões desnecessárias.

let sharedES: EventSource | null = null;
let connectionAttempts = 0;

function getSharedEventSource(): EventSource {
  if (sharedES && sharedES.readyState !== EventSource.CLOSED) {
    return sharedES;
  }

  connectionAttempts++;
  sharedES = new EventSource("/api/realtime");

  sharedES.onerror = () => {
    // Reconectar com backoff exponencial (max 10s)
    const delay = Math.min(1000 * Math.pow(2, connectionAttempts - 1), 10000);
    setTimeout(() => {
      if (sharedES?.readyState === EventSource.CLOSED) {
        sharedES = null;
        getSharedEventSource();
      }
    }, delay);
  };

  sharedES.addEventListener("connected", () => {
    connectionAttempts = 0; // Resetar tentativas após conectar
  });

  return sharedES;
}
