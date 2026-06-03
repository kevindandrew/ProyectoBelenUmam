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
  ClipboardList,
  Clock,
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
    if (key.includes("control") || key.includes("horas")) return Clock;

    return FileText;
  };

  const isActiveLink = (href) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex h-screen bg-[#F5F5F5]">
      {/* Overlay móvil */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex transform flex-col
        border-r border-[#C5A059]/20
        bg-[#1E1E20]
        text-[#FFFFFF]
        shadow-2xl
        transition-all duration-300
        md:relative md:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        ${desktopCollapsed ? "md:w-20" : "md:w-72"}
        w-72`}
      >
        {/* Header sidebar */}
        <div className="border-b border-[#C5A059] p-3">
          <div className="flex items-center gap-3">
            <Link
              href={homeHref}
              className="flex h-10 w-20 items-center justify-center rounded-xl"
              title="Inicio"
            >
              <img
                src="/LOGO_UMAM.png"
                alt="UMAM"
                className="h-10 w-auto object-contain"
              />
            </Link>

            {!desktopCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-wide text-[#FFFFFF]">
                  UMAM
                </p>

                <p className="truncate text-xs text-[#FFFFFF]/70">
                  Panel Administrativo
                </p>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-[#C5A059]/30 bg-[#181818] text-[#FFFFFF] hover:bg-[#C5A059]/20 md:hidden"
              aria-label="Cerrar menú"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <Link
            href={homeHref}
            title="Inicio"
            className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
              pathname === homeHref
                ? "border-[#C5A059] bg-[#C5A059]/20 text-[#FFFFFF]"
                : "border-transparent text-[#FFFFFF]/80 hover:border-[#C5A059]/30 hover:bg-[#181818] hover:text-[#FFFFFF]"
            }`}
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
                title={label}
                className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                  active
                    ? "border-[#C5A059] bg-[#C5A059]/20 text-[#FFFFFF]"
                    : "border-transparent text-[#FFFFFF]/80 hover:border-[#C5A059]/30 hover:bg-[#181818] hover:text-[#FFFFFF]"
                }`}
              >
                <Icon size={18} className="shrink-0" />

                {!desktopCollapsed && (
                  <span className="truncate text-sm">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="border-t border-[#C5A059]/20 p-3">
          <div
            className={`rounded-xl border border-[#C5A059]/20 bg-[#181818] p-3 ${
              desktopCollapsed ? "text-center" : ""
            }`}
          >
            {!desktopCollapsed && (
              <>
                <p className="truncate text-xs uppercase tracking-wide text-[#FFFFFF]/70">
                  {cargo}
                </p>

                <p className="truncate text-sm font-semibold text-[#FFFFFF]">
                  {nombreCompleto}
                </p>
              </>
            )}

            <LogoutButton
              compact={desktopCollapsed}
              className={`mt-2 rounded-lg border border-[#C5A059]/30 bg-[#C5A059]/10 px-2 py-1.5 text-sm text-[#FFFFFF] transition hover:bg-[#C5A059]/20 ${
                desktopCollapsed ? "w-full px-0" : ""
              }`}
            />
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="h-14 shrink-0 border-b border-[#C5A059]/20 bg-white px-4">
          <div className="flex h-full items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileOpen((prev) => !prev)}
                className="rounded p-2 text-gray-700 hover:bg-[#C5A059]/10 md:hidden"
                aria-label="Abrir menú"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>

              <button
                onClick={() => setDesktopCollapsed((prev) => !prev)}
                className="hidden rounded p-2 text-gray-700 hover:bg-[#C5A059]/10 md:inline-flex"
                aria-label="Alternar menú"
              >
                {desktopCollapsed ? (
                  <PanelLeftOpen size={20} />
                ) : (
                  <PanelLeftClose size={20} />
                )}
              </button>
            </div>

            <div>
              <button className="text-sm font-medium text-gray-700 hover:text-gray-900">
                {nombreCompleto.toUpperCase()} ({cargo.toUpperCase()})
              </button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-auto bg-[#F5F5F5] p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="flex h-10 shrink-0 items-center justify-center border-t border-[#C5A059]/20 bg-[#1E1E20] text-sm text-[#FFFFFF]">
          Copyright © 2025 BMSR - DASI All rights reserved.
        </footer>
      </div>
    </div>
  );
}
