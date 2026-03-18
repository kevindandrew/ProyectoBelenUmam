"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { usePageTitle } from "@/lib/usePageTitle";
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

function buildFullName(est) {
  return `${est.nombres || ""} ${est.ap_paterno || ""} ${est.ap_materno || ""}`
    .replace(/\s+/g, " ")
    .trim();
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

export default function ListaCursoDetalleAdminPage() {
  const params = useParams();

  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingByMatricula, setSavingByMatricula] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [error, setError] = useState("");
  const [headerInfo, setHeaderInfo] = useState({
    curso: "Curso",
    sucursal: "Sucursal",
    horario: "Sin horario",
    docente: "Sin docente",
    gestion: "",
  });

  usePageTitle(`Listas - ${headerInfo.curso}`);

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

  useEffect(() => {
    const loadEstudiantes = async () => {
      try {
        setLoading(true);
        setError("");

        const horarioId = Array.isArray(params?.horarioId)
          ? params.horarioId[0]
          : params?.horarioId;
        const stored = getStoredListContext("admin", horarioId);

        const resolvedRequest = {
          profesor_id: stored?.profesor_id ? String(stored.profesor_id) : "",
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

        if (
          (!resolvedRequest.profesor_id ||
            !resolvedRequest.curso_id ||
            !resolvedRequest.sucursal_id ||
            !resolvedRequest.gestion_id) &&
          horarioId
        ) {
          const horarioRes = await fetchAuth(
            `${API_URL}/horarios/${horarioId}`,
          );
          if (horarioRes.ok) {
            const h = await horarioRes.json();
            resolvedRequest.profesor_id =
              String(
                resolvedRequest.profesor_id ||
                  h.profesor_id ||
                  h.usuario_id ||
                  h.profesor?.usuario_id ||
                  "",
              ) || "";
            resolvedRequest.curso_id =
              String(
                resolvedRequest.curso_id ||
                  h.curso_id ||
                  h.id_curso ||
                  h.curso?.curso_id ||
                  "",
              ) || "";
            resolvedRequest.gestion_id =
              String(
                resolvedRequest.gestion_id ||
                  h.gestion_id ||
                  h.id_gestion ||
                  h.gestion?.gestion_id ||
                  "",
              ) || "";

            let sucursalNombreResuelta =
              h.sucursal?.nombre || h.sucursal_nombre || "Sucursal";

            if (!resolvedRequest.sucursal_id) {
              const sucursalesRes = await fetchAuth(`${API_URL}/sucursales/`);
              if (sucursalesRes.ok) {
                const sucursalesData = await sucursalesRes.json();
                const aulaId = h.aula_id || h.id_aula || h.aula?.aula_id;
                for (const sucursal of Array.isArray(sucursalesData)
                  ? sucursalesData
                  : []) {
                  const aulas = Array.isArray(sucursal?.aulas)
                    ? sucursal.aulas
                    : [];
                  if (
                    aulas.some((a) => String(a?.aula_id) === String(aulaId))
                  ) {
                    resolvedRequest.sucursal_id = String(sucursal.sucursal_id);
                    sucursalNombreResuelta =
                      sucursal.nombre || sucursalNombreResuelta;
                    break;
                  }
                }
              }
            }

            const docenteNombreResuelto = [
              h.profesor?.nombres,
              h.profesor?.ap_paterno,
              h.profesor?.ap_materno,
            ]
              .filter(Boolean)
              .join(" ")
              .trim();

            setHeaderInfo({
              curso: h.curso?.nombre || h.curso_nombre || "Curso",
              sucursal: sucursalNombreResuelta,
              horario: buildHorarioLabel(h),
              docente: docenteNombreResuelto || "Sin docente",
              gestion:
                String(
                  h.gestion?.gestion ||
                    h.gestion_id ||
                    h.id_gestion ||
                    resolvedRequest.gestion_id ||
                    "",
                ) || "",
            });
          }
        }

        if (
          !resolvedRequest.profesor_id ||
          !resolvedRequest.curso_id ||
          !resolvedRequest.sucursal_id ||
          !resolvedRequest.gestion_id
        ) {
          throw new Error(
            "No se pudo determinar los datos del curso seleccionado.",
          );
        }

        const query = new URLSearchParams(resolvedRequest);
        const response = await fetchAuth(
          `${API_URL}/listas/estudiantes?${query.toString()}`,
        );

        if (!response.ok) {
          throw new Error("No se pudo cargar la lista de inscritos.");
        }

        const data = await response.json();
        const lista = Array.isArray(data) ? data : [];

        const normalizados = lista.map((e) => ({
          matricula_id: e.matricula_id,
          estudiante_id: e.estudiante_id,
          nombres: toUpperSafe(e.nombres),
          ap_paterno: toUpperSafe(e.ap_paterno),
          ap_materno: toUpperSafe(e.ap_materno),
          ci: e.ci || "",
          telefono: e.telefono || "",
          nota_final: Number(e.nota_final ?? 0),
          estado: (e.estado || "").toUpperCase(),
        }));

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
      } catch {
        setError(
          "No se pudo cargar la lista de inscritos. Comuniquese con el administrador.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadEstudiantes();
  }, [params]);

  const estudiantesFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    return estudiantes
      .filter((e) => {
        const full =
          `${e.nombres} ${e.ap_paterno} ${e.ap_materno} ${e.ci}`.toLowerCase();
        const matchText = !term || full.includes(term);
        const matchEstado =
          statusFilter === "TODOS" ||
          (e.estado || "").toUpperCase() === statusFilter;
        return matchText && matchEstado;
      })
      .sort((a, b) =>
        buildFullName(a).localeCompare(buildFullName(b), "es", {
          sensitivity: "base",
        }),
      );
  }, [estudiantes, search, statusFilter]);

  const updateStudentField = (matriculaId, field, value) => {
    setEstudiantes((prev) =>
      prev.map((e) =>
        e.matricula_id === matriculaId
          ? {
              ...e,
              [field]: field === "nota_final" ? Number(value) : value,
            }
          : e,
      ),
    );
  };

  const guardarNotaEstado = async (student) => {
    if (!student?.matricula_id) {
      toast.error("No se pudo guardar.");
      return;
    }

    const matriculaIds = Array.isArray(student?.matricula_ids)
      ? student.matricula_ids.filter(Boolean)
      : [student.matricula_id];

    const nota = Number(student.nota_final ?? 0);
    const estado = (student.estado || "").toUpperCase();

    try {
      setSavingByMatricula((prev) => {
        const next = { ...prev };
        matriculaIds.forEach((id) => {
          next[id] = true;
        });
        return next;
      });

      for (const matriculaId of matriculaIds) {
        let response = await fetchAuth(
          `${API_URL}/listas/matricula/${matriculaId}/nota`,
          {
            method: "PUT",
            body: JSON.stringify({ nota_final: nota, estado }),
          },
        );

        if (!response.ok && response.status === 422 && student.estudiante_id) {
          response = await fetchAuth(
            `${API_URL}/listas/estudiante/${student.estudiante_id}/nota`,
            {
              method: "PUT",
              body: JSON.stringify({ nota_final: nota }),
            },
          );
        }

        if (!response.ok) {
          throw new Error("No se pudo guardar.");
        }
      }

      toast.success("Actualizacion guardada correctamente.");
    } catch {
      toast.error("No se pudo guardar la nota.");
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

  const handleExport = () => {
    if (estudiantes.length === 0) {
      toast.warning("No hay inscritos para exportar.");
      return;
    }

    const exportWithBirthDate = async () => {
      let byStudentId = {};

      try {
        const allRes = await fetchAuth(`${API_URL}/estudiantes/`);
        if (allRes.ok) {
          const allStudents = await allRes.json();
          byStudentId = (Array.isArray(allStudents) ? allStudents : []).reduce(
            (acc, s) => {
              if (s?.estudiante_id != null) acc[String(s.estudiante_id)] = s;
              return acc;
            },
            {},
          );
        }
      } catch {
        byStudentId = {};
      }

      const estudiantesConNacimiento = estudiantesFiltrados.map((e) => {
        const full = byStudentId[String(e.estudiante_id)] || null;
        return {
          ...e,
          fecha_nacimiento: full?.fecha_nacimiento || "",
        };
      });

      const infoGrupo = {
        curso: headerInfo.curso,
        sucursal: headerInfo.sucursal,
        facilitador: headerInfo.docente || getAuthUser()?.nombre || "Docente",
        horario: headerInfo.horario,
        gestion: headerInfo.gestion,
      };

      generarPDFLista(estudiantesConNacimiento, infoGrupo);
    };

    exportWithBirthDate();
  };

  return (
    <div className="space-y-6 p-4">
      <div className="text-sm text-gray-500">
        <Link
          href="/administrador/listas"
          className="hover:text-[#13678A] hover:underline"
        >
          Listas
        </Link>{" "}
        &gt;{" "}
        <span className="font-semibold text-gray-700">{headerInfo.curso}</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Estudiantes: {headerInfo.curso}
            </h1>
            <p className="text-sm text-gray-500">
              {headerInfo.sucursal} - {headerInfo.horario}
            </p>
            <p className="text-xs text-gray-500">
              Docente: {headerInfo.docente}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="rounded-md bg-[#13678A] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f506b]"
          >
            Exportar
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar estudiante por nombre o CI"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="TODOS">Estado: Todos</option>
            <option value="APROBADO">Aprobado</option>
            <option value="REPROBADO">Reprobado</option>
            <option value="ABANDONO">Abandono</option>
          </select>

          <div className="flex items-center justify-end text-sm text-gray-500">
            Total: {estudiantesFiltrados.length}
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Cargando inscritos...
          </div>
        ) : estudiantesFiltrados.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No hay estudiantes inscritos para este curso.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-3">Nombre completo</th>
                  <th className="px-3 py-3">CI</th>
                  <th className="px-3 py-3">Telefono</th>
                  <th className="px-3 py-3">Nota final</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Accion</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesFiltrados.map((e) => (
                  <tr key={e.matricula_id} className="border-b last:border-b-0">
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {buildFullName(e)}
                    </td>
                    <td className="px-3 py-3 text-gray-700">{e.ci || "-"}</td>
                    <td className="px-3 py-3 text-gray-700">
                      {e.telefono || "-"}
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={Number.isFinite(e.nota_final) ? e.nota_final : 0}
                        onChange={(ev) =>
                          updateStudentField(
                            e.matricula_id,
                            "nota_final",
                            ev.target.value,
                          )
                        }
                        className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={
                          ESTADOS_VALIDOS.includes(e.estado)
                            ? e.estado
                            : "APROBADO"
                        }
                        onChange={(ev) =>
                          updateStudentField(
                            e.matricula_id,
                            "estado",
                            ev.target.value,
                          )
                        }
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="APROBADO">Aprobado</option>
                        <option value="REPROBADO">Reprobado</option>
                        <option value="ABANDONO">Abandono</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => guardarNotaEstado(e)}
                        disabled={!!savingByMatricula[e.matricula_id]}
                        className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {savingByMatricula[e.matricula_id]
                          ? "Guardando..."
                          : "Guardar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
