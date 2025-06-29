"use client";
import React, { useState, useEffect } from "react";
import { Download, Plus, Calendar } from "lucide-react";
import Dropdown from "./Dropdown";
import ScheduleTable from "./ScheduleTable";
import Modal from "./Modal";
import CourseForm from "./CourseForm";
import GestionForm from "./GestionForm";
import { scheduleData, timeSlots, days } from "../data/scheduleData";
import { fetchWithAuth } from "../utils/api";

const SchedulePage = () => {
  // Estados para gestiones
  const [gestiones, setGestiones] = useState([]);
  const [selectedGestion, setSelectedGestion] = useState({
    value: "",
    label: "Seleccione una gestión",
  });
  const [loadingGestiones, setLoadingGestiones] = useState(true);
  const [errorGestiones, setErrorGestiones] = useState(null);

  // Estados para sucursales
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [loadingSucursales, setLoadingSucursales] = useState(true);
  const [errorSucursales, setErrorSucursales] = useState(null);
  const [classroomsBySucursal, setClassroomsBySucursal] = useState({});

  // Resto de estados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGestionModalOpen, setIsGestionModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [courses, setCourses] = useState(scheduleData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);

  // Función para cargar sucursales
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

        // Cargar aulas para la primera sucursal
        const aulas = data[0].aulas || [];
        setClassroomsBySucursal({
          [formattedSucursales[0].value]: aulas.map((aula) => ({
            value: aula.aula_id.toString(),
            label: aula.nombre_aula,
          })),
        });
      }
    } catch (error) {
      console.error("Error cargando sucursales:", error);
      setErrorSucursales(error.message);
    } finally {
      setLoadingSucursales(false);
    }
  };

  // Handler para cambiar de sucursal
  const handleSucursalChange = async (sucursal) => {
    setSelectedSucursal(sucursal);

    if (!classroomsBySucursal[sucursal.value]) {
      try {
        const data = await fetchWithAuth(
          `https://api-umam-1.onrender.com/sucursales/${sucursal.value}/aulas`
        );

        setClassroomsBySucursal((prev) => ({
          ...prev,
          [sucursal.value]: data.map((aula) => ({
            value: aula.aula_id.toString(),
            label: aula.nombre_aula,
          })),
        }));
      } catch (error) {
        console.error("Error cargando aulas:", error);
      }
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          fetchWithAuth(
            "https://api-umam-1.onrender.com/cursos/gestiones"
          ).then((gestionesData) => {
            const formattedGestiones = gestionesData.map((gestion) => ({
              value: gestion.gestion_id.toString(),
              label: gestion.gestion,
              rawData: gestion,
            }));
            setGestiones(formattedGestiones);
            setSelectedGestion(
              formattedGestiones.length > 0
                ? formattedGestiones[0]
                : { value: "", label: "No hay gestiones disponibles" }
            );
          }),
          fetchWithAuth("https://api-umam-1.onrender.com/cursos/years").then(
            setAvailableYears
          ),
          fetchSucursales(),
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

  const handleAddGestion = async (gestionData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validar semestre (1 o 2)
      const semestre = gestionData.semester;
      if (!["1", "2"].includes(semestre)) {
        throw new Error("El semestre debe ser 1 o 2");
      }

      // Formatear nombre de gestión (ej: "2024-I")
      const gestionName = `${gestionData.year}-${
        semestre === "1" ? "I" : "II"
      }`;

      // Verificar si ya existe esta gestión exacta
      const gestionExistente = gestiones.some(
        (g) => g.rawData?.gestion === gestionName
      );

      if (gestionExistente) {
        throw new Error(`Ya existe la gestión ${gestionName}`);
      }

      // Crear la nueva gestión
      const response = await fetchWithAuth(
        "https://api-umam-1.onrender.com/cursos/gestion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gestion: gestionName,
            year_id: parseInt(gestionData.year_id),
          }),
        }
      );

      if (!response?.gestion_id) {
        throw new Error("No se recibió un ID de gestión válido");
      }

      // Actualizar el estado
      const newGestion = {
        value: response.gestion_id.toString(),
        label: response.gestion || gestionName,
        rawData: response,
      };

      setGestiones([newGestion, ...gestiones]);
      setSelectedGestion(newGestion);
      setIsGestionModalOpen(false);

      // Actualizar lista de años si es necesario
      const updatedYears = await fetchWithAuth(
        "https://api-umam-1.onrender.com/cursos/years"
      );
      setAvailableYears(updatedYears);
    } catch (error) {
      console.error("Error al crear gestión:", error);
      setSubmitError(
        error.message.includes("Failed to fetch")
          ? "Error de conexión con el servidor"
          : error.message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCourse = (courseData) => {
    if (!selectedGestion?.value) {
      alert("Por favor seleccione una gestión primero");
      return;
    }

    const isClassroomOccupied = courses.some(
      (course) =>
        course.time === courseData.time &&
        course.day === courseData.day &&
        course.classroom === courseData.classroom &&
        course.gestion === selectedGestion.value &&
        course.sucursal === selectedSucursal.value
    );

    if (isClassroomOccupied) {
      alert(
        "Esta aula ya está ocupada en este horario. Por favor selecciona otra aula."
      );
      return;
    }

    const newCourse = {
      ...courseData,
      id: Date.now().toString(),
      color: getCourseColor(courseData.subject),
      gestion: selectedGestion.value,
      sucursal: selectedSucursal.value,
    };
    setCourses([...courses, newCourse]);
    setIsModalOpen(false);
    setSelectedTimeSlot(null);
  };

  const handleDeleteCourse = (courseId) => {
    setCourses(courses.filter((course) => course.id !== courseId));
  };

  const handleCellClick = (time, day) => {
    if (!selectedGestion?.value) {
      alert("Por favor seleccione una gestión primero");
      return;
    }
    setSelectedTimeSlot({ time, day });
    setIsModalOpen(true);
  };

  const handleDownloadPDF = () => {
    if (!selectedGestion?.value) {
      alert("Por favor seleccione una gestión primero");
      return;
    }
    alert(
      `Descargando PDF de horarios para ${selectedSucursal?.label} - ${selectedGestion.label}`
    );
  };

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

  const filteredCourses = courses.filter(
    (course) =>
      selectedGestion?.value &&
      course.gestion === selectedGestion.value &&
      course.sucursal === selectedSucursal?.value
  );

  const availableClassrooms = selectedSucursal?.value
    ? classroomsBySucursal[selectedSucursal.value] || []
    : [];

  // Renderizado de sucursales
  const renderSucursales = () => {
    if (loadingSucursales) {
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
    }

    if (errorSucursales) {
      return (
        <div className="text-red-500 text-sm">
          Error cargando sucursales: {errorSucursales}
        </div>
      );
    }

    return (
      <>
        {sucursales.map((sucursal) => (
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
        ))}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
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
              <Calendar size={14} />
              Nueva Gestión
            </button>
          </div>

          <div className="flex gap-1 mb-6">{renderSucursales()}</div>

          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                if (!selectedGestion?.value) {
                  alert("Por favor seleccione una gestión primero");
                  return;
                }
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Plus size={16} />
              Agregar Horario
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Download size={16} />
              Descargar Horario PDF
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
                  {availableClassrooms.length}
                </span>{" "}
                aulas disponibles •
                <span className="font-medium ml-2">
                  {filteredCourses.length}
                </span>{" "}
                cursos programados
              </p>
            )}
          </div>
        </div>

        {selectedGestion?.value ? (
          <ScheduleTable
            courses={filteredCourses}
            timeSlots={timeSlots}
            days={days}
            availableClassrooms={availableClassrooms}
            onCellClick={handleCellClick}
            onDeleteCourse={handleDeleteCourse}
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
            setSelectedTimeSlot(null);
          }}
        >
          <CourseForm
            onSubmit={handleAddCourse}
            onCancel={() => {
              setIsModalOpen(false);
              setSelectedTimeSlot(null);
            }}
            initialData={selectedTimeSlot}
            timeSlots={timeSlots}
            days={days}
            availableClassrooms={availableClassrooms}
          />
        </Modal>

        <Modal
          isOpen={isGestionModalOpen}
          onClose={() => !isSubmitting && setIsGestionModalOpen(false)}
        >
          <GestionForm
            onSubmit={handleAddGestion}
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
