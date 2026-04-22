// src/app/administrador/reportes/page.jsx
"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import * as XLSX from "xlsx";
import { usePageTitle } from "@/lib/usePageTitle";

const API_URL = "https://api-umam-1.onrender.com";

const handleFetchResponse = async (response) => {
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent("sessionExpired"));
    Cookies.remove("access_token");
    Cookies.remove("user_data");
    throw new Error("Sesión expirada...");
  }
  return response;
};

export default function DashboardUMAM() {
  usePageTitle("Reportes");
  // Filtros dinámicos
  const [sucursales, setSucursales] = useState([]);
  const [gestiones, setGestiones] = useState([]);
  const [añosAcademicos, setAñosAcademicos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [gestorias, setGestorias] = useState([]);

  // Gráficos dinámicos
  const [estudiantesPorSucursal, setEstudiantesPorSucursal] = useState([]);
  const [estudiantesPorGestion, setEstudiantesPorGestion] = useState([]);
  const [estudiantesPorCurso, setEstudiantesPorCurso] = useState([]);
  const [facilitadoresPorGestion, setFacilitadoresPorGestion] = useState([]);

  // Estadísticas de estudiantes (nuevos endpoints)
  const [totalEstudiantesActivos, setTotalEstudiantesActivos] = useState(null);
  const [totalFacilitadores, setTotalFacilitadores] = useState(0);
  const [estPorSucursal, setEstPorSucursal] = useState([]);
  const [estPorTipo, setEstPorTipo] = useState([]);
  const [estPorGenero, setEstPorGenero] = useState([]);
  const [estPorMacroDistrito, setEstPorMacroDistrito] = useState([]);
  const [loadingEstStats, setLoadingEstStats] = useState(false);

  // Estado para pestañas y filtros
  const [tabActiva, setTabActiva] = useState("general");
  const [filtros, setFiltros] = useState({
    año: "",
    gestion: "",
    sucursal: "",
    curso: "",
    busqueda: "",
  });

  // Estado para datos de la API
  const [generalData, setGeneralData] = useState(null);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState(null);

  // Estado para datos detalle desde API
  const [detalleData, setDetalleData] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);

  // Estado para reporte general filtrado
  const [reporteFiltrado, setReporteFiltrado] = useState({
    total_estudiantes: 0,
    aprobados: 0,
    reprobados: 0,
    porcentaje_aprobados: 0,
    porcentaje_reprobados: 0,
  });
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [errorReporte, setErrorReporte] = useState(null);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return "";
    const fecha = new Date(fechaNacimiento);
    if (isNaN(fecha.getTime())) return "";

    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
      edad--;
    }
    return edad >= 0 ? edad : "";
  };

  const obtenerReferenciaFamiliar = (estudiante) => {
    const referencias = Array.isArray(estudiante?.datos_familiares)
      ? estudiante.datos_familiares
      : [];

    if (referencias.length === 0) {
      return { nombre: "", telefono: "" };
    }

    const referencia =
      referencias.find(
        (item) => String(item?.tipo || "").toLowerCase() === "referencia",
      ) || referencias[0];

    const nombre = [
      referencia?.ap_paterno,
      referencia?.ap_materno,
      referencia?.nombres,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      nombre,
      telefono: referencia?.telefono || "",
    };
  };

  const obtenerDireccionYMacrodistrito = (direccionCompleta) => {
    if (!direccionCompleta) {
      return { macrodistrito: "", direccion: "" };
    }

    const partes = String(direccionCompleta)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (partes.length <= 1) {
      return { macrodistrito: "", direccion: direccionCompleta };
    }

    return {
      macrodistrito: partes[0],
      direccion: partes.slice(1).join(", "),
    };
  };

  const descargarEstudiantesExcel = async () => {
    setExportandoExcel(true);
    try {
      const token = Cookies.get("access_token") || Cookies.get("token");
      if (!token) throw new Error("No hay token de autenticación.");

      const response = await fetch(`${API_URL}/estudiantes/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      await handleFetchResponse(response);

      if (!response.ok) {
        throw new Error("No se pudo obtener la lista de estudiantes.");
      }

      const estudiantes = await response.json();
      if (!Array.isArray(estudiantes) || estudiantes.length === 0) {
        throw new Error("No hay estudiantes para exportar.");
      }

      const toUpperText = (value) =>
        value === null || value === undefined
          ? ""
          : String(value).toUpperCase();

      const filas = estudiantes.map((estudiante, index) => {
        const referencia = obtenerReferenciaFamiliar(estudiante);
        const datosDireccion = obtenerDireccionYMacrodistrito(
          estudiante?.direccion,
        );
        const macrodistrito =
          estudiante?.macro_distrito || datosDireccion.macrodistrito;
        const direccion = estudiante?.macro_distrito
          ? estudiante.direccion
          : datosDireccion.direccion;

        return {
          Nº: index + 1,
          NOMBRES: toUpperText(estudiante?.nombres),
          "APELLIDO PATERNO": toUpperText(estudiante?.ap_paterno),
          "APELLIDO MATERNO": toUpperText(estudiante?.ap_materno),
          CI: toUpperText(estudiante?.ci),
          "FECHA NACIMIENTO": estudiante?.fecha_nacimiento
            ? String(estudiante.fecha_nacimiento).split("T")[0]
            : "",
          EDAD: calcularEdad(estudiante?.fecha_nacimiento),
          DIRECCION: toUpperText(direccion),
          MACRODISTRITO: toUpperText(macrodistrito),
          "NRO CELULAR ESTUDIANTE": toUpperText(estudiante?.telefono),
          "NOMBRE REF FAMILIAR": toUpperText(referencia.nombre),
          "NRO CELULAR REF FAMILIAR": toUpperText(referencia.telefono),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(filas);
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 16 },
        { wch: 8 },
        { wch: 35 },
        { wch: 20 },
        { wch: 22 },
        { wch: 30 },
        { wch: 22 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Estudiantes");
      XLSX.writeFile(
        workbook,
        `estudiantes_umam_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (error) {
      setErrorDetalle(error.message || "Error al exportar estudiantes.");
    } finally {
      setExportandoExcel(false);
    }
  };

  // Cargar filtros y gráficos al inicio
  useEffect(() => {
    const token = Cookies.get("access_token") || Cookies.get("token");
    if (!token) {
      setErrorGeneral("No hay token de autenticación. Inicia sesión.");
      setLoadingGeneral(false);
      return;
    }
    setLoadingGeneral(true);
    setErrorGeneral(null);

    // Sucursales
    fetch("https://api-umam-1.onrender.com/sucursales/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          Cookies.remove("access_token");
          Cookies.remove("token");
          setErrorGeneral(
            "Sesión expirada. Por favor vuelve a iniciar sesión.",
          );
          setLoadingGeneral(false);
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        setSucursales(
          Array.isArray(data)
            ? data.map((s) => ({ nombre: s.nombre, id: s.sucursal_id }))
            : [],
        );
      });

    // Gestiones
    fetch("https://api-umam-1.onrender.com/cursos/gestiones", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          Cookies.remove("access_token");
          Cookies.remove("token");
          setErrorGeneral(
            "Sesión expirada. Por favor vuelve a iniciar sesión.",
          );
          setLoadingGeneral(false);
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        setGestiones(
          Array.isArray(data)
            ? data.map((g) => ({ nombre: g.gestion, id: g.gestion_id }))
            : [],
        );
      });

    // Años académicos
    fetch("https://api-umam-1.onrender.com/cursos/years", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          Cookies.remove("access_token");
          Cookies.remove("token");
          setErrorGeneral(
            "Sesión expirada. Por favor vuelve a iniciar sesión.",
          );
          setLoadingGeneral(false);
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        setAñosAcademicos(Array.isArray(data) ? data.map((y) => y.year) : []);
      });

    // Cursos
    fetch("https://api-umam-1.onrender.com/cursos/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          Cookies.remove("access_token");
          Cookies.remove("token");
          setErrorGeneral(
            "Sesión expirada. Por favor vuelve a iniciar sesión.",
          );
          setLoadingGeneral(false);
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        if (Array.isArray(data)) {
          setCursos(data.map((c) => c.nombre));
          setTalleres(
            data
              .filter((c) => !c.gestoria)
              .map((c) => ({ nombre: c.nombre, id: c.curso_id })),
          );
          setGestorias(
            data
              .filter((c) => c.gestoria)
              .map((c) => ({ nombre: c.nombre, id: c.curso_id })),
          );
        } else {
          setCursos([]);
          setTalleres([]);
          setGestorias([]);
        }
      });

    fetch("https://api-umam-1.onrender.com/usuarios/?rol_id=3", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          Cookies.remove("access_token");
          Cookies.remove("token");
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        // Manejar si es un array directo o un objeto con propiedades
        let facilitadores = 0;
        if (Array.isArray(data)) {
          facilitadores = data.length;
        } else if (data.data && Array.isArray(data.data)) {
          facilitadores = data.data.length;
        } else if (typeof data === "object") {
          facilitadores = Object.keys(data).length;
        }
        setTotalFacilitadores(facilitadores);
      })
      .catch(() => {});

    // Gráficos
    fetch("https://api-umam-1.onrender.com/reportes/por-sucursal", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          Cookies.remove("access_token");
          Cookies.remove("token");
          setErrorGeneral(
            "Sesión expirada. Por favor vuelve a iniciar sesión.",
          );
          setLoadingGeneral(false);
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        const colores = [
          "#0088FE",
          "#00C49F",
          "#FFBB28",
          "#FF8042",
          "#A28CFF",
          "#FF6F91",
          "#F67280",
          "#6C5B7B",
          "#355C7D",
          "#2A9D8F",
          "#E76F51",
          "#264653",
        ];
        setEstudiantesPorSucursal(
          Array.isArray(data)
            ? data.map((s, idx) => ({
                nombre: s.nombre,
                value: s.total_estudiantes,
                color: colores[idx % colores.length],
              }))
            : [],
        );
      });

    fetch("https://api-umam-1.onrender.com/reportes/por-gestion", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          Cookies.remove("access_token");
          Cookies.remove("token");
          setErrorGeneral(
            "Sesión expirada. Por favor vuelve a iniciar sesión.",
          );
          setLoadingGeneral(false);
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        setEstudiantesPorGestion(
          Array.isArray(data)
            ? data.map((g) => ({
                gestion: g.nombre,
                estudiantes: g.total_estudiantes,
              }))
            : [],
        );
      });

    fetch("https://api-umam-1.onrender.com/reportes/por-curso", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          Cookies.remove("access_token");
          Cookies.remove("token");
          setErrorGeneral(
            "Sesión expirada. Por favor vuelve a iniciar sesión.",
          );
          setLoadingGeneral(false);
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        fetch("https://api-umam-1.onrender.com/cursos/", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((cursosData) => {
            if (!Array.isArray(cursosData)) return;
            const coloresTalleres = [
              "#0088FE",
              "#00C49F",
              "#FFBB28",
              "#FF8042",
              "#A28CFF",
              "#FF6F91",
            ];
            const coloresGestorias = [
              "#FF8042",
              "#FFBB28",
              "#0088FE",
              "#00C49F",
              "#A28CFF",
              "#FF6F91",
            ];
            let talleresIndex = 0;
            let gestoriasIndex = 0;
            const cursosMap = {};
            cursosData.forEach((c) => {
              cursosMap[c.nombre] = c.gestoria;
            });
            const filtrados = Array.isArray(data)
              ? data
                  .filter((c) => cursosMap[c.nombre] !== undefined)
                  .filter(
                    (c) =>
                      cursosMap[c.nombre] === true ||
                      cursosMap[c.nombre] === false,
                  )
                  .map((c) => {
                    const esGestoria = cursosMap[c.nombre];
                    const color = esGestoria
                      ? coloresGestorias[
                          gestoriasIndex++ % coloresGestorias.length
                        ]
                      : coloresTalleres[
                          talleresIndex++ % coloresTalleres.length
                        ];
                    return {
                      nombre: c.nombre,
                      value: c.total_estudiantes,
                      color,
                    };
                  })
              : [];
            setEstudiantesPorCurso(filtrados);
          });
      });

    fetch("https://api-umam-1.onrender.com/reportes/por-facilitador", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          Cookies.remove("access_token");
          Cookies.remove("token");
          setErrorGeneral(
            "Sesión expirada. Por favor vuelve a iniciar sesión.",
          );
          setLoadingGeneral(false);
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        let gestionesFiltradas = Array.isArray(data)
          ? data
              .filter(
                (f) =>
                  typeof f.gestion_id === "string" ||
                  typeof f.gestion_id === "number",
              )
              .sort((a, b) => {
                if (a.fecha && b.fecha) {
                  return new Date(b.fecha) - new Date(a.fecha);
                }
                if (!isNaN(a.gestion_id) && !isNaN(b.gestion_id)) {
                  return Number(b.gestion_id) - Number(a.gestion_id);
                }
                if (
                  typeof a.gestion_id === "string" &&
                  typeof b.gestion_id === "string"
                ) {
                  return b.gestion_id.localeCompare(a.gestion_id, undefined, {
                    numeric: true,
                  });
                }
                return 0;
              })
              .slice(0, 4)
              .map((f) => ({
                gestion: f.gestion_id,
                facilitadores: f.total_estudiantes,
              }))
          : [];
        setFacilitadoresPorGestion(gestionesFiltradas);
      });

    setLoadingGeneral(false);
  }, []);

  // Cargar estadísticas de estudiantes (nuevos endpoints)
  useEffect(() => {
    const token = Cookies.get("access_token") || Cookies.get("token");
    if (!token) return;

    setLoadingEstStats(true);

    const headers = { Authorization: `Bearer ${token}` };
    const base = API_URL;

    const coloresSucursal = [
      "#0088FE",
      "#00C49F",
      "#FFBB28",
      "#FF8042",
      "#A28CFF",
      "#FF6F91",
      "#F67280",
      "#6C5B7B",
    ];
    const coloresTipo = ["#13678A", "#FF8042"];
    const coloresGenero = ["#FF6F91", "#0088FE", "#00C49F"];
    const coloresMacro = [
      "#0088FE",
      "#00C49F",
      "#FFBB28",
      "#FF8042",
      "#A28CFF",
      "#FF6F91",
      "#F67280",
      "#6C5B7B",
      "#355C7D",
      "#2A9D8F",
    ];

    Promise.all([
      fetch(`${base}/reportes/estudiantes/total`, { headers }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(`${base}/reportes/estudiantes/por-sucursal`, { headers }).then(
        (r) => (r.ok ? r.json() : null),
      ),
      fetch(`${base}/reportes/estudiantes/por-tipo`, { headers }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(`${base}/reportes/estudiantes/por-genero`, { headers }).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(`${base}/reportes/estudiantes/por-macro-distrito`, {
        headers,
      }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([total, porSucursal, porTipo, porGenero, porMacro]) => {
        if (total) setTotalEstudiantesActivos(total.total ?? total);
        if (Array.isArray(porSucursal))
          setEstPorSucursal(
            porSucursal.map((s, i) => ({
              nombre: s.nombre,
              value: s.total,
              color: coloresSucursal[i % coloresSucursal.length],
            })),
          );
        if (Array.isArray(porTipo))
          setEstPorTipo(
            porTipo.map((t, i) => ({
              nombre:
                t.tipo === "gestoria"
                  ? "Gestoría"
                  : t.tipo === "taller"
                    ? "Taller"
                    : t.tipo,
              value: t.total,
              color: coloresTipo[i % coloresTipo.length],
            })),
          );
        if (Array.isArray(porGenero))
          setEstPorGenero(
            porGenero.map((g, i) => ({
              nombre: g.genero,
              value: g.total,
              color: coloresGenero[i % coloresGenero.length],
            })),
          );
        if (Array.isArray(porMacro))
          setEstPorMacroDistrito(
            porMacro.map((m, i) => ({
              nombre: m.macro_distrito || "Sin especificar",
              value: m.total,
              color: coloresMacro[i % coloresMacro.length],
            })),
          );
      })
      .catch(() => {})
      .finally(() => setLoadingEstStats(false));
  }, []);

  // Fetch detalle y reporte general cada vez que cambian los filtros
  useEffect(() => {
    const fetchDetalle = async () => {
      setLoadingDetalle(true);
      setLoadingReporte(true);
      setErrorDetalle(null);
      setErrorReporte(null);

      const token = Cookies.get("access_token") || Cookies.get("token");
      if (!token) {
        setErrorDetalle("No hay token de autenticación. Inicia sesión.");
        setErrorReporte("No hay token de autenticación. Inicia sesión.");
        setLoadingDetalle(false);
        setLoadingReporte(false);
        return;
      }

      try {
        // Construir query params según filtros
        const params = new URLSearchParams();
        if (filtros.sucursal) params.append("sucursal_id", filtros.sucursal);
        if (filtros.gestion) params.append("gestion_id", filtros.gestion);

        const [
          resReporte,
          resCursos,
          resHorarios,
          resInscripciones,
          resSucursales,
        ] = await Promise.all([
          fetch(
            `${API_URL}/reportes/general${params.toString() ? "?" + params.toString() : ""}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            },
          ),
          fetch(`${API_URL}/cursos/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/horarios/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/inscripciones/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/sucursales/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        await handleFetchResponse(resReporte);

        if (!resReporte.ok) throw new Error("Error al obtener reporte general");

        const [
          dataReporte,
          cursosData,
          horariosData,
          inscripcionesData,
          sucursalesData,
        ] = await Promise.all([
          resReporte.json(),
          resCursos.ok ? resCursos.json() : Promise.resolve([]),
          resHorarios.ok ? resHorarios.json() : Promise.resolve([]),
          resInscripciones.ok ? resInscripciones.json() : Promise.resolve([]),
          resSucursales.ok ? resSucursales.json() : Promise.resolve([]),
        ]);

        const cursosById = {};
        (Array.isArray(cursosData) ? cursosData : []).forEach((curso) => {
          if (curso?.curso_id != null) {
            cursosById[String(curso.curso_id)] = curso;
          }
        });

        const horariosById = {};
        (Array.isArray(horariosData) ? horariosData : []).forEach((h) => {
          const hid = h?.horario_id || h?.id;
          if (hid != null) horariosById[String(hid)] = h;
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

        const sucursalActiva = filtros.sucursal ? String(filtros.sucursal) : "";
        const gestionActiva = filtros.gestion ? String(filtros.gestion) : "";

        const rowsMap = {};
        const ensureRow = (key, nombre) => {
          if (!rowsMap[key]) {
            rowsMap[key] = {
              nombre,
              total_estudiantes: 0,
              aprobados: 0,
              reprobados: 0,
              estudiantesSet: new Set(),
              aprobadosSet: new Set(),
              reprobadosSet: new Set(),
            };
          }
          return rowsMap[key];
        };

        (Array.isArray(horariosData) ? horariosData : []).forEach((h) => {
          const horarioId = h?.horario_id || h?.id;
          if (horarioId == null) return;

          const cursoId = h.curso_id ?? h.id_curso ?? h.curso?.curso_id ?? null;
          const aulaId = h.aula_id ?? h.id_aula ?? h.aula?.aula_id ?? null;
          const sucursalInfo = aulaId ? aulaToSucursal[String(aulaId)] : null;
          const sucursalId =
            h.sucursal_id ?? h.id_sucursal ?? sucursalInfo?.sucursal_id ?? null;
          const gestionId =
            h.gestion_id ?? h.id_gestion ?? h.gestion?.gestion_id ?? null;

          if (sucursalActiva && String(sucursalId) !== sucursalActiva) return;
          if (gestionActiva && String(gestionId) !== gestionActiva) return;

          const cursoNombre =
            h.curso?.nombre ||
            h.curso_nombre ||
            cursosById[String(cursoId)]?.nombre ||
            "Curso";

          const cursoUpper = String(cursoNombre).toUpperCase();
          if (
            cursoUpper.includes("NO DISPONIBLE") ||
            cursoUpper.includes("BLOQUEADO") ||
            cursoUpper.includes("OCUPADO")
          ) {
            return;
          }

          ensureRow(String(cursoId || cursoNombre), cursoNombre);
        });

        (Array.isArray(inscripcionesData) ? inscripcionesData : []).forEach(
          (item) => {
            const horarioId = item?.horario_id;
            const estudianteId = item?.estudiante_id;
            if (horarioId == null || estudianteId == null) return;

            const horario = horariosById[String(horarioId)];
            if (!horario) return;

            const cursoId =
              horario.curso_id ??
              horario.id_curso ??
              horario.curso?.curso_id ??
              null;
            const aulaId =
              horario.aula_id ??
              horario.id_aula ??
              horario.aula?.aula_id ??
              null;
            const sucursalInfo = aulaId ? aulaToSucursal[String(aulaId)] : null;
            const sucursalId =
              horario.sucursal_id ??
              horario.id_sucursal ??
              sucursalInfo?.sucursal_id ??
              null;
            const gestionId =
              horario.gestion_id ??
              horario.id_gestion ??
              horario.gestion?.gestion_id ??
              null;

            if (sucursalActiva && String(sucursalId) !== sucursalActiva) return;
            if (gestionActiva && String(gestionId) !== gestionActiva) return;

            const cursoNombre =
              horario.curso?.nombre ||
              horario.curso_nombre ||
              cursosById[String(cursoId)]?.nombre ||
              "Curso";

            const cursoUpper = String(cursoNombre).toUpperCase();
            if (
              cursoUpper.includes("NO DISPONIBLE") ||
              cursoUpper.includes("BLOQUEADO") ||
              cursoUpper.includes("OCUPADO")
            ) {
              return;
            }

            const row = ensureRow(String(cursoId || cursoNombre), cursoNombre);
            const studentKey = String(estudianteId);
            row.estudiantesSet.add(studentKey);

            const estado = String(item.estado || "")
              .trim()
              .toUpperCase();
            if (estado === "APROBADO") row.aprobadosSet.add(studentKey);
            if (estado === "REPROBADO") row.reprobadosSet.add(studentKey);
          },
        );

        const detalleRows = Object.values(rowsMap)
          .map((row) => ({
            nombre: row.nombre,
            total_estudiantes: row.estudiantesSet.size,
            aprobados: row.aprobadosSet.size,
            reprobados: row.reprobadosSet.size,
          }))
          .sort((a, b) => {
            if (a.total_estudiantes === 0 && b.total_estudiantes > 0) return 1;
            if (a.total_estudiantes > 0 && b.total_estudiantes === 0) return -1;
            return b.total_estudiantes - a.total_estudiantes;
          });

        setDetalleData(detalleRows);
        setReporteFiltrado({
          total_estudiantes: dataReporte.total_estudiantes || 0,
          aprobados: dataReporte.aprobados || 0,
          reprobados: dataReporte.reprobados || 0,
          porcentaje_aprobados: dataReporte.porcentaje_aprobados || 0,
          porcentaje_reprobados: dataReporte.porcentaje_reprobados || 0,
        });
      } catch (err) {
        setErrorDetalle(err.message);
        setErrorReporte(err.message);
      } finally {
        setLoadingDetalle(false);
        setLoadingReporte(false);
      }
    };

    fetchDetalle();
  }, [filtros]);

  // Función para renderizar gráficos de torta
  const renderPieChart = (data, size = 40) => {
    const total = data.reduce(
      (sum, i) =>
        sum + (typeof i.value === "number" && !isNaN(i.value) ? i.value : 0),
      0,
    );
    if (!total || total <= 0) return null;
    let currentAngle = 0;
    return data.map((item, index) => {
      const value =
        typeof item.value === "number" && !isNaN(item.value) ? item.value : 0;
      if (value <= 0) return null;
      const percentage = (value / total) * 100;
      const angle = (percentage / 100) * 360;
      const largeArcFlag = percentage > 50 ? 1 : 0;
      const x1 = 50 + Math.cos((currentAngle * Math.PI) / 180) * size;
      const y1 = 50 + Math.sin((currentAngle * Math.PI) / 180) * size;
      currentAngle += angle;
      const x2 = 50 + Math.cos((currentAngle * Math.PI) / 180) * size;
      const y2 = 50 + Math.sin((currentAngle * Math.PI) / 180) * size;
      return (
        <path
          key={index}
          d={`M 50 50 L ${x1} ${y1} A ${size} ${size} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
          fill={item.color}
          className="opacity-90 hover:opacity-100"
        />
      );
    });
  };

  // Filtrar datos según los filtros seleccionados
  // Utilidad para mostrar 0 y evitar NaN en la tabla
  const safeNumber = (n) => (typeof n === "number" && !isNaN(n) ? n : 0);
  const safePercent = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const normalizeText = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const datosFiltrados = detalleData.filter((item) => {
    return (
      filtros.busqueda === "" ||
      item.nombre?.toLowerCase().includes(filtros.busqueda.toLowerCase())
    );
  });

  // Agrupar datos por curso usando directamente el reporte por curso
  const cursosPorGestion = (() => {
    const cursosMap = {};

    datosFiltrados.forEach((item) => {
      const nombreCurso = item.nombre || item.curso || "Sin especificar";
      if (nombreCurso === "NO DISPONIBLE") return;

      cursosMap[nombreCurso] = {
        nombre: nombreCurso,
        total_estudiantes: safeNumber(item.total_estudiantes),
        aprobados: safeNumber(item.aprobados),
        reprobados: safeNumber(item.reprobados),
      };
    });

    // Convertir a array y ordenar: primero los con estudiantes, luego los con 0
    return Object.values(cursosMap).sort((a, b) => {
      if (a.total_estudiantes === 0 && b.total_estudiantes > 0) return 1;
      if (a.total_estudiantes > 0 && b.total_estudiantes === 0) return -1;
      return b.total_estudiantes - a.total_estudiantes;
    });
  })();

  // Función para descargar lista de aprobados
  const descargarAprobados = () => {
    const aprobados = datosFiltrados.map((item) => ({
      Sucursal: item.sucursal,
      Curso: item.curso,
      Aprobados: item.aprobados,
      Porcentaje: Math.round((item.aprobados / item.inscritos) * 100) + "%",
    }));

    const csvContent = [
      "Sucursal,Curso,Aprobados,Porcentaje",
      ...aprobados.map(
        (item) =>
          `${item.Sucursal},${item.Curso},${item.Aprobados},${item.Porcentaje}`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `aprobados_umam_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-2">
        <h1 className="text-3xl font-bold text-[#13678A]">REPORTES</h1>
        <button
          onClick={descargarEstudiantesExcel}
          disabled={exportandoExcel}
          className="bg-[#13678A] hover:bg-[#0f546f] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 self-start"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6-14a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 10.586V3z"
              clipRule="evenodd"
            />
          </svg>
          {exportandoExcel
            ? "Generando Excel..."
            : "Descargar datos estudiantes"}
        </button>
      </div>

      {/* Pestañas */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-2 px-4 font-medium ${
            tabActiva === "general"
              ? "text-[#13678A] border-b-2 border-[#13678A]"
              : "text-gray-500"
          }`}
          onClick={() => setTabActiva("general")}
        >
          General
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            tabActiva === "detalle"
              ? "text-[#13678A] border-b-2 border-[#13678A]"
              : "text-gray-500"
          }`}
          onClick={() => setTabActiva("detalle")}
        >
          Detalle
        </button>
      </div>

      {/* Contenido de pestañas */}
      {tabActiva === "general" ? (
        /* Contenido General - Nueva estructura */
        <div className="space-y-8">
          {/* FILA 1: Total Estudiantes Activos */}
          <div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 flex items-center gap-6">
              <div className="bg-[#13678A] text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold shrink-0">
                {loadingEstStats ? "..." : (totalEstudiantesActivos ?? "—")}
              </div>
              <div>
                <p className="text-lg font-semibold text-[#012030]">
                  Total de estudiantes activos
                </p>
                <p className="text-sm text-gray-500">
                  Registros activos en el sistema
                </p>
              </div>
            </div>
          </div>

          {/* FILA 2: Estudiantes por Sucursal + Por Tipo de Curso + Por Tipo (Gestoría/Taller) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Estudiantes por Sucursal */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-[#012030] mb-4">
                Estudiantes por Sucursal
              </h3>
              {loadingEstStats ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded" />
                  ))}
                </div>
              ) : estPorSucursal.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos</p>
              ) : (
                <div className="relative h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {renderPieChart(estPorSucursal, 30)}
                    <circle cx="50" cy="50" r="15" fill="white" />
                  </svg>
                </div>
              )}
              <div className="space-y-2 mt-4">
                {estPorSucursal.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.nombre}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Estudiantes por Tipo de Curso */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-[#012030] mb-4">
                Estudiantes por Tipo de Curso
              </h3>
              {loadingEstStats ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded" />
                  ))}
                </div>
              ) : estudiantesPorCurso.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos</p>
              ) : (
                <>
                  <div className="relative h-40 mb-4">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {renderPieChart(
                        [
                          {
                            nombre: "Taller",
                            value: estudiantesPorCurso
                              .filter((c) =>
                                [
                                  "#0088FE",
                                  "#00C49F",
                                  "#FFBB28",
                                  "#A28CFF",
                                  "#FF6F91",
                                ].includes(c.color),
                              )
                              .reduce((sum, c) => sum + c.value, 0),
                            color: "#0088FE",
                          },
                          {
                            nombre: "Gestoría",
                            value: estudiantesPorCurso
                              .filter((c) => c.color === "#FF8042")
                              .reduce((sum, c) => sum + c.value, 0),
                            color: "#FF8042",
                          },
                        ],
                        30,
                      )}
                      <circle cx="50" cy="50" r="15" fill="white" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        nombre: "Taller",
                        value: estudiantesPorCurso
                          .filter((c) =>
                            [
                              "#0088FE",
                              "#00C49F",
                              "#FFBB28",
                              "#A28CFF",
                              "#FF6F91",
                            ].includes(c.color),
                          )
                          .reduce((sum, c) => sum + c.value, 0),
                        color: "#0088FE",
                      },
                      {
                        nombre: "Gestoría",
                        value: estudiantesPorCurso
                          .filter((c) => c.color === "#FF8042")
                          .reduce((sum, c) => sum + c.value, 0),
                        color: "#FF8042",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.nombre}</span>
                        </div>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Por Tipo (Gestoría / Taller) */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-[#012030] mb-4">
                Por Tipo (Gestoría / Taller)
              </h3>
              {loadingEstStats ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded" />
                  ))}
                </div>
              ) : estPorTipo.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos</p>
              ) : (
                <>
                  <div className="relative h-40 mb-4">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {renderPieChart(estPorTipo, 30)}
                      <circle cx="50" cy="50" r="15" fill="white" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    {estPorTipo.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.nombre}</span>
                        </div>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          {/* FILA 3: Por Género + Por Macro Distrito */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Por Género */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-[#012030] mb-4">
                Por Género
              </h3>
              {loadingEstStats ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded" />
                  ))}
                </div>
              ) : estPorGenero.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos</p>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="relative w-40 h-40 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {renderPieChart(estPorGenero, 30)}
                      <circle cx="50" cy="50" r="15" fill="white" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    {estPorGenero.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.nombre}</span>
                        </div>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Por Macro Distrito */}
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-[#012030] mb-4">
                Por Macro Distrito
              </h3>
              {loadingEstStats ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded" />
                  ))}
                </div>
              ) : estPorMacroDistrito.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos</p>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const maxVal = Math.max(
                      ...estPorMacroDistrito.map((m) => m.value),
                      1,
                    );
                    return estPorMacroDistrito.map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate max-w-[60%]">
                            {item.nombre}
                          </span>
                          <span className="text-gray-600 shrink-0">
                            {item.value}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.round((item.value / maxVal) * 100)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Contenido Detalle */
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-[#012030]">
            Detalle por Sucursal y Curso
          </h2>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gestión
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2"
                value={filtros.gestion}
                onChange={(e) =>
                  setFiltros({ ...filtros, gestion: e.target.value })
                }
              >
                <option value="">Todas</option>
                {gestiones.map((gestion) => (
                  <option key={gestion.id} value={gestion.id}>
                    {gestion.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sucursal
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2"
                value={filtros.sucursal}
                onChange={(e) =>
                  setFiltros({ ...filtros, sucursal: e.target.value })
                }
              >
                <option value="">Todas</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resumen General Filtrado */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Tarjeta Total Estudiantes */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">
                Total Estudiantes
              </h3>
              {loadingReporte ? (
                <div className="animate-pulse h-8 w-3/4 bg-gray-200 rounded mt-2"></div>
              ) : errorReporte ? (
                <p className="text-red-500 text-sm mt-1">{errorReporte}</p>
              ) : (
                <p className="text-2xl font-bold text-[#13678A]">
                  {reporteFiltrado.total_estudiantes}
                </p>
              )}
            </div>

            {/* Tarjeta Aprobados */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">Aprobados</h3>
              {loadingReporte ? (
                <div className="animate-pulse h-8 w-3/4 bg-gray-200 rounded mt-2"></div>
              ) : errorReporte ? (
                <p className="text-red-500 text-sm mt-1">{errorReporte}</p>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {reporteFiltrado.aprobados}
                  </p>
                  <p className="text-xs text-gray-500">
                    {reporteFiltrado.porcentaje_aprobados}% del total
                  </p>
                </div>
              )}
            </div>

            {/* Tarjeta Reprobados */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">Reprobados</h3>
              {loadingReporte ? (
                <div className="animate-pulse h-8 w-3/4 bg-gray-200 rounded mt-2"></div>
              ) : errorReporte ? (
                <p className="text-red-500 text-sm mt-1">{errorReporte}</p>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {reporteFiltrado.reprobados}
                  </p>
                  <p className="text-xs text-gray-500">
                    {reporteFiltrado.porcentaje_reprobados}% del total
                  </p>
                </div>
              )}
            </div>

            {/* Tarjeta Porcentaje Aprobación */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">
                Tasa de Aprobación
              </h3>
              {loadingReporte ? (
                <div className="animate-pulse h-8 w-3/4 bg-gray-200 rounded mt-2"></div>
              ) : errorReporte ? (
                <p className="text-red-500 text-sm mt-1">{errorReporte}</p>
              ) : (
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{
                        width: `${reporteFiltrado.porcentaje_aprobados}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {reporteFiltrado.porcentaje_aprobados}%
                  </span>
                </div>
              )}
            </div>

            {/* Tarjeta Porcentaje Reprobación */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">
                Tasa de Reprobación
              </h3>
              {loadingReporte ? (
                <div className="animate-pulse h-8 w-3/4 bg-gray-200 rounded mt-2"></div>
              ) : errorReporte ? (
                <p className="text-red-500 text-sm mt-1">{errorReporte}</p>
              ) : (
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                    <div
                      className="bg-red-600 h-2.5 rounded-full"
                      style={{
                        width: `${reporteFiltrado.porcentaje_reprobados}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {reporteFiltrado.porcentaje_reprobados}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tabla de Cursos */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-[#012030]">
                Detalle por Curso
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                      Nombre Curso
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">
                      Total Estudiantes
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">
                      Aprobados
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">
                      Reprobados
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">
                      Tasa Aprobación
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">
                      Tasa Reprobación
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDetalle ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Cargando datos...
                      </td>
                    </tr>
                  ) : errorDetalle ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-8 text-center text-red-500"
                      >
                        {errorDetalle}
                      </td>
                    </tr>
                  ) : cursosPorGestion.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        No hay cursos para mostrar
                      </td>
                    </tr>
                  ) : (
                    cursosPorGestion.map((curso, idx) => {
                      const tasaAprobacion = safePercent(
                        curso.aprobados,
                        curso.total_estudiantes,
                      );
                      const tasaReprobacion = safePercent(
                        curso.reprobados,
                        curso.total_estudiantes,
                      );
                      return (
                        <tr
                          key={idx}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {curso.nombre}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700 font-semibold">
                            {curso.total_estudiantes}
                          </td>
                          <td className="px-6 py-4 text-center text-green-600 font-semibold">
                            {curso.aprobados}
                          </td>
                          <td className="px-6 py-4 text-center text-red-600 font-semibold">
                            {curso.reprobados}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                              {tasaAprobacion}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                              {tasaReprobacion}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
