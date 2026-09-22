import AdminSidebarDrawer from "@/components/admin/AdminSidebarDrawer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col lg:flex-row">
      {/* Side Drawer (Desktop Fixed Sidebar + Mobile Slide-Over) */}
      <AdminSidebarDrawer user={session.user} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 pt-16 lg:pt-0">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} AidLearn Analytics Ltd. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
