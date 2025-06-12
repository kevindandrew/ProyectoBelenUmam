"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function ModalInscripcionAlumno({
  estudiante,
  isOpen,
  onClose,
}) {
  const [sucursales, setSucursales] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [gestionActual, setGestionActual] = useState(null);
  const [filas, setFilas] = useState([]);
  const API = "https://api-umam-1.onrender.com"; // o tu endpoint real

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      const token = Cookies.get("access_token");
      try {
        const [sRes, cRes, hRes, gRes] = await Promise.all([
          fetch(`${API}/sucursales/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API}/cursos/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API}/horarios/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API}/cursos/gestiones`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!sRes.ok || !cRes.ok || !hRes.ok || !gRes.ok) {
          throw new Error("Uno de los endpoints devolvió error");
        }

        const [sData, cData, hData, gData] = await Promise.all([
          sRes.json(),
          cRes.json(),
          hRes.json(),
          gRes.json(),
        ]);

        setSucursales(sData);
        setCursos(cData);
        setHorarios(hData);
        const gest = gData.find((g) => g.activo) || gData[0];
        setGestionActual(gest?.gestion_id);
        setFilas([]);
      } catch (err) {
        console.error("Error cargando datos:", err);
        alert(
          "No se pudieron cargar los datos. Verifica que el token sea válido y la API esté activa."
        );
      }
    };

    load();
  }, [isOpen]);

  const agregarFila = (tipo) => {
    setFilas([...filas, { tipo, sucursal: null, curso: null, horario: null }]);
  };

  const actualizarFila = (i, campo, valor) => {
    const nueva = [...filas];
    nueva[i][campo] = valor;
    if (campo === "sucursal") nueva[i].curso = nueva[i].horario = null;
    if (campo === "curso") nueva[i].horario = null;
    setFilas(nueva);
  };

  const handleGuardar = async () => {
    const token = Cookies.get("access_token");
    try {
      await Promise.all(
        filas.map((f) =>
          fetch("/inscripciones/", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              estudiante_id: estudiante.estudiante_id,
              horario_id: f.horario,
              gestion_id: gestionActual,
            }),
          })
        )
      );
      alert("Inscripciones exitosas");
      onClose();
    } catch (e) {
      console.error(e);
      alert("Error al guardar inscripciones");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-black"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4">
          Inscribir Cursos - {estudiante.nombres} {estudiante.ap_paterno}
        </h2>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => agregarFila(false)}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            + Taller
          </button>
          <button
            onClick={() => agregarFila(true)}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            + Gestoría
          </button>
        </div>
        <div className="space-y-4">
          {filas.map((f, i) => {
            const cursosSucursal = cursos.filter(
              (c) => c.sucursal_id === f.sucursal
            );
            const horariosDisponibles = horarios.filter(
              (h) =>
                h.curso_id === f.curso &&
                h.sucursal_id === f.sucursal &&
                h.gestion_id === gestionActual &&
                h.activo
            );
            return (
              <div key={i} className="flex gap-2 items-end">
                <select
                  className="border p-2 rounded flex-1"
                  value={f.sucursal ?? ""}
                  onChange={(e) =>
                    actualizarFila(i, "sucursal", Number(e.target.value))
                  }
                >
                  <option value="" disabled>
                    Seleccionar Sucursal
                  </option>
                  {sucursales.map((s) => (
                    <option key={s.sucursal_id} value={s.sucursal_id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
                <select
                  className="border p-2 rounded flex-2"
                  value={f.curso ?? ""}
                  disabled={!f.sucursal}
                  onChange={(e) =>
                    actualizarFila(i, "curso", Number(e.target.value))
                  }
                >
                  <option value="" disabled>
                    Seleccionar {f.tipo ? "Gestoría" : "Taller"}
                  </option>
                  {cursosSucursal
                    .filter((c) => Boolean(c.gestoria) === Boolean(f.tipo))
                    .map((c) => (
                      <option key={c.curso_id} value={c.curso_id}>
                        {c.nombre}
                      </option>
                    ))}
                </select>
                <select
                  className="border p-2 rounded flex-2"
                  value={f.horario ?? ""}
                  disabled={!f.curso}
                  onChange={(e) =>
                    actualizarFila(i, "horario", Number(e.target.value))
                  }
                >
                  <option value="" disabled>
                    Seleccionar Horario
                  </option>
                  {horariosDisponibles.map((h) => (
                    <option key={h.horario_id} value={h.horario_id}>
                      {h.dias_clase
                        .map((d) => d.dia_semana.dia_semana)
                        .join(", ")}{" "}
                      {h.dias_clase[0]?.hora.hora_inicio.slice(0, 5)}-
                      {h.dias_clase[0]?.hora.hora_fin.slice(0, 5)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setFilas(filas.filter((_, idx) => idx !== i))}
                  className="text-red-600"
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
