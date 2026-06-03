"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import Cookies from "js-cookie";
import {
  Building2,
  ClipboardList,
  FileText,
  Plus,
  X,
  Clock,
  CalendarDays,
  CheckCircle,
  User,
  Search,
  Download,
  Filter,
  Trash2,
} from "lucide-react";
import { usePageTitle } from "@/lib/usePageTitle";
import { toast } from "react-toastify";
import { generarPDFControlFacilitadores } from "./pdfControlFacilitadores";

const API_URL = "https://api-umam-1.onrender.com";
const TZ = "America/La_Paz";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const TIPO_OPTIONS = [
  {
    value: "asistencia_eventos",
    label: "Asistencia a UMAM",
    Icon: Building2,
    colorBadge: "bg-teal-100 text-teal-800",
    colorBtn: "border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100",
    colorActive: "border-teal-500 bg-teal-100 text-teal-800",
  },
  {
    value: "clases",
    label: "Asistencia Actividad",
    Icon: ClipboardList,
    colorBadge: "bg-blue-100 text-blue-800",
    colorBtn: "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100",
    colorActive: "border-blue-500 bg-blue-100 text-blue-800",
  },
  {
    value: "creacion_material",
    label: "Elaboración de Material",
    Icon: FileText,
    colorBadge: "bg-purple-100 text-purple-800",
    colorBtn:
      "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100",
    colorActive: "border-purple-500 bg-purple-100 text-purple-800",
  },
];
const TIPO_MAP = Object.fromEntries(TIPO_OPTIONS.map((o) => [o.value, o]));
const PAGE_SIZE = 15;

/* ── TZ helpers ── */
function nowInTZ() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
}
function todayStr() {
  const d = nowInTZ();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function currentTimeStr() {
  const d = nowInTZ();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function formatDateLocal(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
function calcDuration(fecha, hi, hf) {
  if (!fecha || !hi || !hf) return null;
  const diff =
    (new Date(`${fecha}T${hf}:00`) - new Date(`${fecha}T${hi}:00`)) / 3600000;
  return diff > 0 ? diff : null;
}
function formatDuration(hours) {
  if (hours == null) return "—";
  const h = Math.floor(hours),
    m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/* ── Auth ── */
async function fetchAuth(url, options = {}) {
  const token = Cookies.get("access_token");
  if (!token) throw new Error("Sesión expirada.");
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
    Cookies.remove("access_token");
    Cookies.remove("user_data");
    throw new Error("Sesión expirada.");
  }
  return res;
}

/* ── Row parser ── */
function parseRow(r) {
  const obs = r.observaciones || "";
  const tm = obs.match(/Hora inicio: (\d{2}:\d{2}) \| Hora fin: (\d{2}:\d{2})/);
  return {
    horaInicio: tm ? tm[1] : "—",
    horaFin: tm ? tm[2] : "—",
    descripcion: tm ? obs.split(" — ")[0] || "—" : obs || "—",
    fecha: r.fecha ? formatDateLocal(r.fecha) : "—",
    fechaRaw: r.fecha || "",
    duracion: tm ? calcDuration(r.fecha, tm[1], tm[2]) : null,
  };
}

function blankForm() {
  return {
    usuario_id: "",
    tipo_servicio: "",
    fecha: todayStr(),
    hora_inicio: currentTimeStr(),
    hora_fin: "",
    descripcion: "",
  };
}

export default function ControlFacilitadoresPage() {
  usePageTitle("Control de Facilitadores");

  const [facilitadores, setFacilitadores] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(nowInTZ().getFullYear());
  const [selectedMes, setSelectedMes] = useState(nowInTZ().getMonth() + 1);
  const [selectedFacilitador, setSelectedFacilitador] = useState("TODOS");

  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [page, setPage] = useState(1);

  /* Modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  // Cargar Facilitadores
  const loadFacilitadores = useCallback(async () => {
    try {
      const res = await fetchAuth(`${API_URL}/usuarios/`);
      if (res.ok) {
        const data = await res.json();

        // Filtrar facilitadores (rol_id 3 o nombre 'Facilitador')
        const list = (Array.isArray(data) ? data : []).filter(
          (u) =>
            Number(u.rol_id) === 3 ||
            u.rol?.nombre?.toLowerCase().includes("facilitador"),
        );

        // Ordenar alfabéticamente
        list.sort((a, b) => {
          const nameA =
            `${a.nombres} ${a.ap_paterno} ${a.ap_materno || ""}`.toUpperCase();
          const nameB =
            `${b.nombres} ${b.ap_paterno} ${b.ap_materno || ""}`.toUpperCase();
          return nameA.localeCompare(nameB);
        });

        setFacilitadores(list);
      }
    } catch (err) {
      // Error silencioso
    }
  }, []);

  // Cargar Años
  const loadYears = useCallback(async () => {
    try {
      const res = await fetchAuth(`${API_URL}/cursos/years`);
      if (res.ok) {
        const data = await res.json();
        setYears(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, []);

  // Cargar Todos los Registros
  const loadRegistros = useCallback(async () => {
    try {
      setLoading(true);
      // Intentamos cargar todos los registros. Si no hay endpoint global,
      // tendremos que cargar de a uno o buscar el endpoint correcto.
      // Por ahora probamos con el endpoint base de registros.
      const res = await fetchAuth(`${API_URL}/registro-horas/`);
      if (!res.ok) throw new Error("No se pudo cargar el historial global.");
      const data = await res.json();
      setRegistros(
        (Array.isArray(data) ? data : []).sort(
          (a, b) => new Date(b.hora_entrada) - new Date(a.hora_entrada),
        ),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacilitadores();
    loadYears();
    loadRegistros();
  }, [loadFacilitadores, loadYears, loadRegistros]);

  // Filtrado
  const filtrados = useMemo(() => {
    return registros.filter((r) => {
      // Filtro de fecha
      if (!r.fecha) return false;
      const [y, m] = r.fecha.split("-").map(Number);
      if (selectedYear && y !== selectedYear) return false;
      if (selectedMes && m !== selectedMes) return false;

      // Filtro de facilitador
      if (
        selectedFacilitador !== "TODOS" &&
        String(r.usuario_id) !== String(selectedFacilitador)
      )
        return false;

      // Filtro de tipo
      if (filterTipo && r.tipo_servicio !== filterTipo) return false;

      return true;
    });
  }, [registros, selectedYear, selectedMes, selectedFacilitador, filterTipo]);

  const paginados = useMemo(() => {
    return filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filtrados, page]);

  const totalPages = Math.ceil(filtrados.length / PAGE_SIZE) || 1;

  const totalHorasFiltradas = useMemo(() => {
    return filtrados.reduce((acc, r) => {
      const { horaInicio, horaFin, fechaRaw } = parseRow(r);
      const dur = calcDuration(fechaRaw, horaInicio, horaFin);
      return acc + (dur || 0);
    }, 0);
  }, [filtrados]);

  // Modal handlers
  const openModal = () => {
    setForm(blankForm());
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
  };

  const handleGuardarActividad = async () => {
    if (!form.usuario_id) return toast.warning("Selecciona un facilitador");
    if (!form.tipo_servicio) return toast.warning("Selecciona el tipo");
    if (!form.hora_fin) return toast.warning("Ingresa la hora de fin");

    try {
      setSaving(true);

      if (form.usuario_id === "TODOS") {
        const confirmTodos = confirm(
          "¿Estás seguro de registrar esta actividad para TODOS los facilitadores?",
        );
        if (!confirmTodos) return;

        toast.info(`Registrando para ${facilitadores.length} facilitadores...`);
        let exitos = 0;
        for (const f of facilitadores) {
          const ok = await ejecutarRegistroIndividual(f.usuario_id);
          if (ok) exitos++;
        }
        toast.success(
          `${exitos} de ${facilitadores.length} registros realizados con éxito`,
        );
      } else {
        const ok = await ejecutarRegistroIndividual(form.usuario_id);
        if (ok) toast.success("Actividad registrada con éxito");
        else throw new Error("Error al registrar actividad");
      }

      setModalOpen(false);
      loadRegistros();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const ejecutarRegistroIndividual = async (usuarioId) => {
    try {
      const f = facilitadores.find(
        (u) => String(u.usuario_id) === String(usuarioId),
      );
      const sucursal_id = f?.sucursal_id || null;

      const dur = calcDuration(form.fecha, form.hora_inicio, form.hora_fin);
      const obsLine = `Hora inicio: ${form.hora_inicio} | Hora fin: ${form.hora_fin} | Duración: ${formatDuration(dur)}`;
      const obsText = form.descripcion.trim()
        ? `${form.descripcion.trim()} — ${obsLine}`
        : obsLine;

      // Intentamos usar el endpoint base para creación manual
      const res = await fetchAuth(`${API_URL}/registro-horas/`, {
        method: "POST",
        body: JSON.stringify({
          usuario_id: Number(usuarioId),
          tipo_servicio: form.tipo_servicio,
          observaciones: obsText,
          fecha: form.fecha,
          sucursal_id: sucursal_id ? Number(sucursal_id) : null,
          // Para registros manuales completos
          hora_inicio: form.hora_inicio,
          hora_fin: form.hora_fin,
        }),
      });

      if (!res.ok) {
        // Fallback al endpoint de entrada si el base falla con 404
        if (res.status === 404 || res.status === 405) {
          const resEntrada = await fetchAuth(
            `${API_URL}/registro-horas/entrada`,
            {
              method: "POST",
              body: JSON.stringify({
                usuario_id: Number(usuarioId),
                tipo_servicio: form.tipo_servicio,
                observaciones: obsText,
                fecha: form.fecha,
                sucursal_id: sucursal_id ? Number(sucursal_id) : null,
              }),
            },
          );
          if (!resEntrada.ok) return false;
          const { registro_id } = await resEntrada.json();
          await fetchAuth(`${API_URL}/registro-horas/${registro_id}/salida`, {
            method: "PUT",
          });
          return true;
        }
        return false;
      }

      return true;
    } catch (err) {
      console.error(`Error registrando para ${usuarioId}:`, err);
      return false;
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;
    try {
      const res = await fetchAuth(`${API_URL}/registro-horas/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Registro eliminado");
        loadRegistros();
      }
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  const handleExportarPDF = async () => {
    if (filtrados.length === 0)
      return toast.warning("No hay registros para exportar");

    const facilitadorObj = facilitadores.find(
      (f) => String(f.usuario_id) === String(selectedFacilitador),
    );
    const nombreFacilitador = facilitadorObj
      ? `${facilitadorObj.nombres} ${facilitadorObj.ap_paterno} ${facilitadorObj.ap_materno || ""}`.trim()
      : "Todos los facilitadores";

    let extraInfo = {};
    if (facilitadorObj) {
      try {
        toast.info("Obteniendo detalles del facilitador...");

        // Cargar todo en paralelo para mayor velocidad
        const [userRes, horariosRes, cursosRes, sucursalesRes] =
          await Promise.all([
            fetchAuth(`${API_URL}/usuarios/${facilitadorObj.usuario_id}`),
            fetchAuth(
              `${API_URL}/horarios/?usuario_id=${facilitadorObj.usuario_id}`,
            ),
            fetchAuth(`${API_URL}/cursos/`),
            fetchAuth(`${API_URL}/sucursales/`),
          ]);

        // 1. Datos básicos
        if (userRes.ok) {
          const userData = await userRes.json();
          extraInfo.ci = userData.ci || "—";
          extraInfo.celular = userData.telefono || "—";
          extraInfo.sucursal = userData.sucursal?.nombre || "—";
        }

        // 2. Mapeo de catálogos
        const cursosCatalog = cursosRes.ok ? await cursosRes.json() : [];
        const sucursalesCatalog = sucursalesRes.ok
          ? await sucursalesRes.json()
          : [];

        const getCursoName = (id) =>
          cursosCatalog.find((c) => c.curso_id === id)?.nombre || null;

        // Crear un mapa de aula_id -> sucursal_nombre
        const aulaToSucursalName = {};
        sucursalesCatalog.forEach((s) => {
          if (Array.isArray(s.aulas)) {
            s.aulas.forEach((a) => {
              aulaToSucursalName[String(a.aula_id)] = s.nombre;
            });
          }
        });

        const getSucursalName = (id, aulaId) => {
          const fromCatalog = sucursalesCatalog.find(
            (s) => s.sucursal_id === id,
          )?.nombre;
          if (fromCatalog) return fromCatalog;
          if (aulaId) return aulaToSucursalName[String(aulaId)];
          return null;
        };

        // 3. Procesar horarios
        if (horariosRes.ok) {
          const horariosData = await horariosRes.json();
          if (Array.isArray(horariosData) && horariosData.length > 0) {
            // Nombres de cursos
            const nombresCursos = [
              ...new Set(
                horariosData
                  .map(
                    (h) =>
                      h.curso?.nombre ||
                      h.curso_nombre ||
                      h.nombre_curso ||
                      getCursoName(h.curso_id),
                  )
                  .filter(Boolean),
              ),
            ];
            extraInfo.cursos = nombresCursos.join(", ") || "—";

            // Sucursales
            const nombresSucursales = [
              ...new Set(
                horariosData
                  .map(
                    (h) =>
                      h.sucursal?.nombre ||
                      h.sucursal_nombre ||
                      h.nombre_sucursal ||
                      getSucursalName(h.sucursal_id, h.aula_id),
                  )
                  .filter(Boolean),
              ),
            ];
            if (nombresSucursales.length > 0) {
              extraInfo.sucursal = nombresSucursales.join(" / ");
            }

            // Horarios formateados
            const infoHorarios = horariosData
              .flatMap((h) => {
                const dias = h.dias_clase || h.dias || [];
                if (Array.isArray(dias)) {
                  return dias.map((d) => {
                    const dia = d.dia_semana?.dia_semana || d.dia || "";
                    const hi = (
                      d.hora?.hora_inicio ||
                      h.hora_inicio ||
                      ""
                    )?.slice(0, 5);
                    const hf = (d.hora?.hora_fin || h.hora_fin || "")?.slice(
                      0,
                      5,
                    );
                    return dia
                      ? `${dia.charAt(0).toUpperCase()}${dia.slice(1, 3)}. (${hi}-${hf})`
                      : "";
                  });
                }
                return [];
              })
              .filter(Boolean);
            extraInfo.horarios = [...new Set(infoHorarios)].join(" | ") || "—";
          }
        }
      } catch (err) {
        console.error("Error cargando extra info para PDF:", err);
      }
    }

    const infoHeader = {
      facilitador: nombreFacilitador,
      periodo: `${MESES[selectedMes - 1]} ${selectedYear}`,
      totalHoras: formatDuration(totalHorasFiltradas),
      ...extraInfo,
    };

    toast.info("Generando reporte PDF...");
    await generarPDFControlFacilitadores(filtrados, infoHeader);
    toast.success("Reporte generado con éxito");
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-[#1E1E20] to-[#181818] p-6 text-white shadow-xl mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="text-[#C5A059]" /> Control de Facilitadores
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Supervisión y registro administrativo de actividades.
          </p>
        </div>
        <div className="flex gap-2">
          {selectedFacilitador !== "TODOS" && (
            <button
              onClick={handleExportarPDF}
              className="flex items-center gap-2 rounded-xl bg-[#C5A059] px-4 py-2 text-sm font-semibold hover:bg-[#795719] transition-all border border-white/20"
            >
              <Download size={18} /> Generar PDF
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
            Facilitador
          </label>
          <select
            value={selectedFacilitador}
            onChange={(e) => setSelectedFacilitador(e.target.value)}
            className="w-full rounded-lg border-slate-200 text-sm focus:ring-blue-500"
          >
            <option value="TODOS">TODOS LOS FACILITADORES</option>
            {facilitadores.map((f) => (
              <option key={f.usuario_id} value={f.usuario_id}>
                {`${f.nombres} ${f.ap_paterno} ${f.ap_materno || ""}`.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
            Mes
          </label>
          <select
            value={selectedMes}
            onChange={(e) => setSelectedMes(Number(e.target.value))}
            className="w-full rounded-lg border-slate-200 text-sm"
          >
            {MESES.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
            Año
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full rounded-lg border-slate-200 text-sm"
          >
            {years.map((y) => (
              <option key={y.year_id} value={y.year}>
                {y.year}
              </option>
            ))}
          </select>
        </div>

        {selectedFacilitador !== "TODOS" ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm flex flex-col justify-center">
            <span className="text-xs font-bold uppercase text-blue-600 flex items-center gap-1">
              <Clock size={12} /> Horas Totales
            </span>
            <span className="text-2xl font-black text-blue-800">
              {formatDuration(totalHorasFiltradas)}
            </span>
            <span className="text-[10px] text-blue-500">
              {filtrados.length} registros encontrados
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-sm flex flex-col justify-center items-center text-slate-400">
            <User size={20} className="mb-1 opacity-20" />
            <span className="text-[10px] font-bold uppercase text-center">
              Selecciona un facilitador para ver su total
            </span>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-slate-50 px-6 py-4 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">Registros de Actividades</h2>
          <div className="flex gap-2">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="rounded-lg border-slate-200 text-xs"
            >
              <option value="">Todos los tipos</option>
              {TIPO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-left text-xs font-bold uppercase text-slate-500 border-b">
                <th className="px-6 py-4">Facilitador</th>
                <th className="px-6 py-4">Actividad</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Horario</th>
                <th className="px-6 py-4 text-center">Duración</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Cargando registros maestros...
                  </td>
                </tr>
              ) : paginados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No se encontraron actividades con estos filtros.
                  </td>
                </tr>
              ) : (
                paginados.map((r) => {
                  const { horaInicio, horaFin, descripcion, fecha, duracion } =
                    parseRow(r);
                  // Búsqueda flexible por ID
                  const f = facilitadores.find(
                    (u) => String(u.usuario_id) === String(r.usuario_id),
                  );
                  const opt = TIPO_MAP[r.tipo_servicio];
                  const Icon = opt?.Icon || FileText;

                  return (
                    <tr
                      key={r.registro_id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                            {f
                              ? `${f.nombres[0]}${f.ap_paterno[0]}${f.ap_materno ? f.ap_materno[0] : ""}`
                              : "?"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {f
                                ? `${f.nombres} ${f.ap_paterno} ${f.ap_materno || ""}`
                                : "Desconocido"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${opt?.colorBadge || "bg-slate-100"}`}
                        >
                          <Icon size={10} /> {opt?.label || r.tipo_servicio}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {fecha}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-slate-900 font-bold">
                          <span className="text-blue-600">{horaInicio}</span>
                          <span className="text-slate-300">→</span>
                          <span className="text-blue-600">{horaFin}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-700">
                        {formatDuration(duracion)}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-500 italic">
                        "{descripcion}"
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEliminar(r.registro_id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between text-xs font-bold text-slate-500">
          <span>
            Mostrando página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal Registro */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Plus size={18} className="text-blue-400" /> Registrar Actividad
              </h3>
              <button onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Facilitador Destino
                </label>
                <select
                  value={form.usuario_id}
                  onChange={(e) =>
                    setForm({ ...form, usuario_id: e.target.value })
                  }
                  className="w-full rounded-xl border-slate-200"
                >
                  <option value="">SELECCIONAR FACILITADOR...</option>
                  <option value="TODOS" className="font-bold text-blue-600">
                    ✨ TODOS LOS FACILITADORES
                  </option>
                  {facilitadores.map((f) => (
                    <option key={f.usuario_id} value={f.usuario_id}>
                      {`${f.nombres} ${f.ap_paterno} ${f.ap_materno || ""}`.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Tipo de Actividad
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {TIPO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setForm({ ...form, tipo_servicio: opt.value })
                      }
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-sm font-bold ${form.tipo_servicio === opt.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-100 hover:border-slate-200 text-slate-600"}`}
                    >
                      <opt.Icon size={18} /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) =>
                      setForm({ ...form, fecha: e.target.value })
                    }
                    className="w-full rounded-xl border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Inicio
                  </label>
                  <input
                    type="time"
                    value={form.hora_inicio}
                    onChange={(e) =>
                      setForm({ ...form, hora_inicio: e.target.value })
                    }
                    className="w-full rounded-xl border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Hora Fin
                </label>
                <input
                  type="time"
                  value={form.hora_fin}
                  onChange={(e) =>
                    setForm({ ...form, hora_fin: e.target.value })
                  }
                  className="w-full rounded-xl border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Descripción
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  className="w-full rounded-xl border-slate-200 text-sm"
                  rows="2"
                  placeholder="Detalles de la actividad..."
                />
              </div>

              <button
                onClick={handleGuardarActividad}
                disabled={saving}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200"
              >
                {saving ? "Guardando..." : "Registrar Ahora"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
