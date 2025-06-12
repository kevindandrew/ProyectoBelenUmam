"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { generarHistorial } from "@/app/administrador/estudiantes/pdfhistorial";

export default function HistorialAcademicoModal({
  estudiante,
  isOpen,
  onClose,
}) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && estudiante) {
      const fetchHistorial = async () => {
        try {
          const response = await fetch(
            `https://api-umam-1.onrender.com/inscripciones/historial/${estudiante.estudiante_id}`,
            {
              headers: {
                Authorization: `bearer ${Cookies.get("access_token")}`,
              },
            }
          );
          const data = await response.json();
          setHistorial(data);
        } catch (error) {
          console.error("Error fetching historial:", error);
          setHistorial([]);
        } finally {
          setLoading(false);
        }
      };

      fetchHistorial();
    }
  }, [isOpen, estudiante]);

  const handleExportPDF = () => {
    // Implementar lógica para exportar a PDF
    console.log("Exportar historial a PDF");
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-black/25 bg-opacity-50 z-40"
        onClick={onClose}
      ></div>
      <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
          <button
            type="button"
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            &#10005;
          </button>
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Historial Académico de {estudiante.nombres} {estudiante.ap_paterno}
          </h2>

          {loading ? (
            <p>Cargando historial académico...</p>
          ) : historial.length === 0 ? (
            <p>No hay registros académicos para este estudiante.</p>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Talleres</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border text-sm bg-white">
                    <thead className="bg-gray-100 text-left">
                      <tr>
                        <th className="px-4 py-2 border-b">Curso</th>
                        <th className="px-4 py-2 border-b">Gestión</th>
                        <th className="px-4 py-2 border-b">Nota Final</th>
                        <th className="px-4 py-2 border-b">Estado</th>
                        <th className="px-4 py-2 border-b">Fecha Matrícula</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border-b">{item.curso}</td>
                          <td className="px-4 py-2 border-b">{item.gestion}</td>
                          <td className="px-4 py-2 border-b">
                            {item.nota_final}
                          </td>
                          <td className="px-4 py-2 border-b">{item.estado}</td>
                          <td className="px-4 py-2 border-b">
                            {new Date(
                              item.fecha_matricula
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => generarHistorial(estudiante, historial)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Exportar PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
