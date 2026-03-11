"use client";
import React from "react";
import { useRouter } from "next/navigation";

const SessionExpiredModal = ({ isOpen, onClose }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleRedirect = () => {
    onClose();
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          {/* Icono de advertencia */}
          <div className="mb-4 text-yellow-500">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Sesión Expirada
          </h2>

          {/* Mensaje */}
          <p className="text-gray-600 text-center mb-6">
            Tu sesión ha expirado por inactividad. Por favor, vuelve a iniciar
            sesión para continuar.
          </p>

          {/* Botón */}
          <button
            onClick={handleRedirect}
            className="w-full bg-[#22dd9f] text-white py-3 rounded-md font-semibold hover:bg-[#159268] transition-colors"
          >
            Volver a Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
