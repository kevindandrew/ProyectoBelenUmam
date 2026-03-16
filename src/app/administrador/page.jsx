"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { usePageTitle } from "@/lib/usePageTitle";

const API_URL = "https://api-umam-1.onrender.com";

const sedes = [
  {
    nombre: "SUCURSAL KOLLASUYO",
    direccion:
      "Av. Kollasuyo, calle Yocumo lado del mercado Mariscal Santa Cruz",
    mapa: "https://maps.app.goo.gl/LnFAsTj6FPakdgo38",
  },
  {
    nombre: "SUCURSAL AUDITORIO DE LAS AMERICAS",
    direccion: "Puente de Las Americas, calle Juan de Vargas, esq. Chichas",
    mapa: "https://maps.app.goo.gl/EmuRTwp5RrvJZUTUA",
  },
  {
    nombre: "SUCURSAL CASA DEL ADULTO MAYOR ZABALETA",
    direccion: "Av. Rene Zavaleta, altura las canchas.",
    mapa: "https://maps.app.goo.gl/8x3FMBKVJXaPfKbcA",
  },
  {
    nombre: "SUCURSAL JUNIN Y CATACORA",
    direccion:
      "Calle Junin esquina Catacora lado Coliseo Asociacion Municipal de Voleibol de La Paz",
    mapa: "https://maps.app.goo.gl/c1QhFdngXtsiaBie9",
  },
];

const departamentos = [
  {
    nombre: "CONTACTO OFICINA CENTRAL",
    detalle:
      "Unidad del Adulto Mayor (Mercado Camacho, junto a la Guardia Municipal).",
    extra: "Horario: Lunes a viernes de 9:00 a 16:00.",
    accion: "79666939 - 72520403",
  },
];

export default function AdminDashboard() {
  usePageTitle("Inicio");
  const [stats, setStats] = useState({
    totalEstudiantes: 0,
    totalFacilitadores: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = Cookies.get("access_token");
        if (!token) {
          throw new Error("No hay token de autenticación");
        }

        // Obtener estudiantes y facilitadores en paralelo
        const [estudiantesRes, facilitadoresRes] = await Promise.all([
          fetch(`${API_URL}/estudiantes/`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${API_URL}/usuarios/?rol_id=3`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!estudiantesRes.ok || !facilitadoresRes.ok) {
          throw new Error("Error al obtener estadísticas");
        }

        const estudiantes = await estudiantesRes.json();
        const facilitadores = await facilitadoresRes.json();

        setStats({
          totalEstudiantes: estudiantes.length || 0,
          totalFacilitadores: facilitadores.length || 0,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">
        Bienvenido al Panel de Administración
      </h1>

      {stats.loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      ) : stats.error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error al cargar estadísticas: {stats.error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card de Estudiantes */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">
                  Total Estudiantes
                </p>
                <p className="text-4xl font-bold mt-2">
                  {stats.totalEstudiantes}
                </p>
              </div>
              <div className="bg-blue-400 bg-opacity-30 rounded-full p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-blue-100 text-sm mt-4">
              Estudiantes registrados en el sistema
            </p>
          </div>

          {/* Card de Facilitadores */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium uppercase tracking-wide">
                  Total Facilitadores
                </p>
                <p className="text-4xl font-bold mt-2">
                  {stats.totalFacilitadores}
                </p>
              </div>
              <div className="bg-green-400 bg-opacity-30 rounded-full p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-green-100 text-sm mt-4">
              Facilitadores activos en el sistema
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              SUCURSALES DE LA UNIVERSIDAD
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sedes.map((sede) => (
              <article
                key={sede.nombre}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <h3 className="mt-3 text-lg font-semibold text-gray-900">
                  {sede.nombre}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{sede.direccion}</p>
                <a
                  href={sede.mapa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-[#13678A] hover:bg-slate-200"
                >
                  Ver ubicacion
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">CONTACTO</h2>

          {departamentos.map((item) => (
            <article
              key={item.nombre}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-gray-900">
                {item.nombre}
              </h3>
              <p className="mt-1 text-xs text-gray-600">{item.detalle}</p>
              <p className="mt-1 text-xs text-gray-500">{item.extra}</p>
              <p className="mt-2 text-xs font-semibold text-[#13678A]">
                {item.accion}
              </p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
