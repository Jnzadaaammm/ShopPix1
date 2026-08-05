"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { TrendingUp, ShoppingCart, DollarSign, Percent, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePolling } from "@/lib/use-polling";
import PermissionGuard from "@/components/admin/PermissionGuard";

interface Analytics {
  period: number;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    paidOrders: number;
    avgTicket: number;
    conversionRate: number;
  };
  dailyData: { date: string; revenue: number; orders: number }[];
  categorySales: { name: string; revenue: number; qty: number }[];
  productSales: { name: string; revenue: number; qty: number }[];
  paymentMethods: { method: string; count: number; revenue: number }[];
  statusCounts: { PENDING: number; PAID: number; CANCELLED: number; EXPIRED: number };
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState("30");

  const fetcher = useCallback(
    () => fetch(`/api/analytics?period=${period}`).then(r => r.json()) as Promise<Analytics>,
    [period]
  );

  const { data, loading, refetch } = usePolling<Analytics>(fetcher, { interval: 60000 });

  // Re-buscar imediatamente quando o período muda (o polling usa o fetcher mais recente via ref)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refetch();
  }, [period, refetch]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Período", `${data.period} dias`],
      ["Receita Total", data.summary.totalRevenue.toFixed(2)],
      ["Pedidos Totais", data.summary.totalOrders.toString()],
      ["Pedidos Pagos", data.summary.paidOrders.toString()],
      ["Ticket Médio", data.summary.avgTicket.toFixed(2)],
      ["Taxa de Conversão", `${data.summary.conversionRate.toFixed(1)}%`],
      [],
      ["Vendas por Categoria"],
      ["Categoria", "Receita", "Quantidade"],
      ...data.categorySales.map(c => [c.name, c.revenue.toFixed(2), c.qty.toString()]),
      [],
      ["Top Produtos"],
      ["Produto", "Receita", "Quantidade"],
      ...data.productSales.map(p => [p.name, p.revenue.toFixed(2), p.qty.toString()]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${period}dias-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading || !data) {
    return (
      <PermissionGuard permission="reports.view">
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Carregando relatório...</div>
        </div>
      </PermissionGuard>
    );
  }

  const maxRevenue = Math.max(...data.dailyData.map(d => d.revenue), 1);
  const maxCatRevenue = Math.max(...data.categorySales.map(c => c.revenue), 1);

  const stats = [
    {
      title: "Receita Total",
      value: formatCurrency(data.summary.totalRevenue),
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Pedidos Pagos",
      value: data.summary.paidOrders.toString(),
      sub: `${data.summary.totalOrders} total`,
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(data.summary.avgTicket),
      icon: TrendingUp,
      color: "bg-purple-500",
    },
    {
      title: "Taxa de Conversão",
      value: `${data.summary.conversionRate.toFixed(1)}%`,
      sub: "pagos/total",
      icon: Percent,
      color: "bg-orange-500",
    },
  ];

  return (
    <PermissionGuard permission="reports.view">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Relatórios</h1>
          <p className="mt-2 text-slate-400">Análise de vendas e performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className="rounded-xl border bg-slate-950 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                <p className="mt-2 text-2xl font-bold text-slate-100">{stat.value}</p>
                {"sub" in stat && <p className="mt-1 text-xs text-slate-400">{stat.sub}</p>}
              </div>
              <div className={`rounded-lg p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de Receita */}
      <div className="mt-6 rounded-xl border bg-slate-950 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Receita Diária</h2>
        <div className="flex items-end justify-between gap-1 h-64">
          {data.dailyData.map((day, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1 group">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-brand-500 to-brand-400 transition-all relative"
                  style={{
                    height: `${(day.revenue / maxRevenue) * 100}%`,
                    minHeight: day.revenue > 0 ? "4px" : "1px",
                  }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white z-10">
                    {formatCurrency(day.revenue)}
                  </div>
                </div>
              </div>
              {data.period <= 30 && (
                <span className="text-[10px] text-slate-400 rotate-45 origin-left">
                  {new Date(day.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Vendas por Categoria */}
        <div className="rounded-xl border bg-slate-950 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Vendas por Categoria</h2>
          {data.categorySales.length === 0 ? (
            <p className="text-slate-400 text-sm">Nenhuma venda no período</p>
          ) : (
            <div className="space-y-3">
              {data.categorySales.map((cat) => (
                <div key={cat.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-100">{cat.name}</span>
                    <span className="text-slate-400">{formatCurrency(cat.revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${(cat.revenue / maxCatRevenue) * 100}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{cat.qty} unidades vendidas</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Métodos de Pagamento */}
        <div className="rounded-xl border bg-slate-950 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Métodos de Pagamento</h2>
          {data.paymentMethods.length === 0 ? (
            <p className="text-slate-400 text-sm">Nenhum pagamento no período</p>
          ) : (
            <div className="space-y-4">
              {data.paymentMethods.map((pm) => {
                const totalRevenue = data.paymentMethods.reduce((s, p) => s + p.revenue, 0);
                const pct = totalRevenue > 0 ? (pm.revenue / totalRevenue) * 100 : 0;
                return (
                  <div key={pm.method}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-slate-100 capitalize">
                        {pm.method === "pix" ? "PIX" : pm.method === "stripe" ? "Cartão (Stripe)" : pm.method === "paypal" ? "PayPal" : "Mercado Pago"}
                      </span>
                      <span className="text-sm text-slate-400">
                        {pm.count} pedidos · {formatCurrency(pm.revenue)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-900">
                      <div
                        className={`h-2 rounded-full ${
                          pm.method === "pix" ? "bg-green-500" :
                          pm.method === "stripe" ? "bg-purple-500" :
                          pm.method === "paypal" ? "bg-blue-600" : "bg-blue-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{pct.toFixed(1)}% da receita</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status dos Pedidos */}
      <div className="mt-6 rounded-xl border bg-slate-950 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Status dos Pedidos</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(data.statusCounts).map(([status, count]) => (
            <div key={status} className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-slate-100">{count}</p>
              <p className={`text-sm font-medium ${
                status === "PAID" ? "text-green-600" :
                status === "PENDING" ? "text-yellow-600" :
                status === "CANCELLED" ? "text-red-600" : "text-slate-400"
              }`}>
                {status}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Produtos */}
      <div className="mt-6 rounded-xl border bg-slate-950 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Top 10 Produtos</h2>
        {data.productSales.length === 0 ? (
          <p className="text-slate-400 text-sm">Nenhuma venda no período</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="py-2 text-left text-xs font-medium uppercase text-slate-400">#</th>
                  <th className="py-2 text-left text-xs font-medium uppercase text-slate-400">Produto</th>
                  <th className="py-2 text-right text-xs font-medium uppercase text-slate-400">Qtd</th>
                  <th className="py-2 text-right text-xs font-medium uppercase text-slate-400">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.productSales.map((product, i) => (
                  <tr key={product.name} className="hover:bg-slate-900">
                    <td className="py-3 text-sm text-slate-400">{i + 1}</td>
                    <td className="py-3 text-sm font-medium text-slate-100">{product.name}</td>
                    <td className="py-3 text-right text-sm text-slate-400">{product.qty}</td>
                    <td className="py-3 text-right text-sm font-medium text-slate-100">{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </PermissionGuard>
  );
}
