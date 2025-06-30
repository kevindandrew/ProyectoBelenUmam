// src/app/administrador/certificados/page.jsx
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import Cookies from "js-cookie";

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
    TALLER: "/fondos/fondo-taller.jpg",
    GESTORIA: "/fondos/fondo-gestoria.jpg",
  };

  // Previsualización de imágenes
  const [previewFondo, setPreviewFondo] = useState(
    fondosPredeterminados.TALLER
  );
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

  // Estado para datos desde API
  const [cursosApi, setCursosApi] = useState({ TALLER: [], GESTORIA: [] });
  const [cursosApiRaw, setCursosApiRaw] = useState([]);
  const [gestiones, setGestiones] = useState([]);
  const [estudiantesApi, setEstudiantesApi] = useState([]);
  const [gestionSeleccionada, setGestionSeleccionada] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastTemplateRef = useRef("");

  // Inicializar contenidoPersonalizado
  useEffect(() => {
    const plantilla = plantillasBase[formData.tipo].contenido
      .replace("[NOMBRE_ESTUDIANTE]", "[NOMBRE_ESTUDIANTE]")
      .replace("[NOMBRE_CURSO]", formData.curso || "[NOMBRE_CURSO]")
      .replace("[FECHA]", formData.fecha || "[FECHA]")
      .replace("[AÑO]", formData.añoCurricular || "[AÑO]");

    setFormData((prev) => ({
      ...prev,
      contenidoPersonalizado: plantilla,
    }));
    lastTemplateRef.current = plantilla;
  }, [
    formData.tipo,
    formData.curso,
    gestionSeleccionada,
    formData.fecha,
    formData.añoCurricular,
  ]);

  // Cargar cursos y gestiones
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const token = Cookies.get("access_token") || Cookies.get("token");

      if (!token) {
        setError("No se encontró token de autenticación");
        setIsLoading(false);
        return;
      }

      try {
        // Cargar cursos
        const cursosResponse = await fetch(
          "https://api-umam-1.onrender.com/cursos/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const cursosData = await cursosResponse.json();

        if (!Array.isArray(cursosData)) {
          throw new Error("Formato de datos de cursos inválido");
        }

        setCursosApiRaw(cursosData);
        setCursosApi({
          TALLER: cursosData.filter((c) => !c.gestoria),
          GESTORIA: cursosData.filter((c) => c.gestoria),
        });

        // Cargar gestiones
        const gestionesResponse = await fetch(
          "https://api-umam-1.onrender.com/cursos/gestiones",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const gestionesData = await gestionesResponse.json();

        if (!Array.isArray(gestionesData)) {
          throw new Error("Formato de datos de gestiones inválido");
        }

        setGestiones(gestionesData);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Cargar estudiantes
  useEffect(() => {
    const fetchEstudiantes = async () => {
      const token = Cookies.get("access_token") || Cookies.get("token");
      if (!token || !formData.curso || !gestionSeleccionada) {
        setEstudiantesApi([]);
        return;
      }

      try {
        const gestionObj = gestiones.find(
          (g) => String(g.gestion) === String(gestionSeleccionada)
        );
        if (!gestionObj?.gestion_id) {
          setEstudiantesApi([]);
          return;
        }

        setIsLoading(true);
        const response = await fetch(
          `https://api-umam-1.onrender.com/listas/estudiantes?gestion_id=${gestionObj.gestion_id}&curso_id=${formData.curso}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await response.json();
        setEstudiantesApi(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al cargar estudiantes:", err);
        setEstudiantesApi([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstudiantes();
  }, [formData.curso, formData.tipo, gestionSeleccionada, gestiones]);

  // Manejadores de eventos
  const handleFondoChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewFondo(reader.result);
          setFormData((prev) => ({ ...prev, fondo: reader.result }));
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewFondo(fondosPredeterminados[formData.tipo]);
        setFormData((prev) => ({
          ...prev,
          fondo: fondosPredeterminados[prev.tipo],
        }));
      }
    },
    [formData.tipo]
  );

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleFirmanteChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      firmantes: { ...prev.firmantes, [name]: value },
    }));
  }, []);

  // Generar PDF
  const generarPDFCursoCompleto = useCallback(() => {
    try {
      if (!formData.curso || !gestionSeleccionada) {
        throw new Error("Por favor seleccione un curso y gestión");
      }

      const estudiantesAprobados = estudiantesApi.filter(
        (e) => e.estado === "APROBADO" || e.nota_final >= 51
      );

      if (estudiantesAprobados.length === 0) {
        throw new Error(
          `No hay estudiantes aprobados para el curso ${formData.curso}`
        );
      }

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Función para agregar certificado
      const agregarCertificado = (estudiante) => {
        if (formData.fondo) {
          doc.addImage(formData.fondo, "JPEG", 0, 0, pageWidth, pageHeight);
        }
        const nombreCompleto = `${estudiante.nombres || ""} ${
          estudiante.ap_paterno || ""
        } ${estudiante.ap_materno || ""}`
          .trim()
          .toUpperCase();
        const contenido = formData.contenidoPersonalizado
          .replace("[NOMBRE_ESTUDIANTE]", nombreCompleto)
          .replace("[NOMBRE_CURSO]", getCursoNombre())
          .replace("[FECHA]", formData.fecha)
          .replace("[AÑO]", formData.añoCurricular);

        doc.setFont("helvetica");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont(undefined, "normal");

        let yPos = 80;

        contenido.split("\n").forEach((linea) => {
          if (linea.trim() === "") {
            yPos += 5;
          } else {
            const hasBold = linea.includes("<b>");

            if (hasBold) {
              const parts = linea.split(/(<b>|<\/b>)/);
              let currentX =
                (pageWidth -
                  doc.getTextWidth(linea.replace(/<b>|<\/b>/g, ""))) /
                2;

              parts.forEach((part) => {
                if (part === "<b>") doc.setFont(undefined, "bold");
                else if (part === "</b>") doc.setFont(undefined, "normal");
                else if (part) {
                  doc.text(part, currentX, yPos, { align: "left" });
                  currentX += doc.getTextWidth(part);
                }
              });
              yPos += 6;
            } else {
              if (linea === nombreCompleto) {
                doc.setFontSize(18);
                doc.setFont(undefined, "bold");
                doc.text(linea, pageWidth / 2, yPos, { align: "center" });
                doc.setFontSize(12);
                doc.setFont(undefined, "normal");
                yPos += 8;
              } else {
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

        // Firmas
        doc.setFontSize(10);
        const firmaY = pageHeight - 60;

        doc.setFont(undefined, "bold");
        doc.text(formData.firmantes.alcalde, pageWidth / 2, firmaY, {
          align: "center",
        });
        doc.setFont(undefined, "normal");
        doc.text(formData.firmantes.cargoAlcalde, pageWidth / 2, firmaY + 5, {
          align: "center",
        });

        doc.setFont(undefined, "bold");
        doc.text(formData.firmantes.secretario, pageWidth / 2, firmaY + 20, {
          align: "center",
        });
        doc.setFont(undefined, "normal");
        doc.text(
          formData.firmantes.cargoSecretario,
          pageWidth / 2,
          firmaY + 25,
          { align: "center" }
        );
      };

      // Generar primera página
      agregarCertificado(estudiantesAprobados[0]);

      // Generar páginas adicionales
      for (let i = 1; i < estudiantesAprobados.length; i++) {
        doc.addPage();
        agregarCertificado(estudiantesAprobados[i]);
      }

      doc.save(`certificados_${formData.curso.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("Error al generar PDF:", err);
      alert(err.message);
    }
  }, [formData, estudiantesApi, gestionSeleccionada]);

  // Obtener nombre del curso
  const getCursoNombre = useCallback(() => {
    const curso = cursosApiRaw.find(
      (c) => String(c.curso_id) === String(formData.curso)
    );
    return curso ? curso.nombre : formData.curso;
  }, [formData.curso, cursosApiRaw]);

  // Restablecer plantilla
  const resetPlantilla = useCallback(() => {
    const plantilla = plantillasBase[formData.tipo].contenido
      .replace("[NOMBRE_ESTUDIANTE]", "[NOMBRE_ESTUDIANTE]")
      .replace("[NOMBRE_CURSO]", formData.curso || "[NOMBRE_CURSO]")
      .replace("[FECHA]", formData.fecha || "[FECHA]")
      .replace("[AÑO]", formData.añoCurricular || "[AÑO]");

    setFormData((prev) => ({ ...prev, contenidoPersonalizado: plantilla }));
    lastTemplateRef.current = plantilla;
  }, [formData.tipo, formData.curso, formData.fecha, formData.añoCurricular]);

  return (
    <div className="container mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold text-[#13678A] mb-6">CERTIFICADOS</h1>

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-lg font-semibold">Cargando datos...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
      )}

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
                  Gestión*
                </label>
                <select
                  name="gestion"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={gestionSeleccionada}
                  onChange={(e) => setGestionSeleccionada(e.target.value)}
                  required
                  disabled={isLoading}
                >
                  <option value="">Seleccione una gestión</option>
                  {gestiones.map((g) => (
                    <option key={`gestion-${g.gestion_id}`} value={g.gestion}>
                      {g.gestion}
                    </option>
                  ))}
                </select>
              </div>

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
                  disabled={isLoading}
                >
                  <option value="TALLER">Taller</option>
                  <option value="GESTORIA">Gestoría</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  disabled={isLoading}
                >
                  <option value="">Seleccione un curso</option>
                  {cursosApi[formData.tipo]?.map((curso) => (
                    <option
                      key={`curso-${curso.curso_id}`}
                      value={curso.curso_id}
                    >
                      {curso.nombre}
                    </option>
                  ))}
                </select>
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
                  disabled={isLoading}
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
                disabled={isLoading}
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="w-full border border-gray-300 rounded-md p-2 text-left disabled:opacity-50"
                disabled={isLoading}
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
                    className="text-red-500 text-sm mt-1 disabled:opacity-50"
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
              className="w-full h-64 border border-gray-300 rounded-md p-2 font-mono text-sm disabled:opacity-50"
              value={formData.contenidoPersonalizado}
              onChange={handleChange}
              disabled={isLoading}
            />

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={resetPlantilla}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                disabled={isLoading}
              >
                Restablecer plantilla
              </button>

              <button
                onClick={generarPDFCursoCompleto}
                className="bg-[#13678A] hover:bg-[#012030] text-white px-6 py-2 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  !formData.curso || isLoading || estudiantesApi.length === 0
                }
              >
                Generar Certificados (
                {estudiantesApi.filter(
                  (e) => e.estado === "APROBADO" || e.nota_final >= 51
                ).length || 0}
                )
              </button>
            </div>

            {formData.curso && estudiantesApi.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-medium text-[#012030] mb-2">
                  Estudiantes en este curso y gestión (solo aprobados)
                </h3>
                <ul className="max-h-40 overflow-y-auto border rounded-md p-2">
                  {estudiantesApi
                    .filter(
                      (e) => e.estado === "APROBADO" || e.nota_final >= 51
                    )
                    .map((estudiante, index) => (
                      <li
                        key={`${estudiante.ci}-${index}`}
                        className="py-1 border-b last:border-b-0"
                      >
                        {`${estudiante.nombres} ${estudiante.ap_paterno} ${estudiante.ap_materno}`}{" "}
                        -{estudiante.ci} - Nota: {estudiante.nota_final} -
                        Estado: {estudiante.estado}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
