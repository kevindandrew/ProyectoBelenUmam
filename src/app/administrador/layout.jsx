import Link from "next/link";

export const metadata = {
  title: "Administrador | UMAM",
  description: "Panel del administrador",
};

export default function AdministradorLayout({ children }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-50 bg-slate-800 flex flex-col justify-between">
        <div className="text-white">
          <div className="p-4 text-2xl font-bold text-center border-b border-slate-700">
            UMAM
          </div>
          <nav className="mt-4 space-y-2 font-sans">
            <Link
              href="/administrador/usuarios"
              className="block px-6 py-2 hover:bg-teal-400"
            >
              Usuarios
            </Link>
            <Link
              href="/administrador/sucursales"
              className="block px-6 py-2 hover:bg-teal-400"
            >
              Sucursales
            </Link>
            <Link
              href="/administrador/cursos"
              className="block px-6 py-2 hover:bg-teal-400"
            >
              Cursos
            </Link>
            <Link
              href="/administrador/horarios"
              className="block px-6 py-2 hover:bg-teal-400"
            >
              Horarios
            </Link>
            <Link
              href="/administrador/estudiantes"
              className="block px-6 py-2 hover:bg-teal-400"
            >
              Estudiantes
            </Link>
            <Link
              href="/administrador/listas"
              className="block px-6 py-2 hover:bg-teal-400"
            >
              Listas
            </Link>
            <Link
              href="/administrador/reportes"
              className="block px-6 py-2 hover:bg-teal-400"
            >
              Reportes
            </Link>
            <Link
              href="/administrador/certificados"
              className="block px-6 py-2 hover:bg-teal-400"
            >
              Certificados
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 border-b bg-white">
          <span></span>
          <div className="text-sm text-gray-700">Nombre Usuario ▼</div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-100 p-6">{children}</main>

        {/* Footer */}
        <footer className="h-10 bg-slate-800 text-white text-sm flex items-center justify-center">
          Copyright © 2025 BMSR - DASI All rights reserved. DASI - UINA
        </footer>
      </div>
    </div>
  );
}
