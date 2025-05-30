import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "@/components/LogoutButton";

export const metadata = {
  title: "Administrador | UMAM",
  description: "Panel del administrador",
};

async function getUserData() {
  const cookieStore = cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await fetch("https://api-umam-1.onrender.com/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

export default async function AdministradorLayout({ children }) {
  const userData = await getUserData();

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No autorizado</h1>
          <Link href="/login" className="text-blue-500 hover:underline">
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  // Ajustado según el esquema proporcionado
  const nombreCompleto = `${userData.nombres} ${userData.ap_paterno}`;
  const cargo = userData.rol?.nombre || "Administrador";

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
        <footer className="h-10 bg-slate-800 text-white text-sm flex items-center justify-center">
          Copyright © 2025 BMSR - DASI All rights reserved. DASI - UINA
        </footer>
      </div>
    </div>
  );
}
