"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, User, LogOut, Package, Menu, X, LayoutDashboard, Download, Heart, Ticket as TicketIcon } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useState, useEffect } from "react";
import { getRoleColorClass } from "@/lib/roles";
import ImageWithFallback from "@/components/ImageWithFallback";

function getRoleBadgeClass(color: string) {
  return getRoleColorClass(color).badge;
}

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
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-slate-800 bg-slate-950/90 shadow-lg shadow-black/20 backdrop-blur-xl"
          : "border-slate-800/50 bg-slate-950/80 backdrop-blur-lg"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <img
            src="/logo.png"
            alt="ShopPix"
            className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-brand-500/30"
          />
          <span className="text-xl font-bold text-slate-100">ShopPix</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/" prefetch className="text-sm font-medium text-slate-300 transition-colors hover:text-brand-400">
            Início
          </Link>
          <Link href="/produtos" prefetch className="text-sm font-medium text-slate-300 transition-colors hover:text-brand-400">
            Produtos
          </Link>
          {session && (
            <>
              <Link href="/pedidos" prefetch className="text-sm font-medium text-slate-300 transition-colors hover:text-brand-400">
                Meus Pedidos
              </Link>
              <Link href="/downloads" prefetch className="text-sm font-medium text-slate-300 transition-colors hover:text-brand-400">
                Meus Downloads
              </Link>
              <Link href="/favoritos" prefetch className="text-sm font-medium text-slate-300 transition-colors hover:text-brand-400">
                Favoritos
              </Link>
              <Link href="/tickets" prefetch className="text-sm font-medium text-slate-300 transition-colors hover:text-brand-400">
                Suporte
              </Link>
            </>
          )}
          {isTeam && (
            <Link href="/admin" prefetch className="text-sm font-medium text-slate-300 transition-colors hover:text-brand-400">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/carrinho"
            className="relative rounded-xl p-2 text-slate-300 transition-colors hover:bg-slate-800"
            aria-label="Carrinho"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white ring-2 ring-slate-950">
                {itemCount}
              </span>
            )}
          </Link>

          {session ? (
            <div className="hidden items-center gap-3 md:flex">
              {isTeam && (
                <Link href="/admin" className="rounded-xl p-2 text-slate-300 transition-colors hover:bg-slate-800" title="Admin">
                  <LayoutDashboard className="h-5 w-5" />
                </Link>
              )}
              <Link href="/perfil" className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-slate-800" title="Meu Perfil">
                {session.user?.image ? (
                  <ImageWithFallback
                    src={session.user.image}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-brand-500"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
                    <User className="h-4 w-4 text-brand-400" />
                  </div>
                )}
                <span className="text-sm font-medium text-slate-200">
                  {session.user?.name?.split(" ")[0]}
                </span>
                {user?.role && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeClass(user.role.color)}`}>
                    {user.role.name}
                  </span>
                )}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary hidden text-sm md:inline-flex">
              Entrar
            </Link>
          )}

          <button
            className="rounded-xl p-2 text-slate-300 transition-colors hover:bg-slate-800 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 md:hidden animate-slide-in">
          <nav className="flex flex-col gap-3">
            <Link href="/" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900" onClick={() => setMobileOpen(false)}>
              Início
            </Link>
            <Link href="/produtos" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900" onClick={() => setMobileOpen(false)}>
              Produtos
            </Link>
            {session && (
              <>
                <Link href="/pedidos" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900" onClick={() => setMobileOpen(false)}>
                  <Package className="h-4 w-4" /> Meus Pedidos
                </Link>
                <Link href="/downloads" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900" onClick={() => setMobileOpen(false)}>
                  <Download className="h-4 w-4" /> Meus Downloads
                </Link>
                <Link href="/favoritos" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900" onClick={() => setMobileOpen(false)}>
                  <Heart className="h-4 w-4" /> Favoritos
                </Link>
                <Link href="/tickets" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900" onClick={() => setMobileOpen(false)}>
                  <TicketIcon className="h-4 w-4" /> Suporte
                </Link>
                <Link href="/perfil" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900" onClick={() => setMobileOpen(false)}>
                  <User className="h-4 w-4" /> Meu Perfil
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
              <Link href="/login" className="btn-primary text-sm" onClick={() => setMobileOpen(false)}>
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
