"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Ticket as TicketIcon, Plus, X, Send, MessageCircle,
  Clock, CheckCircle, AlertCircle, Loader2, ArrowLeft,
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
  general: "Geral",
  order: "Pedido",
  payment: "Pagamento",
  product: "Produto",
  refund: "Reembolso",
  other: "Outro",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  OPEN: { label: "Aberto", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  ANSWERED: { label: "Respondido", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CLOSED: { label: "Fechado", color: "bg-slate-900 text-slate-400", icon: CheckCircle },
};

export default function TicketsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "", category: "general" });
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/tickets");
    }
  }, [status, router]);

  // Tempo real via SSE — lista de tickets
  const { data: tickets, loading } = useRealtime<Ticket[]>(
    useCallback(() => fetch("/api/tickets").then(r => r.json()), []),
    {
      events: ["tickets:created", "tickets:updated", "tickets:message"],
      enabled: !!session,
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

  // Scroll para baixo quando chega nova mensagem
  useEffect(() => {
    if (!selectedTicket?.messages) return;
    const count = selectedTicket.messages.length;
    if (count > lastMessageCountRef.current) {
      lastMessageCountRef.current = count;
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [selectedTicket?.messages]);

  // Notificar quando staff responde
  const prevStatusRef = useRef<string>("");
  useEffect(() => {
    if (!selectedTicket) return;
    if (prevStatusRef.current && prevStatusRef.current !== selectedTicket.status) {
      if (selectedTicket.status === "ANSWERED") {
        toast.success("Suporte respondeu!");
      }
    }
    prevStatusRef.current = selectedTicket.status;
  }, [selectedTicket?.status]);

  const openTicket = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    lastMessageCountRef.current = 0;
    prevStatusRef.current = "";
  };

  const closeTicket = () => {
    setSelectedTicketId(null);
    lastMessageCountRef.current = 0;
  };

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Ticket criado com sucesso!");
        setShowCreate(false);
        setForm({ subject: "", message: "", category: "general" });
        // O polling vai buscar a lista automaticamente
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao criar ticket");
      }
    } catch {
      toast.error("Erro ao criar ticket");
    } finally {
      setCreating(false);
    }
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
        // Forçar refetch imediato para mostrar a mensagem sem esperar o próximo ciclo
        refetchTicket();
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      } else {
        toast.error("Erro ao enviar mensagem");
      }
    } catch {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  // Visualização de ticket individual
  if (selectedTicket) {
    const statusCfg = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.OPEN;
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => closeTicket()}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-400"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos tickets
        </button>

        <div className="card overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-800 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-100">{selectedTicket.subject}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-400">
                    {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagens */}
          <div className="max-h-[500px] space-y-4 overflow-y-auto p-6">
            {(selectedTicket.messages || []).map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.isStaff ? "flex-row" : "flex-row-reverse"}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-brand-400">
                  {msg.user?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className={`max-w-[75%] ${msg.isStaff ? "" : "text-right"}`}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-300">
                      {msg.isStaff ? "Suporte" : msg.user?.name || "Você"}
                    </span>
                    {msg.isStaff && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">
                        Equipe
                      </span>
                    )}
                  </div>
                  <div
                    className={`inline-block rounded-2xl px-4 py-2.5 text-sm ${
                      msg.isStaff
                        ? "bg-slate-900 text-slate-200"
                        : "bg-brand-600 text-white"
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
          {selectedTicket.status !== "CLOSED" ? (
            <div className="border-t border-slate-800 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReply()}
                  placeholder="Escreva sua mensagem..."
                  className="input flex-1"
                />
                <button
                  onClick={handleReply}
                  disabled={sending || !reply.trim()}
                  className="btn-primary px-4"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-slate-800 p-4 text-center text-sm text-slate-400">
              Este ticket foi fechado. Abra um novo se precisar de mais ajuda.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lista de tickets
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-100">
            <TicketIcon className="h-8 w-8 text-brand-400" /> Meus Tickets
          </h1>
          <p className="mt-2 text-slate-400">Central de suporte — tire suas dúvidas</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="h-5 w-5" /> Novo Ticket
        </button>
      </div>

      {(tickets?.length ?? 0) === 0 ? (
        <div className="card py-20 text-center">
          <MessageCircle className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-6 text-xl font-bold text-slate-100">Nenhum ticket ainda</h2>
          <p className="mt-2 text-slate-400">Abra um ticket para falar com nossa equipe.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-6">
            <Plus className="h-5 w-5" /> Abrir Primeiro Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets?.map((ticket) => {
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
                    {lastMsg?.content || "Sem mensagens"}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-900 px-2 py-0.5">
                      {CATEGORY_LABELS[ticket.category] || ticket.category}
                    </span>
                    <span>{ticket._count?.messages || 0} mensagem(s)</span>
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

      {/* Modal de criação */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-slate-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100">Novo Ticket</h3>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Assunto</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Resuma seu problema..."
                  className="input mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Categoria</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input mt-1"
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Mensagem</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  placeholder="Descreva seu problema em detalhes..."
                  className="input mt-1 resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="btn-outline">
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={creating} className="btn-primary">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
