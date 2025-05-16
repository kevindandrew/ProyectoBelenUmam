// app/administrador/layout.js
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
          <div className="p-4 text-xl font-bold border-b border-slate-700">
            UMAM
          </div>
          <nav className="mt-4 space-y-1">
            {[
              "Usuarios",
              "Sucursales",
              "Cursos",
              "Horarios",
              "Estudiantes",
              "Listas",
              "Reportes",
              "Certificados",
            ].map((item) => (
              <a
                key={item}
                href="#"
                className={`block px-6 py-2 hover:bg-teal-400 `}
              >
                {item}
              </a>
            ))}
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
