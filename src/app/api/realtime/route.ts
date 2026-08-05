import { eventBus } from "@/lib/event-bus";

/**
 * SSE — Server-Sent Events
 *
 * Mantém uma conexão HTTP longa aberta e envia eventos em tempo real
 * para o cliente sempre que o eventBus emite algo.
 *
 * O cliente assina via EventSource:
 *   const es = new EventSource("/api/realtime");
 *   es.addEventListener("tickets:created", (e) => { ... });
 *
 * Otimizações de memória:
 * - Heartbeat a cada 60s (reduz CPU/memória)
 * - Timeout de conexão ociosa de 5 minutos
 * - Desconexão limpa quando cliente fecha
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Enviar um evento inicial de "conectado" para confirmar a conexão
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`)
      );

      // Heartbeat a cada 60s para manter a conexão viva (economiza memória/CPU)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          // Conexão fechada
        }
      }, 60000);

      // Timeout de conexão ociosa: fechar após 5 minutos de inatividade
      const idleTimeout = setTimeout(() => {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // já fechado
        }
      }, 5 * 60 * 1000);

      // Assinar todos os eventos do eventBus e encaminhar via SSE
      const unsubscribe = eventBus.subscribe("*", ({ event, data }) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data || {})}\n\n`)
          );
        } catch {
          // Conexão fechada
        }
      });

      // Cleanup quando o cliente desconecta
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        clearTimeout(idleTimeout);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // já fechado
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Desabilitar buffer do nginx
    },
  });
}
