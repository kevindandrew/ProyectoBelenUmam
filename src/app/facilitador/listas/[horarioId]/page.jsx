"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { usePageTitle } from "@/lib/usePageTitle";
import {
  ArrowLeft,
  Edit3,
  Save,
  Download,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { generarPDFLista } from "../pdfListas";

const API_URL = "https://api-umam-1.onrender.com";
const ESTADOS_VALIDOS = ["APROBADO", "REPROBADO", "ABANDONO"];
const DIAS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

function formatHora(value) {
  if (!value) return "";
  const text = String(value);
  if (text.includes("T")) return (text.split("T")[1] || "").slice(0, 5);
  return text.slice(0, 5);
}

function buildHorarioLabel(horario) {
  const dias = DIAS.filter(
    (dia) => horario?.[dia] === true || horario?.[dia] === 1,
  ).map((dia) => dia.charAt(0).toUpperCase() + dia.slice(1));

  const diasTexto = dias.length ? dias.join(", ") : "Sin dias";
  const hi = formatHora(horario?.hora_inicio);
  const hf = formatHora(horario?.hora_fin);
  return hi && hf ? `${diasTexto} (${hi} - ${hf})` : diasTexto;
}

function getStoredListContext(scope, horarioId) {
  try {
    if (typeof window === "undefined" || !horarioId) return null;
    const raw = sessionStorage.getItem(`listas_ctx_${scope}_${horarioId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toUpperSafe(value) {
  return value ? String(value).toUpperCase() : "";
}

function getAuthUser() {
  try {
    const raw = Cookies.get("user_data");
    if (!raw) return null;
    const user = JSON.parse(raw);
    return {
      id: user.usuario_id || user.id || null,
      nombre: [user.nombres, user.ap_paterno || user.apellido, user.ap_materno]
        .filter(Boolean)
        .join(" ")
        .trim(),
    };
  } catch {
    return null;
  }
}

export default function ListaCursoDetallePage() {
  const params = useParams();

  const [estudiantes, setEstudiantes] = useState([]);
  const [originalEstudiantes, setOriginalEstudiantes] = useState([]); // Para detectar cambios
  const [loading, setLoading] = useState(true);
  const [savingByMatricula, setSavingByMatricula] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [error, setError] = useState("");
  const [headerInfo, setHeaderInfo] = useState({
    curso: "Curso",
    sucursal: "Sucursal",
    horario: "Sin horario",
    docente: "Facilitador",
    gestion: "",
  });

  usePageTitle(`Cursos - ${headerInfo.curso}`);

  const fetchAuth = async (url, options = {}) => {
    const token = Cookies.get("access_token");
    if (!token) throw new Error("Sesion expirada.");

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("sessionExpired"));
      Cookies.remove("access_token");
      Cookies.remove("user_data");
      throw new Error("Sesion expirada.");
    }

    return response;
  };

  const requestData = useMemo(() => {
    const user = getAuthUser();
    return {
      profesor_id: user?.id ? String(user.id) : "",
      curso_id: "",
      sucursal_id: "",
      gestion_id: "",
    };
  }, []);

  const loadEstudiantes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const horarioId = Array.isArray(params?.horarioId)
        ? params.horarioId[0]
        : params?.horarioId;
      const stored = getStoredListContext("facilitador", horarioId);

      const resolvedRequest = {
        ...requestData,
        profesor_id:
          stored?.profesor_id && String(stored.profesor_id)
            ? String(stored.profesor_id)
            : requestData.profesor_id,
        curso_id: stored?.curso_id ? String(stored.curso_id) : "",
        sucursal_id: stored?.sucursal_id ? String(stored.sucursal_id) : "",
        gestion_id: stored?.gestion_id ? String(stored.gestion_id) : "",
      };

      if (stored) {
        setHeaderInfo((prev) => ({
          curso: stored.curso || prev.curso,
          sucursal: stored.sucursal || prev.sucursal,
          horario: stored.horario || prev.horario,
          docente: stored.docente || prev.docente,
          gestion: stored.gestion_id || prev.gestion,
        }));
      }

      const resolveSucursalFromAula = async (aulaId) => {
        if (!aulaId) return "";

        const sucursalesRes = await fetchAuth(`${API_URL}/sucursales/`);
        if (!sucursalesRes.ok) return "";

        const sucursalesData = await sucursalesRes.json();
        for (const sucursal of Array.isArray(sucursalesData)
          ? sucursalesData
          : []) {
          const aulas = Array.isArray(sucursal?.aulas) ? sucursal.aulas : [];
          const found = aulas.find(
            (a) => String(a?.aula_id) === String(aulaId),
          );
          if (found && sucursal?.sucursal_id != null) {
            return String(sucursal.sucursal_id);
          }
        }

        return "";
      };

      if (
        !resolvedRequest.profesor_id ||
        !resolvedRequest.curso_id ||
        !resolvedRequest.sucursal_id ||
        !resolvedRequest.gestion_id
      ) {
        const user = getAuthUser();
        if (!user?.id || !horarioId) {
          throw new Error(
            "No se pudo determinar los datos del curso seleccionado.",
          );
        }

        const horariosRes = await fetchAuth(
          `${API_URL}/listas/profesor/${user.id}/horarios`,
        );

        if (!horariosRes.ok) {
          throw new Error(
            "No se pudo determinar los datos del curso seleccionado.",
          );
        }

        const horariosData = await horariosRes.json();
        const match = (Array.isArray(horariosData) ? horariosData : []).find(
          (h) => String(h.horario_id || h.id) === String(horarioId),
        );

        if (!match) {
          throw new Error(
            "No se pudo determinar los datos del curso seleccionado.",
          );
        }

        resolvedRequest.profesor_id = String(
          resolvedRequest.profesor_id ||
            match.profesor_id ||
            match.profesor?.usuario_id ||
            user.id,
        );
        resolvedRequest.curso_id = String(
          resolvedRequest.curso_id ||
            match.curso_id ||
            match.curso?.curso_id ||
            match.id_curso ||
            "",
        );
        resolvedRequest.sucursal_id = String(
          resolvedRequest.sucursal_id ||
            match.sucursal_id ||
            match.sucursal?.sucursal_id ||
            match.id_sucursal ||
            "",
        );

        if (!resolvedRequest.sucursal_id) {
          const matchAulaId =
            match.aula_id || match.aula?.aula_id || match.id_aula;
          if (matchAulaId) {
            resolvedRequest.sucursal_id =
              await resolveSucursalFromAula(matchAulaId);
          }
        }

        if (!resolvedRequest.sucursal_id) {
          const horarioRes = await fetchAuth(
            `${API_URL}/horarios/${horarioId}`,
          );
          if (horarioRes.ok) {
            const horarioDetalle = await horarioRes.json();
            const aulaIdDetalle =
              horarioDetalle?.aula_id ||
              horarioDetalle?.aula?.aula_id ||
              null;
            resolvedRequest.sucursal_id =
              await resolveSucursalFromAula(aulaIdDetalle);
          }
        }

        resolvedRequest.gestion_id = String(
          resolvedRequest.gestion_id ||
            match.gestion_id ||
            match.gestion?.gestion_id ||
            match.id_gestion ||
            "",
        );

        const docenteNombreResuelto = [
          match.profesor?.nombres,
          match.profesor?.ap_paterno,
          match.profesor?.ap_materno,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        setHeaderInfo({
          curso:
            match.curso?.nombre ||
            (typeof match.curso === "string" ? match.curso : "") ||
            match.curso_nombre ||
            "Curso",
          sucursal:
            match.sucursal?.nombre ||
            (typeof match.sucursal === "string" ? match.sucursal : "") ||
            match.sucursal_nombre ||
            "Sucursal",
          horario: buildHorarioLabel(match),
          docente:
            docenteNombreResuelto || getAuthUser()?.nombre || "Facilitador",
          gestion:
            String(
              match.gestion?.gestion ||
                match.gestion_id ||
                match.id_gestion ||
                resolvedRequest.gestion_id ||
                "",
            ) || "",
        });
      }

      // 1. Obtener matriculas que pertenecen estrictamente a este horario
      const validMatriculaIds = new Set();
      try {
        const inscRes = await fetchAuth(`${API_URL}/inscripciones/`);
        if (inscRes.ok) {
          const inscData = await inscRes.json();
          (Array.isArray(inscData) ? inscData : [])
            .filter((i) => String(i.horario_id) === String(horarioId))
            .forEach((i) => {
              if (i.matricula_id != null) {
                validMatriculaIds.add(String(i.matricula_id));
              }
            });
        }
      } catch (err) {
        console.error("Error al cargar inscripciones para filtrado:", err);
      }

      const query = new URLSearchParams(resolvedRequest);
      query.append("_t", new Date().getTime()); // Bypassing cache

      const response = await fetchAuth(
        `${API_URL}/listas/estudiantes?${query.toString()}`,
      );

      if (!response.ok) {
        throw new Error("No se pudo cargar la lista de inscritos.");
      }

      const data = await response.json();
      const listaRaw = Array.isArray(data) ? data : [];

      // 2. Filtrar para que solo aparezcan las matriculas de ESTE horario
      const lista = listaRaw.filter((e) => 
        e.matricula_id != null && validMatriculaIds.has(String(e.matricula_id))
      );

      const normalizados = lista.map((e) => {
        let estado = (e.estado || "APROBADO").toUpperCase();
        let nota = Number(e.nota_final ?? 0);
        
        // Nuevos Rangos: 0-30 Abandono, 31-64 Reprobado, 65-100 Aprobado
        if (nota >= 0 && nota <= 30) {
          estado = "ABANDONO";
        } else if (nota >= 31 && nota <= 64) {
          estado = "REPROBADO";
        } else if (nota >= 65 && nota <= 100) {
          estado = "APROBADO";
        }

        return {
          matricula_id: e.matricula_id,
          estudiante_id: e.estudiante_id,
          nombres: toUpperSafe(e.nombres),
          ap_paterno: toUpperSafe(e.ap_paterno),
          ap_materno: toUpperSafe(e.ap_materno),
          ci: e.ci || "",
          telefono: e.telefono || "",
          nota_final: nota,
          estado: estado,
        };
      });

      const unicos = Object.values(
        normalizados.reduce((acc, e) => {
          const key =
            e.estudiante_id != null
              ? `id_${e.estudiante_id}`
              : `ci_${e.ci}_${e.nombres}_${e.ap_paterno}_${e.ap_materno}`;

          if (!acc[key]) {
            acc[key] = {
              ...e,
              matricula_ids: [e.matricula_id],
            };
          } else {
            acc[key].matricula_ids.push(e.matricula_id);
          }

          return acc;
        }, {}),
      );

      setEstudiantes(unicos);
      setOriginalEstudiantes(JSON.parse(JSON.stringify(unicos))); // Clon profundo para comparar
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo cargar la lista de inscritos.",
      );
    } finally {
      setLoading(false);
    }
  }, [params, requestData]);

  useEffect(() => {
    loadEstudiantes();
  }, [loadEstudiantes]);

  const estudiantesFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    return estudiantes.filter((e) => {
      const full =
        `${e.nombres} ${e.ap_paterno} ${e.ap_materno} ${e.ci}`.toLowerCase();
      const matchText = !term || full.includes(term);
      const matchEstado =
        statusFilter === "TODOS" ||
        (e.estado || "").toUpperCase() === statusFilter;
      return matchText && matchEstado;
    });
  }, [estudiantes, search, statusFilter]);

  const updateStudentField = (matriculaId, field, value) => {
    setEstudiantes((prev) =>
      prev.map((e) => {
        if (e.matricula_id === matriculaId) {
          const updated = { ...e, [field]: field === "nota_final" ? (value === "" ? "" : Number(value)) : value };
          
          // Automatic state calculation based on grade
          if (field === "nota_final" && value !== "") {
            const nota = Number(value);
            if (nota >= 0 && nota <= 30) updated.estado = "ABANDONO";
            else if (nota >= 31 && nota <= 64) updated.estado = "REPROBADO";
            else if (nota >= 65 && nota <= 100) updated.estado = "APROBADO";
          }
          
          return updated;
        }
        return e;
      }),
    );
  };

  const handleGuardarTodo = async () => {
    try {
      setIsSavingAll(true);
      
      // SOLO guardamos a los que han cambiado
      const modificados = estudiantes.filter(e => {
        const original = originalEstudiantes.find(o => o.matricula_id === e.matricula_id);
        if (!original) return true;
        return Number(e.nota_final) !== Number(original.nota_final) || e.estado !== original.estado;
      });

      if (modificados.length === 0) {
        toast.info("No hay cambios pendientes para guardar.");
        setIsEditing(false);
        return;
      }

      toast.info(`Guardando ${modificados.length} cambios...`);
      
      // Guardar solo los modificados
      const savePromises = modificados.map(student => guardarNotaEstado(student, true));
      await Promise.all(savePromises);
      
      setIsEditing(false);
      toast.success("Se guardaron exitosamente las notas");
      
      await loadEstudiantes();
    } catch (err) {
      console.error("Error al guardar todo:", err);
      toast.error("Hubo un error al guardar. Revisa la consola para más detalles.");
    } finally {
      setIsSavingAll(false);
    }
  };

  const guardarNotaEstado = async (student, silent = false) => {
    if (!student?.matricula_id) {
      if (!silent) toast.error("No se pudo realizar la accion.");
      return;
    }

    const matriculaIds = Array.isArray(student?.matricula_ids)
      ? student.matricula_ids.filter(Boolean)
      : [student.matricula_id];

    const nota = Number(student.nota_final);
    if (Number.isNaN(nota) || nota < 0 || nota > 100) {
      toast.warning("La nota final debe estar entre 0 y 100.");
      return;
    }

    const estado = (student.estado || "").toUpperCase();
    if (!ESTADOS_VALIDOS.includes(estado)) {
      toast.warning("Seleccione un estado valido.");
      return;
    }

    try {
      setSavingByMatricula((prev) => {
        const next = { ...prev };
        matriculaIds.forEach((id) => {
          next[id] = true;
        });
        return next;
      });

      for (const matriculaId of matriculaIds) {
        // El servidor no acepta 0 (pide >= 1), así que si es 0, enviamos 1
        // Pero enviamos el estado real para que se mantenga como ABANDONO
        const notaEnviada = Math.floor(nota) < 1 ? 1 : Math.floor(nota);
        const payload = { 
          nota_final: notaEnviada,
          estado: estado
        };
        
        const response = await fetchAuth(
          `${API_URL}/listas/matricula/${matriculaId}/nota`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Error ${response.status} en matricula ${matriculaId}:`, errorData);
          
          if (response.status === 422) {
            // Esto nos dirá exactamente qué campo falla
            const msg = errorData.detail?.[0]?.msg || JSON.stringify(errorData);
            throw new Error(`Validación fallida: ${msg}`);
          }
          throw new Error(`Error del servidor (${response.status})`);
        }
      }

      if (!silent) toast.success("Actualizacion guardada correctamente.");
    } catch (err) {
      if (!silent) toast.error("No se pudo realizar la accion.");
      throw err; // Re-throw to inform handleGuardarTodo
    } finally {
      setSavingByMatricula((prev) => {
        const next = { ...prev };
        matriculaIds.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
    }
  };

  const handleExport = async () => {
    if (estudiantes.length === 0) {
      toast.warning("No hay inscritos para exportar.");
      return;
    }

    const idToast = toast.loading("Generando PDF...");
    try {
      let byStudentId = {};
      try {
        const allRes = await fetchAuth(`${API_URL}/estudiantes/`);
        if (allRes.ok) {
          const allStudents = await allRes.json();
          (Array.isArray(allStudents) ? allStudents : []).forEach((s) => {
            if (s?.estudiante_id != null) {
              byStudentId[String(s.estudiante_id)] = s;
            }
          });
        }
      } catch (err) {
        console.warn("No se pudo cargar la lista completa de estudiantes", err);
      }

      const estudiantesConNacimiento = estudiantes.map((e) => {
        const full = byStudentId[String(e.estudiante_id)] || null;
        return {
          ...e,
          fecha_nacimiento:
            e.fecha_nacimiento ||
            full?.fecha_nacimiento ||
            full?.fechaNacimiento ||
            "",
        };
      });

      const infoGrupo = {
        curso: headerInfo.curso,
        sucursal: headerInfo.sucursal,
        facilitador: headerInfo.docente || getAuthUser()?.nombre || "Facilitador",
        horario: headerInfo.horario,
        gestion: headerInfo.gestion,
      };

      await generarPDFLista(estudiantesConNacimiento, infoGrupo);
      toast.update(idToast, { 
        render: "PDF generado correctamente.", 
        type: "success", 
        isLoading: false, 
        autoClose: 3000 
      });
    } catch (err) {
      console.error("Error en exportación:", err);
      toast.update(idToast, { 
        render: "Error al generar el PDF.", 
        type: "error", 
        isLoading: false, 
        autoClose: 3000 
      });
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/facilitador/listas"
          className="flex items-center gap-1 hover:text-[#13678A] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Cursos</span>
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-700">{headerInfo.curso}</span>
      </div>

      {/* Premium Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-[#0f4c6e] via-[#13678A] to-[#1f8bb1] p-6 text-white shadow-lg">
        <div className="flex-1">
          <h1 className="text-3xl font-bold uppercase tracking-tight">
            {headerInfo.curso}
          </h1>
          <p className="mt-1 text-sm text-cyan-100 font-medium">
            {headerInfo.sucursal} <span className="mx-2 opacity-40">|</span> {headerInfo.horario}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition-all border border-white/20"
          >
            <Download size={18} />
            Exportar
          </button>
          
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all shadow-md ${
              isEditing 
                ? "bg-amber-500 text-white hover:bg-amber-600" 
                : "bg-white text-[#13678A] hover:bg-gray-50"
            }`}
          >
            <Edit3 size={18} />
            {isEditing ? "Cancelar Edición" : "Editar Notas"}
          </button>
        </div>
      </div>

      {/* Grade Logic Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 flex items-start gap-3">
          <div className="rounded-full bg-blue-100 p-2 text-blue-600 shrink-0">
            <Info size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900">Sistema de Calificación</h4>
            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2 text-xs text-blue-800">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-400"></div> <strong>0 - 30:</strong> Abandono</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> <strong>31 - 64:</strong> Reprobado</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> <strong>65 - 100:</strong> Aprobado</span>
              <div className="w-full mt-1 p-2 bg-amber-100/50 rounded border border-amber-200 text-[#856404] font-medium italic">
                * Estudiantes con nota 31-64 tienen oportunidad de examen recuperatorio para aumentar nota.
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Estudiantes</p>
            <p className="text-2xl font-black text-[#13678A]">{estudiantesFiltrados.length}</p>
          </div>
          <div className="rounded-full bg-[#13678A]/10 p-3 text-[#13678A]">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Filters bar */}
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-gray-50/30">
          <div className="flex flex-1 gap-3 max-w-xl">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o CI..."
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-[#13678A] focus:outline-none focus:ring-1 focus:ring-[#13678A] transition-all"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-44 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-[#13678A] focus:outline-none focus:ring-1 focus:ring-[#13678A] transition-all bg-white"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="APROBADO">Aprobados</option>
              <option value="REPROBADO">Reprobados</option>
              <option value="ABANDONO">Abandono</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 flex items-center gap-2">
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#13678A] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></div>
            <p className="mt-4 text-sm font-medium text-gray-500">Cargando lista de inscritos...</p>
          </div>
        ) : estudiantesFiltrados.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
               <Info size={32} />
            </div>
            <p className="text-sm font-medium text-gray-500 italic">No se encontraron estudiantes con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Estudiante</th>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Teléfono</th>
                  <th className="px-6 py-4 text-center">Nota Final</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {estudiantesFiltrados.map((e) => {
                  const statusColors = {
                    APROBADO: "bg-green-100 text-green-800 border-green-200",
                    REPROBADO: "bg-red-100 text-red-800 border-red-200",
                    ABANDONO: "bg-gray-100 text-gray-800 border-gray-200",
                  };
                  const StatusIcon = e.estado === "APROBADO" ? CheckCircle2 : e.estado === "REPROBADO" ? XCircle : Info;

                  return (
                    <tr key={e.matricula_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">
                          {[e.nombres, e.ap_paterno, e.ap_materno].filter(Boolean).join(" ")}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{e.ci || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{e.telefono || "-"}</td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={!isEditing}
                          value={Number.isFinite(e.nota_final) ? e.nota_final : 0}
                          onChange={(ev) => updateStudentField(e.matricula_id, "nota_final", ev.target.value)}
                          className={`w-20 mx-auto rounded-lg border px-3 py-1.5 text-center font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#13678A]/30 ${
                            isEditing 
                              ? "border-amber-300 bg-amber-50/30 text-gray-900" 
                              : "border-transparent bg-transparent text-gray-700"
                          }`}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isEditing ? (
                          <select
                            value={e.estado || "APROBADO"}
                            onChange={(ev) => updateStudentField(e.matricula_id, "estado", ev.target.value)}
                            className="w-32 rounded-lg border border-amber-300 bg-amber-50/30 px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#13678A]/30 transition-all"
                          >
                            <option value="APROBADO">APROBADO</option>
                            <option value="REPROBADO">REPROBADO</option>
                            <option value="ABANDONO">ABANDONO</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusColors[e.estado] || statusColors.APROBADO}`}>
                            <StatusIcon size={12} />
                            {e.estado || "APROBADO"}
                          </span>
                        )}
                        {e.nota_final >= 31 && e.nota_final <= 64 && (
                          <div className="mt-1 text-[9px] font-bold text-amber-600 animate-pulse">
                            Apto para Recuperatorio
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Global Save Button at bottom */}
        {isEditing && (
          <div className="p-6 bg-amber-50/20 border-t border-amber-100 flex justify-end">
            <button
              type="button"
              disabled={isSavingAll}
              onClick={handleGuardarTodo}
              className="flex items-center gap-2 rounded-2xl bg-[#13678A] px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#0f506b] transition-all disabled:opacity-50"
            >
              {isSavingAll ? (
                 <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Save size={18} />
              )}
              {isSavingAll ? "Guardando todos..." : "Guardar Notas y Finalizar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
