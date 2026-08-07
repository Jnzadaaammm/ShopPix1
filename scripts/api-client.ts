/**
 * Cliente de exemplo para consumir a API externa do ShopPix.
 *
 * Uso:
 *   npx tsx scripts/api-client.ts
 *
 * Configure as variáveis no .env ou passe diretamente abaixo:
 *   - SHOPIX_API_URL=https://shop-pix.com
 *   - SHOPIX_API_KEY=sk_...
 */
import "dotenv/config";

const API_URL = process.env.SHOPIX_API_URL || "https://shop-pix.com";
const API_KEY = process.env.SHOPIX_API_KEY || "";

if (!API_KEY) {
  console.error("❌ SHOPIX_API_KEY não configurada.");
  process.exit(1);
}

class ShopPixApi {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  async dashboard() {
    return this.request("/api/bot/dashboard");
  }

  async listOrders(status?: string, limit = 50) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (limit) params.set("limit", String(limit));
    return this.request(`/api/bot/orders?${params.toString()}`);
  }

  async getOrder(id: string) {
    return this.request(`/api/bot/orders/${id}`);
  }

  async approveOrder(id: string) {
    return this.request(`/api/bot/orders/${id}/approve`, { method: "POST" });
  }

  async rejectOrder(id: string, reason?: string) {
    return this.request(`/api/bot/orders/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async listProducts(search?: string, category?: string, limit = 50) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (limit) params.set("limit", String(limit));
    return this.request(`/api/bot/products?${params.toString()}`);
  }

  async getProduct(id: string) {
    return this.request(`/api/bot/products/${id}`);
  }

  async createProduct(data: {
    name: string;
    description: string;
    price: number;
    categoryId: string;
    image?: string;
    stockMode?: "SIMPLE" | "CREDENTIALS";
    stock?: number;
    featured?: boolean;
  }) {
    return this.request("/api/bot/products", { method: "POST", body: JSON.stringify(data) });
  }

  async updateProduct(id: string, data: Partial<{ stock: number }>) {
    return this.request(`/api/bot/products/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  }

  async listCategories() {
    return this.request("/api/bot/categories");
  }

  async getSettings() {
    return this.request("/api/bot/settings");
  }
}

async function main() {
  const api = new ShopPixApi(API_URL, API_KEY);

  try {
    console.log("Dashboard:");
    const dashboard = await api.dashboard();
    console.log(JSON.stringify(dashboard, null, 2));
  } catch (err: any) {
    console.error("Erro:", err.message);
  }
}

main();
