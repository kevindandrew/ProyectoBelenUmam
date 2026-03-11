"use client";
import React, { useState, useEffect } from "react";

const CourseForm = ({
  onSubmit,
  onCancel,
  initialData,
  timeSlots,
  days,
  availableClassrooms,
  availableSubjects = [],
  availableProfessors = [],
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState({
    curso_id: "",
    profesor_id: "",
    classroom: "",
    schedules: [], // Array de {day, time}
    is_unavailable: false,
  });

  const getClassroomLabel = () => {
    if (!formData.classroom) return "Seleccionar aula";
    const aula = availableClassrooms.find(
      (a) => a.value === formData.classroom,
    );
    return aula ? aula.label : `Aula ${formData.classroom}`;
  };

  useEffect(() => {
    if (initialData) {
      // Si viene de clic en celda, pre-cargar el horario
      const initialSchedules =
        initialData.days && initialData.time
          ? initialData.days.map((day) => ({ day, time: initialData.time }))
          : [];

      setFormData({
        curso_id: initialData.curso_id || "",
        profesor_id: initialData.profesor_id || "",
        classroom: initialData.classroom || "",
        schedules: initialSchedules,
        is_unavailable: initialData.is_unavailable || false,
      });
    }
  }, [initialData, timeSlots, days]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addSchedule = () => {
    if (timeSlots.length === 0 || days.length === 0) return;

    setFormData((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        { day: days[0].id, time: timeSlots[0].label },
      ],
    }));
  };

  const removeSchedule = (index) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }));
  };

  const updateSchedule = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.map((schedule, i) =>
        i === index ? { ...schedule, [field]: value } : schedule,
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Si es "No disponible", no necesitamos curso ni profesor
    if (
      !formData.is_unavailable &&
      (!formData.curso_id || !formData.profesor_id)
    ) {
      alert("Por favor, completa todos los campos obligatorios");
      return;
    }
    if (!formData.classroom) {
      alert("Por favor, selecciona un aula");
      return;
    }
    // Validar que al menos un horario esté configurado
    if (formData.schedules.length === 0) {
      alert("Por favor, agrega al menos un horario (día + hora)");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {isEditMode ? "Editar Horario" : "Agregar Nuevo Curso"}
      </h3>

      {/* NOTA: Opción "No Disponible" temporalmente deshabilitada 
          El backend requiere que se cree un curso/profesor especial para esto */}
      {/* Checkbox: Marcar como No Disponible */}
      {false && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <input
            type="checkbox"
            id="is_unavailable"
            checked={formData.is_unavailable}
            onChange={(e) =>
              setFormData({ ...formData, is_unavailable: e.target.checked })
            }
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="is_unavailable"
            className="text-sm font-medium text-gray-700"
          >
            Marcar este horario como NO DISPONIBLE
          </label>
        </div>
      )}

      {/* Mostrar mensaje explicativo si está marcado como no disponible */}
      {formData.is_unavailable && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ℹ️ Este horario se marcará como no disponible (ocupado por otra
            actividad, mantenimiento, etc.)
          </p>
        </div>
      )}

      {/* Materia (oculto si es "No disponible") */}
      {!formData.is_unavailable && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Materia *
          </label>
          <select
            name="curso_id"
            value={formData.curso_id}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar materia</option>
            {availableSubjects.map((subject) => (
              <option key={subject.curso_id} value={subject.curso_id}>
                {subject.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Profesor (oculto si es "No disponible") */}
      {!formData.is_unavailable && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profesor *
          </label>
          <select
            name="profesor_id"
            value={formData.profesor_id}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar profesor</option>
            {availableProfessors.map((professor) => (
              <option key={professor.usuario_id} value={professor.usuario_id}>
                {professor.nombres +
                  " " +
                  (professor.ap_paterno || "") +
                  " " +
                  (professor.ap_materno || "")}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Aula */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Aula *
        </label>
        {isEditMode ? (
          <select
            name="classroom"
            value={formData.classroom}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar aula</option>
            {availableClassrooms.map((aula) => (
              <option key={aula.value} value={aula.value}>
                {aula.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={getClassroomLabel()}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
          />
        )}
      </div>

      {/* Horarios * (Día + Hora) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Horarios * (Día + Hora)
          </label>
          <button
            type="button"
            onClick={addSchedule}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Agregar Horario
          </button>
        </div>

        {formData.schedules.length === 0 ? (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-md text-center">
            <p className="text-sm text-gray-500">
              Haz clic en "+ Agregar Horario" para agregar un día y hora
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.schedules.map((schedule, index) => (
              <div
                key={index}
                className="flex gap-2 items-start p-3 border border-gray-200 rounded-md bg-gray-50"
              >
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {/* Selector de Día */}
                  <select
                    value={schedule.day}
                    onChange={(e) =>
                      updateSchedule(index, "day", parseInt(e.target.value))
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {days.map((day) => (
                      <option key={day.id} value={day.id}>
                        {day.name}
                      </option>
                    ))}
                  </select>

                  {/* Selector de Hora */}
                  <select
                    value={schedule.time}
                    onChange={(e) =>
                      updateSchedule(index, "time", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {timeSlots.map((time) => (
                      <option key={time.id} value={time.label}>
                        {time.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botón Eliminar */}
                <button
                  type="button"
                  onClick={() => removeSchedule(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  title="Eliminar horario"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {formData.schedules.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {formData.schedules.length} horario(s) configurado(s)
          </p>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {isEditMode ? "Actualizar Horario" : "Guardar Curso"}
        </button>
      </div>
    </form>
  );
};

export default CourseForm;
