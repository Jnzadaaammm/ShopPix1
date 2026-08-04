/**
 * Event Bus em memória — sistema pub/sub para tempo real.
 *
 * Funciona assim:
 * 1. APIs (POST/PATCH/DELETE) chamam `emit("tickets:change")` quando modificam dados
 * 2. O endpoint SSE /api/realtime assina eventos com `subscribe()` e os streama para clientes
 * 3. O hook useRealtime recebe o evento e dispara refetch
 *
 * Em produção com múltiplas instâncias, isto precisaria ser substituído por Redis Pub/Sub.
 * Para uma única instância (nosso caso), o event bus em memória é perfeito.
 */

type EventHandler = (data: any) => void;

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  /** Assina um evento. Retorna função para cancelar inscrição. */
  subscribe(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  /** Emite um evento para todos os assinantes. */
  emit(event: string, data?: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (err) {
          console.error(`[EventBus] Erro no handler do evento "${event}":`, err);
        }
      }
    }
    // Também emitir no wildcard "*" para clientes que assinam tudo
    const wildcardHandlers = this.handlers.get("*");
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler({ event, data });
        } catch (err) {
          console.error(`[EventBus] Erro no handler wildcard:`, err);
        }
      }
    }
  }

  /** Lista todos os eventos ativos (para debug). */
  getActiveEvents(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Singleton global — sobrevive a hot reloads
const globalForEventBus = globalThis as unknown as { __eventBus?: EventBus };
export const eventBus = globalForEventBus.__eventBus || new EventBus();
if (!globalForEventBus.__eventBus) {
  globalForEventBus.__eventBus = eventBus;
}

// === Eventos do sistema ===
export const REALTIME_EVENTS = {
  // Tickets
  TICKET_CREATED: "tickets:created",
  TICKET_UPDATED: "tickets:updated",
  TICKET_MESSAGE: "tickets:message",
  // Pedidos
  ORDER_CREATED: "orders:created",
  ORDER_UPDATED: "orders:updated",
  ORDER_PAID: "orders:paid",
  // Produtos
  PRODUCT_CREATED: "products:created",
  PRODUCT_UPDATED: "products:updated",
  PRODUCT_DELETED: "products:deleted",
  // Categorias
  CATEGORY_CHANGED: "categories:changed",
  // Cupons
  COUPON_CHANGED: "coupons:changed",
  // Clientes/Usuários
  USER_CHANGED: "users:changed",
  ROLE_CHANGED: "roles:changed",
  // Reembolsos
  REFUND_CHANGED: "refunds:changed",
  // Cargos
  CARGO_CHANGED: "cargos:changed",
  // Downloads
  DOWNLOAD_CHANGED: "downloads:changed",
  // Favoritos
  WISHLIST_CHANGED: "wishlist:changed",
  // Perfil
  PROFILE_CHANGED: "profile:changed",
  // Analytics
  ANALYTICS_CHANGED: "analytics:changed",
} as const;

/** Helper para emitir eventos de forma tipada */
export function emit(event: string, data?: any) {
  eventBus.emit(event, data);
}
