import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
export const metadata = {
  title: "UMAM - Facilitador",
  description: "Panel del facilitador",
};

const facilitadorLinks = [
  { href: "/facilitador/listas", label: "Listas" },
  { href: "/facilitador/control-horas", label: "Control de Horas" },
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
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    return await response.json();
  } catch (error) {
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

    // Verificar rol de facilitador (3)
    if (parsedUserData.rol_id !== 3) {
      const roleRoutes = {
        1: "/administrador",
        2: "/encargado",
        3: "/facilitador",
      };
      redirect(roleRoutes[parsedUserData.rol_id] || "/login");
    }
    nombreCompleto = `${parsedUserData.nombres} ${parsedUserData.apellido}`;
    cargo = parsedUserData.cargo || "facilitador";
  } catch (error) {
    // Si hay error al parsear o falta algún dato, redirigir al login
    redirect("/login");
  }

  return (
    <AppShell
      links={facilitadorLinks}
      nombreCompleto={nombreCompleto}
      cargo={cargo}
      homeHref="/facilitador"
    >
      {children}
    </AppShell>
  );
}
