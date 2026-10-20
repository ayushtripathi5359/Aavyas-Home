"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, BedDouble, CalendarRange, ChevronLeft, FileText, Image as ImageIcon, LayoutDashboard, LogOut, Mail, MapPin,
  Menu, MessageSquareQuote, ScrollText, Settings, Sparkles, Users, X, type LucideIcon,
} from "lucide-react";
import { logout } from "@/actions/auth";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard, enquiries: Mail, pricing: CalendarRange, gallery: ImageIcon, rooms: BedDouble, amenities: Sparkles,
  testimonials: MessageSquareQuote, "website-content": FileText, location: MapPin, "contact-settings": BarChart3,
  users: Users, "audit-logs": ScrollText, settings: Settings,
};

export interface AdminLink { area: string; label: string }

export function AdminShell({ links, user, children }: { links: AdminLink[]; user: { name: string; role: string }; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const crumbs = pathname.split("/").filter(Boolean).slice(1);
  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-1 p-3">
      {links.map((l) => {
        const Icon = ICONS[l.area] ?? Settings;
        const active = pathname.startsWith(`/admin/${l.area}`);
        return (
          <Link
            key={l.area}
            href={`/admin/${l.area}`}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            title={l.label}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${active ? "bg-terracotta text-white" : "text-ivory/80 hover:bg-white/10"}`}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span className={collapsed ? "lg:sr-only" : ""}>{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-cream/40">
      {/* Desktop sidebar */}
      <aside className={`sticky top-0 hidden h-dvh shrink-0 flex-col bg-espresso text-ivory transition-[width] lg:flex ${collapsed ? "w-[4.5rem]" : "w-60"}`}>
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && <span className="font-serif text-xl">Aavya’s Home</span>}
          <button type="button" onClick={() => setCollapsed((c) => !c)} className="rounded-lg p-2 hover:bg-white/10" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <ChevronLeft className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button className="absolute inset-0 bg-espresso/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64 overflow-y-auto bg-espresso text-ivory">
            <div className="flex h-16 items-center justify-between px-4">
              <span className="font-serif text-xl">Aavya’s Home</span>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-beige bg-ivory/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-lg p-2 hover:bg-cream lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <nav aria-label="Breadcrumb" className="min-w-0 truncate text-sm text-espresso/70">
              <ol className="flex items-center gap-1.5">
                <li><Link href="/admin/dashboard" className="hover:text-terracotta">Admin</Link></li>
                {crumbs.map((c, i) => (
                  <li key={i} className="flex items-center gap-1.5 truncate">
                    <span aria-hidden>/</span>
                    <span className={i === crumbs.length - 1 ? "font-medium text-espresso" : ""}>{c.replace(/-/g, " ")}</span>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <Link href="/" target="_blank" className="hidden text-terracotta hover:underline sm:inline">View site</Link>
            <span className="hidden text-espresso/70 sm:inline">{user.name} · {user.role === "SUPER_ADMIN" ? "Super Admin" : "Manager"}</span>
            <button
              className="btn btn-outline btn-sm"
              onClick={async () => { await logout(); router.push("/admin/login"); router.refresh(); }}
            >
              <LogOut className="h-4 w-4" aria-hidden />Log out
            </button>
          </div>
        </header>
        <main id="admin-main" className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-4xl">{title}</h1>
      {children}
    </div>
  );
}
