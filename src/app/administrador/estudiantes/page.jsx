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

const API_URL = "https://api-umam-1.onrender.com";

const handleFetchResponse = async (response) => {
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent("sessionExpired"));
    Cookies.remove("access_token");
    Cookies.remove("user_data");
    throw new Error("Sesión expirada...");
  }
  return response;
};

export default function EstudiantesPage() {
  // Dentro de tu componente EstudiantesPage (arriba de los demás estados)
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrImages, setOcrImages] = useState({
    anverso: null,
    reverso: null,
    tipo: "tipo1", // 'tipo1' o 'tipo2'
  });
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
    macrodistrito: "Cotahuma",
    whatsapp: "",
    estado_civil: "SOLTERO",
    fecha_nacimiento: "",
    genero: "MASCULINO",
    lugar_nacimiento: "Cochabamba",
    telefono: "",
    grado_institucion: "Ninguno",
    ultimo_cargo: "",
    anios_servicio: "",
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

  function formatearFecha(fechaStr) {
    if (!fechaStr || fechaStr === "No encontrada") return "No encontrada";

    // Map con meses en español a número
    const meses = {
      enero: "01",
      febrero: "02",
      marzo: "03",
      abril: "04",
      mayo: "05",
      junio: "06",
      julio: "07",
      agosto: "08",
      septiembre: "09",
      octubre: "10",
      noviembre: "11",
      diciembre: "12",
    };

    // Extraer día, mes y año
    const regex = /(\d{1,2})\s+de\s+([a-zA-Z]+)\s+de\s+(\d{4})/i;
    const match = fechaStr.match(regex);

    if (!match) return "No encontrada";

    const dia = match[1].padStart(2, "0");
    const mes = meses[match[2].toLowerCase()] || "00";
    const anio = match[3];

    if (mes === "00") return "No encontrada";

    return `${anio}-${mes}-${dia}`;
  }

  // Función para extraer datos del anverso (Tipo 1 - Carnet Azul)
  const procesarAnversoTipo1 = (texto) => {
    const resultado = {};
    texto = texto.replace(/\s{2,}/g, " ").replace(/\n+/g, "\n");

    // CI con más patrones
    const ciMatch =
      texto.match(/N\s*[:\-]?\s*(\d{6,10})/) || texto.match(/(\d{7,10})$/);

    // Apellidos mejorados (como en el código original)
    const apellidosMatch = texto.match(/APELLIDOS\s*[\n:\-]*\s*([A-Z\s]+)/i);

    if (apellidosMatch) {
      let apellidosLimpios = apellidosMatch[1]
        .trim()
        .split(/\s+/) // divide por espacios reales
        .filter((p) => p.length > 1)
        .slice(0, 2);

      resultado.apellido_paterno = apellidosLimpios[0] || "No encontrado";
      resultado.apellido_materno = apellidosLimpios[1] || "No encontrado";
    } else {
      resultado.apellido_paterno = "No encontrado";
      resultado.apellido_materno = "No encontrado";
    }

    //nombres
    const nombresMatch = texto.match(/NOMBRES\s*[\n:\-]*\s*([A-Z\s]+)/i);
    if (nombresMatch) {
      let nombres = nombresMatch[1].trim();
      nombres = nombres.replace(/^[A-Z]\s+/, "").trim();
      resultado.nombres = nombres;
    } else {
      resultado.nombres = "No encontrado";
    }
    // Fecha de nacimiento
    const fechas = texto.match(/\d{2}\/\d{2}\/\d{4}/g);
    resultado.fecha_nacimiento = fechas?.[0] || "No encontrada";
    return {
      ci: ciMatch?.[1] || "",
      nombres: resultado.nombres,
      ap_paterno: resultado.apellido_paterno,
      ap_materno: resultado.apellido_materno,
      fecha_nacimiento: resultado.fecha_nacimiento,
    };
  };

  // Función para extraer datos del reverso (Tipo 1)
  const procesarReversoTipo1 = (texto) => {
    texto = texto.replace(/[^\w\sÁÉÍÓÚÑáéíóú°\/\.\-\n]/g, "");
    // Ocupación como en el código original
    const ocupacionMatch = texto.match(
      /OCUPACION[\s\S]*?\n?([A-ZÁÉÍÓÚÑ\s]{4,})\n?/i,
    );
    const ocupacionBruta = ocupacionMatch ? ocupacionMatch[1].trim() : "";
    const ocupacionesPosibles = ["ESTUDIANTE", "MÉDICO", "ABOGADO" /* ... */];
    let ocupacionFinal = "No encontrado";
    for (let palabra of ocupacionesPosibles) {
      if (ocupacionBruta.includes(palabra)) {
        ocupacionFinal = palabra;
        break;
      }
    }
    return {
      direccion:
        texto.match(/DOMICILIO[\s\/:\-]*\n?.*?(AV\.[^\n]+)/i)?.[1]?.trim() ||
        "",
      estado_civil:
        texto.match(/ESTADO\s*CIVIL\s*\n?([A-ZÁÉÍÓÚÑ]+)/i)?.[1] || "SOLTERO",
      ocupacion: ocupacionFinal,
    };
  };
  // Función para extraer datos del anverso (Tipo 2 - Carnet Amarillo)
  const procesarAnversoTipo2 = (texto) => {
    const cleanedText = texto
      .replace(/[^\w\sÁÉÍÓÚÑáéíóú°\/\.\-\n]/g, "")
      .trim();

    const ciMatch = cleanedText.match(
      /(No\.|N°|Numero|Número)\s*([0-9]{6,8})/i,
    );

    const fallbackMatch = cleanedText.match(/\b\d{6,8}\b/g);
    const probableCi = fallbackMatch?.reduce(
      (a, b) => (b.length > a.length ? b : a),
      "",
    );

    return {
      ci: ciMatch?.[2] || probableCi || "",
    };
  };
  // Función para extraer datos del reverso (Tipo 2)
  const procesarReversoTipo2 = (texto) => {
    const resultado = {};
    texto = texto.replace(/\s{2,}/g, " ").replace(/\n+/g, "\n");
    // 🔍 Extraer nombre completo robusto
    const nombreMatch = texto.match(/A\s+([A-ZÁÉÍÓÚÑ\s]{10,})/);
    const nombreCompleto = nombreMatch
      ? nombreMatch[1].replace(/\s+/g, " ").trim()
      : "No encontrado";

    const partes = separarNombreCompletoDefinitivo(nombreCompleto);

    resultado.nombres = partes.nombres;
    resultado.apellido_paterno = partes.apellidoPaterno;
    resultado.apellido_materno = partes.apellidoMaterno;

    // 📅 Fecha de nacimiento (variante robusta con fallback)
    const fechaMatch =
      texto.match(
        /(Nacido el|Nacido|Nac\.)\s*(\d{1,2}\s+de\s+[A-Za-z]+\s+de\s+\d{4})/i,
      ) || texto.match(/\d{2}\/\d{2}\/\d{4}/);

    resultado.fecha_nacimiento =
      fechaMatch?.[2] || fechaMatch?.[0] || "No encontrada";

    // ❤️ Estado civil más robusto
    const estadoCivilMatch = texto.match(
      /ESTADO\s*CIVIL[:\-\n\s]*([A-ZÁÉÍÓÚÑ]+)/i,
    );
    let estadoCivilRaw = estadoCivilMatch
      ? estadoCivilMatch[1].trim().toUpperCase()
      : "NO ENCONTRADO";

    const estadoCivilMap = {
      SOLTERA: "SOLTERO",
      SOLTERO: "SOLTERO",
      CASADA: "CASADO",
      CASADO: "CASADO",
      // agrega más equivalencias si quieres
    };

    resultado.estado_civil = estadoCivilMap[estadoCivilRaw] || estadoCivilRaw;
    // 🏠 Dirección (más tolerante con OCR)
    const domicilioLineMatch = texto.match(
      /DOMICILI[A-Z]?\s*[:\-]?\s*([^\n]+)/i,
    );
    const direccion = domicilioLineMatch
      ? domicilioLineMatch[1].trim()
      : "No encontrado";

    resultado.direccion = direccion;
    resultado.domicilio = direccion; // Añadirlo también como "domicilio"
    return resultado;
  };

  // Función auxiliar para separar nombres y apellidos (específica para formato tipo 2)
  const separarNombreCompletoTipo2 = (nombreCompleto) => {
    if (!nombreCompleto || nombreCompleto === "No encontrado") {
      return {
        nombres: "No identificado",
        apellidoPaterno: "No identificado",
        apellidoMaterno: "No identificado",
      };
    }

    const partes = nombreCompleto.split(/\s+/).filter((p) => p.length > 1);

    // Caso típico: 2 nombres + 2 apellidos
    if (partes.length >= 4) {
      return {
        nombres: partes.slice(0, 2).join(" "),
        apellidoPaterno: partes[2],
        apellidoMaterno: partes[3],
      };
    }
    // Caso con 1 nombre + 2 apellidos
    else if (partes.length === 3) {
      return {
        nombres: partes[0],
        apellidoPaterno: partes[1],
        apellidoMaterno: partes[2],
      };
    }
    // Caso con solo 2 partes (1 nombre + 1 apellido)
    else if (partes.length === 2) {
      return {
        nombres: partes[0],
        apellidoPaterno: partes[1],
        apellidoMaterno: "No identificado",
      };
    }
    // Caso de error
    return {
      nombres: nombreCompleto,
      apellidoPaterno: "No identificado",
      apellidoMaterno: "No identificado",
    };
  };
  const separarNombreCompletoDefinitivo = (nombreCompleto) => {
    if (!nombreCompleto || nombreCompleto === "No encontrado") {
      return {
        nombres: "No identificado",
        apellidoPaterno: "No identificado",
        apellidoMaterno: "No identificado",
      };
    }

    const partes = nombreCompleto.split(/\s+/).filter((p) => p.length > 1);

    if (partes.length >= 4) {
      return {
        nombres: partes.slice(0, 2).join(" "),
        apellidoPaterno: partes[2],
        apellidoMaterno: partes[3],
      };
    } else if (partes.length === 3) {
      return {
        nombres: partes[0],
        apellidoPaterno: partes[1],
        apellidoMaterno: partes[2],
      };
    } else if (partes.length === 2) {
      return {
        nombres: partes[0],
        apellidoPaterno: partes[1],
        apellidoMaterno: "No identificado",
      };
    }
    return {
      nombres: nombreCompleto,
      apellidoPaterno: "No identificado",
      apellidoMaterno: "No identificado",
    };
  };

  // Función unificada para procesar imágenes
  const procesarCarnet = async () => {
    if (!ocrImages.anverso || !ocrImages.reverso) {
      alert("Sube ambas imágenes del carnet");
      return;
    }

    setOcrLoading(true);

    try {
      const [anversoResult, reversoResult] = await Promise.all([
        Tesseract.recognize(ocrImages.anverso, "eng"),
        Tesseract.recognize(ocrImages.reverso, "eng"),
      ]);

      const textoLimpio1anverso = anversoResult.data.text
        .replace(/[^\w\sÁÉÍÓÚÑáéíóú°\/\.\-\n]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      const textoLimpio1reverso = reversoResult.data.text
        .replace(/[^\w\sÁÉÍÓÚÑáéíóú°\/\.\-\n]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      const tipo = ocrImages.tipo;

      // Procesar datos según tipo
      const datosAnverso =
        tipo === "tipo1"
          ? procesarAnversoTipo1(textoLimpio1anverso)
          : procesarAnversoTipo2(textoLimpio1anverso);

      const datosReverso =
        tipo === "tipo1"
          ? procesarReversoTipo1(textoLimpio1reverso)
          : procesarReversoTipo2(textoLimpio1reverso);

      // Determinar fecha
      const fechaNacimiento =
        datosAnverso.fecha_nacimiento || datosReverso.fecha_nacimiento;
      let fechaFormateada = "No encontrada";

      if (fechaNacimiento) {
        if (fechaNacimiento.includes("de")) {
          fechaFormateada = formatearFecha(fechaNacimiento);
        } else if (fechaNacimiento.includes("/")) {
          const [day, month, year] = fechaNacimiento.split("/");
          fechaFormateada = `${year}-${month.padStart(2, "0")}-${day.padStart(
            2,
            "0",
          )}`;
        }
      }

      // Extraer nombres y apellidos dependiendo del tipo
      let nombres = "";
      let ap_paterno = "";
      let ap_materno = "";

      if (tipo === "tipo1") {
        nombres = datosAnverso.nombres || "";
        ap_paterno =
          datosAnverso.ap_paterno || datosAnverso.apellido_paterno || "";
        ap_materno =
          datosAnverso.ap_materno || datosAnverso.apellido_materno || "";
      } else if (tipo === "tipo2") {
        nombres = datosReverso.nombres || "";
        ap_paterno = datosReverso.apellido_paterno || "";
        ap_materno = datosReverso.apellido_materno || "";
      }

      const direccion = datosReverso.direccion || datosReverso.domicilio || "";
      const estado_civil = datosReverso.estado_civil || "SOLTERO";

      setNewEstudiante((prev) => ({
        ...prev,
        ci: datosAnverso.ci || "",
        nombres,
        ap_paterno,
        ap_materno,
        fecha_nacimiento: fechaFormateada,
        direccion,
        estado_civil,
      }));

      const camposExtraidos = [
        datosAnverso.ci && "CI",
        nombres && "Nombres",
        ap_paterno && "Apellido Paterno",
        ap_materno && "Apellido Materno",
        fechaNacimiento && "Fecha Nacimiento",
        direccion && "Dirección",
        estado_civil && "Estado Civil",
      ]
        .filter(Boolean)
        .join(", ");
      setShowOCRModal(false);
    } catch (error) {
      console.error("Error en OCR:", error);
      alert("Error al leer el carnet. Sube una foto más clara");
    } finally {
      setOcrLoading(false);
    }
  };

  // Cargar estudiantes al montar el componente
  useEffect(() => {
    const fetchEstudiantes = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/estudiantes/`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("access_token")}`,
          },
        });
        await handleFetchResponse(response);

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
      como_se_entero: "",
      direccion: "",
      macrodistrito: "Cotahuma",
      whatsapp: "",
      estado_civil: "",
      fecha_nacimiento: "",
      genero: "",
      lugar_nacimiento: "",
      telefono: "",
      grado_institucion: "Ninguno",
      ultimo_cargo: "",
      anios_servicio: "",
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
          relacion: "",
          telefono: "",
          tipo: "",
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

    // Separar macrodistrito de la dirección si existe
    let macrodistrito = "Cotahuma";
    let direccionSola = estudiante.direccion || "";

    if (estudiante.direccion && estudiante.direccion.includes(",")) {
      const partes = estudiante.direccion.split(",");
      macrodistrito = partes[0].trim();
      direccionSola = partes.slice(1).join(",").trim();
    }

    setNewEstudiante({
      ...estudiante,
      fecha_nacimiento: estudiante.fecha_nacimiento?.split("T")[0] || "",
      macrodistrito: macrodistrito,
      direccion: direccionSola,
      whatsapp: estudiante.whatsapp || "",
      grado_institucion:
        estudiante.datos_academicos?.[0]?.grado_institucion || "Ninguno",
      ultimo_cargo: estudiante.datos_academicos?.[0]?.ultimo_cargo || "",
      anios_servicio: estudiante.datos_academicos?.[0]?.anios_servicio || "",
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
      (field) => !newEstudiante[field],
    );

    if (missingFields.length > 0) {
      alert(`Faltan campos requeridos: ${missingFields.join(", ")}`);
      return false;
    }

    if (!/^\d{5,10}$/.test(newEstudiante.ci)) {
      alert("El CI debe tener 7 u 8 dígitos");
      return false;
    }

    if (newEstudiante.telefono && !/^\d{6,15}$/.test(newEstudiante.telefono)) {
      alert("El teléfono debe tener entre 6 y 15 dígitos");
      return false;
    }

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

      // Combinar macrodistrito y dirección
      const direccionCompleta =
        newEstudiante.macrodistrito && newEstudiante.direccion
          ? `${newEstudiante.macrodistrito}, ${newEstudiante.direccion}`
          : newEstudiante.direccion || newEstudiante.macrodistrito || "";

      const dataToSend = {
        ...newEstudiante,
        ci: String(newEstudiante.ci),
        direccion: direccionCompleta,
        telefono: newEstudiante.telefono
          ? String(newEstudiante.telefono)
          : null,
        datos_academicos: [
          {
            grado_institucion: newEstudiante.grado_institucion || "",
            ultimo_cargo: newEstudiante.ultimo_cargo || "",
            anios_servicio: Number(newEstudiante.anios_servicio) || 0,
            otras_habilidades: "",
          },
        ],
        datos_familiares: (newEstudiante.datos_familiares || []).map((df) => ({
          ap_paterno: df?.ap_paterno || "",
          ap_materno: df?.ap_materno || "",
          nombres: df?.nombres || "",
          parentesco: df?.parentesco || "",
          direccion: df?.direccion || "",
          telefono: df?.telefono ? String(df.telefono) : null,
          tipo: "referencia",
          relacion: "BUENA",
        })),
        datos_medicos: (newEstudiante.datos_medicos || []).map((dm) => ({
          sistema_salud: dm?.sistema_salud || "PUBLICO",
          enfermedad_base: dm?.enfermedad_base || "",
          tratamiento_especifico: dm?.tratamiento_especifico || "",
          frecuencia_medico: "1 VEZ AL MES",
          alergias: "",
          tuvo_covid: false,
        })),
      };

      // Eliminar campos temporales que no van al backend
      delete dataToSend.macrodistrito;
      delete dataToSend.whatsapp;
      delete dataToSend.grado_institucion;
      delete dataToSend.ultimo_cargo;
      delete dataToSend.anios_servicio;
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify(dataToSend),
      });
      await handleFetchResponse(response);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error del backend:", errorData);
        alert(`Error: ${JSON.stringify(errorData, null, 2)}`);
        throw new Error(errorData.message || "Error al guardar");
      }

      // Actualizar lista de estudiantes después de guardar
      const fetchResponse = await fetch(`${API_URL}/estudiantes/`, {
        headers: { Authorization: `Bearer ${Cookies.get("access_token")}` },
      });
      await handleFetchResponse(fetchResponse);
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
        estudianteToDelete,
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
          "No estás autenticado. Por favor, inicia sesión nuevamente.",
        );
      }

      const response = await fetch(
        `${API_URL}/estudiantes/${estudianteToDelete.estudiante_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      await handleFetchResponse(response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      // Actualizar estado optimizado
      setEstudiantes((prev) =>
        prev.filter(
          (e) => e.estudiante_id !== estudianteToDelete.estudiante_id,
        ),
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
          "No se puede eliminar el estudiante porque tiene registros relacionados.",
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
        .includes(searchTerm.toLowerCase()),
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
            maxLength={100}
            onChange={handleSearch}
          />
        </div>
        {/* OCR Buttons start */}
        {/* <div className="flex gap-2">
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
        </div> */}
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
          onOpenOCR={() => setShowOCRModal(true)} // ← Nueva prop
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

      {showOCRModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowOCRModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Escanear Carnet</h2>

            <select
              value={ocrImages.tipo}
              onChange={(e) =>
                setOcrImages((prev) => ({ ...prev, tipo: e.target.value }))
              }
              className="mb-4 p-2 border rounded w-full"
            >
              <option value="tipo1">Carnet Tipo 1 (Azul)</option>
              <option value="tipo2">Carnet Tipo 2 (Amarillo)</option>
            </select>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block mb-2">Anverso:</label>
                <input
                  type="file"
                  onChange={(e) =>
                    setOcrImages((prev) => ({
                      ...prev,
                      anverso: e.target.files[0],
                    }))
                  }
                  className="w-full"
                />
                {ocrImages.anverso && (
                  <img
                    src={URL.createObjectURL(ocrImages.anverso)}
                    className="mt-2 max-h-40 rounded border"
                    alt="Previsualización anverso"
                  />
                )}
              </div>

              <div>
                <label className="block mb-2">Reverso:</label>
                <input
                  type="file"
                  onChange={(e) =>
                    setOcrImages((prev) => ({
                      ...prev,
                      reverso: e.target.files[0],
                    }))
                  }
                  className="w-full"
                />
                {ocrImages.reverso && (
                  <img
                    src={URL.createObjectURL(ocrImages.reverso)}
                    className="mt-2 max-h-40 rounded border"
                    alt="Previsualización reverso"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowOCRModal(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={procesarCarnet}
                disabled={
                  ocrLoading || !ocrImages.anverso || !ocrImages.reverso
                }
                className={`bg-blue-600 text-white px-4 py-2 rounded ${
                  ocrLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {ocrLoading ? "Procesando..." : "Extraer Datos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
