"use client";

import { useState } from "react";
import AdminSidebarDrawer from "@/components/admin/AdminSidebarDrawer";
import { SidebarToggleIcon } from "@/components/admin/SidebarToggleIcon";

export default function AdminLayoutClient({
  user,
  children,
}: {
  user: any;
  children: React.ReactNode;
}) {
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col">
      {/* Responsive Side Drawer */}
      <AdminSidebarDrawer
        user={user}
        isDesktopOpen={isDesktopOpen}
        setIsDesktopOpen={setIsDesktopOpen}
      />

      {/* Main Content Area smoothly transitioning based on sidebar state */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out pt-16 lg:pt-0 ${
          isDesktopOpen ? "lg:pl-72" : "lg:pl-0"
        }`}
      >
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Desktop Toggle Button when Sidebar is collapsed */}
          {!isDesktopOpen && (
            <div className="hidden lg:flex items-center gap-3 mb-6 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => setIsDesktopOpen(true)}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all flex items-center gap-2 font-bold text-xs cursor-pointer group"
                title="Expand Navigation Sidebar"
              >
                <SidebarToggleIcon className="w-5 h-5 text-[#1d4ed8] group-hover:scale-105 transition-transform" />
                <span>Show Sidebar</span>
              </button>
            </div>
          )}

          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} AidLearn Analytics Ltd. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
