import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/roles";
import { emit, REALTIME_EVENTS } from "@/lib/event-bus";

/**
 * GET — retorna um ticket específico com todas as mensagens
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
  }

  // Usuário comum só pode ver seus próprios tickets; staff pode ver todos
  const isStaff = await userHasPermission(session.user.id, "tickets.manage");
  if (ticket.userId !== session.user.id && !isStaff) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  return NextResponse.json(ticket);
}

/**
 * POST — adiciona uma mensagem ao ticket
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { message, status } = await request.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
  }

  const isStaff = await userHasPermission(session.user.id, "tickets.manage");

  // Usuário comum só pode responder aos seus próprios tickets
  if (ticket.userId !== session.user.id && !isStaff) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  // Não pode responder ticket fechado (exceto staff reabrindo)
  if (ticket.status === "CLOSED" && !isStaff) {
    return NextResponse.json({ error: "Ticket fechado" }, { status: 400 });
  }

  // Criar mensagem + atualizar status do ticket
  const newMessage = await prisma.ticketMessage.create({
    data: {
      content: message.trim(),
      ticketId: id,
      userId: session.user.id,
      isStaff,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  // Atualizar status
  let newStatus = ticket.status;
  if (status && ["OPEN", "ANSWERED", "CLOSED"].includes(status)) {
    newStatus = status;
  } else {
    // Auto: se staff respondeu → ANSWERED, se cliente respondeu → OPEN
    newStatus = isStaff ? "ANSWERED" : "OPEN";
  }

  await prisma.ticket.update({
    where: { id },
    data: { status: newStatus },
  });

  emit(REALTIME_EVENTS.TICKET_MESSAGE, { ticketId: id, isStaff });
  return NextResponse.json({ ...newMessage, ticketStatus: newStatus });
}

/**
 * PATCH — atualiza status do ticket (staff)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!(await userHasPermission(session.user.id, "tickets.manage"))) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const { status, priority } = await request.json();

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
  }

  const data: any = {};
  if (status && ["OPEN", "ANSWERED", "CLOSED"].includes(status)) {
    data.status = status;
  }
  if (priority && ["low", "normal", "high", "urgent"].includes(priority)) {
    data.priority = priority;
  }

  const updated = await prisma.ticket.update({ where: { id }, data });
  emit(REALTIME_EVENTS.TICKET_UPDATED, { ticketId: id, status: data.status, priority: data.priority });
  return NextResponse.json(updated);
}
