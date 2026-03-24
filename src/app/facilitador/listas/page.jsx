"use client";
import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import { usePageTitle } from "@/lib/usePageTitle";

const API_URL = "https://api-umam-1.onrender.com";

const diasSemana = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

const diaIdToNombre = {
  1: "Lunes",
  2: "Martes",
  3: "Miercoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sabado",
  7: "Domingo",
};

function formatHora(value) {
  if (!value) return "";
  const str = String(value);
  if (str.includes("T")) {
    const timePart = str.split("T")[1] || "";
    return timePart.slice(0, 5);
  }
  return str.slice(0, 5);
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

function buildHorarioLabel(horario, horarioDetalle) {
  const diasClase = Array.isArray(horarioDetalle?.dias_clase)
    ? horarioDetalle.dias_clase
    : Array.isArray(horario?.dias_clase)
      ? horario.dias_clase
      : [];

  if (diasClase.length > 0) {
    const dias = diasClase
      .map((d) => {
        const fromName = d?.dia_semana?.dia_semana;
        if (fromName) {
          const clean = String(fromName).trim();
          return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
        }
        return diaIdToNombre[d?.dia_semana_id] || "";
      })
      .filter(Boolean);

    const hi = formatHora(diasClase[0]?.hora?.hora_inicio);
    const hf = formatHora(diasClase[0]?.hora?.hora_fin);
    const diasTexto = dias.length
      ? Array.from(new Set(dias)).join(", ")
      : "Sin dias";

    return hi && hf ? `${diasTexto} (${hi} - ${hf})` : diasTexto;
  }

  const dias = diasSemana
    .filter((dia) => horario[dia] === true || horario[dia] === 1)
    .map((dia) => dia.charAt(0).toUpperCase() + dia.slice(1));

  const diasTexto = dias.length ? dias.join(", ") : "Sin dias";
  const hi = formatHora(horario.hora_inicio);
  const hf = formatHora(horario.hora_fin);

  return hi && hf ? `${diasTexto} (${hi} - ${hf})` : diasTexto;
}

function normalizeCard(h, context = {}) {
  const { cursosById = {}, aulaToSucursal = {}, horariosById = {} } = context;
  const cursoId =
    h.curso_id ?? h.curso?.curso_id ?? h.curso?.id ?? h.id_curso ?? null;
  const aulaId = h.aula_id ?? h.aula?.aula_id ?? h.id_aula ?? null;
  const sucursalFromAula = aulaId ? aulaToSucursal[String(aulaId)] : null;
  const sucursalId =
    h.sucursal_id ??
    h.sucursal?.sucursal_id ??
    h.sucursal?.id ??
    sucursalFromAula?.sucursal_id ??
    h.id_sucursal ??
    null;
  const gestionId =
    h.gestion_id ?? h.gestion?.gestion_id ?? h.id_gestion ?? null;
  const profesorId =
    h.profesor_id ?? h.profesor?.usuario_id ?? h.profesor?.id ?? null;

  const cursoNombre =
    (typeof h.curso === "string" ? h.curso : null) ||
    h.curso?.nombre ||
    cursosById[String(cursoId)]?.nombre ||
    h.curso_nombre ||
    h.nombre_curso ||
    "Curso";

  const sucursalNombre =
    (typeof h.sucursal === "string" ? h.sucursal : null) ||
    h.sucursal?.nombre ||
    sucursalFromAula?.nombre ||
    h.sucursal_nombre ||
    h.nombre_sucursal ||
    "Sucursal";

  return {
    horario_id: h.horario_id || h.id || `${cursoId}-${sucursalId}-${gestionId}`,
    curso_id: cursoId,
    aula_id: aulaId,
    curso_nombre: cursoNombre,
    sucursal_id: sucursalId,
    sucursal_nombre: sucursalNombre,
    gestion_id: gestionId,
    profesor_id: profesorId,
    inscritos:
      h.total_estudiantes ||
      h.cantidad_estudiantes ||
      h.inscritos ||
      (Array.isArray(h.estudiantes) ? h.estudiantes.length : 0),
    horario_texto: buildHorarioLabel(
      h,
      horariosById[String(h.horario_id || h.id || "")],
    ),
  };
}

function isNoDisponibleCourseName(nombreCurso) {
  return /NO\s*DISPONIBLE/i.test(String(nombreCurso || ""));
}

export default function ListasFacilitadorPage() {
  usePageTitle("Listas");

  const [currentUser, setCurrentUser] = useState(null);
  const [gestiones, setGestiones] = useState([]);
  const [selectedGestionId, setSelectedGestionId] = useState("");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAuth = async (url) => {
    const token = Cookies.get("access_token");
    if (!token) throw new Error("Sesion expirada.");

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const user = getAuthUser();
        if (!user?.id)
          throw new Error("No se pudo identificar al facilitador.");
        setCurrentUser(user);

        const [gestionesRes, horariosRes] = await Promise.all([
          fetchAuth(`${API_URL}/cursos/gestiones`),
          fetchAuth(`${API_URL}/listas/profesor/${user.id}/horarios`),
        ]);

        if (!gestionesRes.ok || !horariosRes.ok) {
          throw new Error("No se pudo cargar la informacion.");
        }

        const gestionesData = await gestionesRes.json();
        const horariosData = await horariosRes.json();

        const [cursosData, sucursalesData] = await Promise.all([
          fetchAuth(`${API_URL}/cursos/`)
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
          fetchAuth(`${API_URL}/sucursales/`)
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
        ]);

        const horariosDetalladosData = await fetchAuth(
          `${API_URL}/horarios/?usuario_id=${user.id}`,
        )
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []);

        const cursosById = {};
        (Array.isArray(cursosData) ? cursosData : []).forEach((curso) => {
          if (curso?.curso_id != null) {
            cursosById[String(curso.curso_id)] = curso;
          }
        });

        const aulaToSucursal = {};
        (Array.isArray(sucursalesData) ? sucursalesData : []).forEach(
          (sucursal) => {
            (Array.isArray(sucursal?.aulas) ? sucursal.aulas : []).forEach(
              (aula) => {
                if (aula?.aula_id != null) {
                  aulaToSucursal[String(aula.aula_id)] = {
                    sucursal_id: sucursal.sucursal_id,
                    nombre: sucursal.nombre,
                  };
                }
              },
            );
          },
        );

        const horariosById = {};
        (Array.isArray(horariosDetalladosData)
          ? horariosDetalladosData
          : []
        ).forEach((horario) => {
          if (horario?.horario_id != null) {
            horariosById[String(horario.horario_id)] = horario;
          }
        });

        const nowYear = new Date().getFullYear();
        const gestionActual =
          gestionesData.find((g) => g.activa || g.vigente || g.actual) ||
          gestionesData.find((g) => Number(g.year_id) === nowYear) ||
          gestionesData[0] ||
          null;

        const gestionId = gestionActual ? String(gestionActual.gestion_id) : "";
        setGestiones(Array.isArray(gestionesData) ? gestionesData : []);
        setSelectedGestionId(gestionId);

        const normalizadas = (Array.isArray(horariosData) ? horariosData : [])
          .map((h) =>
            normalizeCard(h, { cursosById, aulaToSucursal, horariosById }),
          )
          .filter(
            (c) =>
              c.curso_id &&
              c.gestion_id &&
              !isNoDisponibleCourseName(c.curso_nombre),
          );

        // Unificar paralelos que el backend entrega en varios horarios (por aula)
        // para mostrar una sola tarjeta al facilitador.
        const agrupadas = Object.values(
          normalizadas.reduce((acc, card) => {
            const key = `${card.curso_id}_${card.profesor_id}_${card.gestion_id}_${card.sucursal_id}`;

            if (!acc[key]) {
              acc[key] = {
                ...card,
                horario_ids: [card.horario_id],
                horarios_texto: [card.horario_texto],
              };
            } else {
              acc[key].horario_ids.push(card.horario_id);
              acc[key].horarios_texto.push(card.horario_texto);
              // Evitar inflar inscritos cuando son los mismos alumnos en paralelo.
              acc[key].inscritos = Math.max(
                Number(acc[key].inscritos) || 0,
                Number(card.inscritos) || 0,
              );
            }

            return acc;
          }, {}),
        ).map((card) => ({
          ...card,
          horario_id: card.horario_ids[0],
          horario_texto: Array.from(new Set(card.horarios_texto)).join(" | "),
        }));

        setCards(agrupadas);
      } catch {
        setError(
          "No se pudo cargar la informacion. Comuniquese con el administrador.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const cardsGestion = useMemo(
    () =>
      cards.filter(
        (c) =>
          !selectedGestionId ||
          String(c.gestion_id) === String(selectedGestionId),
      ),
    [cards, selectedGestionId],
  );

  const saveCardContext = (card) => {
    try {
      if (typeof window === "undefined") return;
      const payload = {
        profesor_id: card.profesor_id != null ? String(card.profesor_id) : "",
        curso_id: card.curso_id != null ? String(card.curso_id) : "",
        sucursal_id: card.sucursal_id != null ? String(card.sucursal_id) : "",
        gestion_id: card.gestion_id != null ? String(card.gestion_id) : "",
        horario_ids: Array.isArray(card.horario_ids)
          ? card.horario_ids.map((id) => String(id))
          : [String(card.horario_id)],
        curso: card.curso_nombre || "Curso",
        sucursal: card.sucursal_nombre || "Sucursal",
        horario: card.horario_texto || "Sin horario",
        docente: currentUser?.nombre || "Facilitador",
      };
      sessionStorage.setItem(
        `listas_ctx_facilitador_${card.horario_id}`,
        JSON.stringify(payload),
      );
    } catch {
      // Ignore storage errors and keep API fallback behavior.
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#13678A]">LISTAS</h1>
          <p className="mt-1 text-sm text-gray-600">
            Cursos que dicta el facilitador logueado.
          </p>
        </div>

        <div className="w-full md:w-72">
          <label
            htmlFor="gestion-select"
            className="mb-1 block text-sm font-semibold"
          >
            Gestion
          </label>
          <select
            id="gestion-select"
            value={selectedGestionId}
            onChange={(e) => setSelectedGestionId(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            disabled={loading || gestiones.length === 0}
          >
            {gestiones.map((g) => (
              <option key={g.gestion_id} value={g.gestion_id}>
                {g.gestion} {g.year_id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Cargando cursos...
        </div>
      ) : cardsGestion.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          No tienes cursos asignados para la gestion seleccionada.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cardsGestion.map((card) => (
            <Link
              key={card.horario_id}
              href={`/facilitador/listas/${card.horario_id}`}
              onClick={() => saveCardContext(card)}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {card.curso_nombre}
                </h3>
                <span className="rounded-full bg-[#13678A] px-2 py-1 text-xs font-semibold text-white">
                  ACTIVO
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {card.sucursal_nombre}
              </p>
              <p className="mt-1 text-xs text-gray-500">{card.horario_texto}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-500">Inscritos</span>
                <span className="font-bold text-[#13678A]">
                  {card.inscritos}
                </span>
              </div>
              <div className="mt-3 text-sm font-medium text-[#13678A]">
                Ver lista
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
