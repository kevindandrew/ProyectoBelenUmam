"use client";
import { usePageTitle } from "@/lib/usePageTitle";

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

const contacto = {
  nombre: "Contactanos",
  detalle:
    "OFICINA CENTRAL: Unidad del Adulto Mayor (Mercado Camacho, junto a la Guardia Municipal).",
  extra: "Horario: Lunes a viernes, de 9:00 a 16:00.",
  accion: "79666939 - 72520403",
};

const contactos = [
  {
    nombre: "CONTACTO OFICINA CENTRAL",
    detalle:
      "Unidad del Adulto Mayor (Mercado Camacho, junto a la Guardia Municipal).",
    extra: "Horario: Lunes a viernes de 9:00 a 16:00.",
    accion: "79666939 - 72520403",
  },
  {
    nombre: "SOPORTE TÉCNICO",
    detalle: "Para problemas técnicos o consultas sobre el sistema.",
    extra: "Disponible de lunes a viernes de 9:00 a 16:00.",
    accion: "+591 67192700 (WhatsApp)",
  },
];

export default function FacilitadorDashboard() {
  usePageTitle("Inicio");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-[#0f4c6e] via-[#13678A] to-[#1f8bb1] p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Panel del Facilitador</h1>
        <p className="mt-2 text-sm text-cyan-100">
          Bienvenido al panel del facilitador. Aquí puedes gestionar tus cursos,
          ver las listas de estudiantes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            SUCURSALES DE LA UNIVERSIDAD
          </h2>

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
          {contactos.map((item) => (
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
