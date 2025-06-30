"use client";
import React, { useState, useEffect } from "react";
import { Download, Plus, Calendar, Clock } from "lucide-react";
import Dropdown from "./Dropdown";
import ScheduleTable from "./ScheduleTable";
import Modal from "./Modal";
import CourseForm from "./CourseForm";
import GestionForm from "./GestionForm";
import { fetchWithAuth, fetchWithAuthDelete } from "../utils/api";

const SchedulePage = () => {
  // Estados existentes
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

  // Estados adicionales que necesitamos agregar
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  // Nuevos estados para manejar horas
  const [selectedHourToRender, setSelectedHourToRender] = useState(null);
  const [isHourModalOpen, setIsHourModalOpen] = useState(false);

  const formatTimeSlot = (hora) =>
    `${hora.hora_inicio.slice(0, 5)} - ${hora.hora_fin.slice(0, 5)}`;

  // Fetch inicial de datos
  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchWithAuth("https://api-umam-1.onrender.com/cursos/gestiones").then(
          (data) => {
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
          }
        ),
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

  const fetchDays = async () => {
    try {
      const data = await fetchWithAuth(
        "https://api-umam-1.onrender.com/horarios/dias-semana"
      );
      setDays(
        data.map((dia) => ({ id: dia.dias_semana_id, name: dia.dia_semana }))
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
      const formattedSlots = data.map((h) => ({
        id: h.hora_id,
        label: formatTimeSlot(h),
        rawData: h,
      }));
      setTimeSlots(formattedSlots);
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
      const formattedCourses = data.flatMap((horario) => {
        const curso = availableSubjects.find(
          (c) => c.curso_id === horario.curso_id
        );
        const profesor = availableProfessors.find(
          (p) => p.usuario_id === horario.profesor_id
        );

        return horario.dias_clase.map((dia) => ({
          id: `${horario.horario_id}-${dia.dia_clase_id}`,
          subject: curso?.nombre || `Curso ${horario.curso_id}`,
          professor: profesor
            ? `${profesor.nombres} ${profesor.ap_paterno || ""} ${
                profesor.ap_materno || ""
              }`.trim()
            : `Profesor ${horario.profesor_id}`,
          classroom: {
            value: horario.aula_id.toString(),
            label: `Aula ${horario.aula_id}`,
          },
          time: formatTimeSlot(dia.hora),
          day: dia.dia_semana.dias_semana_id,
          color: getCourseColor(curso?.nombre || `Curso ${horario.curso_id}`),
          gestion: horario.gestion_id.toString(),
          sucursal: selectedSucursal.value,
        }));
      });

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

  // Función para crear nueva hora
  const submitNewHour = async ({ hora_inicio, hora_fin }) => {
    try {
      await fetchWithAuth("https://api-umam-1.onrender.com/horarios/horas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hora_inicio, hora_fin }),
      });
      // Recargar las horas disponibles
      await fetchTimeSlots();
      setIsHourModalOpen(false);
    } catch (error) {
      console.error("Error creando hora:", error);
      alert("Error al crear la hora");
    }
  };

  // Lógica para filtrar horas
  const availableHoursToAdd = timeSlots.filter(
    (timeSlot) => !courses.some((course) => course.time === timeSlot.label)
  );

  const filteredTimeSlots = selectedHourToRender
    ? [
        ...new Set([
          ...timeSlots.filter((timeSlot) =>
            courses.some((course) => course.time === timeSlot.label)
          ),
          selectedHourToRender,
        ]),
      ]
    : timeSlots.filter((timeSlot) =>
        courses.some((course) => course.time === timeSlot.label)
      );

  // Handlers existentes
  const handleSucursalChange = async (sucursal) => {
    setSelectedSucursal(sucursal);
    if (!classroomsBySucursal[sucursal.value]) {
      await fetchAulasForSucursal(sucursal.value);
    }
  };

  const handleCellClick = (time, day, classroom) => {
    // Verifica que classroom tenga el formato correcto
    if (!classroom || !classroom.value) {
      console.error("Classroom inválido:", classroom);
      return;
    }

    setCourseFormData({
      time,
      day,
      classroom: classroom.value, // Pasamos solo el value para el formulario
      classroomObject: classroom, // Guardamos el objeto completo para referencia
      curso_id: "",
      profesor_id: "",
    });
    setIsModalOpen(true);
  };

  const submitNewCourse = async (formData) => {
    const { curso_id, profesor_id, classroom, day, time } = formData;
    const dia = days.find((d) => d.id === parseInt(day));
    const hora = timeSlots.find((h) => h.label === time);

    if (!dia || !hora) {
      alert("Datos inválidos para día u hora");
      return;
    }

    try {
      await fetchWithAuth("https://api-umam-1.onrender.com/horarios/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso_id: parseInt(curso_id),
          aula_id: parseInt(classroom),
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
      console.error("Error en submitNewCourse:", err);
      alert(`Error al crear horario: ${err.message || err}`);
    }
  };

  const submitNewGestion = async ({ year, year_id, semester }) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await fetchWithAuth("https://api-umam-1.onrender.com/cursos/gestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year_id,
          gestion: `${year} - ${semester === "1" ? "I" : "II"}`,
          semester: parseInt(semester),
          activo: true,
        }),
      });

      const data = await fetchWithAuth(
        "https://api-umam-1.onrender.com/cursos/gestiones"
      );
      const gestionesFormatted = data.map((g) => ({
        value: g.gestion_id.toString(),
        label: g.gestion,
        rawData: g,
      }));
      setGestiones(gestionesFormatted);
      setSelectedGestion(gestionesFormatted[0]);

      setIsGestionModalOpen(false);
    } catch (error) {
      console.error("Error creando gestión:", error);
      setSubmitError("Error al crear la gestión");
    } finally {
      setIsSubmitting(false);
    }
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchHorarios();
  }, [selectedGestion, selectedSucursal]);

  // Función para manejar la eliminación (igual que antes)
  const handleDeleteCourse = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  // Función para confirmar la eliminación - VERSIÓN CORREGIDA
  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const [horarioId] = courseToDelete.id.split("-");

      // Usamos la nueva función específica para DELETE
      await fetchWithAuthDelete(
        `https://api-umam-1.onrender.com/horarios/${horarioId}`
      );

      // Actualización optimista
      setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));

      // Cierra el modal y limpia
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);

      // Opcional: Recargar datos para asegurar consistencia
      await fetchHorarios();
    } catch (error) {
      console.error("Error eliminando horario:", error);
      setDeleteError(error.message || "Error al eliminar el horario");

      // Revertir la actualización optimista si falla
      if (courseToDelete) {
        setCourses((prev) => [...prev, courseToDelete]);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  console.log("Courses:", courses);
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">HORARIOS</h1>

        {/* Selector de gestión */}
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

        {/* Selector de sucursal */}
        <div className="flex gap-1 mb-6">{renderSucursales()}</div>

        {/* Controles de horario */}
        <div className="flex gap-3 mb-4">
          {/* Dropdown para agregar horas existentes */}
          <Dropdown
            options={availableHoursToAdd.map((hour) => ({
              value: hour.id,
              label: hour.label,
            }))}
            selected={null}
            onSelect={(selected) => {
              setSelectedHourToRender(
                timeSlots.find((h) => h.id === selected.value)
              );
            }}
            placeholder="Seleccionar hora"
            className="min-w-48"
            icon={<Clock size={16} className="mr-2" />}
          />

          {/* Botón para crear nueva hora */}
          <button
            onClick={() => setIsHourModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Plus size={16} /> Nueva Hora
          </button>

          {/* Botón de descarga */}
          <button
            onClick={() =>
              alert("Funcionalidad de descarga aún no implementada")
            }
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Download size={16} /> Descargar Horario PDF
          </button>
        </div>

        {/* Resumen */}
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

        {/* Tabla de horarios */}
        {selectedGestion?.value ? (
          <ScheduleTable
            courses={courses}
            timeSlots={filteredTimeSlots.map((t) => t.label)}
            days={days}
            availableClassrooms={
              selectedSucursal?.value
                ? classroomsBySucursal[selectedSucursal.value] || []
                : []
            }
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

        {/* Modales */}
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
            onSubmit={submitNewGestion}
            onCancel={() => !isSubmitting && setIsGestionModalOpen(false)}
            isLoading={isSubmitting}
            error={submitError}
            availableYears={availableYears}
          />
        </Modal>

        {/* Modal para nueva hora */}
        <Modal
          isOpen={isHourModalOpen}
          onClose={() => setIsHourModalOpen(false)}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Crear Nueva Hora</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitNewHour({
                  hora_inicio: e.target.hora_inicio.value + ":00",
                  hora_fin: e.target.hora_fin.value + ":00",
                });
              }}
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    name="hora_inicio"
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    name="hora_fin"
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHourModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Crear Hora
                </button>
              </div>
            </form>
          </div>
        </Modal>
        {/* Modal de confirmación para eliminar */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 text-red-600">
              Eliminar Horario
            </h2>

            {courseToDelete && (
              <div className="mb-6">
                <p className="mb-2">
                  ¿Estás seguro que deseas eliminar este horario?
                </p>
                <div
                  className={`${courseToDelete.color} rounded-lg p-3 border-2`}
                >
                  <div className="text-sm font-semibold mb-1">
                    {courseToDelete.subject}
                  </div>
                  <div className="text-xs">{courseToDelete.professor}</div>
                  <div className="text-xs mt-1">
                    {days.find((d) => d.id === courseToDelete.day)?.name} -{" "}
                    {courseToDelete.time}
                  </div>
                  <div className="text-xs">
                    Aula: {courseToDelete.classroom.label}
                  </div>
                </div>
              </div>
            )}

            {deleteError && (
              <div className="mb-4 text-red-500 text-sm">{deleteError}</div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteCourse}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
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
                    Eliminando...
                  </>
                ) : (
                  "Eliminar Horario"
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SchedulePage;
