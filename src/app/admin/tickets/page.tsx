"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Ticket as TicketIcon, Send, MessageCircle, Clock, CheckCircle,
  AlertCircle, Loader2, ArrowLeft, X, Filter, Search,
} from "lucide-react";
import { toast } from "@/components/ui/Toaster";
import { useRealtime } from "@/lib/use-realtime";

interface TicketMessage {
  id: string;
  content: string;
  isStaff: boolean;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string | null; email: string | null; image: string | null };
  messages?: TicketMessage[];
  _count?: { messages: number };
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "Geral", order: "Pedido", payment: "Pagamento",
  product: "Produto", refund: "Reembolso", other: "Outro",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  OPEN: { label: "Aberto", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  ANSWERED: { label: "Respondido", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CLOSED: { label: "Fechado", color: "bg-slate-900 text-slate-400", icon: CheckCircle },
};

const PRIORITY_CONFIG: Record<string, string> = {
  low: "bg-slate-900 text-slate-400",
  normal: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente",
};

export default function AdminTicketsPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  // Tempo real via SSE — lista de tickets
  const { data: tickets, loading } = useRealtime<Ticket[]>(
    useCallback(() => {
      const params = new URLSearchParams({ admin: "true" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      return fetch(`/api/tickets?${params}`).then(r => r.json());
    }, [statusFilter]),
    {
      events: ["tickets:created", "tickets:updated", "tickets:message"],
    }
  );

  // Tempo real via SSE — ticket selecionado (chat)
  const { data: selectedTicket, refetch: refetchTicket } = useRealtime<Ticket>(
    useCallback(() => {
      if (!selectedTicketId) return Promise.resolve(null as any);
      return fetch(`/api/tickets/${selectedTicketId}`).then(r => r.json());
    }, [selectedTicketId]),
    {
      events: ["tickets:message", "tickets:updated"],
      enabled: !!selectedTicketId,
    }
  );

  // Notificar nova mensagem do cliente
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (!selectedTicket?.messages) return;
    const count = selectedTicket.messages.length;
    if (count > lastMessageCountRef.current) {
      const newMsgs = selectedTicket.messages.slice(lastMessageCountRef.current);
      const hasClientMsg = newMsgs.some(m => !m.isStaff);
      if (hasClientMsg && lastMessageCountRef.current > 0) {
        toast.success("Nova mensagem do cliente!");
      }
      lastMessageCountRef.current = count;
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [selectedTicket?.messages]);

  const openTicket = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    lastMessageCountRef.current = 0;
  };

  const closeTicket = () => {
    setSelectedTicketId(null);
    lastMessageCountRef.current = 0;
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      if (res.ok) {
        setReply("");
        refetchTicket();
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }
    } catch {
      toast.error("Erro ao enviar");
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(status === "CLOSED" ? "Ticket fechado" : "Status atualizado");
        refetchTicket();
      }
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const updatePriority = async (priority: string) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (res.ok) {
        refetchTicket();
      }
    } catch {
      toast.error("Erro");
    }
  };

  const ticketList = tickets || [];
  const filteredTickets = ticketList.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      t.user?.name?.toLowerCase().includes(q) ||
      t.user?.email?.toLowerCase().includes(q)
    );
  });

  const counts = {
    OPEN: ticketList.filter((t) => t.status === "OPEN").length,
    ANSWERED: ticketList.filter((t) => t.status === "ANSWERED").length,
    CLOSED: ticketList.filter((t) => t.status === "CLOSED").length,
  };

  // Visualização de ticket individual
  if (selectedTicket) {
    const statusCfg = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.OPEN;
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => closeTicket()}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-400"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="card overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-800 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-100">{selectedTicket.subject}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-400">
                    {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}
                  </span>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => updatePriority(e.target.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border-0 ${PRIORITY_CONFIG[selectedTicket.priority] || PRIORITY_CONFIG.normal}`}
                  >
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  Cliente: {selectedTicket.user?.name || "N/A"} ({selectedTicket.user?.email || "N/A"})
                </p>
              </div>
              <div className="flex gap-2">
                {selectedTicket.status !== "CLOSED" && (
                  <button
                    onClick={() => updateStatus("CLOSED")}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800"
                  >
                    Fechar Ticket
                  </button>
                )}
                {selectedTicket.status === "CLOSED" && (
                  <button
                    onClick={() => updateStatus("OPEN")}
                    className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
                  >
                    Reabrir
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mensagens */}
          <div className="max-h-[500px] space-y-4 overflow-y-auto p-6">
            {(selectedTicket.messages || []).map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.isStaff ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                  msg.isStaff ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-400"
                }`}>
                  {msg.user?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className={`max-w-[75%] ${msg.isStaff ? "text-right" : ""}`}>
                  <div className="mb-1 flex items-center gap-2">
                    {msg.isStaff && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">
                        Equipe
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-300">
                      {msg.user?.name || "N/A"}
                    </span>
                  </div>
                  <div
                    className={`inline-block rounded-2xl px-4 py-2.5 text-sm ${
                      msg.isStaff ? "bg-brand-600 text-white" : "bg-slate-900 text-slate-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {new Date(msg.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Resposta */}
          <div className="border-t border-slate-800 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                placeholder="Responder como suporte..."
                className="input flex-1"
              />
              <button onClick={handleReply} disabled={sending || !reply.trim()} className="btn-primary px-4">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lista
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-100">
          <TicketIcon className="h-8 w-8 text-brand-400" /> Tickets de Suporte
        </h1>
        <p className="mt-2 text-slate-400">Gerencie tickets de suporte dos clientes</p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {[
            { id: "OPEN", label: "Abertos", count: counts.OPEN },
            { id: "ANSWERED", label: "Respondidos", count: counts.ANSWERED },
            { id: "CLOSED", label: "Fechados", count: counts.CLOSED },
            { id: "all", label: "Todos", count: ticketList.length },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === f.id
                  ? "bg-brand-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-900" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="card py-20 text-center">
          <MessageCircle className="mx-auto h-16 w-16 text-slate-500" />
          <p className="mt-4 text-slate-400">Nenhum ticket encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
            const StatusIcon = cfg.icon;
            const lastMsg = ticket.messages?.[0];
            return (
              <button
                key={ticket.id}
                onClick={() => openTicket(ticket)}
                className="card flex w-full items-center gap-4 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cfg.color}`}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-100 truncate">{ticket.subject}</h3>
                  <p className="text-sm text-slate-400 truncate">
                    {ticket.user?.name} • {lastMsg?.content || "Sem mensagens"}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-900 px-2 py-0.5">
                      {CATEGORY_LABELS[ticket.category] || ticket.category}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 ${PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.normal}`}>
                      {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                    </span>
                    <span>{ticket._count?.messages || 0} msg</span>
                    <span>{new Date(ticket.updatedAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${cfg.color}`}>
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
