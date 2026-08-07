"use client";

import { useState } from "react";
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
  Menu,
  X,
  Store,
  Ticket,
  Crown,
  MessageSquare,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: string;
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

export default function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const userPerms: string[] = (session?.user as any)?.role?.permissions || [];
  const hasAllAccess = userPerms.includes("*");

  const canSee = (item: NavItem) => {
    if (!item.permission) return true;
    if (hasAllAccess) return true;
    return userPerms.includes(item.permission);
  };

  const visibleItems = navItems.filter(canSee);

  return (
    <div className="lg:hidden">
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-700 bg-slate-950 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-slate-100">Admin</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-900"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="absolute left-0 right-0 z-30 border-b border-slate-700 bg-slate-950 shadow-lg">
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
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 border-b border-slate-800 px-4 py-3 text-sm font-medium ${
                  isActive
                    ? "bg-slate-900/60 text-brand-400"
                    : "text-slate-400 hover:bg-slate-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
