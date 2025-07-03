// utils/api.js
import Cookies from "js-cookie";

export const fetchWithAuth = async (url, options = {}) => {
  const token = Cookies.get("access_token");
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
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
