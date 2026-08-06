"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, User, LogOut, Package, Menu, X, LayoutDashboard, Download, Heart, Ticket as TicketIcon, Search } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useState, useEffect } from "react";
import { getRoleColorClass } from "@/lib/roles";
import ImageWithFallback from "@/components/ImageWithFallback";

function getRoleBadgeClass(color: string) {
  return getRoleColorClass(color).badge;
}

const navItems = [
  { href: "/", label: "Início" },
  { href: "/produtos", label: "Catálogo" },
  { href: "/faq", label: "FAQ" },
];

export default function Header() {
  const { data: session } = useSession();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const user = session?.user as any;
  const isTeam = user?.role?.type === "TEAM";

  return (
    <header
      className={`fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 rounded-2xl border transition-all duration-300 md:top-6 ${
        scrolled
          ? "border-slate-700/60 bg-slate-950/90 shadow-2xl shadow-black/30 backdrop-blur-xl"
          : "border-slate-800/40 bg-slate-950/70 backdrop-blur-lg"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <img
            src="/logo.svg"
            alt="ShopPix"
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="text-lg font-bold tracking-tight text-slate-100">ShopPix</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
            >
              {item.label}
            </Link>
          ))}
          {session && (
            <>
              <Link href="/pedidos" prefetch className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100">
                Pedidos
              </Link>
              <Link href="/tickets" prefetch className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100">
                Suporte
              </Link>
            </>
          )}
          {isTeam && (
            <Link href="/admin" prefetch className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/produtos"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:text-slate-100"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </Link>

          <Link
            href="/carrinho"
            className="relative rounded-xl p-2 text-slate-400 transition-colors hover:text-slate-100"
            aria-label="Carrinho"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {session ? (
            <Link href="/perfil" className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-slate-800" title="Meu Perfil">
              {session.user?.image ? (
                <ImageWithFallback
                  src={session.user.image}
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-full ring-2 ring-brand-500/50"
                />
              ) : (
                <User className="h-5 w-5 text-slate-400" />
              )}
            </Link>
          ) : (
            <Link href="/login" className="btn-primary hidden px-4 py-2 text-sm md:inline-flex">
              Entrar
            </Link>
          )}

          <button
            className="rounded-xl p-2 text-slate-400 transition-colors hover:text-slate-100 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-800/60 bg-slate-950/95 px-4 py-4 md:hidden animate-slide-in">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {session && (
              <>
                <Link href="/pedidos" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900" onClick={() => setMobileOpen(false)}>
                  <Package className="h-4 w-4" /> Meus Pedidos
                </Link>
                <Link href="/tickets" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900" onClick={() => setMobileOpen(false)}>
                  <TicketIcon className="h-4 w-4" /> Suporte
                </Link>
                <Link href="/favoritos" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900" onClick={() => setMobileOpen(false)}>
                  <Heart className="h-4 w-4" /> Favoritos
                </Link>
                <Link href="/tickets" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900" onClick={() => setMobileOpen(false)}>
                  <TicketIcon className="h-4 w-4" /> Suporte
                </Link>
              </>
            )}
            {isTeam && (
              <Link href="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900" onClick={() => setMobileOpen(false)}>
                <LayoutDashboard className="h-4 w-4" /> Admin
              </Link>
            )}
            {session ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-slate-900"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            ) : (
              <Link href="/login" className="btn-primary text-sm mt-2" onClick={() => setMobileOpen(false)}>
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
