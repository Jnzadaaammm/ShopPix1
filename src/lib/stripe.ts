import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export interface StripePaymentResult {
  paymentIntentId: string;
  clientSecret: string;
  status: string;
}

export async function createStripePayment(
  amount: number,
  orderId: string,
  customerEmail?: string,
  paymentMethodId?: string,
  cardType?: 'credit' | 'debit'
): Promise<StripePaymentResult> {
  try {
    // Opções específicas para débito: força autenticação 3D Secure
    // (cartões de débito no Brasil geralmente exigem autenticação)
    const cardOptions =
      cardType === 'debit'
        ? {
            payment_method_options: {
              card: {
                request_three_d_secure: 'any' as const,
                setup_future_usage: 'off_session' as const,
              },
            },
          }
        : {};

    // Se temos um paymentMethodId (vindo do Stripe.js), criamos e confirmamos
    // o PaymentIntent em uma única chamada. Caso contrário, apenas criamos
    // o PaymentIntent para o cliente confirmar no frontend.
    if (paymentMethodId) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency: 'brl',
        metadata: { orderId, ...(cardType && { cardType }) },
        description: `Pedido #${orderId}${cardType ? ` (${cardType === 'credit' ? 'Crédito' : 'Débito'})` : ''}`,
        payment_method: paymentMethodId,
        confirm: true,
        payment_method_types: ['card'],
        ...(customerEmail && { receipt_email: customerEmail }),
        ...cardOptions,
      });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || '',
        status: paymentIntent.status,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency: 'brl',
      metadata: {
        orderId,
        ...(cardType && { cardType }),
      },
      description: `Pedido #${orderId}${cardType ? ` (${cardType === 'credit' ? 'Crédito' : 'Débito'})` : ''}`,
      payment_method_types: ['card'],
      ...(customerEmail && { receipt_email: customerEmail }),
      ...cardOptions,
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || '',
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error('Erro ao criar pagamento Stripe:', error);
    if (error instanceof Error) {
      throw new Error(`Erro ao criar pagamento Stripe: ${error.message}`);
    }
    throw new Error('Erro ao criar pagamento Stripe');
  }
}

export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    console.error('Erro ao buscar Payment Intent:', error);
    throw new Error('Erro ao buscar pagamento');
  }
}

export async function confirmPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
    };
  } catch (error) {
    console.error('Erro ao confirmar Payment Intent:', error);
    throw new Error('Erro ao confirmar pagamento');
  }
}
