"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  FiDownload,
  FiTrash2,
  FiPlus,
  FiDatabase,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";

const API_BASE = "https://api-umam-1.onrender.com/backups";

export default function BackupsPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = Cookies.get("access_token");

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(API_BASE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Error al obtener backups");
      const data = await response.json();
      setBackups(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const crearBackup = async () => {
    try {
      setCreating(true);
      setError("");
      const response = await fetch(`${API_BASE}/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Error al crear backup");
      setSuccess("Backup creado exitosamente");
      await fetchBackups();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const eliminarBackup = async (filename) => {
    try {
      setDeleting(filename);
      const response = await fetch(`${API_BASE}/${filename}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Error al eliminar backup");
      setSuccess("Backup eliminado exitosamente");
      await fetchBackups();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const descargarBackup = async (filename) => {
    try {
      const response = await fetch(`${API_BASE}/download/${filename}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error al descargar backup");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      setSuccess(`Descarga iniciada: ${filename}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("No se pudo descargar el backup");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FiDatabase className="text-blue-600 text-2xl" />
            <h1 className="text-2xl font-bold text-gray-800">
              Gestión de Backups
            </h1>
          </div>
          <button
            onClick={crearBackup}
            disabled={creating}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? <FiLoader className="animate-spin" /> : <FiPlus />}
            <span>{creating ? "Creando..." : "Nuevo Backup"}</span>
          </button>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-start space-x-2">
            <FiAlertCircle className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200 flex items-start space-x-2">
            <FiAlertCircle className="mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tabla de backups */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FiLoader className="animate-spin text-gray-500 text-2xl" />
            <span className="ml-2 text-gray-600">Cargando backups...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-md">
            <p className="text-gray-500">No hay backups disponibles</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tamaño
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {backup.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.size_mb} MB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(backup.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => descargarBackup(backup.filename)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        title="Descargar"
                      >
                        <FiDownload className="mr-1" /> Descargar
                      </button>
                      <button
                        onClick={() => eliminarBackup(backup.filename)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                        disabled={deleting === backup.filename}
                        title="Eliminar"
                      >
                        {deleting === backup.filename ? (
                          <FiLoader className="animate-spin mr-1" />
                        ) : (
                          <FiTrash2 className="mr-1" />
                        )}
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
