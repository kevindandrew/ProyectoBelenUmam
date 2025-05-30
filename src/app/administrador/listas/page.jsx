"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const API_URL = "https://api-umam-1.onrender.com";

export default function InscripcionesPage() {
  const [filtros, setFiltros] = useState({
    sucursal_id: "",
    curso_id: "",
    profesor_id: "",
  });

  const [sucursales, setSucursales] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [facilitadores, setFacilitadores] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState({
    general: true,
    estudiantes: false,
  });
  const [error, setError] = useState(null);

  // Función para hacer fetch con manejo de errores
  const fetchData = async (url, options = {}) => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en fetchData (${url}):`, error);
      throw error;
    }
  };

  // Obtener datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading((prev) => ({ ...prev, general: true }));
        setError(null);

        // Cargar todos los datos necesarios en paralelo
        const [sucursalesData, cursosData, facilitadoresData] =
          await Promise.all([
            fetchData(`${API_URL}/sucursales/`),
            fetchData(`${API_URL}/cursos/`),
            fetchData(`${API_URL}/usuarios/?rol_id=3`),
          ]);

        setSucursales(sucursalesData);
        setCursos(cursosData);
        setFacilitadores(facilitadoresData);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        setError(error.message);
      } finally {
        setLoading((prev) => ({ ...prev, general: false }));
      }
    };

    loadInitialData();
  }, []);

  // Obtener estudiantes cuando cambian los filtros
  useEffect(() => {
    const loadEstudiantes = async () => {
      try {
        setLoading((prev) => ({ ...prev, estudiantes: true }));
        setEstudiantes([]);
        setError(null);

        // Preparar parámetros validados
        const params = new URLSearchParams();

        // Solo añadir parámetros si tienen valor válido
        if (filtros.sucursal_id && !isNaN(parseInt(filtros.sucursal_id))) {
          params.append("sucursal_id", filtros.sucursal_id);
        }

        if (filtros.curso_id && !isNaN(parseInt(filtros.curso_id))) {
          params.append("curso_id", filtros.curso_id);
        }

        if (filtros.profesor_id && !isNaN(parseInt(filtros.profesor_id))) {
          params.append("profesor_id", filtros.profesor_id);
        }

        // Determinar qué endpoint usar
        let estudiantesData;
        if (filtros.profesor_id) {
          const data = await fetchData(
            `${API_URL}/listas/profesor/${
              filtros.profesor_id
            }/horarios?${params.toString()}`
          );
          estudiantesData = data.flatMap((horario) =>
            horario.estudiantes.map((est) => ({
              ...est,
              horario_id: horario.horario_id,
              curso_id: horario.curso_id,
            }))
          );
        } else {
          estudiantesData = await fetchData(
            `${API_URL}/listas/estudiantes?${params.toString()}`
          );
        }

        setEstudiantes(estudiantesData);
      } catch (error) {
        console.error("Error al cargar estudiantes:", error);
        setError(error.message);
      } finally {
        setLoading((prev) => ({ ...prev, estudiantes: false }));
      }
    };

    // Debounce para evitar múltiples llamadas
    const timer = setTimeout(loadEstudiantes, 300);
    return () => clearTimeout(timer);
  }, [filtros]);

  // Actualizar nota de estudiante
  const actualizarNota = async (matricula_id, nuevaNota) => {
    try {
      await fetchData(`${API_URL}/listas/matricula/${matricula_id}/nota`, {
        method: "PUT",
        body: JSON.stringify({ nota_final: nuevaNota }),
      });

      setEstudiantes((prev) =>
        prev.map((est) =>
          est.matricula_id === matricula_id
            ? { ...est, nota_final: nuevaNota }
            : est
        )
      );
    } catch (error) {
      console.error("Error al actualizar nota:", error);
      alert(error.message);
    }
  };

  // Funciones auxiliares para obtener nombres
  const getNombreCurso = (curso_id) => {
    const curso = cursos.find((c) => c.curso_id === parseInt(curso_id));
    return curso?.nombre || "Curso no encontrado";
  };

  const getNombreFacilitador = (profesor_id) => {
    const facilitador = facilitadores.find(
      (f) => f.usuario_id === parseInt(profesor_id)
    );
    return facilitador?.nombre || "Facilitador no encontrado";
  };

  const getNombreSucursal = (sucursal_id) => {
    const sucursal = sucursales.find(
      (s) => s.sucursal_id === parseInt(sucursal_id)
    );
    return sucursal?.nombre || "Sucursal no encontrada";
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-[#13678A] border-b pb-2 mb-4">
        LISTAS
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filtros - Ahora solo 3 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Selector de Sucursal */}
        <div>
          <label className="block mb-1 font-semibold">Sucursal</label>
          <select
            value={filtros.sucursal_id}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, sucursal_id: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
            disabled={loading.general || sucursales.length === 0}
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal.sucursal_id} value={sucursal.sucursal_id}>
                {sucursal.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Curso */}
        <div>
          <label className="block mb-1 font-semibold">Curso</label>
          <select
            value={filtros.curso_id}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, curso_id: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
            disabled={loading.general || cursos.length === 0}
          >
            <option value="">Todos los cursos</option>
            {cursos.map((curso) => (
              <option key={curso.curso_id} value={curso.curso_id}>
                {curso.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Facilitador */}
        <div>
          <label className="block mb-1 font-semibold">Facilitador</label>
          <select
            value={filtros.profesor_id}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, profesor_id: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
            disabled={loading.general || facilitadores.length === 0}
          >
            <option value="">Todos los facilitadores</option>
            {facilitadores.map((facilitador) => (
              <option
                key={facilitador.usuario_id}
                value={facilitador.usuario_id}
              >
                {facilitador.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumen de filtros */}
      {!loading.general && (
        <div className="mb-4 bg-gray-100 p-4 rounded shadow">
          <p>
            <strong>Sucursal:</strong>{" "}
            {filtros.sucursal_id
              ? getNombreSucursal(filtros.sucursal_id)
              : "Todas"}
          </p>
          <p>
            <strong>Facilitador:</strong>{" "}
            {filtros.profesor_id
              ? getNombreFacilitador(filtros.profesor_id)
              : "Todos"}
          </p>
          <p>
            <strong>Curso:</strong>{" "}
            {filtros.curso_id ? getNombreCurso(filtros.curso_id) : "Todos"}
          </p>
        </div>
      )}

      {/* Contenido principal */}
      {loading.general ? (
        <div className="text-center py-8">
          <p>Cargando datos iniciales...</p>
        </div>
      ) : loading.estudiantes ? (
        <div className="text-center py-8">
          <p>Cargando estudiantes...</p>
        </div>
      ) : estudiantes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-3 py-2">Nombres</th>
                <th className="border px-3 py-2">Apellido Paterno</th>
                <th className="border px-3 py-2">Apellido Materno</th>
                <th className="border px-3 py-2">CI</th>
                <th className="border px-3 py-2">Teléfono</th>
                <th className="border px-3 py-2">Nota Final</th>
                <th className="border px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((est) => (
                <tr
                  key={est.matricula_id}
                  className="odd:bg-white even:bg-gray-50"
                >
                  <td className="border px-3 py-2">{est.nombres}</td>
                  <td className="border px-3 py-2">{est.ap_paterno}</td>
                  <td className="border px-3 py-2">{est.ap_materno}</td>
                  <td className="border px-3 py-2">{est.ci}</td>
                  <td className="border px-3 py-2">{est.telefono}</td>
                  <td className="border px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={est.nota_final || 0}
                      onChange={(e) =>
                        actualizarNota(est.matricula_id, Number(e.target.value))
                      }
                      className="w-16 border rounded px-2 py-1 text-center"
                    />
                  </td>
                  <td className="border px-3 py-2">{est.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-600">
          No se encontraron estudiantes con los filtros seleccionados
        </div>
      )}
    </div>
  );
}
