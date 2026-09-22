"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { SidebarToggleIcon } from "@/components/admin/SidebarToggleIcon";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Sparkles,
  LogOut,
  ChevronRight,
  ExternalLink,
  Layers,
  Award,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  exact?: boolean;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AdminSidebarDrawerProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  isDesktopOpen: boolean;
  setIsDesktopOpen: (open: boolean) => void;
}

export default function AdminSidebarDrawer({
  isDesktopOpen,
  setIsDesktopOpen,
}: AdminSidebarDrawerProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const navSections: NavSection[] = [
    {
      title: "Core Overview",
      items: [
        {
          label: "Executive Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
          exact: true,
          badge: "Live",
        },
      ],
    },
    {
      title: "Client Management",
      items: [
        {
          label: "Company Directory",
          href: "/admin/companies",
          icon: Building2,
          exact: false,
        },
      ],
    },
    {
      title: "Curriculum & Tests",
      items: [
        {
          label: "Question Bank",
          href: "/admin/question-bank",
          icon: BookOpen,
          exact: false,
        },
      ],
    },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const renderNavList = () => (
    <div className="flex flex-col h-full justify-between bg-white select-none">
      {/* ── Fixed Sidebar Header with Brand & Toggle In/Out Button ──── */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 shrink-0">
        <BrandLogo subtitle="Admin" href="/admin" />

        <button
          type="button"
          onClick={() => {
            if (mobileOpen) setMobileOpen(false);
            else setIsDesktopOpen(false);
          }}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Collapse Sidebar"
          aria-label="Collapse Sidebar"
        >
          <SidebarToggleIcon className="w-5 h-5 text-[#1d4ed8]" />
        </button>
      </div>

      {/* ── Scrollable Navigation Body ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 overscroll-contain">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              {section.title}
            </span>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      active
                        ? "bg-blue-50/80 text-[#1d4ed8] border border-blue-100 shadow-2xs"
                        : "text-slate-600 hover:text-[#0f172a] hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          active
                            ? "bg-[#1d4ed8] text-white shadow-2xs"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          active ? "text-[#1d4ed8]" : "text-slate-300 group-hover:translate-x-0.5"
                        }`}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quick Portals Sub-Section */}
        <div className="space-y-1.5 pt-2">
          <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Quick Portals
          </span>
          <div className="space-y-1">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-[#0f172a] hover:bg-slate-100/80 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-slate-200">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <span>Candidate Portal</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Open &rarr;</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Clean Bottom Sign Out (User profile details removed) ────── */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/60 shrink-0">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-600 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── 1. Desktop Sidebar Drawer (Visible on lg+) ──────────────── */}
      <aside
        className={`hidden lg:flex flex-col w-72 fixed inset-y-0 left-0 bg-white border-r border-slate-200 z-30 shadow-2xs transition-transform duration-300 ease-in-out ${
          isDesktopOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderNavList()}
      </aside>

      {/* ── 2. Mobile Top Bar (Visible on < lg) with Left Toggle Button ─ */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30 px-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer flex items-center justify-center"
            title="Open Menu"
            aria-label="Open Menu"
          >
            <SidebarToggleIcon className="w-5 h-5 text-[#1d4ed8]" />
          </button>
          <BrandLogo subtitle="Admin" href="/admin" />
        </div>
      </header>

      {/* ── 3. Mobile Slide-Over Drawer Opening from the LEFT ───────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Slide-over Drawer strictly from the LEFT */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {renderNavList()}
          </div>
        </div>
      )}
    </>
  );
}
