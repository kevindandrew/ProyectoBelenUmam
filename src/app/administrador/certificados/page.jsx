// src/app/administrador/certificados/page.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";

// Datos de estudiantes por curso (simulados - en producción vendrían de una API)
const estudiantesPorCurso = {
  Computación: [
    { nombre: "MARÍA FERNANDA GUTIÉRREZ", ci: "1234567 LP" },
    { nombre: "JUAN CARLOS PÉREZ", ci: "7654321 SC" },
  ],
  "Computación Avanzada": [{ nombre: "ANA LUCÍA MÉNDEZ", ci: "9876543 LP" }],
  Salud: [
    { nombre: "CARLOS ALBERTO QUISPE", ci: "5432167 LP" },
    { nombre: "SOFÍA ANDREA ARUQUIPA", ci: "8765432 LP" },
  ],
  "Orientación Legal": [{ nombre: "PEDRO ANTONIO GÓMEZ", ci: "1357924 CB" }],
};

export default function GeneradorCertificados() {
  // Estado principal
  const [formData, setFormData] = useState({
    tipo: "TALLER",
    curso: "",
    fecha: new Date().toLocaleDateString("es-BO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    añoCurricular: new Date().getFullYear().toString(),
    fondo: "",
    contenidoPersonalizado: "",
    firmantes: {
      alcalde: "Lic. Iván Arias Durán",
      cargoAlcalde: "ALCALDE MUNICIPAL DE LA PAZ",
      secretario: "Lic. Jacques Alcoba Barba",
      cargoSecretario:
        "SECRETARIO MUNICIPAL DE EDUCACIÓN Y DESARROLLO SOCIAL GAMLP",
    },
  });

  // Fondos predeterminados
  const fondosPredeterminados = {
    TALLER: "/fondos/fondo-taller.jpg", // Ruta a tu imagen de fondo para talleres
    GESTORIA: "/fondos/fondo-gestoria.jpg", // Ruta a tu imagen de fondo para gestorías
  };

  // Previsualización de imágenes
  const [previewFondo, setPreviewFondo] = useState(
    fondosPredeterminados.TALLER
  );

  // Referencia para input de archivo
  const fileInputRef = useRef(null);

  // Plantillas base
  const plantillasBase = {
    TALLER: {
      contenido: [
        ``,
        ``,
        `El Gobierno Autónomo Municipal de La Paz, a través de la Unidad del Adulto Mayor`,
        `dependiente de la Secretaría Municipal de Educación y Desarrollo Social, confiere el`,
        `presente certificado a:`,
        ``,
        `[NOMBRE_ESTUDIANTE]`,
        ``,
        `Por haber culminado satisfactoriamente el curso de <b>"Taller de [NOMBRE_CURSO]"</b>,`,
        `impartido en la <b>Universidad Municipal del Adulto Mayor (UMAM)</b>.`,
        ``,
        ``,
        ``,
        ``,
        `La Paz, [FECHA]`,
      ].join("\n"),
    },
    GESTORIA: {
      contenido: [
        ``,
        ``,
        `El Gobierno Autónomo Municipal de La Paz, a través de la Unidad del Adulto Mayor`,
        `dependiente de la Secretaría Municipal de Educación y Desarrollo Social, confiere el`,
        `presente certificado a:`,
        ``,
        `[NOMBRE_ESTUDIANTE]`,
        ``,
        `Por haber concluido satisfactoriamente los módulos correspondientes al Proyecto de`,
        `Desarrollo de Gestor Social, según malla curricular [AÑO] de la`,
        `<b>Universidad Municipal del Adulto Mayor (UMAM)</b>, obteniendo la certificación como`,
        `<b>Gestor Social</b> con mención en <b>[NOMBRE_CURSO]</b>.`,
        ``,
        ``,
        ``,
        ``,
        `La Paz, [FECHA]`,
      ].join("\n"),
    },
  };

  // Cursos disponibles
  const cursos = {
    TALLER: [
      "Computación",
      "Computación Avanzada",
      "Manualidades",
      "Repostería y Pastelería",
      "Inglés Básico",
      "Danza Folklórica",
    ],
    GESTORIA: ["Orientación Legal", "Nuevas Tecnologías", "Salud", "Turismo"],
  };

  // Cargar plantilla al cambiar tipo
  useEffect(() => {
    const fondo = formData.fondo || fondosPredeterminados[formData.tipo];
    setPreviewFondo(fondo);

    setFormData((prev) => ({
      ...prev,
      fondo,
      contenidoPersonalizado: plantillasBase[prev.tipo].contenido
        .replace("[NOMBRE_ESTUDIANTE]", "[NOMBRE_ESTUDIANTE]")
        .replace("[NOMBRE_CURSO]", prev.curso || "[NOMBRE_CURSO]")
        .replace("[FECHA]", prev.fecha || "[FECHA]")
        .replace("[AÑO]", prev.añoCurricular || "[AÑO]"),
    }));
  }, [formData.tipo, formData.curso, formData.fecha, formData.añoCurricular]);

  // Manejar cambio de imagen de fondo
  const handleFondoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewFondo(reader.result);
        setFormData((prev) => ({ ...prev, fondo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Generar un certificado en el PDF
  const agregarCertificadoAlPDF = (doc, estudiante, pageWidth, pageHeight) => {
    // Agregar fondo
    if (formData.fondo) {
      doc.addImage(formData.fondo, "JPEG", 0, 0, pageWidth, pageHeight);
    }

    // Procesar contenido personalizado
    const contenido = formData.contenidoPersonalizado
      .replace("[NOMBRE_ESTUDIANTE]", estudiante.nombre.toUpperCase())
      .replace("[NOMBRE_CURSO]", formData.curso)
      .replace("[FECHA]", formData.fecha)
      .replace("[AÑO]", formData.añoCurricular);

    // Configuración de texto
    doc.setFont("helvetica");
    doc.setTextColor(0, 0, 0);

    // Contenido - Texto justificado
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");

    let yPos = 80; // Posición inicial

    contenido.split("\n").forEach((linea) => {
      if (linea.trim() === "") {
        yPos += 5;
      } else {
        // Procesar texto con formato HTML básico (negritas)
        const hasBold = linea.includes("<b>");

        if (hasBold) {
          // Procesar partes en negrita
          const parts = linea.split(/(<b>|<\/b>)/);
          let currentX =
            (pageWidth - doc.getTextWidth(linea.replace(/<b>|<\/b>/g, ""))) / 2;

          parts.forEach((part) => {
            if (part === "<b>") {
              doc.setFont(undefined, "bold");
            } else if (part === "</b>") {
              doc.setFont(undefined, "normal");
            } else if (part) {
              doc.text(part, currentX, yPos, { align: "left" });
              currentX += doc.getTextWidth(part);
            }
          });

          yPos += 6;
        } else {
          // Línea normal (nombre del estudiante con tratamiento especial)
          if (linea === estudiante.nombre.toUpperCase()) {
            doc.setFontSize(18);
            doc.setFont(undefined, "bold");
            doc.text(linea, pageWidth / 2, yPos, { align: "center" });
            doc.setFontSize(12);
            doc.setFont(undefined, "normal");
            yPos += 8;
          } else {
            // Texto justificado
            const lines = doc.splitTextToSize(linea, pageWidth - 40);
            lines.forEach((line) => {
              doc.text(line, 20, yPos, {
                align: "justify",
                maxWidth: pageWidth - 40,
              });
              yPos += 6;
            });
          }
        }
      }
    });

    // Firmas centradas
    doc.setFontSize(10);
    const firmaY = pageHeight - 60;

    // Alcalde
    doc.setFont(undefined, "bold");
    doc.text(formData.firmantes.alcalde, pageWidth / 2, firmaY, {
      align: "center",
    });
    doc.setFont(undefined, "normal");
    doc.text(formData.firmantes.cargoAlcalde, pageWidth / 2, firmaY + 5, {
      align: "center",
    });

    // Secretario
    doc.setFont(undefined, "bold");
    doc.text(formData.firmantes.secretario, pageWidth / 2, firmaY + 20, {
      align: "center",
    });
    doc.setFont(undefined, "normal");
    doc.text(formData.firmantes.cargoSecretario, pageWidth / 2, firmaY + 25, {
      align: "center",
    });
  };

  // Generar un solo PDF con todos los certificados del curso
  const generarPDFCursoCompleto = () => {
    if (!formData.curso) {
      alert("Por favor seleccione un curso");
      return;
    }

    const estudiantes = estudiantesPorCurso[formData.curso] || [];
    if (estudiantes.length === 0) {
      alert(
        `No hay estudiantes registrados para el curso de ${formData.curso}`
      );
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "letter",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Generar primera página
    agregarCertificadoAlPDF(doc, estudiantes[0], pageWidth, pageHeight);

    // Generar páginas adicionales para los demás estudiantes
    for (let i = 1; i < estudiantes.length; i++) {
      doc.addPage();
      agregarCertificadoAlPDF(doc, estudiantes[i], pageWidth, pageHeight);
    }

    // Guardar el PDF con todos los certificados
    doc.save(`certificados_${formData.curso.replace(/\s+/g, "_")}.pdf`);
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Actualizar contenido si cambian campos clave
      if (["curso", "fecha", "añoCurricular"].includes(name)) {
        newData.contenidoPersonalizado = prev.contenidoPersonalizado
          .replace(
            "[NOMBRE_CURSO]",
            name === "curso" ? value : prev.curso || "[NOMBRE_CURSO]"
          )
          .replace(
            "[FECHA]",
            name === "fecha" ? value : prev.fecha || "[FECHA]"
          )
          .replace(
            "[AÑO]",
            name === "añoCurricular" ? value : prev.añoCurricular || "[AÑO]"
          );
      }

      return newData;
    });
  };

  // Manejar cambios en los firmantes
  const handleFirmanteChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      firmantes: {
        ...prev.firmantes,
        [name]: value,
      },
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold text-[#13678A] mb-6">
        Generador de Certificados UMAM
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna izquierda - Formulario */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[#012030]">
              Configuración del Certificado
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Certificado*
                </label>
                <select
                  name="tipo"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                >
                  <option value="TALLER">Taller</option>
                  <option value="GESTORIA">Gestoría</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Curso/Mención*
                </label>
                <select
                  name="curso"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={formData.curso}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione un curso</option>
                  {cursos[formData.tipo].map((curso) => (
                    <option key={curso} value={curso}>
                      {curso}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Año Curricular
                </label>
                <input
                  type="text"
                  name="añoCurricular"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={formData.añoCurricular}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Emisión
                </label>
                <input
                  type="text"
                  name="fecha"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={formData.fecha}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagen de Fondo
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFondoChange}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="w-full border border-gray-300 rounded-md p-2 text-left"
              >
                {formData.fondo !== fondosPredeterminados[formData.tipo]
                  ? "Cambiar imagen"
                  : "Seleccionar imagen personalizada..."}
              </button>
              {previewFondo && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Vista previa:</p>
                  <img
                    src={previewFondo}
                    alt="Previsualización de fondo"
                    className="max-h-20 object-contain border"
                  />
                  <button
                    onClick={() => {
                      setPreviewFondo(fondosPredeterminados[formData.tipo]);
                      setFormData((prev) => ({
                        ...prev,
                        fondo: fondosPredeterminados[prev.tipo],
                      }));
                    }}
                    className="text-red-500 text-sm mt-1"
                  >
                    Usar fondo predeterminado
                  </button>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-[#012030] mb-3">
                Firmantes
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Alcalde
                  </label>
                  <input
                    type="text"
                    name="alcalde"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={formData.firmantes.alcalde}
                    onChange={handleFirmanteChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo del Alcalde
                  </label>
                  <input
                    type="text"
                    name="cargoAlcalde"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={formData.firmantes.cargoAlcalde}
                    onChange={handleFirmanteChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Secretario
                  </label>
                  <input
                    type="text"
                    name="secretario"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={formData.firmantes.secretario}
                    onChange={handleFirmanteChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo del Secretario
                  </label>
                  <input
                    type="text"
                    name="cargoSecretario"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={formData.firmantes.cargoSecretario}
                    onChange={handleFirmanteChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Editor de contenido */}
          <div>
            <h2 className="text-xl font-semibold text-[#012030] mb-2">
              Contenido del Certificado
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Edite el contenido del certificado. Puede usar las siguientes
              variables:
              <span className="block mt-1">
                <code className="bg-gray-100 px-1">[NOMBRE_ESTUDIANTE]</code>,{" "}
                <code className="bg-gray-100 px-1">[NOMBRE_CURSO]</code>,{" "}
                <code className="bg-gray-100 px-1">[FECHA]</code>,{" "}
                <code className="bg-gray-100 px-1">[AÑO]</code>
              </span>
              <span className="block mt-2">
                Use{" "}
                <code className="bg-gray-100 px-1">
                  &lt;b&gt;texto&lt;/b&gt;
                </code>{" "}
                para texto en <b>negrita</b>
              </span>
            </p>

            <textarea
              name="contenidoPersonalizado"
              className="w-full h-64 border border-gray-300 rounded-md p-2 font-mono text-sm"
              value={formData.contenidoPersonalizado}
              onChange={handleChange}
            />

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    contenidoPersonalizado: plantillasBase[prev.tipo].contenido
                      .replace("[NOMBRE_ESTUDIANTE]", "[NOMBRE_ESTUDIANTE]")
                      .replace("[NOMBRE_CURSO]", prev.curso || "[NOMBRE_CURSO]")
                      .replace("[FECHA]", prev.fecha || "[FECHA]")
                      .replace("[AÑO]", prev.añoCurricular || "[AÑO]"),
                  }));
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Restablecer plantilla
              </button>

              <button
                onClick={generarPDFCursoCompleto}
                className="bg-[#13678A] hover:bg-[#012030] text-white px-6 py-2 rounded-lg shadow-md transition-colors"
                disabled={!formData.curso}
              >
                Generar Certificados (
                {estudiantesPorCurso[formData.curso]?.length || 0})
              </button>
            </div>

            {formData.curso && estudiantesPorCurso[formData.curso] && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium text-[#012030] mb-2">
                  Estudiantes en este curso
                </h3>
                <ul className="max-h-40 overflow-y-auto border rounded-md p-2">
                  {estudiantesPorCurso[formData.curso].map(
                    (estudiante, index) => (
                      <li key={index} className="py-1 border-b last:border-b-0">
                        {estudiante.nombre} - {estudiante.ci}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
