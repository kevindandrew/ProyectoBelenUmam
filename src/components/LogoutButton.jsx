// components/LogoutButton.jsx
"use client";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function LogoutButton({ className = "", compact = false }) {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove("access_token");
    Cookies.remove("user_data");
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className={`font-medium p-2 transition-colors ${
        className || "text-red-600 hover:text-red-800"
      }`}
      title="Cerrar sesion"
    >
      {compact ? "Salir" : "Cerrar sesion"}
    </button>
  );
}
