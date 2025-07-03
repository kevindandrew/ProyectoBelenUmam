"use client";
import { useState, useRef } from "react";
import Tesseract from "tesseract.js";

export default function OcrPage() {
  // Estados para las imágenes y resultados
  const [anversoImage, setAnversoImage] = useState(null);
  const [reversoImage, setReversoImage] = useState(null);
  const [anversoResult, setAnversoResult] = useState("");
  const [reversoResult, setReversoResult] = useState("");
  const [procesando, setProcesando] = useState({
    anverso: false,
    reverso: false,
  });

  // Refs para los inputs de archivo
  const anversoInputRef = useRef(null);
  const reversoInputRef = useRef(null);

  // Manejar cambio de imagen - Anverso
  const handleAnversoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAnversoImage(event.target.result);
    };
    reader.readAsDataURL(file);
    setAnversoResult(""); // Limpiar resultado anterior
  };

  // Manejar cambio de imagen - Reverso
  const handleReversoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setReversoImage(event.target.result);
    };
    reader.readAsDataURL(file);
    setReversoResult(""); // Limpiar resultado anterior
  };

  // Procesar imagen del anverso (CI)
  const procesarAnverso = async () => {
    if (!anversoImage) {
      setAnversoResult("Por favor selecciona una imagen.");
      return;
    }

    setProcesando((prev) => ({ ...prev, anverso: true }));
    setAnversoResult("Procesando CI...");

    try {
      const {
        data: { text },
      } = await Tesseract.recognize(anversoImage, "spa+eng", {
        logger: (m) => console.log(m),
        tessedit_char_whitelist: "0123456789Emitidael deJunioExpira", // Mejora precisión
      });

      const cleanedText = text
        .replace(/[^\w\sÁÉÍÓÚÑáéíóú°\/\.\-\n]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      // Regex mejorado para CI boliviano
      const ciRegex = /(No\.|N°|Numero|Número)\s*([0-9]{6,8})/i;
      const ciMatch = cleanedText.match(ciRegex);

      // Alternativa: Buscar el número más largo que probablemente sea el CI
      const fallbackCiRegex = /\b\d{6,8}\b/g;
      const allNumbers = cleanedText.match(fallbackCiRegex) || [];
      const probableCi = allNumbers.reduce(
        (a, b) => (b.length > a.length ? b : a),
        ""
      );

      const ci = ciMatch ? ciMatch[2] : probableCi || "CI no encontrado";

      setAnversoResult(`Texto reconocido:\n${cleanedText}\n\n✅ CI: ${ci}`);
    } catch (err) {
      setAnversoResult(`Error en el OCR: ${err.message}`);
    } finally {
      setProcesando((prev) => ({ ...prev, anverso: false }));
    }
  };

  // Procesar imagen del reverso (datos personales)
  const procesarReverso = async () => {
    if (!reversoImage) {
      setReversoResult("Por favor selecciona una imagen.");
      return;
    }

    setProcesando((prev) => ({ ...prev, reverso: true }));
    setReversoResult("Procesando datos...");

    try {
      const {
        data: { text },
      } = await Tesseract.recognize(reversoImage, "spa", {
        logger: (m) => console.log(m),
        preserve_interword_spaces: "1",
        tessedit_pageseg_mode: "6", // Modo de segmentación para texto uniforme
      });

      // Limpieza mejorada del texto
      let cleanedText = text
        .replace(/[^\w\sÁÉÍÓÚÑáéíóú°\/\.\-\n]/g, "")
        .replace(/_/g, " ") // Reemplazar guiones bajos por espacios
        .replace(/\s{2,}/g, " ")
        .trim();

      // 1. Extracción del nombre completo (solución definitiva)
      const nombreMatch = cleanedText.match(
        /A\s+([A-ZÁÉÍÓÚÑ]+\s+[A-ZÁÉÍÓÚÑ]+\s+[A-ZÁÉÍÓÚÑ]+\s+[A-ZÁÉÍÓÚÑ]+)/
      );
      let nombreCompleto = nombreMatch
        ? nombreMatch[1].replace(/\s+/g, " ").trim()
        : "No encontrado";

      // 2. Extracción de fecha de nacimiento (solución robusta)
      const fechaMatch = cleanedText.match(
        /(Nacido el|Nacido|Nac\.)\s*(\d{1,2}\s+de\s+[A-Za-z]+\s+de\s+\d{4})/i
      );
      const fecha = fechaMatch ? fechaMatch[2].trim() : "No encontrada";

      // 3. Estado civil (solución mejorada)
      const estadoMatch = cleanedText.match(/Estado\s+Civil\s+([A-ZÁÉÍÓÚÑ]+)/i);
      const estado = estadoMatch ? estadoMatch[1].trim() : "No encontrado";

      // 🏠 Domicilio (versión definitiva y robusta)
      let domicilio = "No encontrado";
      const domicilioLineMatch = cleanedText.match(/Domicilio\s+([^\n]+)/i);

      if (domicilioLineMatch) {
        let rawDomicilio = domicilioLineMatch[1];

        // ✅ Nuevo patrón: capturar desde C/ o Av. hasta el segundo "Z." o hasta que empiece algo raro
        const domicilioMatch = rawDomicilio.match(
          /(C\/|Av\.?)\s?[A-Z0-9\s°\/\.\-]+Z\.\s?[A-Z\s]{2,}(?:Z\.\s?[A-Z\s]{2,})?/
        );

        if (domicilioMatch) {
          domicilio = domicilioMatch[0]
            .replace(/EL([A-Z]{2,})/g, "EL $1")
            .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
            .replace(/[^A-Z0-9°\/\.\-\s]/gi, "")
            .replace(/\s{2,}/g, " ")
            .trim();
        } else {
          domicilio = rawDomicilio
            .replace(/EL([A-Z]{2,})/g, "EL $1")
            .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
            .replace(/[^A-Z0-9°\/\.\-\s]/gi, "")
            .replace(/\s{2,}/g, " ")
            .trim();
        }
      }
      // 5. Separación de nombres y apellidos (versión definitiva)
      const partesNombre = separarNombreCompletoDefinitivo(nombreCompleto);

      // Formatear resultado final
      const resultadoFormateado =
        `Texto reconocido:\n${cleanedText}\n\n✅ Resultado procesado:\n` +
        `Nombre(s): ${partesNombre.nombres}\n` +
        `Apellido Paterno: ${partesNombre.apellidoPaterno}\n` +
        `Apellido Materno: ${partesNombre.apellidoMaterno}\n` +
        `Fecha de Nacimiento: ${fecha}\n` +
        `Estado Civil: ${estado}\n` +
        `Domicilio: ${domicilio || "No encontrado"}`;

      setReversoResult(resultadoFormateado);
    } catch (err) {
      setReversoResult(`Error en el OCR: ${err.message}`);
    } finally {
      setProcesando((prev) => ({ ...prev, reverso: false }));
    }
  };
  // Función definitiva para separar nombres y apellidos
  const separarNombreCompletoDefinitivo = (nombreCompleto) => {
    if (!nombreCompleto || nombreCompleto === "No encontrado") {
      return {
        nombres: "No identificado",
        apellidoPaterno: "No identificado",
        apellidoMaterno: "No identificado",
      };
    }

    const partes = nombreCompleto.split(/\s+/).filter((p) => p.length > 1);

    // Caso típico boliviano: 2 nombres + 2 apellidos
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
  // Función para encontrar el índice de la N-ésima aparición
  function nthIndexOf(str, searchValue, n) {
    let index = -1;
    while (n-- && index++ < str.length) {
      index = str.indexOf(searchValue, index);
      if (index < 0) break;
    }
    return index;
  }

  // Función para separar nombres y apellidos
  const separarNombreCompleto = (nombreCompleto) => {
    const partes = nombreCompleto.trim().split(/\s+/);

    if (partes.length === 3) {
      return {
        nombres: partes[0],
        apellidoPaterno: partes[1],
        apellidoMaterno: partes[2],
      };
    } else if (partes.length === 4) {
      return {
        nombres: partes[0] + " " + partes[1],
        apellidoPaterno: partes[2],
        apellidoMaterno: partes[3],
      };
    } else if (partes.length >= 5) {
      return {
        nombres: partes.slice(0, partes.length - 2).join(" "),
        apellidoPaterno: partes[partes.length - 2],
        apellidoMaterno: partes[partes.length - 1],
      };
    } else {
      return {
        nombres: nombreCompleto,
        apellidoPaterno: "No identificado",
        apellidoMaterno: "No identificado",
      };
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-6">
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-7xl">
        {/* Sección Anverso */}
        <div className="flex flex-col items-start p-6 bg-white shadow rounded-lg">
          <h1 className="text-2xl font-bold mb-4 text-blue-700">
            OCR Carnet Boliviano - Anverso (CI)
          </h1>

          <input
            type="file"
            ref={anversoInputRef}
            onChange={handleAnversoChange}
            accept="image/*"
            className="mb-4"
            disabled={procesando.anverso}
          />

          {anversoImage && (
            <img
              src={anversoImage}
              alt="Preview Anverso"
              className="max-w-xs mb-4 rounded border"
            />
          )}

          <button
            onClick={procesarAnverso}
            disabled={procesando.anverso || !anversoImage}
            className={`px-4 py-2 rounded text-white ${
              procesando.anverso || !anversoImage
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {procesando.anverso ? "Procesando..." : "Procesar Anverso"}
          </button>

          {anversoResult && (
            <div className="mt-6 bg-gray-50 p-4 shadow-inner rounded w-full whitespace-pre-wrap text-sm">
              {anversoResult}
            </div>
          )}
        </div>

        {/* Sección Reverso */}
        <div className="flex flex-col items-start p-6 bg-white shadow rounded-lg">
          <h1 className="text-2xl font-bold mb-4 text-blue-700">
            OCR Carnet Boliviano - Reverso (Datos)
          </h1>

          <input
            type="file"
            ref={reversoInputRef}
            onChange={handleReversoChange}
            accept="image/*"
            className="mb-4"
            disabled={procesando.reverso}
          />

          {reversoImage && (
            <img
              src={reversoImage}
              alt="Preview Reverso"
              className="max-w-xs mb-4 rounded border"
            />
          )}

          <button
            onClick={procesarReverso}
            disabled={procesando.reverso || !reversoImage}
            className={`px-4 py-2 rounded text-white ${
              procesando.reverso || !reversoImage
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {procesando.reverso ? "Procesando..." : "Procesar Reverso"}
          </button>

          {reversoResult && (
            <div className="mt-6 bg-gray-50 p-4 shadow-inner rounded w-full whitespace-pre-wrap text-sm">
              {reversoResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
