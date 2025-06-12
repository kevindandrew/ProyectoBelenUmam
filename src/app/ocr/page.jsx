"use client";

import React, { useState } from "react";
import Tesseract from "tesseract.js";

export default function CarnetOCR() {
  // Estados para las imágenes y resultados
  const [anversoImage, setAnversoImage] = useState(null);
  const [reversoImage, setReversoImage] = useState(null);
  const [anversoResult, setAnversoResult] = useState("");
  const [reversoResult, setReversoResult] = useState("");
  const [loadingAnverso, setLoadingAnverso] = useState(false);
  const [loadingReverso, setLoadingReverso] = useState(false);

  // Función para extraer datos del reverso
  const extraerDatosReverso = (texto) => {
    const resultado = {};

    texto = texto.replace(/\s{2,}/g, " ").replace(/\n+/g, "\n");

    // 🏠 Domicilio
    const domicilioRegex = /DOMICILIO[\s\/:\-]*\n?.*?(AV\.[^\n]+)/i;
    const domicilioMatch = texto.match(domicilioRegex);
    resultado.domicilio = domicilioMatch
      ? domicilioMatch[1].trim()
      : "No encontrado";

    // 💼 Ocupación (limpieza con palabras clave)
    const ocupacionRegex = /OCUPACION[\s\S]*?\n?([A-ZÁÉÍÓÚÑ\s]{4,})\n?/i;
    const ocupacionMatch = texto.match(ocupacionRegex);

    const ocupacionBruta = ocupacionMatch ? ocupacionMatch[1].trim() : "";
    const ocupacionesPosibles = [
      "ESTUDIANTE",
      "MÉDICO",
      "ABOGADO",
      "INGENIERO",
      "DOCENTE",
      "CONTADOR",
      "COMERCIANTE",
      "ENFERMERA",
      "SECRETARIA",
      "ARQUITECTO",
      "MECÁNICO",
      "CHOFER",
    ];

    let ocupacionFinal = "No encontrado";
    for (let palabra of ocupacionesPosibles) {
      if (ocupacionBruta.includes(palabra)) {
        ocupacionFinal = palabra;
        break;
      }
    }

    resultado.ocupacion = ocupacionFinal;

    // 💍 Estado civil
    const estadoCivilMatch = texto.match(/ESTADO\s*CIVIL\s*\n?([A-ZÁÉÍÓÚÑ]+)/i);
    resultado.estado_civil = estadoCivilMatch
      ? estadoCivilMatch[1].trim()
      : "No encontrado";

    return resultado;
  };

  // Función para extraer datos del anverso
  const extraerDatosAnverso = (texto) => {
    const resultado = {};

    texto = texto.replace(/\s{2,}/g, " ").replace(/\n+/g, "\n");

    // CI
    const ciMatch =
      texto.match(/N\s*[:\-]?\s*(\d{6,10})/) || texto.match(/(\d{7,10})$/);
    resultado.ci = ciMatch ? ciMatch[1] : "No encontrado";

    // Nombres
    const nombresMatch = texto.match(/NOMBRES\s*[\n:\-]*\s*([A-Z\s]+)/i);
    if (nombresMatch) {
      let nombres = nombresMatch[1].trim();
      nombres = nombres.replace(/^[A-Z]\s+/, "").trim();
      resultado.nombres = nombres;
    } else {
      resultado.nombres = "No encontrado";
    }

    // Apellidos
    const apellidosMatch = texto.match(/APELLIDOS\s*[\n:\-]*\s*([A-Z\s]+)/i);
    if (apellidosMatch) {
      let apellidosLimpios = apellidosMatch[1]
        .split(" ")
        .filter((p) => p.length > 1)
        .slice(0, 2);

      resultado.apellido_paterno = apellidosLimpios[0] || "No encontrado";
      resultado.apellido_materno = apellidosLimpios[1] || "No encontrado";
    } else {
      resultado.apellido_paterno = "No encontrado";
      resultado.apellido_materno = "No encontrado";
    }

    // Fecha de nacimiento
    const fechas = texto.match(/\d{2}\/\d{2}\/\d{4}/g);
    resultado.fecha_nacimiento = fechas?.[0] || "No encontrada";

    return resultado;
  };

  // Procesar imagen del anverso
  const procesarAnverso = () => {
    if (!anversoImage) {
      setAnversoResult("Por favor selecciona una imagen.");
      return;
    }

    setLoadingAnverso(true);
    setAnversoResult("Procesando OCR del anverso...");

    Tesseract.recognize(anversoImage, "eng", {
      logger: (m) => console.log(m),
    })
      .then(({ data: { text } }) => {
        const textoLimpio = text
          .replace(/[^\w\sÁÉÍÓÚÑáéíóú°\/\.\-\n]/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();

        const datos = extraerDatosAnverso(textoLimpio);

        setAnversoResult(
          `
Número de CI: ${datos.ci}
Nombres: ${datos.nombres}
Apellido Paterno: ${datos.apellido_paterno}
Apellido Materno: ${datos.apellido_materno}
Fecha de Nacimiento: ${datos.fecha_nacimiento}
        `.trim()
        );
      })
      .catch((err) => {
        setAnversoResult("Error en el OCR: " + err.message);
      })
      .finally(() => {
        setLoadingAnverso(false);
      });
  };

  // Procesar imagen del reverso
  const procesarReverso = () => {
    if (!reversoImage) {
      setReversoResult("Por favor selecciona una imagen.");
      return;
    }

    setLoadingReverso(true);
    setReversoResult("Procesando OCR...");

    Tesseract.recognize(reversoImage, "eng", {
      logger: (m) => console.log(m),
    })
      .then(({ data: { text } }) => {
        const textoLimpio = text
          .replace(/[^\w\sÁÉÍÓÚÑáéíóú°\/\.\-\n]/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();

        const datos = extraerDatosReverso(textoLimpio);
        setReversoResult(
          `
Domicilio: ${datos.domicilio}
Estado Civil: ${datos.estado_civil}
Ocupacion: ${datos.ocupacion}
        `.trim()
        );
      })
      .catch((err) => {
        setReversoResult("Error en el OCR: " + err.message);
      })
      .finally(() => {
        setLoadingReverso(false);
      });
  };

  // Manejar cambio de imagen del anverso
  const handleAnversoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAnversoImage(file);
    } else {
      setAnversoImage(null);
    }
  };

  // Manejar cambio de imagen del reverso
  const handleReversoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReversoImage(file);
    } else {
      setReversoImage(null);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 w-full max-w-7xl mx-auto p-4">
      {/* 🟩 Anverso */}
      <div className="flex flex-col items-start p-6 bg-white shadow rounded">
        <h1 className="text-2xl font-bold mb-4 text-blue-700">
          OCR Carnet Boliviano - Anverso
        </h1>

        <input
          type="file"
          id="imagenInput1"
          accept="image/*"
          className="mb-4 border border-gray-600"
          onChange={handleAnversoChange}
        />

        {anversoImage && (
          <img
            id="previewAnverso"
            src={URL.createObjectURL(anversoImage)}
            className="max-w-xs mb-4 rounded border"
            alt="Vista previa anverso"
          />
        )}

        <button
          onClick={procesarAnverso}
          disabled={loadingAnverso}
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
            loadingAnverso ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loadingAnverso ? "Procesando..." : "Procesar Imagen"}
        </button>

        <div
          id="resultado1"
          className="mt-6 bg-gray-50 p-4 shadow-inner rounded w-full whitespace-pre-wrap text-sm"
        >
          {anversoResult}
        </div>
      </div>

      {/* 🟦 Reverso */}
      <div className="flex flex-col items-start p-6 bg-white shadow rounded">
        <h1 className="text-2xl font-bold mb-4 text-blue-700">
          OCR Carnet Boliviano - Reverso
        </h1>

        <input
          type="file"
          id="imagenInput"
          accept="image/*"
          className="mb-4 border border-gray-600"
          onChange={handleReversoChange}
        />

        {reversoImage && (
          <img
            id="previewReverso"
            src={URL.createObjectURL(reversoImage)}
            className="max-w-xs mb-4 rounded border"
            alt="Vista previa reverso"
          />
        )}

        <button
          onClick={procesarReverso}
          disabled={loadingReverso}
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
            loadingReverso ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loadingReverso ? "Procesando..." : "Procesar Imagen"}
        </button>

        <div
          id="resultado"
          className="mt-6 bg-gray-50 p-4 shadow-inner rounded w-full whitespace-pre-wrap text-sm"
        >
          {reversoResult}
        </div>
      </div>
    </div>
  );
}
