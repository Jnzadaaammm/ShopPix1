import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission, forbiddenResponse } from "@/lib/roles";
import { createStripePayment } from "@/lib/stripe";
import { createPayPalOrder } from "@/lib/paypal";
import { emit, REALTIME_EVENTS } from "@/lib/event-bus";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { items, paymentMethod, couponCode } = await request.json();
  if (!items?.length) {
    return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
  }

  if (!["stripe", "paypal", "pix"].includes(paymentMethod)) {
    return NextResponse.json({ error: "Método de pagamento inválido" }, { status: 400 });
  }

  // Validar quantidades
  for (const item of items) {
    if (!item.quantity || item.quantity < 1) {
      return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
    }
    if (item.quantity > 99) {
      return NextResponse.json({ error: "Quantidade máxima por item é 99" }, { status: 400 });
    }
  }

  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  // Validar produtos e estoque
  let subtotal = 0;
  // Contar credenciais disponíveis para produtos no modo CREDENTIALS
  const credentialProducts = products.filter((p) => p.stockMode === "CREDENTIALS");
  let availableCredentials: Record<string, number> = {};
  if (credentialProducts.length > 0) {
    const counts = await prisma.productCredential.groupBy({
      by: ["productId"],
      where: {
        productId: { in: credentialProducts.map((p) => p.id) },
        status: "AVAILABLE",
      },
      _count: true,
    });
    availableCredentials = Object.fromEntries(
      counts.map((c) => [c.productId, c._count])
    );
  }

  const orderItems: { productId: string; productName: string; productImage: string; quantity: number; price: number }[] = items.map((item: { productId: string; quantity: number }) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error("Produto não encontrado");
    }
    // Validar estoque apenas para produtos no modo CREDENTIALS
    if (product.stockMode === "CREDENTIALS") {
      const available = availableCredentials[product.id] || 0;
      if (available < item.quantity) {
        throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${available}`);
      }
    }
    // Produto digital simples (sem credenciais): sem limite
    subtotal += product.price * item.quantity;
    return {
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      quantity: item.quantity,
      price: product.price,
    };
  });

  // Aplicar cupom se fornecido
  let discount = 0;
  let appliedCouponCode: string | undefined;
  let couponId: string | undefined;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });
    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Cupom inválido ou inativo" }, { status: 400 });
    }
    const now = new Date();
    if (coupon.validFrom > now) {
      return NextResponse.json({ error: "Cupom ainda não está disponível" }, { status: 400 });
    }
    if (coupon.validUntil && coupon.validUntil < now) {
      return NextResponse.json({ error: "Cupom expirado" }, { status: 400 });
    }
    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Cupom esgotado" }, { status: 400 });
    }
    if (coupon.minOrder !== null && subtotal < coupon.minOrder) {
      return NextResponse.json(
        { error: `Pedido mínimo de R$ ${coupon.minOrder.toFixed(2)} para este cupom` },
        { status: 400 }
      );
    }
    if (coupon.type === "PERCENTAGE") {
      discount = subtotal * (coupon.value / 100);
    } else {
      discount = Math.min(coupon.value, subtotal);
    }
    appliedCouponCode = coupon.code;
    couponId = coupon.id;
  }

  const total = Math.max(0, subtotal - discount);

  // Criar pedido + decrementar estoque + incrementar cupom em transação
  const order = await prisma.$transaction(async (tx) => {
    // Re-validar estoque dentro da transação (race condition)
    const freshProducts = await tx.product.findMany({
      where: { id: { in: productIds } },
    });

    for (const item of items) {
      const product = freshProducts.find((p) => p.id === item.productId);
      if (!product) throw new Error("Produto não encontrado");

      if (product.stockMode === "CREDENTIALS") {
        // Re-contar credenciais disponíveis
        const available = await tx.productCredential.count({
          where: { productId: product.id, status: "AVAILABLE" },
        });
        if (available < item.quantity) {
          throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${available}`);
        }
        // Reservar credenciais (marcar como RESERVED)
        const toReserve = await tx.productCredential.findMany({
          where: { productId: product.id, status: "AVAILABLE" },
          take: item.quantity,
          orderBy: { createdAt: "asc" },
        });
        await tx.productCredential.updateMany({
          where: { id: { in: toReserve.map((c) => c.id) } },
          data: { status: "RESERVED" },
        });
      }
    }

    // Criar o pedido
    const newOrder = await tx.order.create({
      data: {
        userId: session.user.id,
        subtotal,
        discount,
        total,
        couponCode: appliedCouponCode || null,
        paymentMethod,
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    });

    // Vincular credenciais reservadas aos orderItems criados
    for (const item of newOrder.items) {
      if (item.product?.stockMode === "CREDENTIALS") {
        await tx.productCredential.updateMany({
          where: {
            productId: item.productId!,
            status: "RESERVED",
          },
          data: {
            status: "RESERVED",
            orderItemId: item.id,
          },
        });
      }
    }

    // Incrementar uso do cupom
    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usesCount: { increment: 1 } },
      });
    }

    return newOrder;
  });

  emit(REALTIME_EVENTS.ORDER_CREATED, { orderId: order.id });

  if (paymentMethod === "stripe") {
    const stripePayment = await createStripePayment(total, order.id);
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentId: stripePayment.paymentIntentId },
      include: { items: { include: { product: true } } },
    });

    return NextResponse.json({
      ...updatedOrder,
      stripeClientSecret: stripePayment.clientSecret,
    });
  }

  if (paymentMethod === "paypal") {
    const paypalPayment = await createPayPalOrder(total, order.id);
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { paypalOrderId: paypalPayment.paypalOrderId },
      include: { items: { include: { product: true } } },
    });

    return NextResponse.json({
      ...updatedOrder,
      paypalOrderId: paypalPayment.paypalOrderId,
    });
  }

  return NextResponse.json(order);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const admin = searchParams.get("admin");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const status = searchParams.get("status");

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (admin === "true") {
    // Verificar permissão
    if (!(await userHasPermission(session.user.id, "orders.view"))) {
      return forbiddenResponse("Sem permissão para ver pedidos");
    }
    // Admin: return orders with pagination
    const where: any = status ? { status } : {};
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              productName: true,
              productImage: true,
              product: { select: { id: true, name: true, image: true, stockMode: true } },
              credentials: { select: { id: true } },
            },
          },
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);
    return NextResponse.json({ orders, total, page, limit });
  }

  // User: return only their orders
  const userOrders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          productName: true,
          productImage: true,
          product: { select: { id: true, name: true, image: true, stockMode: true } },
          // Só retorna credenciais se o pedido estiver PAID
          credentials: { select: { id: true, content: true, status: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filtrar: só mostrar credenciais se pedido estiver PAID
  const filteredOrders = userOrders.map((order) => {
    if (order.status !== "PAID") {
      return {
        ...order,
        items: order.items.map((item) => ({ ...item, credentials: [] })),
      };
    }
    return order;
  });

  return NextResponse.json(filteredOrders);
}
