"use client";

import React, { useState, useRef } from "react";
import Tesseract from "tesseract.js";

const parseDateToDDMMYYYY = (dateStr) => {
  // Convierte fechas en formato "8 de mayo de 1997" a "08/05/1997"
  if (!dateStr) return "";
  const months = {
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
  const regex = /(\d{1,2})\s*de\s*(\w+)\s*de\s*(\d{4})/i;
  const match = dateStr.toLowerCase().match(regex);
  if (!match) return dateStr;
  const day = match[1].padStart(2, "0");
  const month = months[match[2]] || "00";
  const year = match[3];
  return `${day}/${month}/${year}`;
};

const calculateAge = (dateStr) => {
  // Asume fecha en dd/mm/yyyy para calcular edad
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length !== 3) return "";
  const birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age.toString() : "";
};

const splitNombresApellidos = (fullStr) => {
  // Asumiendo formato: Nombres primero, luego Apellido Paterno y Materno al final
  // Si hay solo un nombre, apellidos '-'
  if (!fullStr) return { nombres: "", apPaterno: "-", apMaterno: "-" };
  const parts = fullStr.trim().split(/\s+/);
  if (parts.length < 2)
    return { nombres: parts[0], apPaterno: "-", apMaterno: "-" };
  // Si 4 o más partes: primera(s) son nombres, últimas dos son apellidos
  // Si 3 partes: 1 o 2 nombres, último 2 apellidos o 1 apellido?
  let apPaterno = "-",
    apMaterno = "-";
  let nombres = "";
  if (parts.length >= 4) {
    nombres = parts.slice(0, parts.length - 2).join(" ");
    apPaterno = parts[parts.length - 2];
    apMaterno = parts[parts.length - 1];
  } else if (parts.length === 3) {
    nombres = parts[0];
    apPaterno = parts[1];
    apMaterno = parts[2];
  } else if (parts.length === 2) {
    nombres = parts[0];
    apPaterno = parts[1];
    apMaterno = "-";
  } else {
    nombres = parts[0];
  }
  return { nombres, apPaterno, apMaterno };
};

const Page = () => {
  const [frontImage, setFrontImage] = React.useState(null);
  const [backImage, setBackImage] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [formData, setFormData] = React.useState({
    cedulaIdentidad: "",
    nombres: "",
    apPaterno: "",
    apMaterno: "",
    fechaNacimiento: "",
    edad: "",
    lugarNacimiento: "",
    domicilio: "",
    ocupacion: "",
    estadoCivil: "",
  });

  const frontDropRef = useRef(null);
  const backDropRef = useRef(null);

  const preventDefaults = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const highlight = (element) => {
    element.current.classList.add("border-blue-500", "bg-blue-50");
  };

  const unhighlight = (element) => {
    element.current.classList.remove("border-blue-500", "bg-blue-50");
  };

  const handleDrop = (e, side) => {
    preventDefaults(e);
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files[0]) {
      side === "front" ? setFrontImage(files[0]) : setBackImage(files[0]);
    }
    side === "front" ? unhighlight(frontDropRef) : unhighlight(backDropRef);
  };

  const handleImageChange = (e, side) => {
    if (e.target.files && e.target.files[0]) {
      side === "front"
        ? setFrontImage(e.target.files[0])
        : setBackImage(e.target.files[0]);
    }
  };

  const extractDataFromText = (text, side) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let extracted = {};

    if (side === "front") {
      // Extraer número de carnet después de "No."
      for (const line of lines) {
        const match = line.match(/no\.?\s*([\d\-]+)/i);
        if (match) {
          extracted.cedulaIdentidad = match[1].trim();
          break;
        }
      }
    }

    if (side === "back") {
      // Nombre completo al lado de "A:"
      let fullName = "";
      for (const line of lines) {
        if (line.toUpperCase().startsWith("A:")) {
          fullName = line.substring(2).trim();
          break;
        }
      }

      const { nombres, apPaterno, apMaterno } = splitNombresApellidos(fullName);
      extracted.nombres = nombres;
      extracted.apPaterno = apPaterno;
      extracted.apMaterno = apMaterno;

      // Fecha de nacimiento en formato "Nacido el 8 de mayo de 1997"
      for (const line of lines) {
        const match = line.match(/nacido el\s*(.+)/i);
        if (match) {
          const fechaFormateada = parseDateToDDMMYYYY(match[1].trim());
          extracted.fechaNacimiento = fechaFormateada;
          extracted.edad = calculateAge(fechaFormateada);
          break;
        }
      }

      // Lugar de nacimiento después de "En " hasta primer guion
      for (const line of lines) {
        const match = line.match(/en\s*([^-]+)/i);
        if (match) {
          extracted.lugarNacimiento = match[1].trim();
          break;
        }
      }

      // Estado Civil después de "Estado Civil"
      for (const line of lines) {
        const match = line.match(/estado civil\s*[:\-]?\s*(.+)/i);
        if (match) {
          extracted.estadoCivil = match[1].trim();
          break;
        }
      }

      // Ocupación después de "Profesion/Cargo"
      for (const line of lines) {
        const match = line.match(/profesion\/cargo\s*[:\-]?\s*(.+)/i);
        if (match) {
          extracted.ocupacion = match[1].trim();
          break;
        }
      }

      // Dirección después de "Domicilio"
      for (const line of lines) {
        const match = line.match(/domicilio\s*[:\-]?\s*(.+)/i);
        if (match) {
          extracted.domicilio = match[1].trim();
          break;
        }
      }
    }

    return extracted;
  };

  const mergeExtractedData = (frontData, backData) => {
    // Priorizar backData si existe para casi todo, excepto cedula que viene solo del front
    return {
      cedulaIdentidad:
        frontData.cedulaIdentidad || backData.cedulaIdentidad || "",
      nombres: backData.nombres || "",
      apPaterno: backData.apPaterno || "",
      apMaterno: backData.apMaterno || "",
      fechaNacimiento: backData.fechaNacimiento || "",
      edad: backData.edad || "",
      lugarNacimiento: backData.lugarNacimiento || "",
      domicilio: backData.domicilio || "",
      ocupacion: backData.ocupacion || "",
      estadoCivil: backData.estadoCivil || "",
    };
  };

  const processImages = async () => {
    setError(null);
    if (!frontImage && !backImage) {
      setError("Por favor, sube al menos una imagen (anverso o reverso).");
      return;
    }

    setLoading(true);

    try {
      let frontText = "";
      let backText = "";

      if (frontImage) {
        const frontResult = await Tesseract.recognize(frontImage, "spa", {
          logger: (m) => console.log("Front OCR:", m),
        });
        frontText = frontResult.data.text || "";
      }

      if (backImage) {
        const backResult = await Tesseract.recognize(backImage, "spa", {
          logger: (m) => console.log("Back OCR:", m),
        });
        backText = backResult.data.text || "";
      }

      const frontData = extractDataFromText(frontText, "front");
      const backData = extractDataFromText(backText, "back");

      const merged = mergeExtractedData(frontData, backData);

      setFormData(merged);
    } catch (err) {
      setError(
        "Error procesando las imágenes. Intenta con fotos claras y bien enfocadas."
      );
      console.error(err);
    }

    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">
        Captura y edición de datos - Carnet de Identidad Boliviano
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
        {/* Zona subida imagen anverso */}
        <div>
          <label className="font-semibold mb-2 block">
            Subir imagen Anverso (foto frente)
          </label>
          <div
            ref={frontDropRef}
            onDragEnter={(e) => {
              preventDefaults(e);
              highlight(frontDropRef);
            }}
            onDragOver={(e) => {
              preventDefaults(e);
              highlight(frontDropRef);
            }}
            onDragLeave={(e) => {
              preventDefaults(e);
              unhighlight(frontDropRef);
            }}
            onDrop={(e) => handleDrop(e, "front")}
            className="border-2 border-dashed border-gray-400 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer min-h-[180px] bg-white"
          >
            {frontImage ? (
              <img
                src={URL.createObjectURL(frontImage)}
                alt="Anverso"
                className="max-h-48 object-contain rounded"
              />
            ) : (
              <p className="text-gray-500">
                Arrastra o haz clic para subir la imagen anverso
              </p>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "front")}
              className="hidden"
              id="frontInput"
            />
          </div>
          <button
            type="button"
            onClick={() => document.getElementById("frontInput").click()}
            className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Seleccionar archivo Anverso
          </button>
        </div>

        {/* Zona subida imagen reverso */}
        <div>
          <label className="font-semibold mb-2 block">
            Subir imagen Reverso (foto atrás)
          </label>
          <div
            ref={backDropRef}
            onDragEnter={(e) => {
              preventDefaults(e);
              highlight(backDropRef);
            }}
            onDragOver={(e) => {
              preventDefaults(e);
              highlight(backDropRef);
            }}
            onDragLeave={(e) => {
              preventDefaults(e);
              unhighlight(backDropRef);
            }}
            onDrop={(e) => handleDrop(e, "back")}
            className="border-2 border-dashed border-gray-400 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer min-h-[180px] bg-white"
          >
            {backImage ? (
              <img
                src={URL.createObjectURL(backImage)}
                alt="Reverso"
                className="max-h-48 object-contain rounded"
              />
            ) : (
              <p className="text-gray-500">
                Arrastra o haz clic para subir la imagen reverso
              </p>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, "back")}
              className="hidden"
              id="backInput"
            />
          </div>
          <button
            type="button"
            onClick={() => document.getElementById("backInput").click()}
            className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Seleccionar archivo Reverso
          </button>
        </div>
      </div>

      <button
        onClick={processImages}
        disabled={loading || (!backImage && !frontImage)}
        className="mt-6 px-8 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Procesando..." : "Extraer Datos"}
      </button>

      {error && <div className="mt-4 text-red-600 font-semibold">{error}</div>}

      <form className="w-full max-w-3xl mt-8 bg-white p-6 rounded shadow space-y-6">
        <h2 className="text-xl font-semibold mb-4">
          Datos extraídos y edición
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col">
            Número de Carnet:
            <input
              type="text"
              name="cedulaIdentidad"
              value={formData.cedulaIdentidad}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-3 py-2 mt-1"
            />
          </label>

          <label className="flex flex-col">
            Nombres:
            <input
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-3 py-2 mt-1"
            />
          </label>

          <label className="flex flex-col">
            Apellido Paterno:
            <input
              type="text"
              name="apPaterno"
              value={formData.apPaterno}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-3 py-2 mt-1"
            />
          </label>

          <label className="flex flex-col">
            Apellido Materno:
            <input
              type="text"
              name="apMaterno"
              value={formData.apMaterno}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-3 py-2 mt-1"
            />
          </label>

          <label className="flex flex-col">
            Fecha de Nacimiento (dd/mm/aaaa):
            <input
              type="text"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-3 py-2 mt-1"
              placeholder="Ej: 08/05/1997"
            />
          </label>

          <label className="flex flex-col">
            Edad:
            <input
              type="text"
              name="edad"
              value={formData.edad}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-3 py-2 mt-1"
              disabled
            />
          </label>

          <label className="flex flex-col">
            Lugar de Nacimiento:
            <input
              type="text"
              name="lugarNacimiento"
              value={formData.lugarNacimiento}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-3 py-2 mt-1"
            />
          </label>

          <label className="flex flex-col">
            Dirección:
            <input
              type="text"
              name="domicilio"
              value={formData.domicilio}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-3 py-2 mt-1"
            />
          </label>

          <label className="flex flex-col">
            Ocupación:
            <input
              type="text"
              name="ocupacion"
              value={formData.ocupacion}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-3 py-2 mt-1"
            />
          </label>

          <label className="flex flex-col">
            Estado Civil:
            <input
              type="text"
              name="estadoCivil"
              value={formData.estadoCivil}
              onChange={handleInputChange}
              className="border border-gray-300 rounded px-3 py-2 mt-1"
            />
          </label>
        </div>
      </form>
    </div>
  );
};

export default Page;
