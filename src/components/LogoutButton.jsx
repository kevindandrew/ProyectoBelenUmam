"use client";

import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function LogoutButton({ className }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Opcional: Hacer una llamada a tu API para cerrar sesión
      await fetch("https://api-umam-1.onrender.com/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Eliminar las cookies del cliente
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");

      // Redirigir al login
      router.push("/login");
      router.refresh(); // Forzar recarga para limpiar el estado
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <button onClick={handleLogout} className={className}>
      Cerrar sesión
    </button>
  );
}
