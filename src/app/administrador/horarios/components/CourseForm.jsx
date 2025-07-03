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
}) => {
  const [formData, setFormData] = useState({
    curso_id: "",
    profesor_id: "",
    classroom: "",
    time: "",
    day: "",
  });

  const getClassroomLabel = () => {
    if (!formData.classroom) return "Seleccionar aula";
    const aula = availableClassrooms.find(
      (a) => a.value === formData.classroom
    );
    return aula ? aula.label : `Aula ${formData.classroom}`;
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        curso_id: initialData.curso_id || "",
        profesor_id: initialData.profesor_id || "",
        classroom: initialData.classroom || "", // Usar el aula recibida
        time: initialData.time || timeSlots[0]?.label || "",
        day: initialData.day || days[0]?.id || "",
      });
    }
  }, [initialData, timeSlots, days]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.curso_id || !formData.profesor_id || !formData.classroom) {
      alert("Por favor, completa todos los campos obligatorios");
      return;
    }
    onSubmit(formData);
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

      {/* Profesor */}
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

      {/* Aula (solo lectura) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Aula *
        </label>
        <input
          type="text"
          name="classroom"
          value={getClassroomLabel()}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
        />
        {/* Campo oculto para mantener el valor en el formulario */}
        <input
          type="hidden"
          name="classroom_value"
          value={formData.classroom}
        />
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
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeSlots.map((time) => (
              <option key={time.id} value={time.label}>
                {time.label}
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
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {days.map((day) => (
              <option key={day.id} value={day.id}>
                {day.name}
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
          {"Guardar Curso"}
        </button>
      </div>
    </form>
  );
};

export default CourseForm;
