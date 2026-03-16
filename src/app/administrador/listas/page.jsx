"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { generarPDFLista } from "./pdfListas";
import { usePageTitle } from "@/lib/usePageTitle";
import { toast } from "react-toastify";

const API_URL = "https://api-umam-1.onrender.com";

const handleFetchResponse = async (response) => {
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent("sessionExpired"));
    Cookies.remove("access_token");
    Cookies.remove("user_data");
    throw new Error("Sesión expirada...");
  }
  return response;
};

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
  usePageTitle("Listas");
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
  const [horarios, setHorarios] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState({
    general: true,
    estudiantes: false,
    profesores: false,
    horarios: false,
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
      await handleFetchResponse(response);

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

  // Cargar horarios cuando se selecciona curso, gestión y sucursal
  useEffect(() => {
    const loadHorarios = async () => {
      if (!filtros.curso_id || !filtros.gestion_id || !filtros.sucursal_id) {
        setHorarios([]);
        setProfesores([]);
        return;
      }

      try {
        setLoading((prev) => ({ ...prev, horarios: true }));

        // Obtener horarios del curso específico
        const params = new URLSearchParams({
          curso_id: filtros.curso_id,
          sucursal_id: filtros.sucursal_id,
          gestion_id: filtros.gestion_id,
        });

        const horariosData = await fetchData(
          `${API_URL}/horarios/?${params.toString()}`,
        );

        console.log("Horarios recibidos:", horariosData);
        if (horariosData && horariosData.length > 0) {
          console.log("Primer horario (ejemplo):", horariosData[0]);
        }

        setHorarios(horariosData);

        // Obtener profesores únicos de los horarios
        if (horariosData && horariosData.length > 0) {
          const profesoresIds = [
            ...new Set(horariosData.map((h) => h.profesor_id)),
          ].filter(Boolean);

          if (profesoresIds.length > 0) {
            // Obtener información completa de los profesores
            const profesoresData = await fetchData(
              `${API_URL}/usuarios/?rol_id=3`,
            );
            const profesoresFiltrados = profesoresData.filter((p) =>
              profesoresIds.includes(p.usuario_id),
            );
            setProfesores(profesoresFiltrados);
          } else {
            setProfesores([]);
          }
        } else {
          setProfesores([]);
        }
      } catch (error) {
        console.error("Error al cargar horarios:", error);
        setError(error.message);
        setHorarios([]);
        setProfesores([]);
      } finally {
        setLoading((prev) => ({ ...prev, horarios: false }));
      }
    };

    loadHorarios();
  }, [filtros.curso_id, filtros.gestion_id, filtros.sucursal_id]);

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
          `${API_URL}/listas/estudiantes?${params.toString()}`,
        );

        console.log("Estudiantes recibidos:", estudiantesData);
        if (estudiantesData && estudiantesData.length > 0) {
          console.log("Primer estudiante (ejemplo):", estudiantesData[0]);
          console.log(
            "Campos del primer estudiante:",
            Object.keys(estudiantesData[0]),
          );
        }

        // Enriquecer datos de estudiantes con fecha_nacimiento si no está incluida
        if (estudiantesData && estudiantesData.length > 0) {
          const estudiantesEnriquecidos = await Promise.all(
            estudiantesData.map(async (est) => {
              // Si ya tiene fecha_nacimiento, no necesitamos buscarla
              if (est.fecha_nacimiento) {
                return est;
              }
              // Obtener datos completos del estudiante
              try {
                const estudianteCompleto = await fetchData(
                  `${API_URL}/estudiantes/${est.estudiante_id}`,
                );
                return {
                  ...est,
                  fecha_nacimiento: estudianteCompleto.fecha_nacimiento,
                };
              } catch (error) {
                console.error(
                  `Error al obtener datos completos del estudiante ${est.estudiante_id}:`,
                  error,
                );
                return est;
              }
            }),
          );
          setEstudiantes(estudiantesEnriquecidos);
        } else {
          setEstudiantes(estudiantesData);
        }
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
        (est) => est.estudiante_id === estudiante_id,
      );

      if (!estudiante || !estudiante.matricula_id) {
        throw new Error("No se encontró la matrícula del estudiante");
      }

      // Optimistic update
      setEstudiantes((prev) =>
        prev.map((est) =>
          est.estudiante_id === estudiante_id
            ? { ...est, nota_final: nuevaNota }
            : est,
        ),
      );

      await fetchData(
        `${API_URL}/listas/matricula/${estudiante.matricula_id}/nota`,
        {
          method: "PUT",
          body: JSON.stringify({ nota_final: nuevaNota }),
        },
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
      (g) => g.gestion_id === parseInt(gestion_id),
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
      (p) => p.usuario_id === parseInt(profesor_id),
    );
    return profesor
      ? `${profesor.nombres} ${profesor.ap_paterno} ${profesor.ap_materno}`
      : "Profesor no encontrado";
  };

  const getNombreSucursal = (sucursal_id) => {
    const sucursal = sucursales.find(
      (s) => s.sucursal_id === parseInt(sucursal_id),
    );
    return sucursal?.nombre || "Sucursal no encontrada";
  };

  // Verificar si todos los filtros están seleccionados
  const todosFiltrosSeleccionados =
    filtros.gestion_id &&
    filtros.sucursal_id &&
    filtros.curso_id &&
    filtros.profesor_id;

  // Función para generar el PDF de la lista
  const handleGenerarPDF = () => {
    if (!estudiantes || estudiantes.length === 0) {
      toast.warning("No hay estudiantes para generar el PDF");
      return;
    }

    // Obtener información del horario para el curso y profesor seleccionados
    let horarioTexto = "Sin especificar";

    console.log("Generando PDF con horarios:", horarios);
    console.log("Profesor seleccionado:", filtros.profesor_id);

    if (horarios && horarios.length > 0) {
      const horarioEncontrado = horarios.find(
        (h) => h.profesor_id === parseInt(filtros.profesor_id),
      );

      if (horarioEncontrado) {
        console.log("Horario encontrado para el profesor:", horarioEncontrado);
        const dias = [];
        if (horarioEncontrado.lunes === true || horarioEncontrado.lunes === 1)
          dias.push("Lunes");
        if (horarioEncontrado.martes === true || horarioEncontrado.martes === 1)
          dias.push("Martes");
        if (
          horarioEncontrado.miercoles === true ||
          horarioEncontrado.miercoles === 1
        )
          dias.push("Miércoles");
        if (horarioEncontrado.jueves === true || horarioEncontrado.jueves === 1)
          dias.push("Jueves");
        if (
          horarioEncontrado.viernes === true ||
          horarioEncontrado.viernes === 1
        )
          dias.push("Viernes");
        if (horarioEncontrado.sabado === true || horarioEncontrado.sabado === 1)
          dias.push("Sábado");
        if (
          horarioEncontrado.domingo === true ||
          horarioEncontrado.domingo === 1
        )
          dias.push("Domingo");

        console.log("Días encontrados:", dias);

        const diasTexto =
          dias.length > 0 ? dias.join(", ") : "Sin días específicos";
        const horaInicio = horarioEncontrado.hora_inicio || "";
        const horaFin = horarioEncontrado.hora_fin || "";
        const horaTxt =
          horaInicio && horaFin ? `${horaInicio} - ${horaFin}` : "";

        horarioTexto = `${diasTexto}${horaTxt ? ` (${horaTxt})` : ""}`;
      }
    }

    // Preparar la información del grupo
    const infoGrupo = {
      curso: getNombreCurso(filtros.curso_id),
      sucursal: getNombreSucursal(filtros.sucursal_id),
      facilitador: getNombreProfesor(filtros.profesor_id),
      horario: horarioTexto,
      gestion: getNombreGestion(filtros.gestion_id),
    };

    generarPDFLista(estudiantes, infoGrupo);
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

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Selector de Gestión */}
        <div>
          <label htmlFor="gestion-select" className="block mb-1 font-semibold">
            Gestión
          </label>
          <select
            id="gestion-select"
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
          <label htmlFor="sucursal-select" className="block mb-1 font-semibold">
            Sucursal
          </label>
          <select
            id="sucursal-select"
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
          <label htmlFor="curso-select" className="block mb-1 font-semibold">
            Curso
          </label>
          <select
            id="curso-select"
            value={filtros.curso_id}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                curso_id: e.target.value,
                profesor_id: "",
              }))
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
          <label htmlFor="profesor-select" className="block mb-1 font-semibold">
            Profesor
          </label>
          <select
            id="profesor-select"
            value={filtros.profesor_id}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, profesor_id: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
            disabled={
              loading.horarios ||
              profesores.length === 0 ||
              !filtros.curso_id ||
              !filtros.sucursal_id ||
              !filtros.gestion_id
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
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleGenerarPDF}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Generar PDF
                </button>
              </div>
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
                        <td
                          className="border px-3 py-2"
                          style={{ textTransform: "uppercase" }}
                        >
                          {est.nombres}
                        </td>
                        <td
                          className="border px-3 py-2"
                          style={{ textTransform: "uppercase" }}
                        >
                          {est.ap_paterno}
                        </td>
                        <td
                          className="border px-3 py-2"
                          style={{ textTransform: "uppercase" }}
                        >
                          {est.ap_materno}
                        </td>
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
            </>
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
