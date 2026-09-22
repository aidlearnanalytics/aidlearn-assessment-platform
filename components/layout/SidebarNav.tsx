"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/assessments", label: "Assessments" },
  { href: "/admin/question-bank", label: "Question Bank" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/reports", label: "Reports" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "rounded bg-accentSoft px-2 py-1.5 text-sm font-medium text-accent"
                : "rounded px-2 py-1.5 text-sm text-ink/80 hover:bg-accentSoft hover:text-accent"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
