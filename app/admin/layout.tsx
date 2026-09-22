import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-[#0f172a]">
      <AdminNav />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} AidLearn Analytics Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
