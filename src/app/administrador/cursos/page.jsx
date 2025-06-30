"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function DashboardUMAM() {
  const router = useRouter();
  const [tabActiva, setTabActiva] = useState("general");
  const [filtros, setFiltros] = useState({
    sucursal_id: 1,
    gestion_id: 1,
    curso_id: "",
    profesor_id: "",
  });

  // Estados para los datos
  const [reporteGeneral, setReporteGeneral] = useState(null);
  const [estudiantesPorSucursal, setEstudiantesPorSucursal] = useState([]);
  const [estudiantesPorGestion, setEstudiantesPorGestion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colores para gráficos
  const colors = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  // Función genérica para hacer fetch con autenticación
  const fetchData = async (endpoint, params = {}) => {
    const token = Cookies.get("access_token");

    if (!token) {
      router.push("/login");
      throw new Error("No autenticado");
    }

    try {
      // Construir URL con parámetros
      const url = new URL(`https://api-umam-1.onrender.com${endpoint}`);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== "" && value !== null) {
          url.searchParams.append(key, value);
        }
      });

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Token expirado o inválido
        Cookies.remove("access_token");
        router.push("/login");
        throw new Error("Sesión expirada. Por favor vuelve a iniciar sesión.");
      }

      if (!response.ok) {
        throw new Error(`Error HTTP! estado: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      throw err;
    }
  };

  // Obtener reporte general con filtros actuales
  const fetchReporteGeneral = async () => {
    try {
      const data = await fetchData("/reportes/general", {
        sucursal_id: filtros.sucursal_id,
        gestion_id: filtros.gestion_id,
        curso_id: filtros.curso_id,
        profesor_id: filtros.profesor_id,
      });
      setReporteGeneral(data);
    } catch (err) {
      setError(err.message);
      setReporteGeneral({
        total_estudiantes: 0,
        aprobados: 0,
        reprobados: 0,
        porcentaje_aprobados: 0,
        porcentaje_reprobados: 0,
      });
    }
  };

  // Obtener estudiantes por gestión con filtros actuales
  const fetchEstudiantesPorGestion = async () => {
    try {
      const data = await fetchData("/reportes/por-gestion", {
        sucursal_id: filtros.sucursal_id,
      });

      const transformedData = data.map((item) => ({
        gestion: item.gestion_anio || `Gestión ${item.gestion_id}`,
        estudiantes: item.total_estudiantes || 0,
      }));

      setEstudiantesPorGestion(transformedData);
    } catch (err) {
      setError(err.message);
    }
  };

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    // Verificar autenticación primero
    if (!Cookies.get("access_token")) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchReporteGeneral(),
          fetchEstudiantesPorGestion(),
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filtros, router]);

  // Componente para mostrar estado de autenticación
  const AuthStatus = () => {
    const handleLogout = () => {
      Cookies.remove("access_token");
      router.push("/login");
    };

    return (
      <div className="mb-4 p-4 rounded-lg bg-blue-50 text-blue-800 flex justify-between items-center">
        <p>Autenticado correctamente</p>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-[#13678A] border-b pb-2">
        REPORTES
      </h1>

      {Cookies.get("access_token") && <AuthStatus />}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          {error.includes("Sesión expirada") && (
            <button
              onClick={() => router.push("/login")}
              className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              Ir a login
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#13678A]"></div>
          <span className="ml-3 text-[#13678A]">Cargando datos...</span>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sucursal
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2"
                value={filtros.sucursal_id}
                onChange={(e) =>
                  setFiltros({ ...filtros, sucursal_id: e.target.value })
                }
              >
                <option value="1">Central</option>
                <option value="2">Sur</option>
                <option value="3">Norte</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gestión
              </label>
              <select
                className="w-full border border-gray-300 rounded-md p-2"
                value={filtros.gestion_id}
                onChange={(e) =>
                  setFiltros({ ...filtros, gestion_id: e.target.value })
                }
              >
                <option value="1">I-2023</option>
                <option value="2">II-2023</option>
                <option value="3">I-2024</option>
              </select>
            </div>
          </div>

          {/* Reporte General */}
          {reporteGeneral && (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <h2 className="text-xl font-semibold text-[#012030] mb-4">
                Resumen General
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800">
                    Total Estudiantes
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {reporteGeneral.total_estudiantes}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800">
                    Aprobados
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    {reporteGeneral.aprobados}
                  </p>
                  <p className="text-xs text-green-600">
                    {reporteGeneral.porcentaje_aprobados}%
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-red-800">
                    Reprobados
                  </h3>
                  <p className="text-2xl font-bold text-red-600">
                    {reporteGeneral.reprobados}
                  </p>
                  <p className="text-xs text-red-600">
                    {reporteGeneral.porcentaje_reprobados}%
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Tasa de Éxito
                  </h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {100 - reporteGeneral.porcentaje_reprobados}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Gráfico de estudiantes por gestión */}
          {estudiantesPorGestion.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <h2 className="text-xl font-semibold text-[#012030] mb-4">
                Estudiantes por Gestión
              </h2>
              <div className="space-y-4">
                {estudiantesPorGestion.map((item) => {
                  const total = estudiantesPorGestion.reduce(
                    (sum, i) => sum + i.estudiantes,
                    0
                  );
                  const percentage =
                    total > 0 ? (item.estudiantes / total) * 100 : 0;

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
          )}
        </>
      )}
    </div>
  );
}
