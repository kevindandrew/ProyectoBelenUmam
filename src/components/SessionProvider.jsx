"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import Cookies from "js-cookie";
import SessionExpiredModal from "@/components/SessionExpiredModal";

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession debe ser usado dentro de SessionProvider");
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const handleSessionExpired = useCallback(() => {
    // Limpiar cookies
    Cookies.remove("access_token");
    Cookies.remove("user_data");

    // Mostrar modal
    setShowExpiredModal(true);
  }, []);

  // Escuchar eventos de sesión expirada desde toda la aplicación
  useEffect(() => {
    const handleSessionExpiredEvent = () => {
      handleSessionExpired();
    };

    window.addEventListener("sessionExpired", handleSessionExpiredEvent);

    return () => {
      window.removeEventListener("sessionExpired", handleSessionExpiredEvent);
    };
  }, [handleSessionExpired]);

  const closeModal = useCallback(() => {
    setShowExpiredModal(false);
  }, []);

  // Función para hacer fetch con manejo automático de sesión expirada
  const authenticatedFetch = useCallback(
    async (url, options = {}) => {
      const token = Cookies.get("access_token");

      const fetchOptions = {
        ...options,
        headers: {
          ...options.headers,
          Authorization: token ? `Bearer ${token}` : "",
        },
      };

      try {
        const response = await fetch(url, fetchOptions);

        // Si el token expiró (401), mostrar modal
        if (response.status === 401) {
          handleSessionExpired();
          throw new Error("Sesión expirada");
        }

        return response;
      } catch (error) {
        // Si hay un error de red o el fetch falla, propagarlo
        throw error;
      }
    },
    [handleSessionExpired],
  );

  return (
    <SessionContext.Provider
      value={{ handleSessionExpired, authenticatedFetch }}
    >
      {children}
      <SessionExpiredModal isOpen={showExpiredModal} onClose={closeModal} />
    </SessionContext.Provider>
  );
};
