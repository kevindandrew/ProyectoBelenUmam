"use client";
import React, { useState, useEffect } from "react";
import { Download, Plus, Calendar, Clock } from "lucide-react";
import { toast } from "react-toastify";
import Dropdown from "./Dropdown";
import ScheduleTable from "./ScheduleTable";
import Modal from "./Modal";
import CourseForm from "./CourseForm";
import GestionForm from "./GestionForm";
import TransferirHorarioForm from "./TransferirHorarioForm";
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
  const [horariosRaw, setHorariosRaw] = useState([]);
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
  const [deleteInscripcionesCount, setDeleteInscripcionesCount] = useState(0);

  // Estados para eliminar gestión
  const [gestionToDelete, setGestionToDelete] = useState(null);
  const [isDeleteGestionModalOpen, setIsDeleteGestionModalOpen] =
    useState(false);
  const [isDeletingGestion, setIsDeletingGestion] = useState(false);
  const [deleteGestionError, setDeleteGestionError] = useState(null);

  // Nuevos estados para manejar horas
  const [selectedHourToRender, setSelectedHourToRender] = useState(null);
  const [isHourModalOpen, setIsHourModalOpen] = useState(false);
  const [isEditHourModalOpen, setIsEditHourModalOpen] = useState(false);
  const [hourToEdit, setHourToEdit] = useState(null);
  const [targetHourId, setTargetHourId] = useState("");
  const [hourToDelete, setHourToDelete] = useState(null);
  const [isDeleteHourModalOpen, setIsDeleteHourModalOpen] = useState(false);
  const [isDeletingHour, setIsDeletingHour] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState(null);

  // Estados para transferir horario
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [courseToTransfer, setCourseToTransfer] = useState(null);
  const [rawHorarioToTransfer, setRawHorarioToTransfer] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Eliminar los estados y useEffects relacionados con blockedCells y localStorage
  // Ya no necesitamos manejar esto localmente

  // Limpiar localStorage de datos antiguos (una sola vez)
  useEffect(() => {
    const oldBlockedCells = localStorage.getItem("blockedCells");
    if (oldBlockedCells) {
      console.log(
        "🧹 Limpiando datos antiguos de celdas bloqueadas del localStorage...",
      );
      localStorage.removeItem("blockedCells");
      console.log(
        "✅ Datos antiguos eliminados. Ahora se guardan en el backend.",
      );
    }
  }, []);

  const formatTimeSlot = (hora) =>
    `${hora.hora_inicio.slice(0, 5)} - ${hora.hora_fin.slice(0, 5)}`;

  // Fetch inicial de datos
  const fetchInitialData = async () => {
    try {
      // Cargar TODOS los datos necesarios primero
      const [
        gestionesData,
        yearsData,
        sucursalesData,
        diasData,
        timeSlotsData,
        subjectsData,
        professorsData,
      ] = await Promise.all([
        fetchWithAuth("https://api-umam-1.onrender.com/cursos/gestiones"),
        fetchWithAuth("https://api-umam-1.onrender.com/cursos/years"),
        fetchWithAuth("https://api-umam-1.onrender.com/sucursales/"),
        fetchWithAuth("https://api-umam-1.onrender.com/horarios/dias-semana"),
        fetchWithAuth("https://api-umam-1.onrender.com/horarios/horas"),
        fetchWithAuth("https://api-umam-1.onrender.com/cursos/"),
        fetchWithAuth("https://api-umam-1.onrender.com/usuarios/?rol_id=3"),
      ]);

      // Procesar gestiones
      const gestionesFormatted = gestionesData.map((g) => ({
        value: g.gestion_id.toString(),
        label: g.gestion,
        rawData: g,
      }));
      setGestiones(gestionesFormatted);

      // Buscar la gestión más reciente
      const currentYear = new Date().getFullYear();
      const gestionActual =
        gestionesFormatted.find((g) =>
          g.label.includes(`Gestión I - ${currentYear}`),
        ) ||
        gestionesFormatted.find((g) =>
          g.label.includes(currentYear.toString()),
        ) ||
        gestionesFormatted[gestionesFormatted.length - 1];

      // Establecer años disponibles
      setAvailableYears(yearsData);

      // Procesar días (FILTRAR SÁBADO Y DOMINGO)
      const filteredDays = diasData.filter(
        (dia) => dia.dias_semana_id !== 6 && dia.dias_semana_id !== 7,
      );
      setDays(
        filteredDays.map((dia) => ({
          id: dia.dias_semana_id,
          name: dia.dia_semana,
        })),
      );

      // Procesar time slots
      const sortedTimeSlots = timeSlotsData.sort((a, b) =>
        a.hora_inicio.localeCompare(b.hora_inicio),
      );
      const formattedSlots = sortedTimeSlots.map((h) => ({
        id: h.hora_id,
        label: formatTimeSlot(h),
        rawData: h,
      }));
      setTimeSlots(formattedSlots);

      // Procesar subjects y professors
      setAvailableSubjects(subjectsData);
      setAvailableProfessors(professorsData);

      // Procesar sucursales
      const formattedSucursales = sucursalesData.map((sucursal) => ({
        value: sucursal.sucursal_id.toString(),
        label: sucursal.nombre,
        rawData: sucursal,
      }));
      setSucursales(formattedSucursales);

      // AHORA SÍ establecer las selecciones iniciales (después de cargar TODO)
      setSelectedGestion(
        gestionActual || {
          value: "",
          label: "No hay gestiones disponibles",
        },
      );

      if (formattedSucursales.length > 0) {
        const firstSucursal = formattedSucursales[0];
        // Cargar aulas para la primera sucursal
        const aulasData = await fetchWithAuth(
          `https://api-umam-1.onrender.com/sucursales/${firstSucursal.value}/aulas`,
        );
        setClassroomsBySucursal({
          [firstSucursal.value]: aulasData
            .map((aula) => ({
              value: aula.aula_id.toString(),
              label: aula.nombre_aula,
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        });
        setSelectedSucursal(firstSucursal);
      }
    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
      setErrorGestiones(error.message);
    } finally {
      setLoadingGestiones(false);
      setLoadingSucursales(false);
    }
  };

  const fetchDays = async () => {
    try {
      const data = await fetchWithAuth(
        "https://api-umam-1.onrender.com/horarios/dias-semana",
      );
      // Filtrar sábado (dias_semana_id: 6 o 7)
      const filteredDays = data.filter(
        (dia) => dia.dias_semana_id !== 6 && dia.dias_semana_id !== 7,
      );
      setDays(
        filteredDays.map((dia) => ({
          id: dia.dias_semana_id,
          name: dia.dia_semana,
        })),
      );
    } catch (error) {
      console.error("Error cargando días:", error);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const data = await fetchWithAuth(
        "https://api-umam-1.onrender.com/horarios/horas",
      );

      // Ordenar horas por hora_inicio
      const sortedData = data.sort((a, b) => {
        return a.hora_inicio.localeCompare(b.hora_inicio);
      });

      const formattedSlots = sortedData.map((h) => ({
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
    // Esperar a que los datos necesarios estén cargados
    if (availableSubjects.length === 0 || availableProfessors.length === 0) {
      return;
    }

    try {
      const data = await fetchWithAuth(
        `https://api-umam-1.onrender.com/horarios/?gestion_id=${selectedGestion.value}&sucursal_id=${selectedSucursal.value}`,
      );
      setHorariosRaw(data);

      const formattedCourses = data.flatMap((horario) => {
        const curso = availableSubjects.find(
          (c) => c.curso_id === horario.curso_id,
        );
        const profesor = availableProfessors.find(
          (p) => p.usuario_id === horario.profesor_id,
        );

        // Detectar si es "No disponible"
        // 1. Cuando curso_id o profesor_id son null (formato antiguo)
        // 2. Cuando el nombre del curso contiene "NO DISPONIBLE", "BLOQUEADO", etc.
        const isUnavailable =
          !horario.curso_id ||
          !horario.profesor_id ||
          (curso?.nombre &&
            (curso.nombre.toUpperCase().includes("NO DISPONIBLE") ||
              curso.nombre.toUpperCase().includes("BLOQUEADO") ||
              curso.nombre.toUpperCase().includes("OCUPADO")));

        return horario.dias_clase
          .filter(
            (dia) =>
              dia.dia_semana.dias_semana_id !== 6 &&
              dia.dia_semana.dias_semana_id !== 7,
          ) // Filtrar sábado y domingo
          .map((dia) => {
            const subjectName = isUnavailable
              ? "NO DISPONIBLE"
              : curso?.nombre || `Curso ${horario.curso_id}`;
            // Usar aula del día si está disponible, sino usar aula del horario
            const aulaId = dia.aula_id || horario.aula_id;
            return {
              id: `${horario.horario_id}-${dia.dia_clase_id}`,
              subject: subjectName,
              professor: isUnavailable
                ? "ENCARGADO CAPS"
                : profesor
                  ? `${profesor.nombres} ${profesor.ap_paterno || ""} ${
                      profesor.ap_materno || ""
                    }`.trim()
                  : `Profesor ${horario.profesor_id}`,
              classroom: {
                value: aulaId.toString(),
                label: `Aula ${aulaId}`,
              },
              time: formatTimeSlot(dia.hora),
              day: dia.dia_semana.dias_semana_id,
              color: isUnavailable
                ? "bg-gray-300 border-gray-400 text-gray-800" // Color especial para no disponible
                : "",
              colorStyle: isUnavailable
                ? undefined
                : getCourseColorStyle(subjectName),
              gestion: horario.gestion_id.toString(),
              sucursal: selectedSucursal.value,
              curso_id: horario.curso_id,
              profesor_id: horario.profesor_id,
              is_unavailable: isUnavailable,
              horario_id: horario.horario_id,
              gestion_id: horario.gestion_id,
              aula_id: aulaId,
              cursoId: horario.curso_id,
              profesorId: horario.profesor_id,
              gestionId: horario.gestion_id,
              aulaId: aulaId,
            };
          });
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
        "https://api-umam-1.onrender.com/sucursales/",
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
        `https://api-umam-1.onrender.com/sucursales/${sucursalId}/aulas`,
      );
      setClassroomsBySucursal((prev) => ({
        ...prev,
        [sucursalId]: data
          .map((aula) => ({
            value: aula.aula_id.toString(),
            label: aula.nombre_aula,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      }));
    } catch (error) {
      console.error("Error cargando aulas:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await fetchWithAuth(
        "https://api-umam-1.onrender.com/cursos/",
      );
      setAvailableSubjects(data.map((curso) => curso));
    } catch (error) {
      console.error("Error cargando materias:", error);
    }
  };

  const fetchProfessors = async () => {
    try {
      const data = await fetchWithAuth(
        "https://api-umam-1.onrender.com/usuarios/?rol_id=3",
      );
      setAvailableProfessors(data.map((prof) => prof));
    } catch (error) {
      console.error("Error cargando profesores:", error);
    }
  };

  // Función para crear nueva hora
  const submitNewHour = async ({ hora_inicio, hora_fin }) => {
    try {
      // Verificar si ya existe una hora con el mismo rango
      const horaExistente = timeSlots.find((slot) => {
        const inicio = slot.rawData.hora_inicio.slice(0, 5);
        const fin = slot.rawData.hora_fin.slice(0, 5);
        return (
          inicio === hora_inicio.slice(0, 5) && fin === hora_fin.slice(0, 5)
        );
      });

      if (horaExistente) {
        toast.warning(
          `La hora ${hora_inicio.slice(0, 5)} - ${hora_fin.slice(0, 5)} ya existe`,
        );
        return;
      }

      await fetchWithAuth("https://api-umam-1.onrender.com/horarios/horas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hora_inicio, hora_fin }),
      });
      // Recargar las horas disponibles
      await fetchTimeSlots();
      setIsHourModalOpen(false);
      toast.success(
        `Hora ${hora_inicio.slice(0, 5)} - ${hora_fin.slice(0, 5)} creada exitosamente`,
      );
    } catch (error) {
      console.error("Error creando hora:", error);
      toast.error(
        `Error al crear la hora: ${error.message || "Intente nuevamente"}`,
      );
    }
  };

  // Función para eliminar hora
  const handleDeleteHour = (hour) => {
    setHourToDelete(hour);
    setIsDeleteHourModalOpen(true);
  };

  const handleEditHour = (hour) => {
    if (!hour) return;
    setHourToEdit(hour);
    setTargetHourId("");
    setIsEditHourModalOpen(true);
  };

  const submitEditHour = async () => {
    if (!hourToEdit) return;
    if (!targetHourId) {
      toast.warning("Seleccione una hora de reemplazo");
      return;
    }

    if (parseInt(targetHourId, 10) === hourToEdit.id) {
      toast.warning("Seleccione una hora diferente");
      return;
    }

    try {
      const targetHour = timeSlots.find(
        (slot) => slot.id === parseInt(targetHourId, 10),
      );
      if (!targetHour) {
        toast.error("No se encontró la hora de reemplazo seleccionada");
        return;
      }

      await fetchWithAuth(
        `https://api-umam-1.onrender.com/horarios/horas/${hourToEdit.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hora_inicio: targetHour.rawData.hora_inicio,
            hora_fin: targetHour.rawData.hora_fin,
          }),
        },
      );

      await fetchTimeSlots();
      await fetchHorarios();

      if (selectedHourToRender?.id === hourToEdit.id) {
        setSelectedHourToRender(targetHour);
      }

      toast.success("Hora reasignada exitosamente");
      closeEditHourModal();
    } catch (error) {
      console.error("Error reasignando hora:", error);
      toast.error(
        `Error al reasignar la hora: ${error.message || "Intente nuevamente"}`,
      );
    }
  };

  const targetHourOptions = timeSlots.filter(
    (slot) => slot.id !== hourToEdit?.id,
  );

  const confirmEditHourSelection = async (e) => {
    e.preventDefault();
    await submitEditHour();
  };

  const closeEditHourModal = () => {
    setIsEditHourModalOpen(false);
    setHourToEdit(null);
    setTargetHourId("");
  };

  const confirmDeleteHour = async () => {
    if (!hourToDelete) return;

    setIsDeletingHour(true);
    try {
      // Verificar si la hora está siendo usada en algún horario
      const horaEnUso = courses.some(
        (course) => course.time === hourToDelete.label,
      );

      if (horaEnUso) {
        toast.warning(
          "No se puede eliminar esta hora porque está siendo usada en uno o más horarios",
        );
        setIsDeleteHourModalOpen(false);
        setHourToDelete(null);
        setIsDeletingHour(false);
        return;
      }

      await fetchWithAuthDelete(
        `https://api-umam-1.onrender.com/horarios/horas/${hourToDelete.id}`,
      );

      await fetchTimeSlots();
      setIsDeleteHourModalOpen(false);
      setHourToDelete(null);
      toast.success("Hora eliminada exitosamente");
    } catch (error) {
      console.error("Error eliminando hora:", error);
      toast.error(
        `Error al eliminar la hora: ${error.message || "Intente nuevamente"}`,
      );
    } finally {
      setIsDeletingHour(false);
    }
  };

  // Lógica para filtrar horas
  const availableHoursToAdd = timeSlots.filter(
    (timeSlot) => !courses.some((course) => course.time === timeSlot.label),
  );

  const usedTimeSlotLabels = [
    ...new Set(
      timeSlots
        .filter((timeSlot) =>
          courses.some((course) => course.time === timeSlot.label),
        )
        .map((timeSlot) => timeSlot.label),
    ),
  ];

  const filteredTimeSlots = selectedHourToRender?.label
    ? [...new Set([...usedTimeSlotLabels, selectedHourToRender.label])]
    : usedTimeSlotLabels;

  // Handlers existentes
  const handleSucursalChange = async (sucursal) => {
    setSelectedSucursal(sucursal);
    if (!classroomsBySucursal[sucursal.value]) {
      await fetchAulasForSucursal(sucursal.value);
    }
  };

  // Verificar si una celda está bloqueada - REVISA EN LOS DATOS DEL BACKEND
  const isCellBlocked = (time, day, classroom) => {
    return courses.some(
      (c) =>
        c.time === time &&
        c.day === day &&
        c.classroom.value === classroom.value &&
        c.is_unavailable === true,
    );
  };

  const handleCellClick = (time, day, classroom) => {
    if (!classroom || !classroom.value) {
      return;
    }

    const isBlocked = isCellBlocked(time, day, classroom);

    if (isBlocked) {
      toast.warning(
        "Esta celda está marcada como NO DISPONIBLE. Desbloqúeala primero para agregar un curso.",
      );
      return;
    }

    setCourseFormData({
      time,
      days: [day],
      classroom: classroom.value,
      classroomObject: classroom,
      curso_id: "",
      profesor_id: "",
    });
    setIsModalOpen(true);
  };

  // Función para bloquear/desbloquear una celda - AHORA GUARDA EN EL BACKEND
  const toggleBlockCell = async (time, day, classroom) => {
    if (!selectedGestion?.value || !selectedSucursal?.value) {
      toast.warning("Seleccione una gestión y sucursal primero");
      return;
    }

    try {
      const existingCourse = courses.find(
        (c) =>
          c.time === time &&
          c.day === day &&
          c.classroom.value === classroom.value &&
          c.is_unavailable === true,
      );

      if (existingCourse) {
        const horarioId = existingCourse.id.split("-")[0];

        if (confirm("¿Desea desbloquear este horario?")) {
          await fetchWithAuthDelete(
            `https://api-umam-1.onrender.com/horarios/${horarioId}`,
          );

          await fetchHorarios();
          toast.success("Horario desbloqueado exitosamente");
        }
      } else {
        const hora = timeSlots.find((h) => h.label === time);
        if (!hora) {
          throw new Error(`Hora inválida: ${time}`);
        }

        let cursNoDisponible = availableSubjects.find(
          (c) =>
            c.nombre &&
            (c.nombre.toUpperCase().includes("NO DISPONIBLE") ||
              c.nombre.toUpperCase().includes("BLOQUEADO") ||
              c.nombre.toUpperCase().includes("OCUPADO")),
        );

        if (!cursNoDisponible && availableSubjects.length > 0) {
          cursNoDisponible = availableSubjects[0];
          console.warn(
            "⚠️ No se encontró un curso 'NO DISPONIBLE'. Usando curso temporal. Se recomienda crear un curso llamado 'NO DISPONIBLE' en la gestión de cursos.",
          );
        }

        let profesorNoDisponible = availableProfessors.find((p) => {
          const nombreCompleto =
            `${p.nombres} ${p.ap_paterno || ""} ${p.ap_materno || ""}`.toUpperCase();
          return (
            nombreCompleto.includes("SISTEMA") ||
            nombreCompleto.includes("NO DISPONIBLE") ||
            nombreCompleto.includes("BLOQUEADO")
          );
        });

        if (!profesorNoDisponible && availableProfessors.length > 0) {
          profesorNoDisponible = availableProfessors[0];
          console.warn(
            "⚠️ No se encontró un profesor 'Sistema'. Usando profesor temporal. Se recomienda crear un usuario llamado 'Sistema NO DISPONIBLE'.",
          );
        }

        if (!cursNoDisponible || !profesorNoDisponible) {
          toast.warning(
            "Necesita tener al menos un curso y un profesor registrado. Recomendación: Cree un curso llamado 'NO DISPONIBLE' y un usuario facilitador llamado 'Sistema' para marcar horarios bloqueados.",
          );
          return;
        }

        const payload = {
          curso_id: cursNoDisponible.curso_id,
          aula_id: parseInt(classroom.value),
          profesor_id: profesorNoDisponible.usuario_id,
          gestion_id: parseInt(selectedGestion.value),
          activo: true,
          dias_clase: [
            {
              dia_semana_id: parseInt(day),
              hora_id: hora.id,
            },
          ],
        };

        console.log("📤 Marcando horario como NO DISPONIBLE:", {
          curso: cursNoDisponible.nombre,
          profesor: `${profesorNoDisponible.nombres} ${profesorNoDisponible.ap_paterno || ""}`,
          payload,
        });

        await fetchWithAuth("https://api-umam-1.onrender.com/horarios/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        await fetchHorarios();
        toast.success("✅ Horario marcado como NO DISPONIBLE");
      }
    } catch (err) {
      console.error("Error al bloquear/desbloquear celda:", err);
      toast.error(`Error: ${err.message || err}`);
    }
  };

  const submitNewCourse = async (formData) => {
    const {
      curso_id,
      profesor_id,
      classroom,
      schedules, // Array de {day, time}
      horario_id,
      is_unavailable,
    } = formData;

    if (!schedules || schedules.length === 0) {
      toast.warning("Debe agregar al menos un horario (día + hora)");
      return;
    }

    try {
      const scheduleEntries = schedules.map((schedule) => {
        const hora = timeSlots.find((h) => h.label === schedule.time);
        if (!hora) {
          throw new Error(`Hora inválida: ${schedule.time}`);
        }

        const aulaId = parseInt(schedule.classroom || classroom, 10);
        if (Number.isNaN(aulaId)) {
          throw new Error("Aula inválida en uno de los horarios");
        }

        return {
          aula_id: aulaId,
          dia_semana_id: parseInt(schedule.day),
          hora_id: hora.id,
        };
      });

      const parsedCursoId = is_unavailable ? null : parseInt(curso_id, 10);
      const parsedProfesorId = is_unavailable
        ? null
        : parseInt(profesor_id, 10);
      const parsedGestionId = parseInt(selectedGestion.value, 10);

      console.log("Bloques de horario a enviar:", scheduleEntries);

      if (isEditingCourse && horario_id) {
        // PUT actualiza el horario SIN borrar inscripciones (el horario_id se mantiene)
        const mainAulaId = parseInt(
          scheduleEntries[0]?.aula_id || classroom,
          10,
        );
        await fetchWithAuth(
          `https://api-umam-1.onrender.com/horarios/${horario_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              curso_id: parsedCursoId,
              aula_id: mainAulaId,
              profesor_id: parsedProfesorId,
              gestion_id: parsedGestionId,
              activo: true,
              horario_id: parseInt(horario_id, 10),
              dias_clase: scheduleEntries.map((item) => ({
                dia_semana_id: item.dia_semana_id,
                hora_id: item.hora_id,
                aula_id: item.aula_id,
              })),
            }),
          },
        );
        toast.success("Horario actualizado exitosamente");
      } else {
        // Crear el mismo paralelo en aulas distintas sin perder la relación lógica.
        const entriesByAula = scheduleEntries.reduce((acc, item) => {
          if (!acc[item.aula_id]) {
            acc[item.aula_id] = [];
          }
          acc[item.aula_id].push(item);
          return acc;
        }, {});

        for (const [aulaId, entries] of Object.entries(entriesByAula)) {
          await fetchWithAuth("https://api-umam-1.onrender.com/horarios/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              curso_id: parsedCursoId,
              aula_id: parseInt(aulaId, 10),
              profesor_id: parsedProfesorId,
              gestion_id: parsedGestionId,
              activo: true,
              dias_clase: entries.map((item) => ({
                dia_semana_id: item.dia_semana_id,
                hora_id: item.hora_id,
                aula_id: item.aula_id,
              })),
            }),
          });
        }

        // Mostrar mensaje con los horarios creados
        const horariosStr = schedules
          .map((s) => {
            const dayName = days.find((d) => d.id === parseInt(s.day))?.name;
            return `${dayName} ${s.time}`;
          })
          .join(", ");
        toast.success(`Horario creado exitosamente: ${horariosStr}`);
      }
      setIsModalOpen(false);
      setCourseFormData(null);
      setIsEditingCourse(false);
      setCourseToEdit(null);
      fetchHorarios();
    } catch (err) {
      console.error("Error en submitNewCourse:", err);
      toast.error(
        `Error al ${isEditingCourse ? "actualizar" : "crear"} horario: ${err.message || err}`,
      );
    }
  };

  const submitNewGestion = async ({ year, year_id, semester }) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const nuevaGestion = `Gestión ${semester === "1" ? "I" : "II"} - ${year}`;

      // Validar que no exista una gestión con el mismo nombre
      const gestionExistente = gestiones.find((g) => g.label === nuevaGestion);
      if (gestionExistente) {
        setSubmitError(`Ya existe una gestión con el nombre "${nuevaGestion}"`);
        setIsSubmitting(false);
        return;
      }

      await fetchWithAuth("https://api-umam-1.onrender.com/cursos/gestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year_id,
          gestion: nuevaGestion,
          semester: parseInt(semester),
          activo: true,
        }),
      });

      const data = await fetchWithAuth(
        "https://api-umam-1.onrender.com/cursos/gestiones",
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
      setSubmitError(error.message || "Error al crear la gestión");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para manejar la solicitud de eliminación de gestión
  const handleDeleteGestion = (gestion) => {
    setGestionToDelete(gestion);
    setIsDeleteGestionModalOpen(true);
  };

  // Función para manejar la edición de cursos
  const handleEditCourse = (course) => {
    // Usar SOLO el horario específico clicado (no todos los del mismo curso+profesora)
    const horarioId = String(course.horario_id || course.id.split("-")[0]);
    const specificHorario = horariosRaw.find(
      (h) => String(h.horario_id) === horarioId,
    );

    const schedules = specificHorario
      ? (specificHorario.dias_clase || [])
          .map((dia) => ({
            day: dia?.dia_semana?.dias_semana_id,
            time: formatTimeSlot(dia?.hora),
            classroom: String(dia?.aula_id || specificHorario?.aula_id || ""),
          }))
          .filter((s) => s.day && s.time && s.classroom)
      : [{ day: course.day, time: course.time, classroom: course.classroom.value }];

    const uniqueSchedules = Array.from(
      new Map(
        schedules.map((s) => [`${s.day}-${s.time}-${s.classroom}`, s]),
      ).values(),
    );

    setCourseToEdit(course);
    setIsEditingCourse(true);
    setCourseFormData({
      curso_id: course.curso_id || "",
      profesor_id: course.profesor_id || "",
      classroom: course.classroom.value,
      classroomObject: course.classroom,
      time: course.time,
      days: uniqueSchedules.map((s) => s.day),
      schedules: uniqueSchedules,
      horario_id: horarioId,
      is_unavailable: course.is_unavailable || false,
    });
    setIsModalOpen(true);
  };

  // Función para confirmar la eliminación de gestión
  const confirmDeleteGestion = async () => {
    if (!gestionToDelete) return;

    setIsDeletingGestion(true);
    setDeleteGestionError(null);

    try {
      await fetchWithAuthDelete(
        `https://api-umam-1.onrender.com/cursos/gestion/${gestionToDelete.value}`,
      );

      // Recargar las gestiones
      const data = await fetchWithAuth(
        "https://api-umam-1.onrender.com/cursos/gestiones",
      );
      const gestionesFormatted = data.map((g) => ({
        value: g.gestion_id.toString(),
        label: g.gestion,
        rawData: g,
      }));
      setGestiones(gestionesFormatted);

      // Si la gestión eliminada era la seleccionada, seleccionar la primera disponible
      if (selectedGestion?.value === gestionToDelete.value) {
        setSelectedGestion(
          gestionesFormatted[0] || {
            value: "",
            label: "No hay gestiones disponibles",
          },
        );
      }

      setIsDeleteGestionModalOpen(false);
      setGestionToDelete(null);
    } catch (error) {
      console.error("Error eliminando gestión:", error);
      setDeleteGestionError(error.message || "Error al eliminar la gestión");
    } finally {
      setIsDeletingGestion(false);
    }
  };

  // Función para abrir el modal de transferir
  const handleTransferCourse = (course) => {
    const rawHorario = horariosRaw.find(
      (h) => h.horario_id === course.horario_id,
    );
    setCourseToTransfer(course);
    setRawHorarioToTransfer(rawHorario || null);
    setIsTransferModalOpen(true);
  };

  // Función para ejecutar la transferencia
  const submitTransferCourse = async (payload) => {
    const horarioId =
      courseToTransfer?.horario_id ||
      parseInt(courseToTransfer?.id?.split("-")[0]);

    if (!horarioId) return;

    const url = `https://api-umam-1.onrender.com/horarios/${horarioId}/transferir`;
    console.log("🔀 Transfiriendo horario:", { horarioId, url, payload });

    setIsTransferring(true);
    try {
      await fetchWithAuth(url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      toast.success(
        `Clase "${courseToTransfer.subject}" transferida exitosamente`,
      );
      setIsTransferModalOpen(false);
      setCourseToTransfer(null);
      setRawHorarioToTransfer(null);
      // Recargar horarios para reflejar el cambio
      await fetchHorarios();
    } catch (error) {
      console.error("Error transfiriendo horario:", error);
      // Mostrar el detalle del error del backend (400 capacidad, 409 conflicto, etc.)
      const msg = error.message || "Error al transferir el horario";
      toast.error(msg);
    } finally {
      setIsTransferring(false);
    }
  };

  const getCourseColorStyle = (subject) => {
    const safeSubject = String(subject || "")
      .trim()
      .toUpperCase();
    const hash = safeSubject
      .split("")
      .reduce((acc, char) => acc * 31 + char.charCodeAt(0), 7);
    const hue = Math.abs(hash) % 360;

    return {
      backgroundColor: `hsl(${hue} 75% 88%)`,
      borderColor: `hsl(${hue} 65% 52%)`,
      color: `hsl(${hue} 55% 22%)`,
    };
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
    // Solo ejecutar fetchHorarios si todos los datos están listos
    if (
      selectedGestion?.value &&
      selectedSucursal?.value &&
      availableSubjects.length > 0 &&
      availableProfessors.length > 0
    ) {
      fetchHorarios();
    }
  }, [
    selectedGestion,
    selectedSucursal,
    availableSubjects,
    availableProfessors,
  ]);

  // Función para manejar la eliminación — consulta inscripciones antes de abrir modal
  const handleDeleteCourse = async (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    setCourseToDelete(course);
    setDeleteInscripcionesCount(0);
    setDeleteError(null);
    setIsDeleteModalOpen(true);

    // Contar cuántos estudiantes tiene este horario
    const horarioId = course?.horario_id || parseInt(course?.id?.split("-")[0]);
    if (horarioId) {
      try {
        const res = await fetchWithAuth(
          "https://api-umam-1.onrender.com/inscripciones/",
        );
        if (res.ok) {
          const allInsc = await res.json();
          const count = (Array.isArray(allInsc) ? allInsc : []).filter(
            (i) => String(i.horario_id) === String(horarioId),
          ).length;
          setDeleteInscripcionesCount(count);
        }
      } catch {}
    }
  };

  // Función para confirmar la eliminación
  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // Eliminar SOLO el horario específico clicado (no afecta otros paralelos)
      const horarioId =
        courseToDelete.horario_id ||
        parseInt(courseToDelete.id?.split("-")[0]);

      if (!horarioId) {
        throw new Error("No se pudo identificar el horario a eliminar");
      }

      await fetchWithAuthDelete(
        `https://api-umam-1.onrender.com/horarios/${horarioId}`,
      );

      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
      await fetchHorarios();
    } catch (error) {
      console.error("Error eliminando horario:", error);
      setDeleteError(error.message || "Error al eliminar el horario");
    } finally {
      setIsDeleting(false);
    }
  };

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
                onDelete={handleDeleteGestion}
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
                timeSlots.find((h) => h.id === selected.value),
              );
            }}
            onDelete={(hour) => {
              const hourToDelete = timeSlots.find((h) => h.id === hour.value);
              handleDeleteHour(hourToDelete);
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
            onClick={async () => {
              // Importar dinámicamente la función para evitar problemas SSR
              const { generateSchedulePDF } = await import("./pdfSchedule");
              generateSchedulePDF({
                timeSlots: filteredTimeSlots,
                availableClassrooms: selectedSucursal?.value
                  ? classroomsBySucursal[selectedSucursal.value] || []
                  : [],
                days,
                courses,
                sucursal:
                  selectedSucursal?.label || selectedSucursal?.nombre || "",
                gestion:
                  selectedGestion?.label || selectedGestion?.gestion || "",
              });
            }}
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
            timeSlots={filteredTimeSlots}
            days={days}
            availableClassrooms={
              selectedSucursal?.value
                ? classroomsBySucursal[selectedSucursal.value] || []
                : []
            }
            onCellClick={handleCellClick}
            onDeleteCourse={handleDeleteCourse}
            onEditCourse={handleEditCourse}
            onEditTimeSlot={(timeLabel) => {
              const hour = timeSlots.find((h) => h.label === timeLabel);
              handleEditHour(hour);
            }}
            onToggleBlockCell={toggleBlockCell}
            isCellBlocked={isCellBlocked}
            onTransferCourse={handleTransferCourse}
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
            setIsEditingCourse(false);
            setCourseToEdit(null);
          }}
        >
          <CourseForm
            onSubmit={submitNewCourse}
            onCancel={() => {
              setIsModalOpen(false);
              setCourseFormData(null);
              setIsEditingCourse(false);
              setCourseToEdit(null);
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
            isEditMode={isEditingCourse}
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
                const horaInicio = e.target.hora_inicio.value;
                const horaFin = e.target.hora_fin.value;

                // Validación
                if (!horaInicio || !horaFin) {
                  toast.warning("Por favor, complete ambos campos");
                  return;
                }

                if (horaInicio >= horaFin) {
                  toast.warning(
                    "La hora de inicio debe ser menor que la hora de fin",
                  );
                  return;
                }

                submitNewHour({
                  hora_inicio: horaInicio + ":00",
                  hora_fin: horaFin + ":00",
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

        {/* Modal para editar hora */}
        <Modal isOpen={isEditHourModalOpen} onClose={closeEditHourModal}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Cambiar Hora</h2>
            <p className="text-sm text-gray-600 mb-3">
              Hora actual:{" "}
              <span className="font-semibold">{hourToEdit?.label}</span>
            </p>
            <form onSubmit={confirmEditHourSelection}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Cambiar por una hora ya creada
                </label>
                <select
                  value={targetHourId}
                  onChange={(e) => setTargetHourId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Seleccione una hora</option>
                  {targetHourOptions.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditHourModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Cambiar Hora
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

                {deleteInscripcionesCount > 0 ? (
                  <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3">
                    <p className="text-sm font-semibold text-red-700">
                      ⚠️ Este horario tiene{" "}
                      <span className="text-red-800 underline">
                        {deleteInscripcionesCount} estudiante(s) inscrito(s)
                      </span>
                      .
                    </p>
                    <p className="mt-1 text-xs text-red-600">
                      Al eliminar, esos estudiantes serán removidos de la lista.
                      Vuelve a inscribirlos manualmente en el horario correcto.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-green-300 bg-green-50 px-4 py-3">
                    <p className="text-sm text-green-700">
                      ✅ Este horario no tiene estudiantes inscritos. Se puede
                      eliminar sin perder datos.
                    </p>
                  </div>
                )}
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

        {/* Modal de confirmación para eliminar gestión */}
        <Modal
          isOpen={isDeleteGestionModalOpen}
          onClose={() =>
            !isDeletingGestion && setIsDeleteGestionModalOpen(false)
          }
          title="Eliminar Gestión"
        >
          <div className="p-6">
            {gestionToDelete && (
              <div className="mb-6">
                <p className="mb-2">
                  ¿Estás seguro que deseas eliminar esta gestión?
                </p>
                <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-300">
                  <div className="text-sm font-semibold">
                    {gestionToDelete.label}
                  </div>
                </div>
                <p className="text-sm text-red-600 mt-3">
                  Advertencia: Esta acción eliminará todos los horarios
                  asociados a esta gestión.
                </p>
              </div>
            )}

            {deleteGestionError && (
              <div className="mb-4 text-red-500 text-sm">
                {deleteGestionError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  !isDeletingGestion && setIsDeleteGestionModalOpen(false)
                }
                disabled={isDeletingGestion}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteGestion}
                disabled={isDeletingGestion}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingGestion ? (
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
                  "Eliminar Gestión"
                )}
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal de confirmación para eliminar hora */}
        <Modal
          isOpen={isDeleteHourModalOpen}
          onClose={() => !isDeletingHour && setIsDeleteHourModalOpen(false)}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 text-red-600">
              Eliminar Hora
            </h2>

            {hourToDelete && (
              <div className="mb-6">
                <p className="mb-2">
                  ¿Estás seguro que deseas eliminar esta hora?
                </p>
                <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-300">
                  <div className="text-lg font-semibold text-center">
                    {hourToDelete.label}
                  </div>
                </div>
                <p className="text-sm text-red-600 mt-3">
                  Nota: Solo se pueden eliminar horas que no estén siendo usadas
                  en ningún horario.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  !isDeletingHour && setIsDeleteHourModalOpen(false)
                }
                disabled={isDeletingHour}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteHour}
                disabled={isDeletingHour}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingHour ? (
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
                  "Eliminar Hora"
                )}
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal de transferir horario */}
        <Modal
          isOpen={isTransferModalOpen}
          onClose={() => !isTransferring && setIsTransferModalOpen(false)}
          title="Transferir Horario"
        >
          <TransferirHorarioForm
            course={courseToTransfer}
            rawHorario={rawHorarioToTransfer}
            sucursales={sucursales}
            classroomsBySucursal={classroomsBySucursal}
            availableProfessors={availableProfessors}
            days={days}
            timeSlots={timeSlots}
            onLoadAulas={fetchAulasForSucursal}
            onSubmit={submitTransferCourse}
            onCancel={() => {
              if (!isTransferring) {
                setIsTransferModalOpen(false);
                setCourseToTransfer(null);
                setRawHorarioToTransfer(null);
              }
            }}
            isSubmitting={isTransferring}
          />
        </Modal>
      </div>
    </div>
  );
};

export default SchedulePage;
