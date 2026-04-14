"use client";
import { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { usePageTitle } from "@/lib/usePageTitle";

const API_URL = "https://api-umam-1.onrender.com";

const DIA_NOMBRE = {
  1: "Lunes", 2: "Martes", 3: "Miércoles",
  4: "Jueves", 5: "Viernes", 6: "Sábado", 7: "Domingo",
};

function formatHora(v) {
  if (!v) return "";
  const s = String(v);
  return s.includes("T") ? (s.split("T")[1] || "").slice(0, 5) : s.slice(0, 5);
}

function buildDiasLabel(dias_clase) {
  if (!Array.isArray(dias_clase) || dias_clase.length === 0) return "Sin días";
  const dias = dias_clase.map((d) => {
    const id = d?.dia_semana_id ?? d?.dia_semana?.dias_semana_id;
    return DIA_NOMBRE[id] || `Día ${id}`;
  });
  const hi = formatHora(dias_clase[0]?.hora?.hora_inicio ?? dias_clase[0]?.hora_inicio);
  const hf = formatHora(dias_clase[0]?.hora?.hora_fin ?? dias_clase[0]?.hora_fin);
  const diasStr = [...new Set(dias)].join(", ");
  return hi && hf ? `${diasStr} (${hi} - ${hf})` : diasStr;
}

export default function DuplicadosPage() {
  usePageTitle("Limpieza de Duplicados");

  const [grupos, setGrupos] = useState([]);
  const [cursosMap, setCursosMap] = useState({});
  const [profesoresMap, setProfesoresMap] = useState({});
  const [aulasMap, setAulasMap] = useState({});
  const [gestionesMap, setGestionesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Cargando datos...");
  const [procesando, setProcesando] = useState({});
  const [debugInfo, setDebugInfo] = useState(null);

  const fetchAuth = useCallback(async (url, options = {}) => {
    const token = Cookies.get("access_token");
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent("sessionExpired"));
      throw new Error("Sesión expirada");
    }
    return res;
  }, []);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setLoadingMsg("Cargando catálogos...");
    try {
      // 1. Fetch all catalogs in parallel
      const [cursosRes, profRes, sucRes, gestionesRes, inscRes] = await Promise.all([
        fetchAuth(`${API_URL}/cursos/`),
        fetchAuth(`${API_URL}/usuarios/?rol_id=3`),
        fetchAuth(`${API_URL}/sucursales/`),
        fetchAuth(`${API_URL}/cursos/gestiones`),
        fetchAuth(`${API_URL}/inscripciones/`),
      ]);

      // Build cursos map
      const cMap = {};
      if (cursosRes.ok) {
        const data = await cursosRes.json();
        (Array.isArray(data) ? data : []).forEach((c) => {
          if (c?.curso_id) cMap[c.curso_id] = c.nombre;
        });
        setCursosMap(cMap);
      }

      // Build profesores map
      const pMap = {};
      if (profRes.ok) {
        const data = await profRes.json();
        (Array.isArray(data) ? data : []).forEach((u) => {
          if (u?.usuario_id)
            pMap[u.usuario_id] = `${u.nombres || ""} ${u.ap_paterno || ""}`.trim();
        });
        setProfesoresMap(pMap);
      }

      // Build aulas map + get sucursales list
      const aMap = {};
      let sucursales = [];
      if (sucRes.ok) {
        const data = await sucRes.json();
        sucursales = Array.isArray(data) ? data : [];
        sucursales.forEach((s) => {
          (s?.aulas || []).forEach((a) => {
            if (a?.aula_id)
              aMap[a.aula_id] = `${a.nombre || `Aula ${a.aula_id}`} - ${s.nombre}`;
          });
        });
        setAulasMap(aMap);
      }

      // Build gestiones map + get gestiones list
      const gMap = {};
      let gestiones = [];
      if (gestionesRes.ok) {
        const data = await gestionesRes.json();
        gestiones = Array.isArray(data) ? data : [];
        gestiones.forEach((g) => {
          if (g?.gestion_id) gMap[g.gestion_id] = g.gestion;
        });
        setGestionesMap(gMap);
      }

      // Count inscripciones per horario
      const inscritosPorHorario = {};
      if (inscRes.ok) {
        const data = await inscRes.json();
        (Array.isArray(data) ? data : []).forEach((i) => {
          if (i?.horario_id != null) {
            const k = String(i.horario_id);
            inscritosPorHorario[k] = (inscritosPorHorario[k] || 0) + 1;
          }
        });
      }

      // 2. Fetch ALL horarios across every gestion × sucursal combination
      setLoadingMsg(
        `Analizando horarios (${gestiones.length} gestiones × ${sucursales.length} sucursales)...`,
      );

      const allHorariosMap = {}; // keyed by horario_id to deduplicate

      await Promise.all(
        gestiones.flatMap((g) =>
          sucursales.map(async (s) => {
            try {
              const res = await fetchAuth(
                `${API_URL}/horarios/?gestion_id=${g.gestion_id}&sucursal_id=${s.sucursal_id}`,
              );
              if (res.ok) {
                const data = await res.json();
                (Array.isArray(data) ? data : []).forEach((h) => {
                  if (h?.horario_id != null && !allHorariosMap[h.horario_id]) {
                    allHorariosMap[h.horario_id] = {
                      ...h,
                      inscritos: inscritosPorHorario[String(h.horario_id)] || 0,
                    };
                  }
                });
              }
            } catch {
              // skip failed combinations silently
            }
          }),
        ),
      );

      const allHorarios = Object.values(allHorariosMap);

      // 3. Filter out "NO DISPONIBLE" / blocker horarios
      const horariosReales = allHorarios.filter((h) => {
        if (!h.curso_id || !h.profesor_id) return false;
        const nombre = (cMap[h.curso_id] || "").toUpperCase();
        return (
          !nombre.includes("NO DISPONIBLE") &&
          !nombre.includes("BLOQUEADO") &&
          !nombre.includes("OCUPADO")
        );
      });

      // 4. Detect duplicates: group by curso_id + profesor_id + gestion_id
      //    (same teacher teaching the same course in the same period = duplicate)
      const gruposMap = {};
      horariosReales.forEach((h) => {
        const key = `${h.curso_id}__${h.profesor_id}__${h.gestion_id}`;
        if (!gruposMap[key]) {
          gruposMap[key] = {
            curso_id: h.curso_id,
            profesor_id: h.profesor_id,
            gestion_id: h.gestion_id,
            horarios: [],
          };
        }
        gruposMap[key].horarios.push(h);
      });

      const gruposDuplicados = Object.values(gruposMap).filter(
        (g) => g.horarios.length > 1,
      );

      setDebugInfo({
        totalHorarios: allHorarios.length,
        horariosReales: horariosReales.length,
        gruposAnalizados: Object.keys(gruposMap).length,
        duplicadosEncontrados: gruposDuplicados.length,
      });

      setGrupos(gruposDuplicados);
    } catch (err) {
      toast.error("Error al cargar datos: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  }, [fetchAuth]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const setKey = (k, v) => setProcesando((p) => ({ ...p, [k]: v }));

  const eliminarHorario = async (horarioId) => {
    setKey(horarioId, true);
    try {
      const res = await fetchAuth(`${API_URL}/horarios/${horarioId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success(`Horario #${horarioId} eliminado`);
      await cargarDatos();
    } catch (err) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setKey(horarioId, false);
    }
  };

  const fusionarHorario = async (sourceId, targetId) => {
    const k = `f_${sourceId}`;
    setKey(k, true);
    try {
      const res = await fetchAuth(`${API_URL}/horarios/${sourceId}/fusionar`, {
        method: "POST",
        body: JSON.stringify({ target_horario_id: targetId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || "Error al fusionar");
      }
      toast.success(`Horario #${sourceId} fusionado en #${targetId}`);
      await cargarDatos();
    } catch (err) {
      toast.error(err.message || "Error al fusionar");
    } finally {
      setKey(k, false);
    }
  };

  const fusionarTodoGrupo = async (grupo) => {
    const keeper = [...grupo.horarios].sort((a, b) => b.inscritos - a.inscritos)[0];
    const otros = grupo.horarios.filter((h) => h.horario_id !== keeper.horario_id);
    for (const h of otros) {
      if (h.inscritos > 0) {
        await fusionarHorario(h.horario_id, keeper.horario_id);
      } else {
        await eliminarHorario(h.horario_id);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm text-gray-500">{loadingMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Limpieza de Duplicados</h1>
          <p className="text-sm text-gray-500">
            {grupos.length === 0
              ? "No hay horarios duplicados detectados."
              : `${grupos.length} grupo(s) con horarios duplicados · Revisa y limpia de forma segura`}
          </p>
        </div>
        <button
          onClick={cargarDatos}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Actualizar
        </button>
      </div>

      {/* Debug info */}
      {debugInfo && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500 font-mono">
          Analizados: {debugInfo.totalHorarios} horarios totales · {debugInfo.horariosReales} reales ·{" "}
          {debugInfo.gruposAnalizados} grupos únicos · {debugInfo.duplicadosEncontrados} con duplicados
        </div>
      )}

      {/* Sin duplicados */}
      {grupos.length === 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-10 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-2 text-lg font-semibold text-green-700">Todo limpio</p>
          <p className="text-sm text-green-600">No se detectaron horarios duplicados.</p>
        </div>
      )}

      {/* Leyenda */}
      {grupos.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-green-700 font-medium">
            ✅ Conservar — tiene más estudiantes
          </span>
          <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-yellow-700 font-medium">
            🔀 Fusionar — mover sus estudiantes al principal
          </span>
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-red-700 font-medium">
            🗑 Eliminar — sin estudiantes, es seguro borrar
          </span>
        </div>
      )}

      {/* Grupos de duplicados */}
      <div className="space-y-5">
        {grupos.map((grupo, idx) => {
          const keeper = [...grupo.horarios].sort(
            (a, b) => b.inscritos - a.inscritos,
          )[0];
          const totalInscritos = grupo.horarios.reduce(
            (s, h) => s + h.inscritos,
            0,
          );
          const vacios = grupo.horarios.filter(
            (h) => h.inscritos === 0 && h.horario_id !== keeper.horario_id,
          );
          const conEstudiantes = grupo.horarios.filter(
            (h) => h.inscritos > 0 && h.horario_id !== keeper.horario_id,
          );

          return (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border border-orange-200 bg-white shadow-sm"
            >
              {/* Header grupo */}
              <div className="flex flex-col gap-2 bg-orange-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-base">
                    {cursosMap[grupo.curso_id] || `Curso #${grupo.curso_id}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {profesoresMap[grupo.profesor_id] ||
                      `Docente #${grupo.profesor_id}`}
                    {" · "}
                    {gestionesMap[grupo.gestion_id] ||
                      `Gestión #${grupo.gestion_id}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {grupo.horarios.length} horarios · {totalInscritos} inscritos
                    en total
                    {vacios.length > 0 &&
                      ` · ${vacios.length} vacíos eliminables`}
                    {conEstudiantes.length > 0 &&
                      ` · ${conEstudiantes.length} para fusionar`}
                  </p>
                </div>
                <button
                  onClick={() => fusionarTodoGrupo(grupo)}
                  disabled={grupo.horarios.length <= 1}
                  className="whitespace-nowrap rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-40"
                >
                  Limpiar todo → conservar #{keeper.horario_id}
                </button>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-2">ID</th>
                      <th className="px-4 py-2">Aula</th>
                      <th className="px-4 py-2">Días / Horario</th>
                      <th className="px-4 py-2">Inscritos</th>
                      <th className="px-4 py-2">Estado</th>
                      <th className="px-4 py-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...grupo.horarios]
                      .sort((a, b) => b.inscritos - a.inscritos)
                      .map((h) => {
                        const esKeeper = h.horario_id === keeper.horario_id;
                        const cargandoElim = procesando[h.horario_id];
                        const cargandoFus = procesando[`f_${h.horario_id}`];
                        const cargando = cargandoElim || cargandoFus;

                        return (
                          <tr
                            key={h.horario_id}
                            className={`border-b last:border-b-0 transition-colors ${
                              esKeeper
                                ? "bg-green-50"
                                : h.inscritos === 0
                                  ? "bg-red-50"
                                  : "bg-yellow-50"
                            }`}
                          >
                            {/* ID */}
                            <td className="px-4 py-3">
                              <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-700">
                                #{h.horario_id}
                              </span>
                            </td>

                            {/* Aula */}
                            <td className="px-4 py-3 text-gray-600 text-xs">
                              {aulasMap[h.aula_id] || `Aula #${h.aula_id}`}
                            </td>

                            {/* Días */}
                            <td className="px-4 py-3 text-gray-700">
                              {buildDiasLabel(h.dias_clase)}
                            </td>

                            {/* Inscritos */}
                            <td className="px-4 py-3">
                              <span
                                className={`font-semibold ${
                                  h.inscritos > 0
                                    ? "text-blue-700"
                                    : "text-gray-400"
                                }`}
                              >
                                {h.inscritos}
                                {h.inscritos === 1
                                  ? " estudiante"
                                  : " estudiantes"}
                              </span>
                            </td>

                            {/* Badge estado */}
                            <td className="px-4 py-3">
                              {esKeeper ? (
                                <span className="rounded-full bg-green-200 px-2 py-1 text-xs font-semibold text-green-800">
                                  ✅ Conservar
                                </span>
                              ) : h.inscritos === 0 ? (
                                <span className="rounded-full bg-red-200 px-2 py-1 text-xs font-semibold text-red-800">
                                  🗑 Eliminar
                                </span>
                              ) : (
                                <span className="rounded-full bg-yellow-200 px-2 py-1 text-xs font-semibold text-yellow-800">
                                  🔀 Fusionar
                                </span>
                              )}
                            </td>

                            {/* Botón acción */}
                            <td className="px-4 py-3">
                              {esKeeper ? (
                                <span className="text-xs text-gray-400 italic">
                                  Principal
                                </span>
                              ) : h.inscritos === 0 ? (
                                <button
                                  onClick={() =>
                                    eliminarHorario(h.horario_id)
                                  }
                                  disabled={!!cargando}
                                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  {cargando ? "..." : "Eliminar"}
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    fusionarHorario(
                                      h.horario_id,
                                      keeper.horario_id,
                                    )
                                  }
                                  disabled={!!cargando}
                                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {cargando
                                    ? "..."
                                    : `Fusionar → #${keeper.horario_id}`}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
