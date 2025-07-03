// components/LogoutButton.jsx
"use client";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function LogoutButton() {
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
      className="text-red-600 hover:text-red-800 font-medium p-2"
    >
      Cerrar sesión
    </button>
  );
}
