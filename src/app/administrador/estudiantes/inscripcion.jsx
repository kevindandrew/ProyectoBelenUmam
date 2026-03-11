"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { generarPDFInscripciones } from "./pdfInscripciones";

export default function ModalInscripcionAlumno({
  estudiante,
  isOpen,
  onClose,
}) {
  // Estados principales
  const [sucursales, setSucursales] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [gestiones, setGestiones] = useState([]);
  const [gestionActual, setGestionActual] = useState(null);
  const [filas, setFilas] = useState([]);
  const [todasLasInscripciones, setTodasLasInscripciones] = useState([]);
  const [inscripcionesExistentes, setInscripcionesExistentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [loadingInscripciones, setLoadingInscripciones] = useState(false);

  const API = "https://api-umam-1.onrender.com";

  // Detectar gestión actual automáticamente
  const detectarGestionActual = () => {
    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1; // 0-indexed

    // Si estamos entre enero y junio, es Gestión I
    // Si estamos entre julio y diciembre, es Gestión II
    const gestion = mesActual <= 6 ? "I" : "II";
    return { anio: anioActual, gestion: gestion };
  };

  // Cargar todos los datos necesarios al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    const loadAllData = async () => {
      setLoading(true);
      setLoadingInscripciones(true);
      setError(null);
      setInscripcionesExistentes([]);
      setFilas([]);
      const token = Cookies.get("access_token");

      try {
        // Cargar gestiones, sucursales y cursos en paralelo
        const [gRes, sRes, cRes] = await Promise.all([
          fetch(`${API}/cursos/gestiones`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API}/sucursales/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API}/cursos/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Verificar errores
        if (!gRes.ok) throw new Error("Error al cargar gestiones");
        if (!sRes.ok) throw new Error("Error al cargar sucursales");
        if (!cRes.ok) throw new Error("Error al cargar cursos");

        const [gData, sData, cData] = await Promise.all([
          gRes.json(),
          sRes.json(),
          cRes.json(),
        ]);

        // Ordenar gestiones: año más reciente primero, luego II antes de I
        const gestionesOrdenadas = [...gData].sort((a, b) => {
          if (b.year_id !== a.year_id) return b.year_id - a.year_id;
          return b.gestion.localeCompare(a.gestion);
        });

        setGestiones(gestionesOrdenadas);
        setSucursales(sData);
        setCursos(cData);

        // Detectar gestión actual automáticamente
        const { anio, gestion } = detectarGestionActual();
        const gestionAutoDetectada =
          gestionesOrdenadas.find(
            (g) => g.year_id === anio && g.gestion === gestion,
          ) ||
          gestionesOrdenadas.find((g) => g.activo) ||
          gestionesOrdenadas[0];
        setGestionActual(gestionAutoDetectada?.gestion_id);

        // Cargar inscripciones del estudiante con datos enriquecidos
        const iRes = await fetch(
          `${API}/inscripciones/estudiante/${estudiante.estudiante_id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (iRes.ok) {
          const iData = await iRes.json();

          const inscripcionesConDatos = await Promise.all(
            iData.map(async (matricula) => {
              try {
                const horarioRes = await fetch(
                  `${API}/horarios/${matricula.horario_id}`,
                  { headers: { Authorization: `Bearer ${token}` } },
                );
                if (!horarioRes.ok) return null;
                const horarioData = await horarioRes.json();

                const curso =
                  cData.find((c) => c.curso_id === horarioData.curso_id) || {};
                const sucursal =
                  sData.find((s) =>
                    s.aulas?.some((a) => a.aula_id === horarioData.aula_id),
                  ) || {};
                const aula =
                  sucursal.aulas?.find(
                    (a) => a.aula_id === horarioData.aula_id,
                  ) || {};

                const usuarioRes = await fetch(
                  `${API}/usuarios/${horarioData.profesor_id}`,
                  { headers: { Authorization: `Bearer ${token}` } },
                );
                const facilitador = usuarioRes.ok
                  ? await usuarioRes.json()
                  : {};

                return {
                  inscripcion_id: matricula.matricula_id,
                  estudiante_id: matricula.estudiante_id,
                  horario_id: matricula.horario_id,
                  gestion_id: matricula.gestion_id,
                  fecha_matricula: matricula.fecha_matricula,
                  nota_final: matricula.nota_final,
                  estado: matricula.estado,
                  horario: {
                    horario_id: horarioData.horario_id,
                    curso: {
                      curso_id: curso.curso_id,
                      nombre: curso.nombre || "Curso desconocido",
                      gestoria: curso.gestoria || false,
                    },
                    sucursal: {
                      sucursal_id: sucursal.sucursal_id,
                      nombre: sucursal.nombre || "Sin sucursal",
                    },
                    facilitador: {
                      facilitador_id: facilitador.usuario_id,
                      nombres: facilitador.nombres || "",
                      apellido:
                        `${facilitador.ap_paterno || ""} ${facilitador.ap_materno || ""}`.trim(),
                      telefono: facilitador.telefono || "",
                    },
                    aula: {
                      aula_id: aula.aula_id,
                      nombre: aula.nombre_aula || "Sin aula",
                    },
                    dias_clase: horarioData.dias_clase || [],
                  },
                };
              } catch {
                return null;
              }
            }),
          );

          setTodasLasInscripciones(
            inscripcionesConDatos.filter((i) => i !== null),
          );
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        setLoadingInscripciones(false);
      }
    };

    loadAllData();
  }, [isOpen, estudiante.estudiante_id]);

  // Filtrar inscripciones cuando cambie la gestión seleccionada
  useEffect(() => {
    if (gestionActual && todasLasInscripciones.length > 0) {
      setInscripcionesExistentes(
        todasLasInscripciones.filter(
          (insc) => insc.gestion_id === gestionActual,
        ),
      );
    } else {
      setInscripcionesExistentes([]);
    }
  }, [gestionActual, todasLasInscripciones]);

  const agregarFila = (esGestoria) => {
    setFilas([
      ...filas,
      {
        esGestoria,
        curso: null,
        sucursal: null,
        horario: null,
        loadingHorarios: false,
        errorHorarios: null,
        horariosDisponibles: [],
        guardando: false,
        errorGuardado: null,
        inscrito: false,
      },
    ]);
    setMensajeExito(null); // Limpiar mensaje al agregar nueva fila
  };

  const actualizarFila = async (i, campo, valor) => {
    const nuevasFilas = [...filas];
    nuevasFilas[i][campo] = valor;

    // Resetear dependencias cuando cambian los valores
    if (campo === "curso") {
      nuevasFilas[i].sucursal = null;
      nuevasFilas[i].horario = null;
      nuevasFilas[i].horariosDisponibles = [];
      nuevasFilas[i].inscrito = false;
    } else if (campo === "sucursal") {
      nuevasFilas[i].horario = null;
      nuevasFilas[i].inscrito = false;

      // Cargar horarios cuando tenemos curso, sucursal y gestión
      if (nuevasFilas[i].curso && valor && gestionActual) {
        await cargarHorarios(nuevasFilas, i, valor);
      }
    }

    setFilas(nuevasFilas);
  };

  // Función separada para cargar horarios
  const cargarHorarios = async (filasActualizadas, index, sucursalId) => {
    filasActualizadas[index].loadingHorarios = true;
    filasActualizadas[index].errorHorarios = null;
    setFilas([...filasActualizadas]);

    try {
      const token = Cookies.get("access_token");
      const res = await fetch(
        `${API}/horarios/?gestion_id=${gestionActual}&curso_id=${filasActualizadas[index].curso}&sucursal_id=${sucursalId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) throw new Error("Error al cargar horarios");

      const data = await res.json();
      filasActualizadas[index].horariosDisponibles = data;

      if (data.length === 0) {
        filasActualizadas[index].errorHorarios =
          `No hay horarios disponibles para esta combinación`;
      }
    } catch (err) {
      filasActualizadas[index].errorHorarios = "Error al cargar horarios";
    } finally {
      filasActualizadas[index].loadingHorarios = false;
      setFilas([...filasActualizadas]);
    }
  };

  // Filtrar cursos por tipo (taller/gestoría)
  const filtrarCursosPorTipo = (esGestoria) => {
    return cursos.filter((curso) => curso.gestoria === esGestoria);
  };

  const inscribirCurso = async (fila, index) => {
    if (!fila.horario || !gestionActual) return;

    // Verificar si ya está inscrito en este curso
    const yaInscrito = inscripcionesExistentes.some(
      (insc) => insc.horario_id === fila.horario,
    );

    if (yaInscrito) {
      const nuevasFilas = [...filas];
      nuevasFilas[index].errorGuardado = "Ya está inscrito en este curso";
      setFilas(nuevasFilas);
      return false;
    }

    const nuevasFilas = [...filas];
    nuevasFilas[index].guardando = true;
    nuevasFilas[index].errorGuardado = null;
    setFilas(nuevasFilas);

    const token = Cookies.get("access_token");

    try {
      const response = await fetch(`${API}/inscripciones/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estudiante_id: estudiante.estudiante_id,
          horario_id: fila.horario,
          gestion_id: gestionActual,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error al inscribir");
      }

      // Actualizar estado
      nuevasFilas[index].guardando = false;
      nuevasFilas[index].inscrito = true;
      setFilas(nuevasFilas);

      // Mostrar mensaje de éxito y recargar inscripciones
      setMensajeExito(
        `¡${fila.esGestoria ? "Gestoría" : "Taller"} inscrito correctamente!`,
      );

      // Recargar el historial para mostrar la nueva inscripción
      setTimeout(() => {
        window.location.reload();
      }, 1500);

      return true;
    } catch (err) {
      console.error("Error inscribiendo curso:", err);
      nuevasFilas[index].guardando = false;
      nuevasFilas[index].errorGuardado = err.message;
      setFilas(nuevasFilas);
      return false;
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setError(null);
    setMensajeExito(null);

    // Inscribir cada curso uno por uno
    let inscripcionesExitosas = 0;
    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];

      if (fila.inscrito) {
        inscripcionesExitosas++;
        continue;
      }

      const resultado = await inscribirCurso(fila, i);
      if (resultado) {
        inscripcionesExitosas++;
      }
    }

    setGuardando(false);

    // Mostrar mensaje final
    if (inscripcionesExitosas === filas.length) {
      setMensajeExito("¡Todas las inscripciones realizadas con éxito!");
    } else if (inscripcionesExitosas > 0) {
      setError(
        `Algunas inscripciones fallaron. ${inscripcionesExitosas} de ${filas.length} realizadas con éxito.`,
      );
    } else {
      setError("No se pudo realizar ninguna inscripción");
    }
  };

  const eliminarInscripcion = async (inscripcionId) => {
    if (!confirm("¿Está seguro de eliminar esta inscripción?")) return;

    const token = Cookies.get("access_token");
    try {
      const response = await fetch(`${API}/inscripciones/${inscripcionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error al eliminar");

      // Actualizar lista de inscripciones
      setInscripcionesExistentes(
        inscripcionesExistentes.filter(
          (i) => i.inscripcion_id !== inscripcionId,
        ),
      );
      setMensajeExito("Inscripción eliminada correctamente");
    } catch (err) {
      setError("Error al eliminar la inscripción");
    }
  };

  const handleGenerarPDF = () => {
    if (inscripcionesExistentes.length === 0) {
      alert("No hay inscripciones para generar PDF");
      return;
    }

    const gestionObj = gestiones.find((g) => g.gestion_id === gestionActual);
    const tituloGestion = gestionObj?.gestion || "";

    generarPDFInscripciones(estudiante, inscripcionesExistentes, tituloGestion);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white shadow-lg rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-4">
          Inscribir Cursos - {estudiante.nombres} {estudiante.ap_paterno}
        </h2>

        {/* Inscripciones existentes del estudiante */}
        {loadingInscripciones ? (
          <div className="mb-4 p-3 bg-gray-50 rounded text-gray-500 text-sm">
            Cargando inscripciones actuales...
          </div>
        ) : inscripcionesExistentes.length > 0 ? (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Inscripciones actuales de este estudiante:
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-1 text-left border-b">Horario ID</th>
                    <th className="px-3 py-1 text-left border-b">Gestión ID</th>
                    <th className="px-3 py-1 text-left border-b">Estado</th>
                    <th className="px-3 py-1 text-left border-b">Nota Final</th>
                    <th className="px-3 py-1 text-left border-b">
                      Fecha Matrícula
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inscripcionesExistentes.map((insc, idx) => (
                    <tr
                      key={insc.matricula_id ?? idx}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-3 py-1 border-b">{insc.horario_id}</td>
                      <td className="px-3 py-1 border-b">{insc.gestion_id}</td>
                      <td className="px-3 py-1 border-b">
                        {insc.estado ?? "-"}
                      </td>
                      <td className="px-3 py-1 border-b">
                        {insc.nota_final ?? "-"}
                      </td>
                      <td className="px-3 py-1 border-b">
                        {insc.fecha_matricula
                          ? new Date(insc.fecha_matricula).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-gray-50 rounded text-gray-500 text-sm">
            Este estudiante no tiene inscripciones actualmente.
          </div>
        )}

        {/* Mensajes de estado globales */}
        {loading && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded">
            Cargando datos...
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
        )}
        {mensajeExito && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">
            {mensajeExito}
          </div>
        )}

        {/* Selector de gestión */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gestión Académica
          </label>
          <select
            value={gestionActual ?? ""}
            onChange={(e) => setGestionActual(Number(e.target.value))}
            className="border p-2 rounded w-full"
            disabled={loading}
          >
            {gestiones.map((g) => (
              <option key={g.gestion_id} value={g.gestion_id}>
                {g.gestion} - {g.year_id}
              </option>
            ))}
          </select>
        </div>

        {/* Inscripciones Existentes */}
        {inscripcionesExistentes.length > 0 && (
          <div className="mb-6 border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Cursos Inscritos ({inscripcionesExistentes.length})
              </h3>
              <button
                onClick={handleGenerarPDF}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Ver PDF Horario
              </button>
            </div>
            <div className="space-y-2">
              {inscripcionesExistentes.map((insc, idx) => {
                const horario = insc.horario || {};
                const curso = horario.curso || {};
                const sucursal = horario.sucursal || {};
                const facilitador = horario.facilitador || {};
                const diasClase = horario.dias_clase || [];

                const horarioTexto = diasClase
                  .map((dc) => {
                    const dia = dc.dia_semana?.dia_semana || "";
                    const inicio = dc.hora?.hora_inicio?.slice(0, 5) || "";
                    const fin = dc.hora?.hora_fin?.slice(0, 5) || "";
                    return `${dia} ${inicio}-${fin}`;
                  })
                  .join(", ");

                const esGestoria = curso.gestoria === true;
                const colorBorde = esGestoria
                  ? "border-l-4 border-l-purple-500"
                  : "border-l-4 border-l-blue-500";
                const colorBadge = esGestoria
                  ? "bg-purple-100 text-purple-800"
                  : "bg-blue-100 text-blue-800";

                return (
                  <div
                    key={`insc-${insc.inscripcion_id || Math.random()}`}
                    className={`flex justify-between items-center p-3 bg-white rounded border ${colorBorde}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">
                          {curso.nombre || "Sin nombre"}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${colorBadge}`}
                        >
                          {esGestoria ? "Gestoría" : "Taller"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {sucursal.nombre || "Sin sucursal"}
                        <span className="mx-1">-</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        {horario.aula?.nombre || "Sin aula"}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {facilitador.nombres || ""} {facilitador.apellido || ""}
                        <span className="mx-1">-</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        {facilitador.telefono || "Sin teléfono"}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {horarioTexto || "Sin horario definido"}
                      </p>
                    </div>
                    <button
                      onClick={() => eliminarInscripcion(insc.inscripcion_id)}
                      className="ml-4 text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botones para agregar cursos */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => agregarFila(false)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Agregar Taller
          </button>
          <button
            onClick={() => agregarFila(true)}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Agregar Gestoría
          </button>
        </div>

        {/* Lista de cursos a inscribir */}
        <div className="space-y-4">
          {filas.map((f, i) => (
            <div
              key={i}
              className={`border rounded-lg p-4 ${
                f.inscrito ? "bg-green-50" : "bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">
                  {f.esGestoria ? "Gestoría" : "Taller"} #{i + 1}
                  {f.inscrito && (
                    <span className="ml-2 text-green-600">✓ Inscrito</span>
                  )}
                </h3>
                {!f.inscrito && (
                  <button
                    onClick={() =>
                      setFilas(filas.filter((_, idx) => idx !== i))
                    }
                    className="text-red-600 hover:text-red-800"
                    disabled={f.guardando}
                  >
                    &times;
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Selector de curso */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.esGestoria ? "Gestoría" : "Taller"}
                  </label>
                  <select
                    className="border p-2 rounded w-full"
                    value={f.curso ?? ""}
                    onChange={(e) =>
                      actualizarFila(i, "curso", Number(e.target.value))
                    }
                    disabled={loading || f.inscrito}
                  >
                    <option value="" disabled>
                      Seleccionar {f.esGestoria ? "Gestoría" : "Taller"}
                    </option>
                    {filtrarCursosPorTipo(f.esGestoria).map((c) => (
                      <option key={c.curso_id} value={c.curso_id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de sucursal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sucursal
                  </label>
                  <select
                    className="border p-2 rounded w-full"
                    value={f.sucursal ?? ""}
                    onChange={(e) =>
                      actualizarFila(i, "sucursal", Number(e.target.value))
                    }
                    disabled={!f.curso || loading || f.inscrito}
                  >
                    <option value="" disabled>
                      Seleccionar Sucursal
                    </option>
                    {sucursales.map((s) => (
                      <option key={s.sucursal_id} value={s.sucursal_id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de horario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horario
                  </label>
                  <select
                    className="border p-2 rounded w-full"
                    value={f.horario ?? ""}
                    onChange={(e) =>
                      actualizarFila(i, "horario", Number(e.target.value))
                    }
                    disabled={
                      !f.sucursal || f.loadingHorarios || loading || f.inscrito
                    }
                  >
                    <option value="" disabled>
                      {f.loadingHorarios
                        ? "Cargando..."
                        : "Seleccionar Horario"}
                    </option>

                    {f.errorHorarios ? (
                      <option value="" disabled className="text-red-500">
                        {f.errorHorarios}
                      </option>
                    ) : f.horariosDisponibles.length === 0 ? (
                      <option value="" disabled>
                        {f.sucursal
                          ? "No hay horarios disponibles"
                          : "Seleccione sucursal"}
                      </option>
                    ) : (
                      f.horariosDisponibles.map((h) => (
                        <option key={h.horario_id} value={h.horario_id}>
                          {h.dias_clase
                            .map((d) => d.dia_semana.dia_semana)
                            .join(", ")}{" "}
                          {h.dias_clase[0]?.hora.hora_inicio.slice(0, 5)}-
                          {h.dias_clase[0]?.hora.hora_fin.slice(0, 5)}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Estado de la inscripción */}
              {f.guardando && (
                <div className="mt-2 text-blue-600">Inscribiendo...</div>
              )}
              {f.errorGuardado && (
                <div className="mt-2 text-red-600">{f.errorGuardado}</div>
              )}

              {/* Botón para inscribir individualmente */}
              {!f.inscrito && f.horario && (
                <div className="mt-3">
                  <button
                    onClick={() => inscribirCurso(f, i)}
                    disabled={f.guardando || guardando}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {f.guardando ? "Inscribiendo..." : "Inscribir este curso"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={
              guardando || filas.length === 0 || filas.every((f) => f.inscrito)
            }
          >
            {guardando ? "Guardando..." : "Guardar todas las inscripciones"}
          </button>
        </div>
      </div>
    </div>
  );
}
