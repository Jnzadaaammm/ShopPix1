"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Tem acesso se for admin OU se tiver algum cargo de equipe (TEAM)
  const role = (session?.user as any)?.role;
  const hasTeamRole = role?.type === "TEAM";
  const hasAccess = session?.user?.isAdmin || hasTeamRole;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/admin");
    } else if (status === "authenticated" && !hasAccess) {
      router.replace("/");
    }
  }, [status, hasAccess, router]);

  if (status === "loading" || (status === "authenticated" && !hasAccess)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
          <p className="mt-2 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
