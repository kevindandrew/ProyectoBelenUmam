"use client";
import React, { useState, useEffect } from "react";

const CourseForm = ({
  onSubmit,
  onCancel,
  initialData,
  timeSlots,
  days,
  availableClassrooms,
}) => {
  const [formData, setFormData] = useState({
    subject: "",
    professor: "",
    classroom: availableClassrooms[0] || "",
    time: initialData?.time || timeSlots[0],
    day: initialData?.day || days[0],
  });

  // Lista de materias disponibles
  const availableSubjects = [
    "Matemáticas",
    "Física",
    "Química",
    "Biología",
    "Historia",
    "Geografía",
    "Literatura",
    "Inglés",
    "Francés",
    "Filosofía",
    "Psicología",
    "Economía",
    "Contabilidad",
    "Informática",
    "Programación",
    "Base de Datos",
    "Redes",
    "Estadística",
    "Cálculo",
    "Álgebra",
    "Geometría",
    "Arte",
    "Música",
    "Educación Física",
    "Dioses",
  ];

  // Lista de profesores disponibles
  const availableProfessors = [
    "Dr. Juan Pérez",
    "Dra. Ana Gómez",
    "Lic. Luis Martínez",
    "Ing. María Rodriguez",
    "Prof. Carlos López",
    "Dra. Elena Vargas",
    "Lic. Roberto Silva",
    "Ing. Patricia Morales",
    "Prof. Diego Herrera",
    "Dra. Carmen Jiménez",
    "Lic. Fernando Castro",
    "Ing. Lucía Mendoza",
    "Prof. Andrés Ruiz",
    "Dra. Sofía Delgado",
    "Lic. Miguel Torres",
  ];

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        time: initialData.time,
        day: initialData.day,
      }));
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.subject && formData.professor && formData.classroom) {
      onSubmit(formData);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Agregar Nuevo Curso
        </h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Materia *
        </label>
        <select
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Seleccionar materia</option>
          {availableSubjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profesor *
        </label>
        <select
          name="professor"
          value={formData.professor}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Seleccionar profesor</option>
          {availableProfessors.map((professor) => (
            <option key={professor} value={professor}>
              {professor}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Aula *
        </label>
        <select
          name="classroom"
          value={formData.classroom}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Seleccionar aula</option>
          {availableClassrooms.map((classroom) => (
            <option key={classroom} value={classroom}>
              {classroom}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Horario
          </label>
          <select
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {timeSlots.map((time) => (
              <option key={time} value={time}>
                {time}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Guardar Curso
        </button>
      </div>
    </form>
  );
};

export default CourseForm;
