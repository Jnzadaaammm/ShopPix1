/**
 * Cliente HTTP para a API REST do ShopPix.
 *
 * O bot chama os endpoints /api/bot/* do site, autenticando com
 * a chave de API gerada em /admin/apigenerator.
 */
import "dotenv/config";

const BASE_URL = (process.env.SHOPIX_API_URL || "https://shop-pix.com").replace(/\/$/, "");
const API_KEY = process.env.SHOPIX_API_KEY || "";

if (!API_KEY) {
  console.warn("[api-client] SHOPPIX_API_KEY não configurada — os comandos de loja não funcionarão.");
}

async function request<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  if (!API_KEY) {
    throw new Error("Chave de API não configurada (SHOPPIX_API_KEY no .env).");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  };

  const opts: RequestInit = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = (data && data.error) || `HTTP ${res.status}`;
    const err = new Error(msg) as Error & { status: number; data: any };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // Dashboard
  getDashboard: () => request<{ revenue: number; counts: Record<string, number>; recentOrders: any[] }>("GET", "/api/bot/dashboard"),

  // Produtos
  listProducts: (params?: { search?: string; category?: string; featured?: boolean; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.category) sp.set("category", params.category);
    if (params?.featured) sp.set("featured", "true");
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return request<{ products: any[] }>("GET", `/api/bot/products${qs ? `?${qs}` : ""}`);
  },
  getProduct: (id: string) => request<any>("GET", `/api/bot/products/${id}`),
  createProduct: (p: {
    name: string; description: string; price: number; categoryId: string;
    image?: string; stockMode?: "SIMPLE" | "CREDENTIALS"; stock?: number;
    featured?: boolean; fileUrl?: string; maxDownloads?: number;
  }) => request<any>("POST", "/api/bot/products", p),
  updateProduct: (id: string, p: {
    name?: string; description?: string; price?: number; stock?: number;
    featured?: boolean; image?: string;
  }) => request<any>("PATCH", `/api/bot/products/${id}`, p),

  // Categorias
  listCategories: () => request<{ categories: any[] }>("GET", "/api/bot/categories"),

  // Pedidos
  listOrders: (status?: string) =>
    request<{ orders: any[] }>("GET", `/api/bot/orders${status ? `?status=${status}` : ""}`),
  getOrder: (id: string) => request<any>("GET", `/api/bot/orders/${id}`),
  approveOrder: (id: string) => request<any>("POST", `/api/bot/orders/${id}/approve`),
  rejectOrder: (id: string, reason?: string) =>
    request<any>("POST", `/api/bot/orders/${id}/reject`, reason ? { reason } : {}),

  // Settings
  getSettings: () => request<{ storeName: string; storeDescription: string; supportEmail: string; siteUrl: string }>("GET", "/api/bot/settings"),
};
