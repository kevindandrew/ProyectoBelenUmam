"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

// Componentes de íconos
const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 4.487a2.062 2.062 0 112.91 2.91l-9.193 9.193a2.062 2.062 0 01-1.035.556l-3.47.694a.516.516 0 01-.605-.605l.694-3.47a2.062 2.062 0 01.556-1.035l9.193-9.193z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 7.5l-1.25 1.25"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

export default function HorariosPage() {
  const API_URL = "https://api-umam-1.onrender.com";
  const [sucursales, setSucursales] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [facilitadores, setFacilitadores] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [diasSemana, setDiasSemana] = useState([]);
  const [horas, setHoras] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [gestiones, setGestiones] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
  const [gestionSeleccionada, setGestionSeleccionada] = useState("");
  const [cursoFiltro, setCursoFiltro] = useState("");
  const [anioSeleccionado, setAnioSeleccionado] = useState("");
  const [semestreSeleccionado, setSemestreSeleccionado] = useState("I");

  // Modales
  const [modalHoraOpen, setModalHoraOpen] = useState(false);
  const [modalAsignacionOpen, setModalAsignacionOpen] = useState(false);
  const [modalEditarHoraOpen, setModalEditarHoraOpen] = useState(false);
  const [horaEditando, setHoraEditando] = useState(null);

  // Formularios
  const [formHora, setFormHora] = useState({
    hora_inicio: "",
    hora_fin: "",
  });

  const [formAsignacion, setFormAsignacion] = useState({
    horario_id: "",
    dia_semana_id: "",
    curso_id: "",
    profesor_id: "",
    aula_id: "",
    gestion_id: "",
    hora_id: "",
  });

  // Obtener datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Obtener años disponibles
        const yearsRes = await fetch(`${API_URL}/cursos/years`, {
          headers: { Authorization: `bearer ${Cookies.get("access_token")}` },
        });
        if (!yearsRes.ok) throw new Error("Error al cargar años");
        const yearsData = await yearsRes.json();
        setYears(yearsData.sort((a, b) => b.year - a.year)); // Ordenar de más reciente a más antiguo

        // Obtener gestiones
        const gestionesRes = await fetch(`${API_URL}/cursos/gestiones`, {
          headers: { Authorization: `bearer ${Cookies.get("access_token")}` },
        });
        if (!gestionesRes.ok) throw new Error("Error al cargar gestiones");
        const gestionesData = await gestionesRes.json();
        setGestiones(gestionesData);

        // Obtener sucursales
        const sucursalesRes = await fetch(`${API_URL}/sucursales/`, {
          headers: { Authorization: `bearer ${Cookies.get("access_token")}` },
        });
        if (!sucursalesRes.ok) throw new Error("Error al cargar sucursales");
        const sucursalesData = await sucursalesRes.json();
        setSucursales(sucursalesData);

        // Obtener cursos
        const cursosRes = await fetch(`${API_URL}/cursos/`, {
          headers: { Authorization: `bearer ${Cookies.get("access_token")}` },
        });
        if (!cursosRes.ok) throw new Error("Error al cargar cursos");
        const cursosData = await cursosRes.json();
        setCursos(cursosData);

        // Establecer valores por defecto (año actual)
        const currentYear = new Date().getFullYear();
        setAnioSeleccionado(currentYear.toString());
        setSemestreSeleccionado("I");

        if (sucursalesData.length > 0) {
          setSucursalSeleccionada(sucursalesData[0].sucursal_id);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Obtener la gestión correspondiente al año y semestre seleccionados
  useEffect(() => {
    if (!anioSeleccionado || !semestreSeleccionado) return;

    const gestion = gestiones.find(
      (g) =>
        g.anio === parseInt(anioSeleccionado) &&
        g.semestre === semestreSeleccionado
    );

    if (gestion) {
      setGestionSeleccionada(gestion.gestion_id);
    } else {
      setGestionSeleccionada("");
    }
  }, [anioSeleccionado, semestreSeleccionado, gestiones]);

  // Obtener datos adicionales cuando se seleccionan los filtros
  useEffect(() => {
    if (!sucursalSeleccionada || !gestionSeleccionada) return;

    const fetchAdditionalData = async () => {
      try {
        setLoading(true);

        // Obtener aulas, facilitadores, días y horas
        const [aulasRes, facilitadoresRes, diasRes, horasRes] =
          await Promise.all([
            fetch(`${API_URL}/sucursales/${sucursalSeleccionada}/aulas`, {
              headers: {
                Authorization: `bearer ${Cookies.get("access_token")}`,
              },
            }),
            fetch(`${API_URL}/usuarios/?rol_id=3`, {
              headers: {
                Authorization: `bearer ${Cookies.get("access_token")}`,
              },
            }),
            fetch(`${API_URL}/horarios/dias-semana`, {
              headers: {
                Authorization: `bearer ${Cookies.get("access_token")}`,
              },
            }),
            fetch(`${API_URL}/horarios/horas`, {
              headers: {
                Authorization: `bearer ${Cookies.get("access_token")}`,
              },
            }),
          ]);

        if (!aulasRes.ok) throw new Error("Error al cargar aulas");
        if (!facilitadoresRes.ok)
          throw new Error("Error al cargar facilitadores");
        if (!diasRes.ok) throw new Error("Error al cargar días de semana");
        if (!horasRes.ok) throw new Error("Error al cargar horas");

        const [aulasData, facilitadoresData, diasData, horasData] =
          await Promise.all([
            aulasRes.json(),
            facilitadoresRes.json(),
            diasRes.json(),
            horasRes.json(),
          ]);

        setAulas(aulasData);
        setFacilitadores(facilitadoresData);
        setDiasSemana(
          diasData.filter((dia) =>
            ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].includes(
              dia.dia_semana
            )
          )
        );
        setHoras(
          horasData.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
        );

        // Obtener horarios para la sucursal y gestión seleccionadas
        const horariosRes = await fetch(
          `${API_URL}/horarios/?gestion_id=${gestionSeleccionada}&sucursal_id=${sucursalSeleccionada}`,
          {
            headers: { Authorization: `bearer ${Cookies.get("access_token")}` },
          }
        );
        if (!horariosRes.ok) throw new Error("Error al cargar horarios");
        setHorarios(await horariosRes.json());
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdditionalData();
  }, [sucursalSeleccionada, gestionSeleccionada]);

  // Filtrar horarios por curso si hay filtro aplicado
  const horariosFiltrados = cursoFiltro
    ? horarios.filter((h) => h.curso_id === parseInt(cursoFiltro))
    : horarios;

  // Crear nueva hora
  const crearHora = async () => {
    try {
      const response = await fetch(`${API_URL}/horarios/horas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify(formHora),
      });

      if (!response.ok) throw new Error("Error al crear hora");

      const nuevaHora = await response.json();
      setHoras(
        [...horas, nuevaHora].sort((a, b) =>
          a.hora_inicio.localeCompare(b.hora_inicio)
        )
      );
      setModalHoraOpen(false);
      setFormHora({ hora_inicio: "", hora_fin: "" });
    } catch (error) {
      alert(error.message);
    }
  };

  // Editar hora existente
  const editarHora = async () => {
    try {
      const response = await fetch(
        `${API_URL}/horarios/horas/${horaEditando.hora_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `bearer ${Cookies.get("access_token")}`,
          },
          body: JSON.stringify(formHora),
        }
      );

      if (!response.ok) throw new Error("Error al actualizar hora");

      const horaActualizada = await response.json();
      setHoras(
        horas
          .map((h) =>
            h.hora_id === horaActualizada.hora_id ? horaActualizada : h
          )
          .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
      );
      setModalEditarHoraOpen(false);
      setFormHora({ hora_inicio: "", hora_fin: "" });
      setHoraEditando(null);
    } catch (error) {
      alert(error.message);
    }
  };

  // Eliminar hora
  const eliminarHora = async (horaId) => {
    if (!confirm("¿Eliminar este horario?")) return;

    try {
      const response = await fetch(`${API_URL}/horarios/horas/${horaId}`, {
        method: "DELETE",
        headers: { Authorization: `bearer ${Cookies.get("access_token")}` },
      });

      if (!response.ok) throw new Error("Error al eliminar hora");

      setHoras(horas.filter((h) => h.hora_id !== horaId));
    } catch (error) {
      alert(error.message);
    }
  };

  // Asignar curso a horario
  const asignarCurso = async () => {
    try {
      const method = formAsignacion.horario_id ? "PUT" : "POST";
      const url = formAsignacion.horario_id
        ? `${API_URL}/horarios/${formAsignacion.horario_id}`
        : `${API_URL}/horarios/`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          ...formAsignacion,
          sucursal_id: sucursalSeleccionada,
        }),
      });

      if (!response.ok) throw new Error("Error al asignar curso");

      const nuevoHorario = await response.json();

      if (formAsignacion.horario_id) {
        setHorarios(
          horarios.map((h) =>
            h.horario_id === nuevoHorario.horario_id ? nuevoHorario : h
          )
        );
      } else {
        setHorarios([...horarios, nuevoHorario]);
      }

      setModalAsignacionOpen(false);
      setFormAsignacion({
        horario_id: "",
        dia_semana_id: "",
        curso_id: "",
        profesor_id: "",
        aula_id: "",
        gestion_id: gestionSeleccionada,
        hora_id: "",
      });
    } catch (error) {
      alert(error.message);
    }
  };

  // Eliminar asignación
  const eliminarAsignacion = async (horarioId) => {
    if (!confirm("¿Eliminar esta asignación?")) return;

    try {
      const response = await fetch(`${API_URL}/horarios/${horarioId}`, {
        method: "DELETE",
        headers: { Authorization: `bearer ${Cookies.get("access_token")}` },
      });

      if (!response.ok) throw new Error("Error al eliminar asignación");

      setHorarios(horarios.filter((h) => h.horario_id !== horarioId));
    } catch (error) {
      alert(error.message);
    }
  };

  // Formatear hora para mostrar
  function formatHora(horaString) {
    if (!horaString) return "";
    const [hours, minutes] = horaString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  // Obtener nombre del aula
  const getNombreAula = (aulaId) => {
    const aula = aulas.find((a) => a.aula_id === aulaId);
    return aula ? `${aula.nombre} (${aula.tipo})` : "Sin aula";
  };

  // Obtener nombre del curso
  function getNombreCurso(cursoId) {
    const curso = cursos.find((c) => c.curso_id === cursoId);
    return curso ? curso.nombre : "Sin curso";
  }

  // Obtener nombre del facilitador
  function getNombreFacilitador(profesorId) {
    const facilitador = facilitadores.find((f) => f.usuario_id === profesorId);
    return facilitador ? facilitador.nombre : "Sin facilitador";
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">HORARIOS</h1>

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
          onClick={() => setModalAsignacionOpen(true)}
        >
          <PlusIcon />
          Asignar Horario
        </button>
      </div>

      {/* Selector de Año y Semestre */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(e.target.value)}
              disabled={loading}
            >
              {years.map((year) => (
                <option key={year.year_id} value={year.year}>
                  {year.year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gestión
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={semestreSeleccionado}
              onChange={(e) => setSemestreSeleccionado(e.target.value)}
              disabled={loading}
            >
              <option value="I">I</option>
              <option value="II">II</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {gestionSeleccionada ? (
              <span>
                Mostrando horarios para {anioSeleccionado} - Gestión{" "}
                {semestreSeleccionado}
              </span>
            ) : (
              <span className="text-red-500">
                No existe gestión para {anioSeleccionado} -{" "}
                {semestreSeleccionado}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro de Sucursal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sucursal
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={sucursalSeleccionada}
              onChange={(e) => {
                setSucursalSeleccionada(e.target.value);
                setCursoFiltro("");
              }}
              disabled={loading || sucursales.length === 0}
            >
              {sucursales.map((sucursal) => (
                <option key={sucursal.sucursal_id} value={sucursal.sucursal_id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Curso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curso
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={cursoFiltro}
              onChange={(e) => setCursoFiltro(e.target.value)}
              disabled={loading || cursos.length === 0}
            >
              <option value="">Todos los cursos</option>
              {cursos.map((curso) => (
                <option key={curso.curso_id} value={curso.curso_id}>
                  {curso.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Botón para gestionar horas */}
          <div className="flex items-end">
            <button
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-1"
              onClick={() => {
                setFormHora({ hora_inicio: "", hora_fin: "" });
                setModalHoraOpen(true);
              }}
              disabled={loading}
            >
              <PlusIcon /> Gestionar Horas
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de horarios */}
      {loading ? (
        <div className="text-center py-8">Cargando horarios...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : !gestionSeleccionada ? (
        <div className="text-center py-8 text-gray-500">
          No existe una gestión para el año {anioSeleccionado} y semestre{" "}
          {semestreSeleccionado} seleccionados.
        </div>
      ) : horas.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No hay horas registradas. Crea primero los periodos horarios.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora
                </th>
                {diasSemana.map((dia) => (
                  <th
                    key={dia.dias_semana_id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {dia.dia_semana}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {horas.map((hora) => (
                <tr key={hora.hora_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span>
                        {formatHora(hora.hora_inicio)} -{" "}
                        {formatHora(hora.hora_fin)}
                      </span>
                      <button
                        onClick={() => {
                          setHoraEditando(hora);
                          setFormHora({
                            hora_inicio: hora.hora_inicio,
                            hora_fin: hora.hora_fin,
                          });
                          setModalEditarHoraOpen(true);
                        }}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => eliminarHora(hora.hora_id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
                  {diasSemana.map((dia) => {
                    const horario = horariosFiltrados.find(
                      (h) =>
                        h.dia_semana_id === dia.dias_semana_id &&
                        h.hora_id === hora.hora_id
                    );

                    return (
                      <td
                        key={`${hora.hora_id}-${dia.dias_semana_id}`}
                        className="px-6 py-4 whitespace-nowrap"
                      >
                        {horario ? (
                          <div className="group relative bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div className="font-medium text-blue-800">
                              {getNombreCurso(horario.curso_id)}
                            </div>
                            <div className="text-sm text-blue-600">
                              {getNombreFacilitador(horario.profesor_id)}
                            </div>
                            <div className="text-xs text-blue-500 mt-1">
                              {getNombreAula(horario.aula_id)}
                            </div>
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1">
                              <button
                                className="text-blue-500 hover:text-blue-700"
                                onClick={() => {
                                  setFormAsignacion({
                                    horario_id: horario.horario_id,
                                    dia_semana_id: horario.dia_semana_id,
                                    curso_id: horario.curso_id,
                                    profesor_id: horario.profesor_id,
                                    aula_id: horario.aula_id,
                                    gestion_id: horario.gestion_id,
                                    hora_id: horario.hora_id,
                                  });
                                  setModalAsignacionOpen(true);
                                }}
                              >
                                <EditIcon />
                              </button>
                              <button
                                className="text-red-500 hover:text-red-700"
                                onClick={() =>
                                  eliminarAsignacion(horario.horario_id)
                                }
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="w-full h-full p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center"
                            onClick={() => {
                              setFormAsignacion({
                                horario_id: "",
                                dia_semana_id: dia.dias_semana_id,
                                curso_id: "",
                                profesor_id: "",
                                aula_id:
                                  aulas.length > 0 ? aulas[0].aula_id : "",
                                gestion_id: gestionSeleccionada,
                                hora_id: hora.hora_id,
                              });
                              setModalAsignacionOpen(true);
                            }}
                          >
                            + Asignar curso
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para asignar/editar horario */}
      {modalAsignacionOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {formAsignacion.horario_id
                  ? "Editar Asignación"
                  : "Asignar Horario"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sucursal
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={sucursalSeleccionada}
                    disabled
                  >
                    {sucursales.map(
                      (sucursal) =>
                        sucursal.sucursal_id === sucursalSeleccionada && (
                          <option
                            key={sucursal.sucursal_id}
                            value={sucursal.sucursal_id}
                          >
                            {sucursal.nombre}
                          </option>
                        )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Curso
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formAsignacion.curso_id}
                    onChange={(e) =>
                      setFormAsignacion({
                        ...formAsignacion,
                        curso_id: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Seleccionar curso</option>
                    {cursos.map((curso) => (
                      <option key={curso.curso_id} value={curso.curso_id}>
                        {curso.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facilitador
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formAsignacion.profesor_id}
                    onChange={(e) =>
                      setFormAsignacion({
                        ...formAsignacion,
                        profesor_id: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Seleccionar facilitador</option>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aula
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formAsignacion.aula_id}
                    onChange={(e) =>
                      setFormAsignacion({
                        ...formAsignacion,
                        aula_id: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Seleccionar aula</option>
                    {aulas.map((aula) => (
                      <option key={aula.aula_id} value={aula.aula_id}>
                        {aula.nombre} ({aula.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Día
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formAsignacion.dia_semana_id}
                      onChange={(e) =>
                        setFormAsignacion({
                          ...formAsignacion,
                          dia_semana_id: e.target.value,
                        })
                      }
                      required
                      disabled={!!formAsignacion.horario_id}
                    >
                      <option value="">Seleccionar día</option>
                      {diasSemana.map((dia) => (
                        <option
                          key={dia.dias_semana_id}
                          value={dia.dias_semana_id}
                        >
                          {dia.dia_semana}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formAsignacion.hora_id}
                      onChange={(e) =>
                        setFormAsignacion({
                          ...formAsignacion,
                          hora_id: e.target.value,
                        })
                      }
                      required
                      disabled={!!formAsignacion.horario_id}
                    >
                      <option value="">Seleccionar hora</option>
                      {horas.map((hora) => (
                        <option key={hora.hora_id} value={hora.hora_id}>
                          {formatHora(hora.hora_inicio)} -{" "}
                          {formatHora(hora.hora_fin)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  onClick={() => setModalAsignacionOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={asignarCurso}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nueva hora */}
      {modalHoraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Nueva Hora</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formHora.hora_inicio}
                    onChange={(e) =>
                      setFormHora({
                        ...formHora,
                        hora_inicio: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formHora.hora_fin}
                    onChange={(e) =>
                      setFormHora({
                        ...formHora,
                        hora_fin: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  onClick={() => setModalHoraOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={crearHora}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar hora */}
      {modalEditarHoraOpen && horaEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Editar Hora</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formHora.hora_inicio}
                    onChange={(e) =>
                      setFormHora({
                        ...formHora,
                        hora_inicio: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formHora.hora_fin}
                    onChange={(e) =>
                      setFormHora({
                        ...formHora,
                        hora_fin: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  onClick={() => setModalEditarHoraOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={editarHora}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
