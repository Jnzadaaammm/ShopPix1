// Admin e sempre dinamico (nao pre-renderizar no build) para economizar RAM
export const dynamic = "force-dynamic";

import AdminGuard from "@/components/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <AdminMobileNav />
        <main className="lg:pl-64">
          <div className="min-h-screen">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}
