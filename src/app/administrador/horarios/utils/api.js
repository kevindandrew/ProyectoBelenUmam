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
      const errorText = await response.text();
      console.error("[Error Response]", errorText);
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
    console.error("[Fetch Error]", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

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
