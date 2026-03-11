// utils/api.js
import Cookies from "js-cookie";

export const fetchWithAuth = async (url, options = {}) => {
  const token = Cookies.get("access_token");
  if (!token) throw new Error("No authentication token found");

  try {
    // Configuración completa de la petición
    const fetchOptions = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
      mode: "cors", // Especificar explícitamente el modo CORS
      credentials: "omit", // No enviar cookies (usar solo Bearer token)
    };

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      // Si es 401, disparar evento de sesión expirada
      if (response.status === 401) {
        // Disparar evento personalizado para que SessionProvider lo capture
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("sessionExpired"));
        }
        // Limpiar token
        Cookies.remove("access_token");
        Cookies.remove("user_data");
        throw new Error("Sesión expirada. Por favor, vuelve a iniciar sesión.");
      }

      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${errorText || response.statusText}`,
      );
    }

    // Manejo especial para respuestas vacías (204 No Content)
    if (
      response.status === 204 ||
      response.headers.get("Content-Length") === "0"
    ) {
      return { success: true };
    }

    // Solo intentamos parsear JSON si hay contenido
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    }

    return { success: true };
  } catch (error) {
    // Verificar si es un error de red/CORS
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Error de conexión: Verifique su conexión a internet o configuración CORS del servidor",
      );
    }

    throw error;
  }
};

export const fetchWithAuthDelete = async (url, options = {}) => {
  const token = Cookies.get("access_token");
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(url, {
    ...options,
    method: "DELETE",
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // Si es 401, disparar evento de sesión expirada
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sessionExpired"));
      }
      Cookies.remove("access_token");
      Cookies.remove("user_data");
      throw new Error("Sesión expirada. Por favor, vuelve a iniciar sesión.");
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Manejo especial para respuestas vacías (204 No Content)
  if (
    response.status === 204 ||
    response.headers.get("Content-Length") === "0"
  ) {
    return { success: true }; // Retornamos un objeto indicando éxito
  }

  // Solo intentamos parsear JSON si hay contenido
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  return await response.text();
};
