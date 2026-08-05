"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePolling } from "@/lib/use-polling";

interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  awaitingApproval: number;
  todayRevenue: number;
  yesterdayRevenue: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  conversionRate: number;
  productCount: number;
  lowStockCount: number;
  userCount: number;
  adminCount: number;
  recentOrders: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    paymentMethod: string;
    user?: { name: string | null; email: string | null };
    items: { productName: string | null; quantity: number; price: number }[];
  }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  dailyRevenue: { date: string; revenue: number }[];
}

function AdminDashboard() {
  const { data, loading } = usePolling<DashboardData>(
    () => fetch("/api/admin/dashboard").then(r => r.json())
  );

  const dashboard = data;

  const revenueChange = useMemo(() => {
    const yesterday = dashboard?.yesterdayRevenue || 0;
    const today = dashboard?.todayRevenue || 0;
    if (yesterday > 0) return ((today - yesterday) / yesterday) * 100;
    return today > 0 ? 100 : 0;
  }, [dashboard?.todayRevenue, dashboard?.yesterdayRevenue]);

  const maxRevenue = useMemo(() => {
    if (!dashboard?.dailyRevenue?.length) return 1;
    return Math.max(...dashboard.dailyRevenue.map(d => d.revenue), 1);
  }, [dashboard?.dailyRevenue]);

  const monthChange = useMemo(() => {
    const last = dashboard?.lastMonthRevenue || 0;
    const current = dashboard?.monthRevenue || 0;
    if (last > 0) return ((current - last) / last) * 100;
    return current > 0 ? 100 : 0;
  }, [dashboard?.monthRevenue, dashboard?.lastMonthRevenue]);

  const stats = useMemo(() => {
    if (!dashboard) return [];
    return [
      {
        title: "Receita Total",
        value: formatCurrency(dashboard.totalRevenue),
        icon: DollarSign,
        color: "bg-green-900/300",
        sub: `${dashboard.paidOrders} pedidos pagos`,
      },
      {
        title: "Receita Hoje",
        value: formatCurrency(dashboard.todayRevenue),
        icon: TrendingUp,
        color: "bg-emerald-500",
        sub: "vs ontem",
        change: revenueChange,
      },
      {
        title: "Receita do Mês",
        value: formatCurrency(dashboard.monthRevenue),
        icon: BarChart3,
        color: "bg-indigo-500",
        sub: "vs mês passado",
        change: monthChange,
      },
      {
        title: "Ticket Médio",
        value: formatCurrency(dashboard.paidOrders > 0 ? dashboard.totalRevenue / dashboard.paidOrders : 0),
        icon: BarChart3,
        color: "bg-blue-900/300",
        sub: "por pedido pago",
      },
      {
        title: "Aguardando Aprovação",
        value: dashboard.awaitingApproval.toString(),
        icon: Clock,
        color: "bg-orange-900/300",
        sub: `${dashboard.pendingOrders} pendentes`,
      },
      {
        title: "Taxa de Conversão",
        value: `${dashboard.conversionRate.toFixed(1)}%`,
        icon: TrendingUp,
        color: "bg-purple-500",
        sub: `${dashboard.paidOrders}/${dashboard.totalOrders} pedidos`,
      },
      {
        title: "Produtos",
        value: dashboard.productCount.toString(),
        icon: Package,
        color: "bg-purple-500",
        sub: dashboard.lowStockCount > 0 ? `${dashboard.lowStockCount} com estoque baixo` : "estoque OK",
      },
      {
        title: "Clientes",
        value: dashboard.userCount.toString(),
        icon: Users,
        color: "bg-pink-500",
        sub: `${dashboard.adminCount} admins`,
      },
    ];
  }, [dashboard, revenueChange, monthChange]);

  if (loading || !dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="mt-2 text-slate-400">Visão geral do seu e-commerce</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                <p className="mt-2 text-2xl font-bold text-slate-100">{stat.value}</p>
                <div className="mt-1 flex items-center gap-1">
                  {"change" in stat && stat.change !== undefined && (
                    <span className={`flex items-center text-xs font-medium ${
                      stat.change >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {stat.change >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(stat.change).toFixed(1)}%
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{stat.sub}</span>
                </div>
              </div>
              <div className={`rounded-lg p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de Receita 7 dias */}
      <div className="mt-6 card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Receita - Últimos 7 dias</h2>
          <Link href="/admin/relatorios" className="text-sm text-brand-400 hover:underline">
            Ver relatórios
          </Link>
        </div>
        <div className="flex items-end justify-between gap-2 h-48">
          {dashboard.dailyRevenue.map((day, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-brand-500 to-brand-400 transition-all hover:from-brand-600 hover:to-brand-500 relative group"
                  style={{ height: `${(day.revenue / maxRevenue) * 100}%`, minHeight: day.revenue > 0 ? "8px" : "2px" }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-xs text-white">
                    {formatCurrency(day.revenue)}
                  </div>
                </div>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(day.date).toLocaleDateString("pt-BR", { weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Pedidos Recentes */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Pedidos Recentes</h2>
            <Link href="/admin/pedidos" className="text-sm text-brand-400 hover:underline">
              Ver todos
            </Link>
          </div>
          {dashboard.recentOrders.length === 0 ? (
            <p className="text-slate-400 text-sm">Nenhum pedido ainda</p>
          ) : (
            <div className="space-y-3">
              {dashboard.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      order.status === "PAID" ? "bg-green-900/40" :
                      order.status === "PENDING" ? "bg-yellow-100" :
                      order.status === "CANCELLED" ? "bg-red-900/40" : "bg-slate-900"
                    }`}>
                      {order.status === "PAID" ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : order.status === "PENDING" ? (
                        <Clock className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <Package className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-100">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-slate-400">
                        {order.user?.name || order.user?.email || "Cliente"} ·{" "}
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-100">{formatCurrency(order.total)}</p>
                    <span className={`text-xs font-medium ${
                      order.status === "PAID" ? "text-green-400" :
                      order.status === "PENDING" ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Produtos + Alertas de Estoque */}
        <div className="space-y-6">
          {/* Top Produtos */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">Produtos Mais Vendidos</h2>
            {dashboard.topProducts.length === 0 ? (
              <p className="text-slate-400 text-sm">Nenhuma venda ainda</p>
            ) : (
              <div className="space-y-3">
                {dashboard.topProducts.map((product, i) => (
                  <div key={product.name} className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-yellow-100 text-yellow-300" :
                      i === 1 ? "bg-slate-900 text-slate-300" :
                      i === 2 ? "bg-orange-900/40 text-orange-300" : "bg-slate-900 text-slate-400"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-100 truncate">{product.name}</p>
                      <p className="text-xs text-slate-400">{product.qty} vendidos</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-100">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alerta de Estoque Baixo */}
          {dashboard.lowStockCount > 0 && (
            <div className="rounded-xl border border-orange-900/50 bg-orange-900/30 p-6">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <h2 className="text-lg font-semibold text-orange-900">Estoque Baixo</h2>
              </div>
              <p className="text-sm text-orange-300">
                {dashboard.lowStockCount} produto(s) com estoque baixo ou esgotado.
              </p>
              <Link href="/admin/produtos" className="mt-3 block text-sm text-orange-300 hover:underline">
                Gerenciar estoque →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Links Rápidos */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/produtos" className="flex items-center gap-3 card p-4 hover:shadow-md transition-shadow">
          <div className="rounded-lg bg-purple-900/40 p-2.5">
            <Package className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="font-medium text-slate-100 text-sm">Produtos</p>
            <p className="text-xs text-slate-400">Gerenciar catálogo</p>
          </div>
        </Link>
        <Link href="/admin/pedidos" className="flex items-center gap-3 card p-4 hover:shadow-md transition-shadow">
          <div className="rounded-lg bg-blue-900/40 p-2.5">
            <ShoppingCart className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-slate-100 text-sm">Pedidos</p>
            <p className="text-xs text-slate-400">{dashboard.pendingOrders} pendentes</p>
          </div>
        </Link>
        <Link href="/admin/clientes" className="flex items-center gap-3 card p-4 hover:shadow-md transition-shadow">
          <div className="rounded-lg bg-pink-100 p-2.5">
            <Users className="h-5 w-5 text-pink-600" />
          </div>
          <div>
            <p className="font-medium text-slate-100 text-sm">Clientes</p>
            <p className="text-xs text-slate-400">{dashboard.userCount} cadastrados</p>
          </div>
        </Link>
        <Link href="/admin/reembolsos" className="flex items-center gap-3 card p-4 hover:shadow-md transition-shadow">
          <div className="rounded-lg bg-red-900/40 p-2.5">
            <RefreshCw className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="font-medium text-slate-100 text-sm">Reembolsos</p>
            <p className="text-xs text-slate-400">Solicitações</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return <AdminDashboard />;
}
