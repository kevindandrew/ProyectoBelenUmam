"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);

  const API = "https://api-umam-1.onrender.com";

  // Cargar todos los datos necesarios al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    const loadAllData = async () => {
      setLoading(true);
      setError(null);
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

        setGestiones(gData);
        setSucursales(sData);
        setCursos(cData);

        // Establecer gestión activa por defecto
        const gestionActiva = gData.find((g) => g.activo) || gData[0];
        setGestionActual(gestionActiva?.gestion_id);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [isOpen]);

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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Error al cargar horarios");

      const data = await res.json();
      filasActualizadas[index].horariosDisponibles = data;

      if (data.length === 0) {
        filasActualizadas[
          index
        ].errorHorarios = `No hay horarios disponibles para esta combinación`;
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

      if (!response.ok) throw new Error("Error al inscribir");

      // Actualizar estado
      nuevasFilas[index].guardando = false;
      nuevasFilas[index].inscrito = true;
      setFilas(nuevasFilas);

      // Mostrar mensaje de éxito inmediatamente
      setMensajeExito(
        `¡${fila.esGestoria ? "Gestoría" : "Taller"} inscrito correctamente!`
      );

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
        `Algunas inscripciones fallaron. ${inscripcionesExitosas} de ${filas.length} realizadas con éxito.`
      );
    } else {
      setError("No se pudo realizar ninguna inscripción");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
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
                {g.gestion} ({g.year_id})
              </option>
            ))}
          </select>
        </div>

        {/* Botones para agregar cursos */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => agregarFila(false)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            + Agregar Taller
          </button>
          <button
            onClick={() => agregarFila(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            disabled={loading}
          >
            + Agregar Gestoría
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
