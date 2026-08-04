"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
}

/**
 * Guarda de permissão para páginas admin.
 * - Enquanto a sessão carrega, mostra um placeholder.
 * - Se o usuário não tiver a permissão, redireciona para a home.
 */
export default function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const userPerms: string[] = (session?.user as any)?.role?.permissions || [];
  const hasAccess = userPerms.includes("*") || userPerms.includes(permission);

  useEffect(() => {
    if (status !== "loading" && !hasAccess) {
      router.replace("/");
    }
  }, [status, hasAccess, router]);

  if (status === "loading" || !hasAccess) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  return <>{children}</>;
}
