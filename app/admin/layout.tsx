import SidebarNav from "@/components/layout/SidebarNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <aside className="w-full shrink-0 border-b border-ink/10 p-4 sm:w-56 sm:border-b-0 sm:border-r">
        <p className="mb-6 px-2 text-sm font-semibold">AidLearn Analytics</p>
        <SidebarNav />
      </aside>
      <main className="flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
