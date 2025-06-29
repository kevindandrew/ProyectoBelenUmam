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
