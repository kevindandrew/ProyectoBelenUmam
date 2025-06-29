"use client";
import React, { useState, useEffect } from "react";
import { Download, Plus, Calendar } from "lucide-react";
import Dropdown from "./Dropdown";
import ScheduleTable from "./ScheduleTable";
import Modal from "./Modal";
import CourseForm from "./CourseForm";
import GestionForm from "./GestionForm";
import { fetchWithAuth } from "../utils/api";

const SchedulePage = () => {
  const [gestiones, setGestiones] = useState([]);
  const [selectedGestion, setSelectedGestion] = useState({
    value: "",
    label: "Seleccione una gestión",
  });
  const [loadingGestiones, setLoadingGestiones] = useState(true);
  const [errorGestiones, setErrorGestiones] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [loadingSucursales, setLoadingSucursales] = useState(true);
  const [errorSucursales, setErrorSucursales] = useState(null);
  const [classroomsBySucursal, setClassroomsBySucursal] = useState({});
  const [timeSlots, setTimeSlots] = useState([]);
  const [days, setDays] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGestionModalOpen, setIsGestionModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [courseFormData, setCourseFormData] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableProfessors, setAvailableProfessors] = useState([]);

  const formatTimeSlot = (hora) =>
    `${hora.hora_inicio.slice(0, 5)} - ${hora.hora_fin.slice(0, 5)}`;

  const fetchDays = async () => {
    try {
      const data = await fetchWithAuth(
        "https://api-umam-1.onrender.com/horarios/dias-semana"
      );
      setDays(
        data.map((dia) => ({ id: dia.dia_semana_id, name: dia.dia_semana }))
      );
    } catch (error) {
      console.error("Error cargando días:", error);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const data = await fetchWithAuth(
        "https://api-umam-1.onrender.com/horarios/horas"
      );
      setTimeSlots(
        data.map((h) => ({ id: h.hora_id, label: formatTimeSlot(h) }))
      );
    } catch (error) {
      console.error("Error cargando horas:", error);
    }
  };

  const fetchHorarios = async () => {
    if (!selectedGestion?.value || !selectedSucursal?.value) return;
    try {
      const data = await fetchWithAuth(
        `https://api-umam-1.onrender.com/horarios/?gestion_id=${selectedGestion.value}&sucursal_id=${selectedSucursal.value}`
      );
      const formattedCourses = data.flatMap((horario) =>
        horario.dias_clase.map((dia) => ({
          id: `${horario.horario_id}-${dia.dia_clase_id}`,
          subject: `Curso ${horario.curso_id}`,
          professor: `Profesor ${horario.profesor_id}`,
          classroom: {
            value: horario.aula_id.toString(),
            label: `Aula ${horario.aula_id}`,
          },
          time: formatTimeSlot(dia.hora),
          day: dia.dia_semana.dia_semana,
          color: getCourseColor(`Curso ${horario.curso_id}`),
          gestion: horario.gestion_id.toString(),
          sucursal: selectedSucursal.value,
        }))
      );
      setCourses(formattedCourses);
    } catch (error) {
      console.error("Error cargando horarios:", error);
    }
  };

  const fetchSucursales = async () => {
    setLoadingSucursales(true);
    setErrorSucursales(null);
    try {
      const data = await fetchWithAuth(
        "https://api-umam-1.onrender.com/sucursales/"
      );
      const formattedSucursales = data.map((sucursal) => ({
        value: sucursal.sucursal_id.toString(),
        label: sucursal.nombre,
        rawData: sucursal,
      }));
      setSucursales(formattedSucursales);
      if (formattedSucursales.length > 0) {
        setSelectedSucursal(formattedSucursales[0]);
        await fetchAulasForSucursal(formattedSucursales[0].value);
      }
    } catch (error) {
      console.error("Error cargando sucursales:", error);
      setErrorSucursales(error.message);
    } finally {
      setLoadingSucursales(false);
    }
  };

  const fetchAulasForSucursal = async (sucursalId) => {
    try {
      const data = await fetchWithAuth(
        `https://api-umam-1.onrender.com/sucursales/${sucursalId}/aulas`
      );
      setClassroomsBySucursal((prev) => ({
        ...prev,
        [sucursalId]: data.map((aula) => ({
          value: aula.aula_id.toString(),
          label: aula.nombre_aula,
        })),
      }));
    } catch (error) {
      console.error("Error cargando aulas:", error);
    }
  };

  const handleSucursalChange = async (sucursal) => {
    setSelectedSucursal(sucursal);
    if (!classroomsBySucursal[sucursal.value]) {
      await fetchAulasForSucursal(sucursal.value);
    }
  };

  const handleCellClick = (time, day, classroom) => {
    setCourseFormData({ time, day, classroom, curso_id: "", profesor_id: "" });
    setIsModalOpen(true);
  };

  const submitNewCourse = async (formData) => {
    const { curso_id, profesor_id, classroom, day, time } = formData;
    const dia = days.find((d) => d.name === day);
    const hora = timeSlots.find((h) => h.label === time);
    if (!dia || !hora) return alert("Datos inválidos para día u hora");
    try {
      await fetchWithAuth("https://api-umam-1.onrender.com/horarios/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso_id: parseInt(curso_id),
          aula_id: parseInt(classroom.value),
          profesor_id: parseInt(profesor_id),
          gestion_id: parseInt(selectedGestion.value),
          activo: true,
          dias_clase: [{ dia_semana_id: dia.id, hora_id: hora.id }],
        }),
      });
      setIsModalOpen(false);
      setCourseFormData(null);
      fetchHorarios();
    } catch (err) {
      console.error(err);
      alert("Error al crear horario");
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          fetchWithAuth(
            "https://api-umam-1.onrender.com/cursos/gestiones"
          ).then((data) => {
            const gestionesFormatted = data.map((g) => ({
              value: g.gestion_id.toString(),
              label: g.gestion,
              rawData: g,
            }));
            setGestiones(gestionesFormatted);
            setSelectedGestion(
              gestionesFormatted[0] || {
                value: "",
                label: "No hay gestiones disponibles",
              }
            );
          }),
          fetchWithAuth("https://api-umam-1.onrender.com/cursos/years").then(
            setAvailableYears
          ),
          fetchSucursales(),
          fetchDays(),
          fetchTimeSlots(),
          fetchSubjects(),
          fetchProfessors(),
        ]);
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        setErrorGestiones(error.message);
      } finally {
        setLoadingGestiones(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchHorarios();
  }, [selectedGestion, selectedSucursal]);

  const getCourseColor = (subject) => {
    const colors = [
      "bg-pink-200 border-pink-300 text-pink-800",
      "bg-cyan-200 border-cyan-300 text-cyan-800",
      "bg-green-200 border-green-300 text-green-800",
      "bg-blue-200 border-blue-300 text-blue-800",
      "bg-purple-200 border-purple-300 text-purple-800",
      "bg-yellow-200 border-yellow-300 text-yellow-800",
      "bg-orange-200 border-orange-300 text-orange-800",
      "bg-red-200 border-red-300 text-red-800",
      "bg-indigo-200 border-indigo-300 text-indigo-800",
      "bg-teal-200 border-teal-300 text-teal-800",
    ];
    const hash = subject.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  const fetchSubjects = async () => {
    try {
      const data = await fetchWithAuth(
        "https://api-umam-1.onrender.com/cursos/"
      );
      setAvailableSubjects(data.map((curso) => curso));
    } catch (error) {
      console.error("Error cargando materias:", error);
    }
  };

  const fetchProfessors = async () => {
    try {
      const data = await fetchWithAuth(
        "https://api-umam-1.onrender.com/usuarios/?rol_id=3"
      );
      setAvailableProfessors(data.map((prof) => prof));
    } catch (error) {
      console.error("Error cargando profesores:", error);
    }
  };
  const renderSucursales = () => {
    if (loadingSucursales)
      return (
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-24 h-10 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      );
    if (errorSucursales)
      return (
        <div className="text-red-500 text-sm">
          Error cargando sucursales: {errorSucursales}
        </div>
      );
    return sucursales.map((sucursal) => (
      <button
        key={sucursal.value}
        onClick={() => handleSucursalChange(sucursal)}
        className={`px-4 py-2 text-sm font-medium border-b-2 ${
          selectedSucursal?.value === sucursal.value
            ? "text-blue-600 border-blue-600"
            : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        {sucursal.label}
      </button>
    ));
  };
  console.log(availableProfessors, availableSubjects);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">HORARIOS</h1>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Año:</label>
            {loadingGestiones ? (
              <div className="min-w-40 px-3 py-2 text-sm bg-gray-100 rounded-md animate-pulse">
                Cargando...
              </div>
            ) : errorGestiones ? (
              <div className="min-w-40 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-md">
                Error: {errorGestiones}
              </div>
            ) : gestiones.length > 0 ? (
              <Dropdown
                options={gestiones}
                selected={selectedGestion}
                onSelect={setSelectedGestion}
                className="min-w-40"
              />
            ) : (
              <div className="min-w-40 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-md">
                No hay gestiones
              </div>
            )}
          </div>
          <button
            onClick={() => setIsGestionModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <Calendar size={14} /> Nueva Gestión
          </button>
        </div>
        <div className="flex gap-1 mb-6">{renderSucursales()}</div>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Plus size={16} /> Agregar Horario
          </button>
          <button
            onClick={() =>
              alert("Funcionalidad de descarga aún no implementada")
            }
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Download size={16} /> Descargar Horario PDF
          </button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            {selectedSucursal?.label || "Sin sucursal seleccionada"} -{" "}
            {selectedGestion?.label || "Sin gestión seleccionada"}
          </h3>
          {selectedGestion?.value && (
            <p className="text-sm text-blue-700">
              <span className="font-medium">
                {selectedSucursal?.value
                  ? classroomsBySucursal[selectedSucursal.value]?.length || 0
                  : 0}
              </span>{" "}
              aulas disponibles •{" "}
              <span className="font-medium ml-2">{courses.length}</span> cursos
              programados
            </p>
          )}
        </div>
        {selectedGestion?.value ? (
          <ScheduleTable
            courses={courses}
            timeSlots={timeSlots.map((t) => t.label)}
            days={days.map((d) => d.name)}
            availableClassrooms={
              selectedSucursal?.value
                ? classroomsBySucursal[selectedSucursal.value] || []
                : []
            }
            onCellClick={handleCellClick}
            onDeleteCourse={() => {}}
          />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <p className="text-yellow-700">
              Seleccione una gestión para ver los horarios
            </p>
          </div>
        )}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setCourseFormData(null);
          }}
        >
          <CourseForm
            onSubmit={submitNewCourse}
            onCancel={() => {
              setIsModalOpen(false);
              setCourseFormData(null);
            }}
            initialData={courseFormData}
            timeSlots={timeSlots}
            days={days}
            availableClassrooms={
              selectedSucursal?.value
                ? classroomsBySucursal[selectedSucursal.value] || []
                : []
            }
            availableSubjects={availableSubjects}
            availableProfessors={availableProfessors}
          />
        </Modal>
        <Modal
          isOpen={isGestionModalOpen}
          onClose={() => !isSubmitting && setIsGestionModalOpen(false)}
        >
          <GestionForm
            onSubmit={() => {}}
            onCancel={() => !isSubmitting && setIsGestionModalOpen(false)}
            isLoading={isSubmitting}
            error={submitError}
            availableYears={availableYears}
          />
        </Modal>
      </div>
    </div>
  );
};

export default SchedulePage;
