"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default function AppShell({
  children,
  links,
  nombreCompleto,
  cargo,
  homeHref = "/",
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside
        className={`bg-slate-800 flex flex-col justify-between transition-all duration-300 ${
          sidebarOpen ? "w-50" : "w-0 overflow-hidden"
        }`}
      >
        <div className="text-white min-w-[200px]">
          <Link
            href={homeHref}
            className="block p-4 text-2xl font-bold text-center border-b border-slate-700 hover:bg-slate-700 transition-colors"
          >
            UMAM
          </Link>
          <nav className="mt-4 space-y-2 font-sans">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-6 py-2 hover:bg-teal-400 whitespace-nowrap"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b bg-white shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-gray-100 text-gray-700"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="relative">
            <button className="flex items-center text-sm text-gray-700 hover:text-gray-900 peer">
              {nombreCompleto.toUpperCase()} ({cargo.toUpperCase()}) ▼
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden hover:block peer-focus:block">
              <LogoutButton className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left" />
            </div>
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
