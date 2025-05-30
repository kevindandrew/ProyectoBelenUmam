"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

// Componentes de íconos (se mantienen igual)
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
  });

  // Obtener datos iniciales (gestiones y sucursales)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

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

        // Establecer valores por defecto
        if (gestionesData.length > 0) {
          const ultimaGestion = gestionesData[gestionesData.length - 1];
          setAnioSeleccionado(ultimaGestion.anio);
          setSemestreSeleccionado(ultimaGestion.semestre);
          setGestionSeleccionada(ultimaGestion.gestion_id);
        }

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

  // Obtener datos adicionales cuando se seleccionan los filtros
  useEffect(() => {
    if (!sucursalSeleccionada || !anioSeleccionado || !semestreSeleccionado)
      return;

    const fetchAdditionalData = async () => {
      try {
        setLoading(true);

        // Obtener la gestión correspondiente al año y semestre seleccionados
        const gestion = gestiones.find(
          (g) =>
            g.anio === anioSeleccionado && g.semestre === semestreSeleccionado
        );

        if (!gestion) return;

        setGestionSeleccionada(gestion.gestion_id);

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
        setHoras(horasData);

        // Obtener horarios para la sucursal y gestión seleccionadas
        const horariosRes = await fetch(
          `${API_URL}/horarios/?gestion_id=${gestion.gestion_id}&sucursal_id=${sucursalSeleccionada}`,
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
  }, [sucursalSeleccionada, anioSeleccionado, semestreSeleccionado, gestiones]);

  // Filtrar horarios por curso si hay filtro aplicado
  const horariosFiltrados = cursoFiltro
    ? horarios.filter((h) => h.curso_id === parseInt(cursoFiltro))
    : horarios;

  // Obtener aulas y horas cuando cambia la sucursal
  useEffect(() => {
    if (!sucursalSeleccionada) return;

    const fetchAulasYHoras = async () => {
      try {
        const [aulasRes, horasRes] = await Promise.all([
          fetch(`${API_URL}/sucursales/${sucursalSeleccionada}/aulas`, {
            headers: { Authorization: `bearer ${Cookies.get("access_token")}` },
          }),
          fetch(`${API_URL}/horarios/horas`, {
            headers: { Authorization: `bearer ${Cookies.get("access_token")}` },
          }),
        ]);

        if (!aulasRes.ok) throw new Error("Error al cargar aulas");
        if (!horasRes.ok) throw new Error("Error al cargar horas");

        setAulas(await aulasRes.json());
        setHoras(await horasRes.json());
      } catch (error) {
        setError(error.message);
      }
    };

    fetchAulasYHoras();
  }, [sucursalSeleccionada]);

  // Obtener horarios cuando cambia la sucursal o gestión
  useEffect(() => {
    if (!sucursalSeleccionada || !gestionSeleccionada) return;

    const fetchHorarios = async () => {
      try {
        setLoading(true);
        const url = `${API_URL}/horarios/?gestion_id=${gestionSeleccionada}&sucursal_id=${sucursalSeleccionada}`;
        const res = await fetch(url, {
          headers: { Authorization: `bearer ${Cookies.get("access_token")}` },
        });

        if (!res.ok) throw new Error("Error al cargar horarios");

        const data = await res.json();
        setHorarios(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHorarios();
  }, [sucursalSeleccionada, gestionSeleccionada]);

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
      setHoras([...horas, nuevaHora]);
      setModalHoraOpen(false);
      setFormHora({ hora_inicio: "", hora_fin: "" });
    } catch (error) {
      alert(error.message);
    }
  };

  // Asignar curso a horario
  const asignarCurso = async () => {
    try {
      const response = await fetch(`${API_URL}/horarios/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify(formAsignacion),
      });

      if (!response.ok) throw new Error("Error al asignar curso");

      const nuevoHorario = await response.json();
      setHorarios([...horarios, nuevoHorario]);
      setModalAsignacionOpen(false);
      setFormAsignacion({
        horario_id: "",
        dia_semana_id: "",
        curso_id: "",
        profesor_id: "",
        aula_id: "",
        gestion_id: gestionSeleccionada,
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
    return `${hours}:${minutes}`;
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

  // Obtener nombre del día
  const getNombreDia = (diaId) => {
    const dia = diasSemana.find((d) => d.dias_semana_id === diaId);
    return dia ? dia.dia_semana : "";
  };

  // Filtrar horarios por curso si hay filtro aplicado

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Encabezado con filtros de gestión */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#13678A]">HORARIOS</h1>

        <div className="flex gap-4">
          {/* Selector de Año */}
          <div>
            <label className="block text-sm font-medium mb-1">Año</label>
            <select
              className="border rounded px-3 py-2"
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(e.target.value)}
              disabled={loading || gestiones.length === 0}
            >
              <option value="">Seleccionar año</option>
              {Array.from(new Set(gestiones.map((g) => g.anio)))
                .sort((a, b) => b - a) // Ordenar años de más reciente a más antiguo
                .map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
            </select>
          </div>

          {/* Selector de Semestre */}
          <div>
            <label className="block text-sm font-medium mb-1">Semestre</label>
            <select
              className="border rounded px-3 py-2"
              value={semestreSeleccionado}
              onChange={(e) => setSemestreSeleccionado(e.target.value)}
              disabled={loading || gestiones.length === 0}
            >
              <option value="I">I</option>
              <option value="II">II</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtros de sucursal y curso */}
      <div className="flex flex-wrap gap-4 mb-6 border-t pt-4">
        {/* Selector de Sucursal */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Sucursal</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={sucursalSeleccionada}
            onChange={(e) => {
              setSucursalSeleccionada(e.target.value);
              setCursoFiltro(""); // Resetear filtro de curso al cambiar sucursal
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

        {/* Filtro por Curso */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">
            Filtrar por Curso
          </label>
          <select
            className="w-full border rounded px-3 py-2"
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

        {/* Botón para agregar nueva hora */}
        <div className="flex items-end">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-1"
            onClick={() => setModalHoraOpen(true)}
            disabled={loading}
          >
            <PlusIcon /> Nueva Hora
          </button>
        </div>
      </div>

      {/* Tabla de horarios */}
      {loading ? (
        <div className="text-center py-8">Cargando horarios...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : horas.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No hay horas registradas. Crea primero los periodos horarios.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Aula</th>
                <th className="border px-4 py-2">Horario</th>
                {diasSemana.map((dia) => (
                  <th key={dia.dias_semana_id} className="border px-4 py-2">
                    {dia.dia_semana}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aulas.map((aula) =>
                horas.map((hora) => {
                  // Verificar si hay horarios para esta aula y hora
                  const horariosAulaHora = horariosFiltrados.filter(
                    (h) =>
                      h.aula_id === aula.aula_id && h.hora_id === hora.hora_id
                  );

                  // Si no hay horarios y estamos filtrando, no mostrar la fila
                  if (cursoFiltro && horariosAulaHora.length === 0) {
                    return null;
                  }

                  return (
                    <tr key={`${aula.aula_id}-${hora.hora_id}`}>
                      <td className="border px-4 py-2">
                        {aula.nombre} ({aula.tipo})
                      </td>
                      <td className="border px-4 py-2">
                        {formatHora(hora.hora_inicio)} -{" "}
                        {formatHora(hora.hora_fin)}
                      </td>
                      {diasSemana.map((dia) => {
                        const horario = horariosFiltrados.find(
                          (h) =>
                            h.aula_id === aula.aula_id &&
                            h.dia_semana_id === dia.dias_semana_id &&
                            h.hora_id === hora.hora_id
                        );

                        return (
                          <td
                            key={`${aula.aula_id}-${hora.hora_id}-${dia.dias_semana_id}`}
                            className="border px-4 py-2 min-w-[200px]"
                          >
                            {horario ? (
                              <div className="group relative">
                                <div className="p-2 rounded hover:bg-gray-50">
                                  <div className="font-semibold">
                                    {getNombreCurso(horario.curso_id)}
                                  </div>
                                  <div className="text-sm">
                                    {getNombreFacilitador(horario.profesor_id)}
                                  </div>
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
                                className="w-full h-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                onClick={() => {
                                  setFormAsignacion({
                                    horario_id: "",
                                    dia_semana_id: dia.dias_semana_id,
                                    curso_id: "",
                                    profesor_id: "",
                                    aula_id: aula.aula_id,
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para agregar/editar hora */}
      {modalHoraOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {formHora.hora_inicio ? "Editar Hora" : "Nueva Hora"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  className="w-full border rounded px-3 py-2"
                  value={formHora.hora_inicio}
                  onChange={(e) =>
                    setFormHora({
                      ...formHora,
                      hora_inicio: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Hora Fin
                </label>
                <input
                  type="time"
                  className="w-full border rounded px-3 py-2"
                  value={formHora.hora_fin}
                  onChange={(e) =>
                    setFormHora({
                      ...formHora,
                      hora_fin: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setModalHoraOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={crearHora}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para asignar/editar curso */}
      {modalAsignacionOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {formAsignacion.curso_id ? "Editar Asignación" : "Asignar Curso"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Curso</label>
                <select
                  className="w-full border rounded px-3 py-2"
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
                <label className="block text-sm font-medium mb-1">
                  Facilitador
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
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
                <label className="block text-sm font-medium mb-1">Día</label>
                <select
                  className="w-full border rounded px-3 py-2"
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
                    <option key={dia.dias_semana_id} value={dia.dias_semana_id}>
                      {dia.dia_semana}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Aula</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={formAsignacion.aula_id}
                  onChange={(e) =>
                    setFormAsignacion({
                      ...formAsignacion,
                      aula_id: e.target.value,
                    })
                  }
                  required
                  disabled={!!formAsignacion.horario_id}
                >
                  <option value="">Seleccionar aula</option>
                  {aulas.map((aula) => (
                    <option key={aula.aula_id} value={aula.aula_id}>
                      {aula.nombre} ({aula.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Horario
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
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
                  <option value="">Seleccionar horario</option>
                  {horas.map((hora) => (
                    <option key={hora.hora_id} value={hora.hora_id}>
                      {formatHora(hora.hora_inicio)} -{" "}
                      {formatHora(hora.hora_fin)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setModalAsignacionOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={asignarCurso}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
