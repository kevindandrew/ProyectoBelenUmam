"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const API_URL = "https://api-umam-1.onrender.com";

// Componente para editar notas
const EditarNota = ({ estudiante, onUpdate }) => {
  const [editando, setEditando] = useState(false);
  const [nuevaNota, setNuevaNota] = useState(estudiante.nota_final || "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirmar = async () => {
    // Validación
    if (nuevaNota === "" || isNaN(nuevaNota)) {
      setError("Ingrese un número válido");
      return;
    }

    const notaNum = Number(nuevaNota);
    if (notaNum < 0 || notaNum > 100) {
      setError("La nota debe estar entre 0 y 100");
      return;
    }

    setCargando(true);
    setError(null);

    try {
      await onUpdate(estudiante.estudiante_id, notaNum);
      setEditando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    setNuevaNota(estudiante.nota_final || "");
    setError(null);
    setEditando(false);
  };

  return (
    <div className="relative">
      {editando ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="100"
            value={nuevaNota}
            onChange={(e) => setNuevaNota(e.target.value)}
            className="w-16 border rounded px-2 py-1 text-center"
            disabled={cargando}
          />
          <button
            onClick={handleConfirmar}
            disabled={cargando}
            className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
            title="Confirmar"
          >
            {cargando ? "..." : "✓"}
          </button>
          <button
            onClick={handleCancelar}
            disabled={cargando}
            className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
            title="Cancelar"
          >
            ✗
          </button>
          {error && (
            <span className="absolute top-full left-0 text-xs text-red-600 mt-1">
              {error}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span>{estudiante.nota_final || "-"}</span>
          <button
            onClick={() => setEditando(true)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Editar nota"
          >
            ✏️
          </button>
        </div>
      )}
    </div>
  );
};

export default function InscripcionesPage() {
  const [filtros, setFiltros] = useState({
    gestion_id: "",
    sucursal_id: "",
    curso_id: "",
    profesor_id: "",
  });

  const [gestiones, setGestiones] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState({
    general: true,
    estudiantes: false,
    profesores: false,
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
        const [gestionesData, sucursalesData, cursosData] = await Promise.all([
          fetchData(`${API_URL}/cursos/gestiones`),
          fetchData(`${API_URL}/sucursales/`),
          fetchData(`${API_URL}/cursos/`),
        ]);

        setGestiones(gestionesData);
        setSucursales(sucursalesData);
        setCursos(cursosData);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        setError(error.message);
      } finally {
        setLoading((prev) => ({ ...prev, general: false }));
      }
    };

    loadInitialData();
  }, []);

  // Cargar profesores cuando se selecciona una sucursal
  useEffect(() => {
    const loadProfesores = async () => {
      if (!filtros.sucursal_id) {
        setProfesores([]);
        return;
      }

      try {
        setLoading((prev) => ({ ...prev, profesores: true }));
        const data = await fetchData(`${API_URL}/usuarios/?rol_id=3`);
        setProfesores(data);
      } catch (error) {
        console.error("Error al cargar profesores:", error);
        setError(error.message);
      } finally {
        setLoading((prev) => ({ ...prev, profesores: false }));
      }
    };

    loadProfesores();
  }, [filtros.sucursal_id]);

  // Obtener estudiantes cuando todos los filtros estén completos
  useEffect(() => {
    const loadEstudiantes = async () => {
      // Verificar que todos los filtros estén seleccionados
      if (
        !filtros.gestion_id ||
        !filtros.sucursal_id ||
        !filtros.curso_id ||
        !filtros.profesor_id
      ) {
        setEstudiantes([]);
        return;
      }

      try {
        setLoading((prev) => ({ ...prev, estudiantes: true }));
        setEstudiantes([]);
        setError(null);

        const params = new URLSearchParams({
          sucursal_id: filtros.sucursal_id,
          gestion_id: filtros.gestion_id,
          curso_id: filtros.curso_id,
          profesor_id: filtros.profesor_id,
        });

        const estudiantesData = await fetchData(
          `${API_URL}/listas/estudiantes?${params.toString()}`
        );

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
  const actualizarNota = async (estudiante_id, nuevaNota) => {
    try {
      // Encontrar el estudiante para obtener su matricula_id
      const estudiante = estudiantes.find(
        (est) => est.estudiante_id === estudiante_id
      );

      if (!estudiante || !estudiante.matricula_id) {
        throw new Error("No se encontró la matrícula del estudiante");
      }

      // Optimistic update
      setEstudiantes((prev) =>
        prev.map((est) =>
          est.estudiante_id === estudiante_id
            ? { ...est, nota_final: nuevaNota }
            : est
        )
      );

      await fetchData(
        `${API_URL}/listas/matricula/${estudiante.matricula_id}/nota`,
        {
          method: "PUT",
          body: JSON.stringify({ nota_final: nuevaNota }),
        }
      );
    } catch (error) {
      console.error("Error al actualizar nota:", error);
      // Revertir el cambio si falla
      setEstudiantes((prev) => [...prev]);
      throw error;
    }
  };

  // Funciones auxiliares para obtener nombres
  const getNombreGestion = (gestion_id) => {
    const gestion = gestiones.find(
      (g) => g.gestion_id === parseInt(gestion_id)
    );
    return gestion
      ? `${gestion.gestion} ${gestion.year_id}`
      : "Gestión no encontrada";
  };

  const getNombreCurso = (curso_id) => {
    const curso = cursos.find((c) => c.curso_id === parseInt(curso_id));
    return curso?.nombre || "Curso no encontrado";
  };

  const getNombreProfesor = (profesor_id) => {
    const profesor = profesores.find(
      (p) => p.usuario_id === parseInt(profesor_id)
    );
    return profesor
      ? `${profesor.nombres} ${profesor.ap_paterno} ${profesor.ap_materno}`
      : "Profesor no encontrado";
  };

  const getNombreSucursal = (sucursal_id) => {
    const sucursal = sucursales.find(
      (s) => s.sucursal_id === parseInt(sucursal_id)
    );
    return sucursal?.nombre || "Sucursal no encontrada";
  };

  // Verificar si todos los filtros están seleccionados
  const todosFiltrosSeleccionados =
    filtros.gestion_id &&
    filtros.sucursal_id &&
    filtros.curso_id &&
    filtros.profesor_id;

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

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Selector de Gestión */}
        <div>
          <label className="block mb-1 font-semibold">Gestión</label>
          <select
            value={filtros.gestion_id}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, gestion_id: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
            disabled={loading.general || gestiones.length === 0}
          >
            <option value="">Seleccione una gestión</option>
            {gestiones.map((gestion) => (
              <option key={gestion.gestion_id} value={gestion.gestion_id}>
                {gestion.gestion} {gestion.year_id}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Sucursal */}
        <div>
          <label className="block mb-1 font-semibold">Sucursal</label>
          <select
            value={filtros.sucursal_id}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                sucursal_id: e.target.value,
                profesor_id: "",
              }))
            }
            className="w-full border rounded px-3 py-2"
            disabled={
              loading.general || sucursales.length === 0 || !filtros.gestion_id
            }
          >
            <option value="">Seleccione una sucursal</option>
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
            disabled={
              loading.general || cursos.length === 0 || !filtros.sucursal_id
            }
          >
            <option value="">Seleccione un curso</option>
            {cursos.map((curso) => (
              <option key={curso.curso_id} value={curso.curso_id}>
                {curso.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Profesor */}
        <div>
          <label className="block mb-1 font-semibold">Profesor</label>
          <select
            value={filtros.profesor_id}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, profesor_id: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
            disabled={
              loading.profesores ||
              profesores.length === 0 ||
              !filtros.curso_id ||
              !filtros.sucursal_id
            }
          >
            <option value="">Seleccione un profesor</option>
            {profesores.map((profesor) => (
              <option key={profesor.usuario_id} value={profesor.usuario_id}>
                {profesor.nombres} {profesor.ap_paterno} {profesor.ap_materno}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumen de filtros */}
      {todosFiltrosSeleccionados && (
        <div className="mb-4 bg-gray-100 p-4 rounded shadow">
          <p>
            <strong>Gestión:</strong> {getNombreGestion(filtros.gestion_id)}
          </p>
          <p>
            <strong>Sucursal:</strong> {getNombreSucursal(filtros.sucursal_id)}
          </p>
          <p>
            <strong>Curso:</strong> {getNombreCurso(filtros.curso_id)}
          </p>
          <p>
            <strong>Profesor:</strong> {getNombreProfesor(filtros.profesor_id)}
          </p>
        </div>
      )}

      {/* Contenido principal */}
      {loading.general ? (
        <div className="text-center py-8">
          <p>Cargando datos iniciales...</p>
        </div>
      ) : (
        <>
          {!todosFiltrosSeleccionados && (
            <div className="text-center py-8 text-gray-600">
              Por favor seleccione todos los filtros para mostrar la lista de
              estudiantes
            </div>
          )}

          {todosFiltrosSeleccionados && loading.estudiantes ? (
            <div className="text-center py-8">
              <p>Cargando estudiantes...</p>
            </div>
          ) : todosFiltrosSeleccionados && estudiantes.length > 0 ? (
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
                      key={est.estudiante_id}
                      className="odd:bg-white even:bg-gray-50"
                    >
                      <td className="border px-3 py-2">{est.nombres}</td>
                      <td className="border px-3 py-2">{est.ap_paterno}</td>
                      <td className="border px-3 py-2">{est.ap_materno}</td>
                      <td className="border px-3 py-2">{est.ci}</td>
                      <td className="border px-3 py-2">{est.telefono}</td>
                      <td className="border px-3 py-2">
                        <EditarNota
                          estudiante={est}
                          onUpdate={actualizarNota}
                        />
                      </td>
                      <td className="border px-3 py-2">{est.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : todosFiltrosSeleccionados && estudiantes.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No se encontraron estudiantes con los filtros seleccionados
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
