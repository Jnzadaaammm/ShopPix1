"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderOpen,
  RefreshCw,
  BarChart3,
  Settings,
  Store,
  Ticket,
  Crown,
  MessageSquare,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: string; // undefined = qualquer admin vê
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package, permission: "products.manage" },
  { href: "/admin/categorias", label: "Categorias", icon: FolderOpen, permission: "categories.manage" },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart, permission: "orders.view" },
  { href: "/admin/clientes", label: "Clientes", icon: Users, permission: "customers.view" },
  { href: "/admin/cupons", label: "Cupons", icon: Ticket, permission: "coupons.manage" },
  { href: "/admin/reembolsos", label: "Reembolsos", icon: RefreshCw, permission: "refunds.manage" },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, permission: "reports.view" },
  { href: "/admin/tickets", label: "Tickets", icon: MessageSquare },
  { href: "/admin/cargos", label: "Cargos", icon: Crown, permission: "roles.manage" },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, permission: "settings.manage" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userPerms: string[] = (session?.user as any)?.role?.permissions || [];
  const hasAllAccess = userPerms.includes("*");

  const canSee = (item: NavItem) => {
    if (!item.permission) return true; // Dashboard, Tickets — qualquer admin
    if (hasAllAccess) return true;
    return userPerms.includes(item.permission);
  };

  const visibleItems = navItems.filter(canSee);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-700 bg-slate-950 lg:block">
      <div className="flex h-16 items-center gap-2 border-b border-slate-700 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <Store className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-100">Admin</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-900 hover:text-slate-100"
        >
          <Store className="h-4 w-4" />
          Ver Loja
        </Link>
      </div>
    </aside>
  );
}
