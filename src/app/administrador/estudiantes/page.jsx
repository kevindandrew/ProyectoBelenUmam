"use client";
import { useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";
import { generarFichaEstudiante } from "./pdf";
import HistorialAcademicoModal from "./historial";
import ModalInscripcionAlumno from "./inscripcion";
import EstudiantesTable from "./EstudiantesTable";
import EstudianteForm from "./EstudianteForm";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import Tesseract from "tesseract.js"; // si usas OCR local

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEstudiante, setEditingEstudiante] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [estudianteToDelete, setEstudianteToDelete] = useState(null);
  const [isHistorialOpen, setIsHistorialOpen] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [isInscripcionOpen, setIsInscripcionOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newEstudiante, setNewEstudiante] = useState({
    ap_paterno: "",
    ap_materno: "",
    nombres: "",
    ci: "",
    como_se_entero: "Facebook",
    direccion: "",
    estado_civil: "SOLTERO",
    fecha_nacimiento: "",
    genero: "MASCULINO",
    lugar_nacimiento: "Cochabamba",
    telefono: "",
    datos_academicos: [
      {
        anios_servicio: 0,
        grado_institucion: "",
        otras_habilidades: "",
        ultimo_cargo: "",
      },
    ],
    datos_familiares: [
      {
        ap_materno: "",
        ap_paterno: "",
        direccion: "",
        nombres: "",
        parentesco: "",
        relacion: "BUENA",
        telefono: "",
        tipo: "referencia",
      },
    ],
    datos_medicos: [
      {
        alergias: "",
        enfermedad_base: "",
        frecuencia_medico: "1 VEZ AL MES",
        sistema_salud: "PUBLICO",
        tratamiento_especifico: "",
        tuvo_covid: false,
      },
    ],
  });

  // Cargar estudiantes al montar el componente
  useEffect(() => {
    const fetchEstudiantes = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "https://api-umam-1.onrender.com/estudiantes/",
          {
            headers: {
              Authorization: `bearer ${Cookies.get("access_token")}`,
            },
          }
        );

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const data = await response.json();
        setEstudiantes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando estudiantes:", error);
        setEstudiantes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEstudiantes();
  }, []);

  // Función para manejar búsqueda
  const handleSearch = (e) => setSearchTerm(e.target.value);

  // Funciones para abrir modales
  const openAcademicHistoryModal = (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setIsHistorialOpen(true);
  };

  const openInscripcionModal = (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setIsInscripcionOpen(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setNewEstudiante({
      ap_paterno: "",
      ap_materno: "",
      nombres: "",
      ci: "",
      como_se_entero: "Facebook",
      direccion: "",
      estado_civil: "SOLTERO",
      fecha_nacimiento: "",
      genero: "MASCULINO",
      lugar_nacimiento: "Cochabamba",
      telefono: "",
      datos_academicos: [
        {
          anios_servicio: 0,
          grado_institucion: "",
          otras_habilidades: "",
          ultimo_cargo: "",
        },
      ],
      datos_familiares: [
        {
          ap_materno: "",
          ap_paterno: "",
          direccion: "",
          nombres: "",
          parentesco: "",
          relacion: "BUENA",
          telefono: "",
          tipo: "referencia",
        },
      ],
      datos_medicos: [
        {
          alergias: "",
          enfermedad_base: "",
          frecuencia_medico: "1 VEZ AL MES",
          sistema_salud: "PUBLICO",
          tratamiento_especifico: "",
          tuvo_covid: false,
        },
      ],
    });
    setEditingEstudiante(null);
  };

  // Abrir formulario de edición
  const openEditForm = (estudiante) => {
    setEditingEstudiante(estudiante);
    setNewEstudiante({
      ...estudiante,
      fecha_nacimiento: estudiante.fecha_nacimiento?.split("T")[0] || "",
    });
    setShowForm(true);
  };

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let actualValue = type === "checkbox" ? checked : value;

    if (name === "ci" || name === "telefono" || name.includes("telefono")) {
      const numericValue = value.replace(/\D/g, "");
      if (name === "ci" && numericValue.length > 10) return;
      if (name === "telefono" && numericValue.length > 15) return;
      actualValue = numericValue;
    }

    if (!name.includes(".")) {
      setNewEstudiante((prev) => ({ ...prev, [name]: actualValue }));
      return;
    }

    const [parent, index, field] = name.split(".");
    setNewEstudiante((prev) => {
      const updated = { ...prev };
      updated[parent] = [...updated[parent]];
      updated[parent][index] = {
        ...updated[parent][index],
        [field]: actualValue,
      };
      return updated;
    });
  };

  // Manejar arrays dinámicos
  const addArrayItem = (arrayName) => {
    setNewEstudiante((prev) => {
      const template = {
        datos_academicos: {
          anios_servicio: 0,
          grado_institucion: "",
          otras_habilidades: "",
          ultimo_cargo: "",
        },
        datos_familiares: {
          ap_materno: "",
          ap_paterno: "",
          direccion: "",
          nombres: "",
          parentesco: "",
          relacion: "BUENA",
          telefono: "",
          tipo: "referencia",
        },
        datos_medicos: {
          alergias: "",
          enfermedad_base: "",
          frecuencia_medico: "1 VEZ AL MES",
          sistema_salud: "PUBLICO",
          tratamiento_especifico: "",
          tuvo_covid: false,
        },
      };
      return {
        ...prev,
        [arrayName]: [...prev[arrayName], template[arrayName]],
      };
    });
  };

  const removeArrayItem = (arrayName, index) => {
    setNewEstudiante((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
  };

  // Validar formulario
  const validateForm = () => {
    const requiredFields = [
      "ap_paterno",
      "ap_materno",
      "nombres",
      "ci",
      "fecha_nacimiento",
    ];
    const missingFields = requiredFields.filter(
      (field) => !newEstudiante[field]
    );

    if (missingFields.length > 0) {
      alert(`Faltan campos requeridos: ${missingFields.join(", ")}`);
      return false;
    }

    if (!/^\d{7,8}$/.test(newEstudiante.ci)) {
      alert("El CI debe tener 7 u 8 dígitos");
      return false;
    }

    if (newEstudiante.telefono && !/^\d{6,15}$/.test(newEstudiante.telefono)) {
      alert("El teléfono debe tener entre 6 y 15 dígitos");
      return false;
    }

    /* if (newEstudiante.datos_academicos.length === 0) {
      alert("Debe agregar al menos un dato académico");
      return false;
    } */

    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const url = editingEstudiante
        ? `https://api-umam-1.onrender.com/estudiantes/${editingEstudiante.estudiante_id}`
        : "https://api-umam-1.onrender.com/estudiantes/";

      const method = editingEstudiante ? "PUT" : "POST";

      const dataToSend = {
        ...newEstudiante,
        ci: String(newEstudiante.ci),
        telefono: newEstudiante.telefono
          ? String(newEstudiante.telefono)
          : null,
        datos_academicos: newEstudiante.datos_academicos.map((da) => ({
          ...da,
          anios_servicio: Number(da.anios_servicio) || 0,
        })),
        datos_familiares: newEstudiante.datos_familiares.map((df) => ({
          ...df,
          telefono: df.telefono ? String(df.telefono) : null,
        })),
        datos_medicos: newEstudiante.datos_medicos.map((dm) => ({
          ...dm,
          tuvo_covid:
            dm.tuvo_covid === true || dm.tuvo_covid === "true" ? true : false,
        })),
      };
      console.log("Datos que se enviarán:", dataToSend);
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify(dataToSend),
      });
      console.log(response);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al guardar");
      }

      // Actualizar lista de estudiantes después de guardar
      const fetchResponse = await fetch(
        "https://api-umam-1.onrender.com/estudiantes/",
        {
          headers: { Authorization: `bearer ${Cookies.get("access_token")}` },
        }
      );
      const data = await fetchResponse.json();
      setEstudiantes(data);

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar eliminación de estudiantes
  const openDeleteModal = (estudiante) => {
    console.log("Estudiante a eliminar:", estudiante); // Para debug
    if (!estudiante?.estudiante_id) {
      console.error("Estudiante sin ID recibido:", estudiante);
      return;
    }
    setEstudianteToDelete(estudiante);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!estudianteToDelete?.estudiante_id) {
      console.error(
        "Intento de eliminar estudiante inválido:",
        estudianteToDelete
      );
      alert("Error: No se pudo identificar el estudiante a eliminar");
      setShowDeleteModal(false);
      return;
    }

    setIsDeleting(true);

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        throw new Error(
          "No estás autenticado. Por favor, inicia sesión nuevamente."
        );
      }

      const response = await fetch(
        `https://api-umam-1.onrender.com/estudiantes/${estudianteToDelete.estudiante_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      // Actualizar estado optimizado
      setEstudiantes((prev) =>
        prev.filter((e) => e.estudiante_id !== estudianteToDelete.estudiante_id)
      );
      setShowDeleteModal(false);
      setEstudianteToDelete(null);
    } catch (error) {
      console.error("Error al eliminar:", error);

      if (error.message.includes("401")) {
        alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
      } else if (error.message.includes("403")) {
        alert("No tienes permisos para eliminar estudiantes.");
      } else if (error.message.includes("422")) {
        alert(
          "No se puede eliminar el estudiante porque tiene registros relacionados."
        );
      } else {
        alert(`Error al eliminar: ${error.message}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrar estudiantes para búsqueda
  const filteredEstudiantes = useMemo(() => {
    return estudiantes.filter((estudiante) =>
      `${estudiante.ap_paterno} ${estudiante.ap_materno} ${estudiante.nombres} ${estudiante.ci}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [estudiantes, searchTerm]);

  // Renderizado del componente
  return (
    <div className="text-gray-900 relative p-4">
      <h1 className="text-3xl font-bold text-[#13678A] border-b pb-2 mb-6">
        ESTUDIANTES
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="registros" className="text-sm text-gray-900">
            Mostrar
          </label>
          <select
            id="registros"
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
          <span className="text-sm">registros</span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="buscar" className="text-sm">
            Buscar:
          </label>
          <input
            id="buscar"
            type="text"
            placeholder="Buscar estudiante..."
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        {/* OCR Buttons start */}
        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            id="ocr-front"
            hidden
            onChange={(e) => handleOCRUpload(e, "front")}
          />
          <label
            htmlFor="ocr-front"
            className="bg-blue-500 text-white px-3 py-2 rounded cursor-pointer hover:bg-blue-600"
          >
            Subir Carnet Anverso
          </label>

          <input
            type="file"
            accept="image/*"
            id="ocr-back"
            hidden
            onChange={(e) => handleOCRUpload(e, "back")}
          />
          <label
            htmlFor="ocr-back"
            className="bg-purple-500 text-white px-3 py-2 rounded cursor-pointer hover:bg-purple-600"
          >
            Subir Carnet Reverso
          </label>
        </div>
        {/* OCR Buttons end */}
        <button
          className="bg-teal-500 text-white px-4 py-2 rounded text-sm hover:bg-teal-600 self-start sm:self-auto"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          aria-label="Nuevo Estudiante"
        >
          + Nuevo Estudiante
        </button>
      </div>

      <EstudiantesTable
        estudiantes={filteredEstudiantes}
        loading={loading}
        onViewAcademicHistory={openAcademicHistoryModal}
        onInscripcion={openInscripcionModal}
        onViewPDF={generarFichaEstudiante}
        onEdit={openEditForm}
        onDelete={(estudiante) => openDeleteModal(estudiante)}
      />

      <div className="flex justify-end items-center gap-4 mt-4">
        <button className="text-sm text-gray-500 hover:text-black">
          Anterior
        </button>
        <button className="text-sm text-gray-500 hover:text-black">
          Siguiente
        </button>
      </div>

      {/* Modales */}
      {isHistorialOpen && (
        <HistorialAcademicoModal
          estudiante={estudianteSeleccionado}
          isOpen={isHistorialOpen}
          onClose={() => {
            setIsHistorialOpen(false);
            setEstudianteSeleccionado(null); // Limpiar selección
          }}
        />
      )}

      {isInscripcionOpen && (
        <ModalInscripcionAlumno
          estudiante={estudianteSeleccionado}
          isOpen={isInscripcionOpen}
          onClose={() => {
            setIsInscripcionOpen(false);
            setEstudianteSeleccionado(null); // Limpiar selección
          }}
        />
      )}

      {showForm && (
        <EstudianteForm
          estudiante={newEstudiante}
          isEditing={!!editingEstudiante}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onAddArrayItem={addArrayItem}
          onRemoveArrayItem={removeArrayItem}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {showDeleteModal && estudianteToDelete && (
        <DeleteConfirmationModal
          estudiante={estudianteToDelete}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setEstudianteToDelete(null);
          }}
          isDeleting={isDeleting}
        />
      )}
      {/* Nuevos modales - AÑADIR JUSTO AQUÍ */}
    </div>
  );
}
