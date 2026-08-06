import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/roles";
import { emit, REALTIME_EVENTS } from "@/lib/event-bus";

/**
 * GET — lista tickets do usuário (ou todos se staff)
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const adminView = searchParams.get("admin") === "true";

  // Staff (Suporte/Administrador) pode ver todos, usuário comum só os seus
  const isStaff = await userHasPermission(session.user.id, "tickets.manage");
  const where: any = {};
  if (adminView && isStaff) {
    if (status) where.status = status;
  } else {
    where.userId = session.user.id;
    if (status) where.status = status;
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, isStaff: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(tickets);
}

/**
 * POST — cria um novo ticket
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { subject, message, category, orderId, priority } = await request.json();

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Assunto e mensagem são obrigatórios" }, { status: 400 });
    }

    // Criar ticket + primeira mensagem em transação
    const ticket = await prisma.ticket.create({
      data: {
        subject: subject.trim(),
        category: category || "general",
        priority: priority || "normal",
        orderId: orderId || null,
        userId: session.user.id,
        messages: {
          create: {
            content: message.trim(),
            userId: session.user.id,
            isStaff: false,
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        messages: true,
      },
    });

    // Notificar clientes em tempo real
    emit(REALTIME_EVENTS.TICKET_CREATED, { ticketId: ticket.id, userId: ticket.userId });
    emit(REALTIME_EVENTS.TICKET_MESSAGE, { ticketId: ticket.id });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Erro ao criar ticket:", error);
    return NextResponse.json({ error: "Erro ao criar ticket" }, { status: 500 });
  }
}
