"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import Cookies from "js-cookie";
import {
  Building2, ClipboardList, FileText,
  Plus, X, Clock, CalendarDays, CheckCircle,
} from "lucide-react";
import { usePageTitle } from "@/lib/usePageTitle";

const API_URL = "https://api-umam-1.onrender.com";
const TZ = "America/La_Paz";

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const TIPO_OPTIONS = [
  { value: "asistencia_eventos", label: "Asistencia a UMAM",       Icon: Building2,    colorBadge: "bg-teal-100 text-teal-800",   colorBtn: "border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100",       colorActive: "border-teal-500 bg-teal-100 text-teal-800" },
  { value: "clases",             label: "Asistencia Actividad",     Icon: ClipboardList, colorBadge: "bg-blue-100 text-blue-800",   colorBtn: "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100",       colorActive: "border-blue-500 bg-blue-100 text-blue-800" },
  { value: "creacion_material",  label: "Elaboración de Material",  Icon: FileText,      colorBadge: "bg-purple-100 text-purple-800", colorBtn: "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100", colorActive: "border-purple-500 bg-purple-100 text-purple-800" },
];
const TIPO_MAP = Object.fromEntries(TIPO_OPTIONS.map((o) => [o.value, o]));
const PAGE_SIZE = 10;

/* ── TZ helpers ── */
function nowInTZ() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
}
function todayStr() {
  const d = nowInTZ();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function currentTimeStr() {
  const d = nowInTZ();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function formatDateLocal(dateStr) {
  if (!dateStr) return "—";
  const [y,m,d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
function calcDuration(fecha, hi, hf) {
  if (!fecha||!hi||!hf) return null;
  const diff = (new Date(`${fecha}T${hf}:00`) - new Date(`${fecha}T${hi}:00`)) / 3600000;
  return diff > 0 ? diff : null;
}
function formatDuration(hours) {
  if (hours == null) return "—";
  const h = Math.floor(hours), m = Math.round((hours-h)*60);
  if (h===0) return `${m}min`;
  if (m===0) return `${h}h`;
  return `${h}h ${m}min`;
}

/* ── Auth ── */
function getAuthUser() {
  try {
    const user = JSON.parse(Cookies.get("user_data") || "null");
    if (!user) return null;
    return { id: user.usuario_id||user.id||null, sucursal_id: user.sucursal_id||null };
  } catch { return null; }
}
async function fetchAuth(url, options={}) {
  const token = Cookies.get("access_token");
  if (!token) throw new Error("Sesión expirada.");
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}`, ...(options.headers||{}) },
  });
  if (res.status===401) {
    window.dispatchEvent(new CustomEvent("sessionExpired"));
    Cookies.remove("access_token"); Cookies.remove("user_data");
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
    horaFin:    tm ? tm[2] : "—",
    descripcion: tm ? obs.split(" — ")[0] || "—" : obs || "—",
    fecha: r.fecha ? formatDateLocal(r.fecha) : "—",
    fechaRaw: r.fecha || "",
    duracion: tm ? calcDuration(r.fecha, tm[1], tm[2]) : null,
  };
}

function blankForm() {
  return { tipo_servicio:"", fecha:todayStr(), hora_inicio:currentTimeStr(), hora_fin:"", descripcion:"" };
}

/* ══════════════════════════════════════════════════════════ */
export default function ControlHorasPage() {
  usePageTitle("Control de Horas");

  const [currentUser] = useState(() => getAuthUser());

  /* años */
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(nowInTZ().getFullYear());

  /* filtros */
  const nowLocal = nowInTZ();
  const [selectedMes, setSelectedMes] = useState(nowLocal.getMonth() + 1); // 1-12

  /* registros */
  const [registros, setRegistros] = useState([]);
  const [loadingReg, setLoadingReg] = useState(true);
  const [loadError, setLoadError] = useState("");

  /* notificaciones */
  const [success, setSuccess] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [page, setPage] = useState(1);

  /* modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  /* ── Load years ── */
  useEffect(() => {
    fetchAuth(`${API_URL}/cursos/years`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setYears(list);
        const curYear = nowInTZ().getFullYear();
        const current = list.find((y) => Number(y.year) === curYear)
          || list[list.length - 1]
          || null;
        if (current) setSelectedYear(Number(current.year));
      })
      .catch(() => {});
  }, []);

  /* ── Load registros ── */
  const loadRegistros = useCallback(async () => {
    try {
      setLoadingReg(true); setLoadError("");
      const res = await fetchAuth(`${API_URL}/registro-horas/mis-registros`);
      if (!res.ok) throw new Error("No se pudo cargar el historial.");
      const data = await res.json();
      setRegistros(
        (Array.isArray(data) ? data : []).sort(
          (a,b) => new Date(b.hora_entrada) - new Date(a.hora_entrada)
        )
      );
    } catch (e) { setLoadError(e.message); }
    finally { setLoadingReg(false); }
  }, []);

  useEffect(() => { loadRegistros(); }, [loadRegistros]);

  /* ── Records filtered by año + mes ── */
  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => {
      if (!r.fecha) return false;
      const [y, m] = r.fecha.split("-").map(Number);
      if (selectedYear && y !== selectedYear) return false;
      if (m !== selectedMes) return false;
      return true;
    });
  }, [registros, selectedYear, selectedMes]);

  /* ── Total hours for selected period ── */
  const totalHorasMes = useMemo(() => {
    return registrosFiltrados.reduce((acc, r) => {
      const { horaInicio, horaFin, fechaRaw } = parseRow(r);
      const dur = calcDuration(fechaRaw, horaInicio, horaFin);
      return acc + (dur || 0);
    }, 0);
  }, [registrosFiltrados]);

  /* ── Filtered for table (tipo filter on top of period filter) ── */
  const filtered = useMemo(() =>
    registrosFiltrados.filter((r) => !filterTipo || r.tipo_servicio === filterTipo),
    [registrosFiltrados, filterTipo]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  /* ── Modal ── */
  const openModal = () => { setForm(blankForm()); setFormError(""); setSuccess(""); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setFormError(""); };
  const handleChange = (field, value) => { setForm((p) => ({...p,[field]:value})); setFormError(""); };

  const validate = () => {
    if (!form.tipo_servicio) return "Selecciona el tipo de actividad.";
    if (!form.fecha) return "Ingresa la fecha.";
    if (!form.hora_inicio) return "Ingresa la hora de inicio.";
    if (!form.hora_fin) return "Ingresa la hora de fin.";
    if (calcDuration(form.fecha, form.hora_inicio, form.hora_fin) === null)
      return "La hora de fin debe ser posterior a la de inicio.";
    return null;
  };

  const handleGuardar = async () => {
    const err = validate(); if (err) { setFormError(err); return; }
    try {
      setSaving(true); setFormError("");
      const dur = calcDuration(form.fecha, form.hora_inicio, form.hora_fin);
      const obsLine = `Hora inicio: ${form.hora_inicio} | Hora fin: ${form.hora_fin} | Duración: ${formatDuration(dur)}`;
      const obsText = form.descripcion.trim() ? `${form.descripcion.trim()} — ${obsLine}` : obsLine;

      const entradaRes = await fetchAuth(`${API_URL}/registro-horas/entrada`, {
        method: "POST",
        body: JSON.stringify({ tipo_servicio:form.tipo_servicio, observaciones:obsText, sucursal_id:currentUser?.sucursal_id||null }),
      });
      if (!entradaRes.ok) { const e=await entradaRes.json().catch(()=>({})); throw new Error(e?.detail||"Error al registrar."); }
      const { registro_id } = await entradaRes.json();

      const salidaRes = await fetchAuth(`${API_URL}/registro-horas/${registro_id}/salida`, { method:"PUT" });
      if (!salidaRes.ok) { const e=await salidaRes.json().catch(()=>({})); throw new Error(e?.detail||"Error al cerrar el registro."); }

      setSuccess(`Actividad "${TIPO_MAP[form.tipo_servicio]?.label}" guardada correctamente.`);
      setModalOpen(false);
      await loadRegistros();
    } catch(e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const durPreview = calcDuration(form.fecha, form.hora_inicio, form.hora_fin);

  /* ════════════════════ RENDER ════════════════════════════════ */
  return (
    <div className="space-y-6 p-4">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-[#0f4c6e] via-[#13678A] to-[#1f8bb1] p-6 text-white shadow-lg">
        <div>
          <h1 className="text-3xl font-bold">Control de Horas</h1>
          <p className="mt-1 text-sm text-cyan-100">Registra tus actividades con horario y descripción.</p>
        </div>
        <button onClick={openModal} id="btn-registrar-actividad"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/30 transition-colors">
          <Plus size={18}/> Registrar Actividad
        </button>
      </div>

      {/* Success */}
      {success && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <div className="flex items-center gap-2"><CheckCircle size={16}/><span>{success}</span></div>
          <button onClick={() => setSuccess("")} className="ml-3 text-green-500 hover:text-green-700"><X size={16}/></button>
        </div>
      )}

      {/* Filtros de período + contador */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Año */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Año</label>
          <select
            value={selectedYear ?? ""}
            onChange={(e) => { setSelectedYear(Number(e.target.value)); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#13678A] focus:outline-none focus:ring-1 focus:ring-[#13678A]"
          >
            {years.map((y) => (
              <option key={y.year_id} value={y.year}>{y.year}</option>
            ))}
          </select>
        </div>

        {/* Mes */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Mes</label>
          <select
            value={selectedMes}
            onChange={(e) => { setSelectedMes(Number(e.target.value)); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#13678A] focus:outline-none focus:ring-1 focus:ring-[#13678A]"
          >
            {MESES.map((label, i) => (
              <option key={i+1} value={i+1}>{label}</option>
            ))}
          </select>
        </div>

        {/* Contador de horas */}
        <div className="flex flex-col justify-center rounded-xl border border-[#13678A]/30 bg-[#13678A]/5 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#13678A]">
            <Clock size={14}/> Total del mes
          </div>
          <p className="mt-1 text-3xl font-bold text-[#13678A]">{formatDuration(totalHorasMes)}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {MESES[selectedMes-1]}{selectedYear ? ` · ${selectedYear}` : ""} — {registrosFiltrados.length} actividad{registrosFiltrados.length!==1?"es":""}
          </p>
        </div>
      </div>

      {/* Historial */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Historial de Actividades</h2>
          <select value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm">
            <option value="">Todos los tipos</option>
            {TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {loadError && <div className="px-6 py-4 text-sm text-red-600">{loadError}</div>}

        {loadingReg ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Cargando registros...</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No hay actividades para {MESES[selectedMes-1]}{selectedYear ? ` ${selectedYear}` : ""}.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Hora Inicio</th>
                    <th className="px-6 py-3">Hora Fin</th>
                    <th className="px-6 py-3">Duración</th>
                    <th className="px-6 py-3">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((r) => {
                    const { horaInicio, horaFin, descripcion, fecha, fechaRaw, duracion } = parseRow(r);
                    const opt = TIPO_MAP[r.tipo_servicio];
                    const Icon = opt?.Icon || FileText;
                    return (
                      <tr key={r.registro_id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${opt?.colorBadge||"bg-gray-100 text-gray-700"}`}>
                            <Icon size={12}/>{opt?.label||r.tipo_servicio}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-700">{fecha}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">{horaInicio}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">{horaFin}</td>
                        <td className="px-6 py-3 text-gray-700">{formatDuration(duracion)}</td>
                        <td className="max-w-xs px-6 py-3 text-gray-500 truncate">{descripcion}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-6 py-3 text-sm text-gray-600">
                <span>Página {page} de {totalPages} — {filtered.length} registros</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p)=>Math.max(1,p-1))} disabled={page===1}
                    className="rounded-lg border px-3 py-1 disabled:opacity-40 hover:bg-gray-100">Anterior</button>
                  <button onClick={() => setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                    className="rounded-lg border px-3 py-1 disabled:opacity-40 hover:bg-gray-100">Siguiente</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ MODAL ═══ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-[#13678A]"/>
                <h3 className="text-lg font-bold text-gray-900">Registrar Actividad</h3>
              </div>
              <button onClick={closeModal} disabled={saving} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-50"><X size={20}/></button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {/* Tipo */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tipo de Actividad <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {TIPO_OPTIONS.map(({ value, label, Icon, colorBtn, colorActive }) => (
                    <button key={value} type="button" onClick={() => handleChange("tipo_servicio", value)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${form.tipo_servicio===value ? colorActive : colorBtn}`}>
                      <Icon size={16} className="shrink-0"/><span className="text-left leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  <CalendarDays size={14} className="mr-1 inline"/>
                  Fecha <span className="text-red-500">*</span>
                </label>
                <input type="date" value={form.fecha} max={todayStr()}
                  onChange={(e) => handleChange("fecha", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#13678A] focus:outline-none focus:ring-1 focus:ring-[#13678A]"/>
              </div>

              {/* Horas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    <Clock size={14} className="mr-1 inline"/>Hora de Inicio <span className="text-red-500">*</span>
                  </label>
                  <input type="time" value={form.hora_inicio} onChange={(e) => handleChange("hora_inicio", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#13678A] focus:outline-none focus:ring-1 focus:ring-[#13678A]"/>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    <Clock size={14} className="mr-1 inline"/>Hora de Fin <span className="text-red-500">*</span>
                  </label>
                  <input type="time" value={form.hora_fin} onChange={(e) => handleChange("hora_fin", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#13678A] focus:outline-none focus:ring-1 focus:ring-[#13678A]"/>
                </div>
              </div>

              {/* Duration preview */}
              {durPreview !== null && (
                <div className="rounded-lg border border-dashed border-[#13678A] bg-[#13678A]/5 px-4 py-2 text-center">
                  <p className="text-xs text-gray-500">Duración</p>
                  <p className="text-xl font-bold text-[#13678A]">{formatDuration(durPreview)}</p>
                </div>
              )}

              {/* Descripción */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Descripción <span className="ml-1 text-xs text-gray-400">(opcional)</span>
                </label>
                <textarea rows={3} value={form.descripcion} onChange={(e) => handleChange("descripcion", e.target.value)}
                  placeholder="Ej: Reunión mensual de facilitadores..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#13678A] focus:outline-none focus:ring-1 focus:ring-[#13678A]"/>
              </div>

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button onClick={closeModal} disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={saving} id="btn-guardar-actividad"
                className="flex items-center gap-2 rounded-lg bg-[#13678A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0f4c6e] disabled:opacity-60 transition-colors">
                {saving ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Guardando...</>
                ) : (
                  <><Plus size={16}/>Guardar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
