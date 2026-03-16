import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
export const metadata = {
  title: "UMAM - Encargado",
  description: "Panel del encargado",
};

const encargadoLinks = [
  { href: "/encargado/horarios", label: "Horarios" },
  { href: "/encargado/estudiantes", label: "Estudiantes" },
  { href: "/encargado/listas", label: "Listas" },
  { href: "/encargado/reportes", label: "Reportes" },
  { href: "/encargado/certificados", label: "Certificados" },
];

async function getUserData() {
  const cookieStore = await cookies();
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
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("Auth check failed, but continuing with cookie data");
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn(
      "Error fetching user data, continuing with cookie:",
      error.message,
    );
    return null;
  }
}

export default async function AdministradorLayout({ children }) {
  // Obtener cookies con await
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get("user_data")?.value;
  const userData = await getUserData();

  if (!userDataCookie) {
    redirect("/login");
  }

  let nombreCompleto = "";
  let cargo = "";

  try {
    const parsedUserData = JSON.parse(userDataCookie);

    // Verificar rol de administrador (1)
    if (parsedUserData.rol_id !== 2) {
      const roleRoutes = {
        1: "/administrador",
        2: "/encargado",
        3: "/facilitador",
      };
      redirect(roleRoutes[parsedUserData.rol_id] || "/login");
    }
    nombreCompleto = `${parsedUserData.nombres} ${parsedUserData.apellido}`;
    cargo = parsedUserData.cargo || "encargado";
  } catch (error) {
    // Si hay error al parsear o falta algún dato, redirigir al login
    redirect("/login");
  }

  return (
    <AppShell
      links={encargadoLinks}
      nombreCompleto={nombreCompleto}
      cargo={cargo}
      homeHref="/encargado"
    >
      {children}
    </AppShell>
  );
}
