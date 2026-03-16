"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { usePageTitle } from "@/lib/usePageTitle";
import { generarPDFLista } from "../pdfListas";

const API_URL = "https://api-umam-1.onrender.com";
const ESTADOS_VALIDOS = ["APROBADO", "REPROBADO", "ABANDONO"];

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
  const searchParams = useSearchParams();

  const cursoNombre = searchParams.get("curso") || "Curso";
  const sucursalNombre = searchParams.get("sucursal") || "Sucursal";
  const horarioTexto = searchParams.get("horario") || "Sin horario";

  usePageTitle(`Cursos - ${cursoNombre}`);

  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingByMatricula, setSavingByMatricula] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [error, setError] = useState("");

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
      profesor_id:
        searchParams.get("profesor_id") || (user?.id ? String(user.id) : ""),
      curso_id: searchParams.get("curso_id") || "",
      sucursal_id: searchParams.get("sucursal_id") || "",
      gestion_id: searchParams.get("gestion_id") || "",
    };
  }, [searchParams]);

  useEffect(() => {
    const loadEstudiantes = async () => {
      try {
        setLoading(true);
        setError("");

        const resolvedRequest = { ...requestData };

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
          const horarioId = Array.isArray(params?.horarioId)
            ? params.horarioId[0]
            : params?.horarioId;

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

        setEstudiantes(
          lista.map((e) => ({
            matricula_id: e.matricula_id,
            estudiante_id: e.estudiante_id,
            nombres: toUpperSafe(e.nombres),
            ap_paterno: toUpperSafe(e.ap_paterno),
            ap_materno: toUpperSafe(e.ap_materno),
            ci: e.ci || "",
            telefono: e.telefono || "",
            nota_final: Number(e.nota_final ?? 0),
            estado: (e.estado || "").toUpperCase(),
          })),
        );
      } catch {
        setError(
          "No se pudo cargar la lista de inscritos. Comuniquese con el administrador.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadEstudiantes();
  }, [params, requestData]);

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
      toast.error(
        "No se pudo realizar la accion. Comuniquese con el administrador.",
      );
      return;
    }

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
      setSavingByMatricula((prev) => ({
        ...prev,
        [student.matricula_id]: true,
      }));

      const response = await fetchAuth(
        `${API_URL}/listas/matricula/${student.matricula_id}/nota`,
        {
          method: "PUT",
          body: JSON.stringify({ nota_final: nota, estado }),
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo guardar.");
      }

      toast.success("Actualizacion guardada correctamente.");
    } catch {
      toast.error(
        "No se pudo realizar la accion. Comuniquese con el administrador.",
      );
    } finally {
      setSavingByMatricula((prev) => ({
        ...prev,
        [student.matricula_id]: false,
      }));
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
              if (s?.estudiante_id != null) {
                acc[String(s.estudiante_id)] = s;
              }
              return acc;
            },
            {},
          );
        }
      } catch {
        byStudentId = {};
      }

      if (Object.keys(byStudentId).length === 0) {
        const uniqueIds = Array.from(
          new Set(
            estudiantes
              .map((e) => e?.estudiante_id)
              .filter((id) => id !== null && id !== undefined),
          ),
        );

        const details = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const res = await fetchAuth(`${API_URL}/estudiantes/${id}`);
              if (!res.ok) return null;
              return await res.json();
            } catch {
              return null;
            }
          }),
        );

        byStudentId = details.reduce((acc, s) => {
          if (s?.estudiante_id != null) {
            acc[String(s.estudiante_id)] = s;
          }
          return acc;
        }, {});
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

      generarPDFLista(estudiantesConNacimiento, {
        curso: cursoNombre,
        sucursal: sucursalNombre,
        facilitador: getAuthUser()?.nombre || "Facilitador",
        horario: horarioTexto,
        gestion: requestData.gestion_id,
      });
    };

    exportWithBirthDate();
  };

  return (
    <div className="space-y-6 p-4">
      <div className="text-sm text-gray-500">
        <Link
          href="/facilitador/listas"
          className="hover:text-[#13678A] hover:underline"
        >
          Cursos
        </Link>{" "}
        &gt; <span className="font-semibold text-gray-700">{cursoNombre}</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Estudiantes: {cursoNombre}
            </h1>
            <p className="text-sm text-gray-500">
              {sucursalNombre} - {horarioTexto}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="rounded-md bg-[#13678A] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f506b]"
          >
            Exportar CSV/PDF
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
                      {[e.nombres, e.ap_paterno, e.ap_materno]
                        .filter(Boolean)
                        .join(" ")}
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
