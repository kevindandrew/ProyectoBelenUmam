import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "@/components/LogoutButton";
import { redirect } from "next/navigation";
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
  // Obtener cookies con await
  const cookieStore = cookies();
  const userDataCookie = await cookieStore.get("user_data")?.value;
  const userData = await getUserData();

  if (!userDataCookie) {
    redirect("/login");
  }

  let nombreCompleto = "";
  let cargo = "";

  try {
    const parsedUserData = JSON.parse(userDataCookie);

    // Verificar rol de administrador (1)
    if (parsedUserData.rol_id !== 1) {
      const roleRoutes = {
        1: "/administrador",
        2: "/encargado",
        3: "/facilitador",
      };
      redirect(roleRoutes[parsedUserData.rol_id] || "/login");
    }
    console.log("User Data:", parsedUserData);
    nombreCompleto = `${parsedUserData.nombres} ${parsedUserData.apellido}`;
    cargo = parsedUserData.cargo || "Administrador";
  } catch (error) {
    // Si hay error al parsear o falta algún dato, redirigir al login
    redirect("/login");
  }

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
            <Link
              href="/administrador/backups"
              className="block px-6 py-2 hover:bg-teal-400"
            >
              Backups
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
