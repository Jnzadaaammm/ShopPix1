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

    addRealtimeListener();
    let es: EventSource | null = null;
    let mounted = true;

    try {
      es = getSharedEventSource();

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
        if (es) {
          es.removeEventListener("connected", onConnected);
          for (const event of events) {
            es.removeEventListener(event, handler as EventListener);
          }
        }
        removeRealtimeListener();
      };
    } catch {
      // Se não conseguir conectar (sem listeners), limpa
      removeRealtimeListener();
      return;
    }
  }, [enabled, refetch, events.join(",")]);

  return { data, loading, connected, refetch };
}

// === Conexão SSE global compartilhada ===
// Todos os hooks useRealtime compartilham a mesma conexão EventSource
// para evitar múltiplas conexões desnecessárias.

let sharedES: EventSource | null = null;
let connectionAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let listenerCount = 0;

function cleanupSharedEventSource() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (sharedES) {
    sharedES.close();
    sharedES = null;
  }
}

export function addRealtimeListener() {
  listenerCount++;
}

export function removeRealtimeListener() {
  listenerCount = Math.max(0, listenerCount - 1);
  // Fechar conexão se nenhum componente estiver ouvindo
  if (listenerCount === 0) {
    cleanupSharedEventSource();
  }
}

function getSharedEventSource(): EventSource {
  if (sharedES && sharedES.readyState !== EventSource.CLOSED) {
    return sharedES;
  }

  if (listenerCount === 0) {
    // Não conectar se ninguém está ouvindo
    throw new Error("Nenhum listener ativo para realtime");
  }

  connectionAttempts++;
  sharedES = new EventSource("/api/realtime");

  sharedES.onerror = () => {
    if (reconnectTimer) return; // evitar múltiplos timers
    // Reconectar com backoff exponencial (max 30s)
    const delay = Math.min(1000 * Math.pow(2, connectionAttempts - 1), 30000);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (sharedES?.readyState === EventSource.CLOSED) {
        sharedES = null;
      }
    }, delay);
  };

  sharedES.addEventListener("connected", () => {
    connectionAttempts = 0; // Resetar tentativas após conectar
  });

  return sharedES;
}
