"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
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
    return (str.split("T")[1] || "").slice(0, 5);
  }
  return str.slice(0, 5);
}

function buildHorarioLabel(horario) {
  const diasClase = Array.isArray(horario?.dias_clase)
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

function normalizeArrayPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.estudiantes)) return payload.estudiantes;
  if (Array.isArray(payload?.estudiantes?.data))
    return payload.estudiantes.data;
  return [];
}

function getStudentUniqueKey(item) {
  return String(
    item?.estudiante_id ||
      item?.id_estudiante ||
      item?.estudiante?.estudiante_id ||
      item?.estudiante?.id ||
      item?.ci ||
      item?.matricula_id ||
      JSON.stringify(item),
  );
}

export default function ListasEncargadoPage() {
  usePageTitle("Listas");

  const [gestiones, setGestiones] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [selectedGestionId, setSelectedGestionId] = useState("");
  const [selectedSucursalId, setSelectedSucursalId] = useState("");
  const [search, setSearch] = useState("");
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

        const [
          gestionesRes,
          sucursalesRes,
          cursosRes,
          profesoresRes,
          horariosRes,
          inscripcionesRes,
        ] = await Promise.all([
          fetchAuth(`${API_URL}/cursos/gestiones`),
          fetchAuth(`${API_URL}/sucursales/`),
          fetchAuth(`${API_URL}/cursos/`),
          fetchAuth(`${API_URL}/usuarios/?rol_id=3`),
          fetchAuth(`${API_URL}/horarios/`),
          fetchAuth(`${API_URL}/inscripciones/`),
        ]);

        if (
          !gestionesRes.ok ||
          !sucursalesRes.ok ||
          !cursosRes.ok ||
          !profesoresRes.ok ||
          !horariosRes.ok
        ) {
          throw new Error("No se pudo cargar la informacion.");
        }

        const [
          gestionesData,
          sucursalesData,
          cursosData,
          profesoresData,
          horariosData,
          inscripcionesData,
        ] = await Promise.all([
          gestionesRes.json(),
          sucursalesRes.json(),
          cursosRes.json(),
          profesoresRes.json(),
          horariosRes.json(),
          inscripcionesRes.ok ? inscripcionesRes.json() : Promise.resolve([]),
        ]);

        const cursosById = {};
        (Array.isArray(cursosData) ? cursosData : []).forEach((curso) => {
          if (curso?.curso_id != null)
            cursosById[String(curso.curso_id)] = curso;
        });

        const profesoresById = {};
        (Array.isArray(profesoresData) ? profesoresData : []).forEach(
          (prof) => {
            if (prof?.usuario_id != null)
              profesoresById[String(prof.usuario_id)] = prof;
          },
        );

        const horariosById = {};
        (Array.isArray(horariosData) ? horariosData : []).forEach((h) => {
          const hid = h?.horario_id || h?.id;
          if (hid != null) horariosById[String(hid)] = h;
        });

        // Contar inscritos por horario_id usando inscripciones (tienen horario_id directamente)
        const inscritosPorHorario = {};
        (Array.isArray(inscripcionesData) ? inscripcionesData : []).forEach((item) => {
          const hid = item?.horario_id;
          const eid = item?.estudiante_id;
          if (hid != null && eid != null) {
            const hidStr = String(hid);
            if (!inscritosPorHorario[hidStr]) {
              inscritosPorHorario[hidStr] = new Set();
            }
            inscritosPorHorario[hidStr].add(String(eid));
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

        const inscritosPorParalelo = {};
        Object.entries(inscritosPorHorario).forEach(([hid, estudiantesSet]) => {
          const h = horariosById[hid];
          if (!h) return;

          const cursoId = h.curso_id ?? h.id_curso ?? h.curso?.curso_id ?? null;
          const profesorId =
            h.profesor_id ?? h.usuario_id ?? h.profesor?.usuario_id ?? null;
          const gestionId =
            h.gestion_id ?? h.id_gestion ?? h.gestion?.gestion_id ?? null;
          const aulaId = h.aula_id ?? h.id_aula ?? h.aula?.aula_id ?? null;
          const sucursalInfo = aulaId ? aulaToSucursal[String(aulaId)] : null;
          const sucursalId =
            h.sucursal_id ?? h.id_sucursal ?? sucursalInfo?.sucursal_id ?? null;

          const paraleloKey = `horario_${hid}`;
          if (!inscritosPorParalelo[paraleloKey]) {
            inscritosPorParalelo[paraleloKey] = new Set();
          }
          estudiantesSet.forEach((studentKey) => {
            inscritosPorParalelo[paraleloKey].add(studentKey);
          });
        });

        const normalizadas = (
          Array.isArray(horariosData) ? horariosData : []
        ).map((h) => {
          const cursoId = h.curso_id ?? h.id_curso ?? h.curso?.curso_id ?? null;
          const profesorId =
            h.profesor_id ?? h.usuario_id ?? h.profesor?.usuario_id ?? null;
          const aulaId = h.aula_id ?? h.id_aula ?? h.aula?.aula_id ?? null;
          const sucursalInfo = aulaId ? aulaToSucursal[String(aulaId)] : null;

          const profesor = profesoresById[String(profesorId)] || null;

          const horarioKey = String(h.horario_id || h.id || "");
          const cursoNombre =
            h.curso?.nombre ||
            h.curso_nombre ||
            cursosById[String(cursoId)]?.nombre ||
            "Curso";
          const cursoUpper = String(cursoNombre).toUpperCase();
          const isNoDisponible =
            !cursoId ||
            !profesorId ||
            cursoUpper.includes("NO DISPONIBLE") ||
            cursoUpper.includes("BLOQUEADO") ||
            cursoUpper.includes("OCUPADO");
          const paraleloKey = `horario_${h.horario_id || h.id}`;

          return {
            horario_id: h.horario_id || h.id,
            curso_id: cursoId,
            curso_nombre: cursoNombre,
            profesor_id: profesorId,
            docente_nombre: profesor
              ? `${profesor.nombres || ""} ${profesor.ap_paterno || ""} ${
                  profesor.ap_materno || ""
                }`
                  .trim()
                  .toUpperCase()
              : "SIN DOCENTE",
            is_no_disponible: isNoDisponible,
            paralelo_key: paraleloKey,
            gestion_id:
              h.gestion_id ?? h.id_gestion ?? h.gestion?.gestion_id ?? null,
            sucursal_id:
              h.sucursal_id ??
              h.id_sucursal ??
              sucursalInfo?.sucursal_id ??
              null,
            sucursal_nombre:
              h.sucursal?.nombre ||
              h.sucursal_nombre ||
              sucursalInfo?.nombre ||
              "Sucursal",
            horario_texto: buildHorarioLabel(h),
            inscritos:
              inscritosPorParalelo[paraleloKey]?.size ??
              inscritosPorHorario[horarioKey]?.size ??
              h.total_estudiantes ??
              h.cantidad_estudiantes ??
              h.inscritos ??
              (Array.isArray(h.estudiantes) ? h.estudiantes.length : 0),
          };
        });

        const cardsPorParalelo = {};
        normalizadas.forEach((card) => {
          if (!card?.paralelo_key) return;
          if (!cardsPorParalelo[card.paralelo_key]) {
            cardsPorParalelo[card.paralelo_key] = {
              ...card,
              horario_ids: [card.horario_id],
              horarios_texto: [card.horario_texto],
            };
          } else {
            cardsPorParalelo[card.paralelo_key].horario_ids.push(
              card.horario_id,
            );
            cardsPorParalelo[card.paralelo_key].horarios_texto.push(
              card.horario_texto,
            );
            cardsPorParalelo[card.paralelo_key].inscritos = Math.max(
              Number(cardsPorParalelo[card.paralelo_key].inscritos) || 0,
              Number(card.inscritos) || 0,
            );
          }
        });

        const cardsAgrupadas = Object.values(cardsPorParalelo).map((card) => ({
          ...card,
          horario_id: card.horario_ids[0],
          horario_texto: Array.from(new Set(card.horarios_texto)).join(" | "),
        }));

        const cardsConConteoReal = cardsAgrupadas;

        const nowYear = new Date().getFullYear();
        const gestionActual =
          gestionesData.find((g) => g.activa || g.vigente || g.actual) ||
          gestionesData.find((g) => Number(g.year_id) === nowYear) ||
          gestionesData[0] ||
          null;

        setGestiones(Array.isArray(gestionesData) ? gestionesData : []);
        setSucursales(Array.isArray(sucursalesData) ? sucursalesData : []);
        setSelectedGestionId(
          gestionActual ? String(gestionActual.gestion_id) : "",
        );
        setCards(
          cardsConConteoReal.filter((c) => c.horario_id && !c.is_no_disponible),
        );
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

  const cardsFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();

    return cards
      .filter(
        (c) =>
          !selectedGestionId ||
          String(c.gestion_id) === String(selectedGestionId),
      )
      .filter(
        (c) =>
          !selectedSucursalId ||
          String(c.sucursal_id) === String(selectedSucursalId),
      )
      .filter((c) => {
        if (!term) return true;
        return (
          String(c.curso_nombre || "")
            .toLowerCase()
            .includes(term) ||
          String(c.docente_nombre || "")
            .toLowerCase()
            .includes(term)
        );
      })
      .sort((a, b) =>
        `${a.curso_nombre} ${a.docente_nombre}`.localeCompare(
          `${b.curso_nombre} ${b.docente_nombre}`,
          "es",
          { sensitivity: "base" },
        ),
      );
  }, [cards, selectedGestionId, selectedSucursalId, search]);

  const saveCardContext = (card) => {
    try {
      if (typeof window === "undefined") return;
      const payload = {
        profesor_id: card.profesor_id != null ? String(card.profesor_id) : "",
        curso_id: card.curso_id != null ? String(card.curso_id) : "",
        sucursal_id: card.sucursal_id != null ? String(card.sucursal_id) : "",
        gestion_id: card.gestion_id != null ? String(card.gestion_id) : "",
        curso: card.curso_nombre || "Curso",
        sucursal: card.sucursal_nombre || "Sucursal",
        horario: card.horario_texto || "Sin horario",
        docente: card.docente_nombre || "Sin docente",
      };
      sessionStorage.setItem(
        `listas_ctx_encargado_${card.horario_id}`,
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
            Cursos disponibles por sucursal y gestion.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
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
            <option value="">Todas</option>
            {gestiones.map((g) => (
              <option key={g.gestion_id} value={g.gestion_id}>
                {g.gestion} - {g.year_id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="sucursal-select"
            className="mb-1 block text-sm font-semibold"
          >
            Sucursal
          </label>
          <select
            id="sucursal-select"
            value={selectedSucursalId}
            onChange={(e) => setSelectedSucursalId(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            disabled={loading || sucursales.length === 0}
          >
            <option value="">Todas</option>
            {sucursales.map((s) => (
              <option key={s.sucursal_id} value={s.sucursal_id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="search-card"
            className="mb-1 block text-sm font-semibold"
          >
            Buscar Curso o Docente
          </label>
          <input
            id="search-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre del curso o docente"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
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
      ) : cardsFiltradas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          No hay cursos para los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cardsFiltradas.map((card) => (
            <Link
              key={card.horario_id}
              href={`/encargado/listas/${card.horario_id}`}
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
              <p className="mt-2 text-xs font-semibold text-gray-700">
                Docente: {card.docente_nombre}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {card.sucursal_nombre}
              </p>
              <p className="mt-1 text-xs text-gray-500">{card.horario_texto}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-500">Inscritos</span>
                <span className="font-bold text-[#13678A]">
                  {Number(card.inscritos) || 0}
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
