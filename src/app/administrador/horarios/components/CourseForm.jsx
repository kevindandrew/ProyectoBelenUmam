"use client";
import React, { useState, useEffect } from "react";

const CourseForm = ({
  onSubmit,
  onCancel,
  initialData,
  timeSlots,
  days,
  availableClassrooms,
  availableSubjects = [], // Valor por defecto para evitar errores
  availableProfessors = [], // Valor por defecto
}) => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    subject: "",
    professor: "",
    classroom:
      initialData?.classroom?.value || availableClassrooms[0]?.value || "",
    time: initialData?.time || timeSlots[0]?.label || timeSlots[0],
    day: initialData?.day || days[0]?.name || days[0],
    curso_id: initialData?.curso_id || "",
    profesor_id: initialData?.profesor_id || "",
  });

  // Efecto para actualizar datos iniciales
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        classroom: initialData.classroom?.value || prev.classroom,
        time: initialData.time || prev.time,
        day: initialData.day || prev.day,
      }));
    }
  }, [initialData]);

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.subject && formData.professor && formData.classroom) {
      // Encontrar IDs correspondientes para curso y profesor
      const cursoSeleccionado = availableSubjects.find(
        (subj) => subj.nombre_curso === formData.subject
      );
      const profesorSeleccionado = availableProfessors.find(
        (prof) => prof.nombre_completo === formData.professor
      );

      onSubmit({
        ...formData,
        curso_id: cursoSeleccionado?.curso_id || "",
        profesor_id: profesorSeleccionado?.profesor_id || "",
      });
    }
  };

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {initialData ? "Editar Curso" : "Agregar Nuevo Curso"}
      </h3>

      {/* Materia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Materia *
        </label>
        <select
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccionar materia</option>
          {availableSubjects.map((subject) => (
            <option key={subject.curso_id} value={subject.nombre}>
              {subject.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Profesor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profesor *
        </label>
        <select
          name="professor"
          value={formData.professor}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccionar profesor</option>
          {availableProfessors.map((professor) => (
            <option key={professor.usuario_id} value={professor.nombres}>
              {professor.nombres}
            </option>
          ))}
        </select>
      </div>

      {/* Aula */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Aula *
        </label>
        <select
          name="classroom"
          value={formData.classroom}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccionar aula</option>
          {availableClassrooms.map((classroom) => (
            <option key={classroom.value} value={classroom.value}>
              {classroom.label}
            </option>
          ))}
        </select>
      </div>

      {/* Horario y Día */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Horario
          </label>
          <select
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeSlots.map((time) => (
              <option key={time.id || time} value={time.label || time}>
                {time.label || time}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Día
          </label>
          <select
            name="day"
            value={formData.day}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {days.map((day) => (
              <option key={day.id || day} value={day.name || day}>
                {day.name || day}
              </option>
            ))}
          </select>
        </div>
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
          {initialData ? "Actualizar Curso" : "Guardar Curso"}
        </button>
      </div>
    </form>
  );
};

export default CourseForm;
