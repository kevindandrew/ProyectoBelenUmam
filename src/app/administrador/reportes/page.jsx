// src/app/administrador/reportes/page.jsx
"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export default function DashboardUMAM() {
  // Filtros dinámicos (moved inside component)
  const [sucursales, setSucursales] = useState([]);
  const [gestiones, setGestiones] = useState([]);
  const [añosAcademicos, setAñosAcademicos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [gestorias, setGestorias] = useState([]);

  // Gráficos dinámicos (moved inside component)
  const [estudiantesPorSucursal, setEstudiantesPorSucursal] = useState([]);
  const [estudiantesPorGestion, setEstudiantesPorGestion] = useState([]);
  const [estudiantesPorCurso, setEstudiantesPorCurso] = useState([]);
  const [facilitadoresPorGestion, setFacilitadoresPorGestion] = useState([]);

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
            "Sesión expirada. Por favor vuelve a iniciar sesión."
          );
          setLoadingGeneral(false);
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        setSucursales(Array.isArray(data) ? data.map((s) => s.nombre) : []);
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
            "Sesión expirada. Por favor vuelve a iniciar sesión."
          );
          setLoadingGeneral(false);
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        setGestiones(Array.isArray(data) ? data.map((g) => g.gestion) : []);
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
            "Sesión expirada. Por favor vuelve a iniciar sesión."
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
            "Sesión expirada. Por favor vuelve a iniciar sesión."
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
          setTalleres(data.filter((c) => !c.gestoria).map((c) => c.nombre));
          setGestorias(data.filter((c) => c.gestoria).map((c) => c.nombre));
        } else {
          setCursos([]);
          setTalleres([]);
          setGestorias([]);
        }
      });
    // Gráficos
    fetch("https://api-umam-1.onrender.com/reportes/por-sucursal", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          Cookies.remove("access_token");
          Cookies.remove("token");
          setErrorGeneral(
            "Sesión expirada. Por favor vuelve a iniciar sesión."
          );
          setLoadingGeneral(false);
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        // Colores diferenciados para cada sucursal
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
            : []
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
            "Sesión expirada. Por favor vuelve a iniciar sesión."
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
            : []
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
            "Sesión expirada. Por favor vuelve a iniciar sesión."
          );
          setLoadingGeneral(false);
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        // Filtrar solo talleres y gestorías, y asignar colores diferenciados
        // Necesitamos saber si es taller o gestoria, así que cruzamos con cursos
        fetch("https://api-umam-1.onrender.com/cursos/", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((cursosData) => {
            if (!Array.isArray(cursosData)) return;
            // Colores alternos para talleres y gestorías
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
                  .filter((c) => cursosMap[c.nombre] !== undefined) // Solo cursos válidos
                  .filter(
                    (c) =>
                      cursosMap[c.nombre] === true ||
                      cursosMap[c.nombre] === false
                  ) // Solo talleres o gestorías
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
            "Sesión expirada. Por favor vuelve a iniciar sesión."
          );
          setLoadingGeneral(false);
          return { error: true };
        }
        return r.json();
      })
      .then((data) => {
        if (!data || data.error) return;
        // Mostrar solo las últimas 4 gestiones creadas (por fecha/orden)
        let gestionesFiltradas = Array.isArray(data)
          ? data
              .filter(
                (f) =>
                  typeof f.gestion_id === "string" ||
                  typeof f.gestion_id === "number"
              )
              .sort((a, b) => {
                // Si hay fecha, usarla; si no, usar nombre como string
                if (a.fecha && b.fecha) {
                  return new Date(b.fecha) - new Date(a.fecha);
                }
                // Si gestion_id es número, comparar como número
                if (!isNaN(a.gestion_id) && !isNaN(b.gestion_id)) {
                  return Number(b.gestion_id) - Number(a.gestion_id);
                }
                // Si gestion_id es string, comparar como string
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

  // Fetch detalle cada vez que cambian los filtros
  useEffect(() => {
    const fetchDetalle = async () => {
      setLoadingDetalle(true);
      setErrorDetalle(null);
      // Usa el nombre correcto de la cookie
      const token = Cookies.get("access_token") || Cookies.get("token");
      if (!token) {
        setErrorDetalle("No hay token de autenticación. Inicia sesión.");
        setLoadingDetalle(false);
        return;
      }
      try {
        // Construir query params según filtros
        const params = new URLSearchParams();
        if (filtros.sucursal) params.append("sucursal", filtros.sucursal);
        if (filtros.gestion) params.append("gestion", filtros.gestion);
        if (filtros.curso) params.append("curso", filtros.curso);
        if (filtros.año) params.append("anio", filtros.año);
        // Puedes ajustar los nombres de los parámetros según tu API
        const url = `https://api-umam-1.onrender.com/reportes/por-sucursal?${params.toString()}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (res.status === 401) {
          Cookies.remove("access_token");
          Cookies.remove("token");
          setErrorDetalle(
            "Sesión expirada. Por favor vuelve a iniciar sesión."
          );
          setLoadingDetalle(false);
          return;
        }
        if (!res.ok) throw new Error("Error al obtener detalle");
        const data = await res.json();
        setDetalleData(Array.isArray(data) ? data : []);
      } catch (err) {
        setErrorDetalle(err.message);
      } finally {
        setLoadingDetalle(false);
      }
    };
    fetchDetalle();
  }, [filtros]);

  // Función para renderizar gráficos de torta
  const renderPieChart = (data, size = 40) => {
    const total = data.reduce(
      (sum, i) =>
        sum + (typeof i.value === "number" && !isNaN(i.value) ? i.value : 0),
      0
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
  const datosFiltrados = detalleData.filter((item) => {
    return (
      (filtros.gestion === "" || item.gestion === filtros.gestion) &&
      (filtros.sucursal === "" || item.sucursal?.includes(filtros.sucursal)) &&
      (filtros.curso === "" || item.curso?.includes(filtros.curso)) &&
      (filtros.busqueda === "" ||
        item.sucursal?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        item.curso?.toLowerCase().includes(filtros.busqueda.toLowerCase()))
    );
  });

  // Utilidad para mostrar 0 y evitar NaN en la tabla
  const safeNumber = (n) => (typeof n === "number" && !isNaN(n) ? n : 0);
  const safePercent = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

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
          `${item.Sucursal},${item.Curso},${item.Aprobados},${item.Porcentaje}`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `aprobados_umam_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-[#13678A] border-b pb-2">
        REPORTES
      </h1>

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
        /* Contenido General */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Estudiantes por Sucursal */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-[#012030] mb-4">
              Estudiantes por Sucursal
            </h2>
            <div className="flex flex-col md:flex-row items-center">
              <div className="relative w-48 h-48 mb-4 md:mb-0 md:mr-4">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {renderPieChart(estudiantesPorSucursal, 40)}
                  <circle cx="50" cy="50" r="15" fill="white" />
                </svg>
              </div>
              <div className="space-y-2">
                {estudiantesPorSucursal.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">
                      {item.nombre}:{" "}
                      <span className="font-medium">{item.value}</span> (
                      {Math.round(
                        (item.value /
                          estudiantesPorSucursal.reduce(
                            (sum, i) => sum + i.value,
                            0
                          )) *
                          100
                      )}
                      %)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Estudiantes por Gestión */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-[#012030] mb-4">
              Estudiantes por Gestión
            </h2>
            <div className="space-y-4">
              {estudiantesPorGestion.map((item) => {
                const percentage = (item.estudiantes / 600) * 100;
                return (
                  <div key={item.gestion}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.gestion}</span>
                      <span className="text-gray-600">
                        {item.estudiantes} estudiantes
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-[#13678A] h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {Math.round(percentage)}% del total
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Estudiantes por Curso */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-[#012030] mb-4">
              Estudiantes por Tipo de Curso
            </h2>
            <div className="relative h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {renderPieChart(
                  [
                    {
                      nombre: "Taller",
                      value: estudiantesPorCurso
                        .filter((c) => {
                          return (
                            c.color === "#0088FE" ||
                            c.color === "#00C49F" ||
                            c.color === "#FFBB28" ||
                            c.color === "#A28CFF" ||
                            c.color === "#FF6F91"
                          );
                        })
                        .reduce((sum, c) => sum + c.value, 0),
                      color: "#0088FE",
                    },
                    {
                      nombre: "Gestoría",
                      value: estudiantesPorCurso
                        .filter((c) => {
                          return c.color === "#FF8042";
                        })
                        .reduce((sum, c) => sum + c.value, 0),
                      color: "#FF8042",
                    },
                  ],
                  30
                )}
                <circle cx="50" cy="50" r="15" fill="white" />
              </svg>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {[
                {
                  nombre: "Taller",
                  value: estudiantesPorCurso
                    .filter(
                      (c) =>
                        c.color === "#0088FE" ||
                        c.color === "#00C49F" ||
                        c.color === "#FFBB28" ||
                        c.color === "#A28CFF" ||
                        c.color === "#FF6F91"
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
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs">
                    {item.nombre} ({item.value})
                  </span>
                </div>
              ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
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
                  <option key={gestion} value={gestion}>
                    {gestion}
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
                  <option key={sucursal} value={sucursal}>
                    {sucursal}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Curso
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2"
                value={filtros.curso}
                onChange={(e) =>
                  setFiltros({ ...filtros, curso: e.target.value })
                }
              >
                <option value="">Todos</option>
                <optgroup label="Talleres">
                  {talleres.map((taller) => (
                    <option key={taller} value={taller}>
                      {taller}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Gestorías">
                  {gestorias.map((gestoria) => (
                    <option key={gestoria} value={gestoria}>
                      {gestoria}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Buscar por sucursal o curso..."
                value={filtros.busqueda}
                onChange={(e) =>
                  setFiltros({ ...filtros, busqueda: e.target.value })
                }
              />
            </div>
          </div>

          {/* Tabla de resultados */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sucursal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Curso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inscritos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aprobados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Aprobación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reprobados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Abandonos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingDetalle ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm">
                        Cargando...
                      </td>
                    </tr>
                  ) : errorDetalle ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-4 text-center text-sm text-red-500"
                      >
                        {errorDetalle}
                      </td>
                    </tr>
                  ) : datosFiltrados.length > 0 ? (
                    datosFiltrados.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.sucursal || ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.curso || ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {safeNumber(item.inscritos)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {safeNumber(item.aprobados)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {safePercent(item.aprobados, item.inscritos)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {safeNumber(item.reprobados)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {safeNumber(item.abandonos)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No se encontraron resultados con los filtros
                        seleccionados
                      </td>
                    </tr>
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
