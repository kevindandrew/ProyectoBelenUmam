"use client";
import React, { useState } from "react";

export default function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSupport = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={toggleSupport}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center transition-all duration-300"
        aria-label="Abrir soporte"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="h-8 w-"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
          />
        </svg>
      </button>

      {/* Panel flotante de soporte */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 bg-gradient-to-br from-[#1E1E20] to-[#27272b] rounded-lg shadow-2xl p-6 w-80 z-50 text-white border border-slate-600">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold">Soporte</h3>
            <button
              onClick={toggleSupport}
              className="text-gray-400 hover:text-gray-200"
              aria-label="Cerrar soporte"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-300 mb-4">
            Para problemas técnicos o consultas sobre el sistema.
          </p>
          <p className="text-sm text-gray-300 mb-4">
            El usuario y contraseña debe proporcionarte el administrador del
            sistema.
          </p>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.707 12.293a.999.999 0 0 0-1.414 0L13 15.586V6a1 1 0 1 0-2 0v9.586l-3.293-3.293a.999.999 0 1 0-1.414 1.414l5 5a.999.999 0 0 0 1.414 0l5-5a.999.999 0 0 0 0-1.414z" />
              </svg>
              <div>
                <p className="text-xs text-gray-400">WhatsApp</p>
                <p className="text-sm font-semibold">+591 67192700</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
              <div>
                <p className="text-xs text-gray-400">Horario de atención</p>
                <p className="text-sm font-semibold">09:00 - 16:00</p>
              </div>
            </div>
          </div>

          <button
            onClick={toggleSupport}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md text-sm font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}
    </>
  );
}
