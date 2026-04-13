"use client";
import React, { useState, useEffect } from "react";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "react-toastify";

const TransferirHorarioForm = ({
  course,
  rawHorario,
  sucursales,
  classroomsBySucursal,
  availableProfessors,
  days,
  timeSlots,
  onLoadAulas,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [selectedSucursal, setSelectedSucursal] = useState("");
  const [selectedAula, setSelectedAula] = useState("");
  const [selectedProfesor, setSelectedProfesor] = useState("");
  const [cambiarDias, setCambiarDias] = useState(false);
  const [nuevasDias, setNuevasDias] = useState([]);

  // Pre-cargar días actuales del horario
  useEffect(() => {
    if (rawHorario?.dias_clase) {
      setNuevasDias(
        rawHorario.dias_clase.map((d) => ({
          dia_semana_id: d.dia_semana.dias_semana_id,
          hora_id: d.hora.hora_id,
        })),
      );
    }
  }, [rawHorario]);

  // Cargar aulas cuando cambia la sucursal destino
  useEffect(() => {
    if (selectedSucursal && !classroomsBySucursal[selectedSucursal]) {
      onLoadAulas(selectedSucursal);
    }
    setSelectedAula("");
  }, [selectedSucursal]);

  const aulaOptions = selectedSucursal
    ? classroomsBySucursal[selectedSucursal] || []
    : [];

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedAula) {
      toast.warning("Seleccione un aula de destino");
      return;
    }

    const payload = {
      aula_id: parseInt(selectedAula),
    };

    if (selectedProfesor) {
      payload.profesor_id = parseInt(selectedProfesor);
    }

    if (cambiarDias) {
      if (nuevasDias.length === 0) {
        toast.warning("Agrega al menos un día/hora si quieres cambiar el horario");
        return;
      }
      payload.dias_clase = nuevasDias;
    }

    onSubmit(payload);
  };

  const addDia = () => {
    setNuevasDias((prev) => [
      ...prev,
      {
        dia_semana_id: days[0]?.id ?? 1,
        hora_id: timeSlots[0]?.id ?? 1,
      },
    ]);
  };

  const removeDia = (index) => {
    setNuevasDias((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDia = (index, field, value) => {
    setNuevasDias((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: parseInt(value) } : d)),
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <ArrowRightLeft size={20} className="text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Transferir Horario a Otra Aula
        </h3>
      </div>

      {/* Info del horario actual */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-600 uppercase mb-2">
          Horario actual
        </p>
        <p className="text-sm font-bold text-gray-900">{course?.subject}</p>
        <p className="text-sm text-gray-600 mb-1">{course?.professor}</p>
        {rawHorario?.dias_clase?.map((d, i) => (
          <p key={i} className="text-xs text-gray-500">
            {d.dia_semana.dia_semana} &middot;{" "}
            {d.hora.hora_inicio.slice(0, 5)} – {d.hora.hora_fin.slice(0, 5)}{" "}
            &middot; Aula {d.aula_id}
          </p>
        ))}
      </div>

      {/* Sucursal destino */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sucursal destino *
        </label>
        <select
          value={selectedSucursal}
          onChange={(e) => setSelectedSucursal(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Seleccionar sucursal</option>
          {sucursales.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          También puedes elegir la misma sucursal para cambiar solo de aula.
        </p>
      </div>

      {/* Aula destino */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Aula destino *
        </label>
        <select
          value={selectedAula}
          onChange={(e) => setSelectedAula(e.target.value)}
          required
          disabled={!selectedSucursal}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">Seleccionar aula</option>
          {aulaOptions.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        {selectedSucursal && aulaOptions.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">Cargando aulas...</p>
        )}
      </div>

      {/* Profesor (opcional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profesor{" "}
          <span className="text-gray-400 font-normal">
            (opcional — conserva el actual si no seleccionas)
          </span>
        </label>
        <select
          value={selectedProfesor}
          onChange={(e) => setSelectedProfesor(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Conservar profesor actual</option>
          {availableProfessors.map((p) => (
            <option key={p.usuario_id} value={p.usuario_id}>
              {p.nombres} {p.ap_paterno || ""} {p.ap_materno || ""}
            </option>
          ))}
        </select>
      </div>

      {/* Días/Horas (opcional) */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id="cambiarDias"
            checked={cambiarDias}
            onChange={(e) => setCambiarDias(e.target.checked)}
            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
          />
          <label
            htmlFor="cambiarDias"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Cambiar días/horas del horario
          </label>
        </div>

        {cambiarDias && (
          <div className="space-y-2 p-3 bg-gray-50 rounded-md border border-gray-200">
            {nuevasDias.map((d, i) => (
              <div key={i} className="flex gap-2 items-center">
                {/* Día */}
                <select
                  value={d.dia_semana_id}
                  onChange={(e) => updateDia(i, "dia_semana_id", e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {days.map((day) => (
                    <option key={day.id} value={day.id}>
                      {day.name}
                    </option>
                  ))}
                </select>

                {/* Hora */}
                <select
                  value={d.hora_id}
                  onChange={(e) => updateDia(i, "hora_id", e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.label}
                    </option>
                  ))}
                </select>

                {/* Eliminar fila */}
                <button
                  type="button"
                  onClick={() => removeDia(i)}
                  className="px-2 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addDia}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              + Agregar día/hora
            </button>
          </div>
        )}

        {!cambiarDias && (
          <p className="text-xs text-gray-400 mt-1">
            Si no marcas esta opción, se conservan los días y horas actuales.
          </p>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !selectedAula}
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Transfiriendo...
            </>
          ) : (
            <>
              <ArrowRightLeft size={16} />
              Transferir Clase
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TransferirHorarioForm;
