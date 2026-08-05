import { prisma } from "./db";

const IS_SANDBOX = process.env.PAYPAL_SANDBOX !== "false";
const PAYPAL_API = IS_SANDBOX
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com";

interface PayPalOrderResponse {
  id: string;
  status: string;
}

interface PayPalCaptureResponse {
  id: string;
  status: string;
  purchase_units: Array<{
    payments?: {
      captures?: Array<{ id: string }>;
    };
  }>;
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID ou PAYPAL_CLIENT_SECRET não configurado");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro ao obter token do PayPal: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export interface PayPalPaymentResult {
  paypalOrderId: string;
  status: string;
}

export async function createPayPalOrder(
  amount: number,
  orderId: string
): Promise<PayPalPaymentResult> {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId,
          custom_id: orderId,
          amount: {
            currency_code: "BRL",
            value: amount.toFixed(2),
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro ao criar ordem PayPal: ${res.status} ${text}`);
  }

  const data = (await res.json()) as PayPalOrderResponse;

  return {
    paypalOrderId: data.id,
    status: data.status,
  };
}

export interface PayPalCaptureResult {
  paypalCaptureId: string;
  status: string;
}

export async function capturePayPalOrder(
  paypalOrderId: string
): Promise<PayPalCaptureResult> {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro ao capturar pagamento PayPal: ${res.status} ${text}`);
  }

  const data = (await res.json()) as PayPalCaptureResponse;
  const captureId =
    data.purchase_units?.[0]?.payments?.captures?.[0]?.id || "";

  return {
    paypalCaptureId: captureId,
    status: data.status,
  };
}

export async function updateOrderPayPalData(
  orderId: string,
  paypalOrderId: string,
  paypalCaptureId?: string
) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      paypalOrderId,
      ...(paypalCaptureId && { paypalCaptureId }),
    },
  });
}
