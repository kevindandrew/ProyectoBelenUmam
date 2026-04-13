"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  DatabaseBackup,
  FileText,
  GraduationCap,
  Home,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  X,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default function AppShell({
  children,
  links,
  nombreCompleto,
  cargo,
  homeHref = "/",
}) {
  const pathname = usePathname();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const getLinkIcon = (label = "", href = "") => {
    const key = `${label} ${href}`.toLowerCase();

    if (key.includes("usuario")) return Users;
    if (key.includes("sucursal")) return Building2;
    if (key.includes("curso")) return BookOpen;
    if (key.includes("horario")) return CalendarDays;
    if (key.includes("estudiante")) return GraduationCap;
    if (key.includes("lista")) return ClipboardList;
    if (key.includes("reporte")) return BarChart3;
    if (key.includes("certificado")) return BadgeCheck;
    if (key.includes("backup")) return DatabaseBackup;
    return FileText;
  };

  const isActiveLink = (href) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex transform flex-col border-r border-slate-700 bg-slate-800 text-white shadow-2xl transition-all duration-300 md:relative md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${desktopCollapsed ? "md:w-20" : "md:w-72"} w-72`}
      >
        <div className="border-b border-slate-700 p-3">
          <div className="flex items-center gap-3">
            <Link
              href={homeHref}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-lg font-bold text-white"
              title="Inicio"
            >
              U
            </Link>

            {!desktopCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-wide text-white">
                  UMAM
                </p>
                <p className="truncate text-xs text-slate-300">Panel</p>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto h-8 w-8 items-center justify-center rounded-full border border-slate-600 bg-slate-700 text-slate-100 transition hover:bg-slate-600 md:hidden flex"
              aria-label="Cerrar menu"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <Link
            href={homeHref}
            className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
              pathname === homeHref
                ? "border-teal-300 bg-teal-500/20 text-white"
                : "border-transparent text-slate-200 hover:border-slate-600 hover:bg-slate-700 hover:text-white"
            }`}
            title="Inicio"
          >
            <Home size={18} className="shrink-0" />
            {!desktopCollapsed && (
              <span className="truncate text-sm">Inicio</span>
            )}
          </Link>

          {links.map(({ href, label }) => {
            const Icon = getLinkIcon(label, href);
            const active = isActiveLink(href);

            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                  active
                    ? "border-teal-300 bg-teal-500/20 text-white"
                    : "border-transparent text-slate-200 hover:border-slate-600 hover:bg-slate-700 hover:text-white"
                }`}
                title={label}
              >
                <Icon size={18} className="shrink-0" />
                {!desktopCollapsed && (
                  <span className="truncate text-sm">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-700 p-3">
          <div
            className={`rounded-xl border border-slate-600 bg-slate-700/70 p-3 ${
              desktopCollapsed ? "text-center" : ""
            }`}
          >
            {!desktopCollapsed && (
              <>
                <p className="truncate text-xs uppercase tracking-wide text-slate-300">
                  {cargo}
                </p>
                <p className="truncate text-sm font-semibold text-white">
                  {nombreCompleto}
                </p>
              </>
            )}
            <LogoutButton
              className={`mt-2 rounded-lg border border-red-400/40 bg-red-500/10 px-2 py-1.5 text-sm text-red-100 hover:bg-red-500/20 hover:text-white ${
                desktopCollapsed ? "w-full px-0" : ""
              }`}
              compact={desktopCollapsed}
            />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b bg-white shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="p-2 rounded hover:bg-gray-100 text-gray-700 md:hidden"
              aria-label="Abrir menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <button
              onClick={() => setDesktopCollapsed((prev) => !prev)}
              className="hidden p-2 rounded hover:bg-gray-100 text-gray-700 md:inline-flex"
              aria-label="Alternar menu"
            >
              {desktopCollapsed ? (
                <PanelLeftOpen size={20} />
              ) : (
                <PanelLeftClose size={20} />
              )}
            </button>
          </div>

          <div className="relative">
            <button className="flex items-center text-sm text-gray-700 hover:text-gray-900 peer">
              {nombreCompleto.toUpperCase()} ({cargo.toUpperCase()})
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-100 p-6">{children}</main>

        {/* Footer */}
        <footer className="h-10 bg-slate-800 text-white text-sm flex items-center justify-center shrink-0">
          Copyright © 2025 BMSR - DASI All rights reserved. DASI - UINA
        </footer>
      </div>
    </div>
  );
}
