"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BrandLogo } from "@/components/common/BrandLogo";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Sparkles,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  PlusCircle,
  Database,
  Layers,
  Activity,
  Award,
} from "lucide-react";

interface AdminSidebarDrawerProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export default function AdminSidebarDrawer({ user }: AdminSidebarDrawerProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
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

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Header & Brand */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <BrandLogo subtitle="Admin Console" href="/admin" />
          {mobileOpen && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="px-3 space-y-6">
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

          {/* Quick Direct Links Section */}
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
      </div>

      {/* Bottom User Profile & Sign Out */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#1d4ed8] flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#0f172a] truncate">
                {user?.name || "AidLearn Admin"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email || "admin@aidlearn.com"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              <ShieldCheck className="w-3 h-3" />
              <span>Super Admin</span>
            </span>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── 1. Desktop Fixed Sidebar Drawer (Visible on lg+) ───────────── */}
      <aside className="hidden lg:flex flex-col w-72 fixed inset-y-0 left-0 bg-white border-r border-slate-200 z-30 shadow-2xs">
        {navContent}
      </aside>

      {/* ── 2. Mobile Top Navigation Bar (Visible on < lg) ──────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30 px-4 flex items-center justify-between shadow-2xs">
        <BrandLogo subtitle="Admin" href="/admin" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <Menu className="w-5 h-5 text-[#1d4ed8]" />
            <span className="text-xs font-bold text-[#0f172a]">Menu</span>
          </button>
        </div>
      </header>

      {/* ── 3. Mobile Slide-Over Drawer with Overlay ───────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Slide-over Content */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
