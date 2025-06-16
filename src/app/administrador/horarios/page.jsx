"use client";

import { useState, useEffect } from "react";

const sucursales = ["BASERI", "KOLLASUYO"];
const cursos = ["Dioses", "C", "Matemáticas", "Inglés"];
const facilitadores = ["Juan Pérez", "Ana Gómez", "Luis Martínez"];
const aulasConNombres = [
  "A1 - BIBLIOTECA",
  "A2 - COCINA",
  "B2 - GYM",
  "D3 - COMPUTACIÓN",
];

const diasAbrev = ["L", "M", "X", "J", "V"];
const diasTodos = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

function obtenerColorCurso(curso) {
  const coloresCurso = [
    "#FFCDD2",
    "#F8BBD0",
    "#E1BEE7",
    "#D1C4E9",
    "#C5CAE9",
    "#BBDEFB",
    "#B3E5FC",
    "#B2EBF2",
    "#B2DFDB",
    "#C8E6C9",
    "#DCEDC8",
    "#F0F4C3",
    "#FFF9C4",
    "#FFECB3",
    "#FFE0B2",
  ];
  let hash = 0;
  for (let i = 0; i < curso.length; i++) {
    hash = curso.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % coloresCurso.length;
  return coloresCurso[index];
}

function diasAbrevANombres(abrevs) {
  return abrevs
    .map((a) => {
      const i = diasAbrev.indexOf(a);
      return i >= 0 ? diasTodos[i] : null;
    })
    .filter((d) => d !== null);
}

const SEMESTRES = ["I", "II"];

export default function HorariosPage() {
  const [tabActivo, setTabActivo] = useState(sucursales[0]);
  // { año: { semestre: { sucursal: { horarios:[], asignaciones:[] }}}}
  const [datosSemestre, setDatosSemestre] = useState({});

  const [year, setYear] = useState(new Date().getFullYear());
  const [semestre, setSemestre] = useState("I");

  const [horarios, setHorarios] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);

  // Modal control
  const [modalHorarioOpen, setModalHorarioOpen] = useState(false);
  const [modalAsignacionOpen, setModalAsignacionOpen] = useState(false);

  // Modal Horario states
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [editIndexHorario, setEditIndexHorario] = useState(null);

  // Modal Asignacion states
  const [modalData, setModalData] = useState({
    sucursal: "",
    dia: "",
    hora: "",
    curso: "",
    facilitador: "",
    aula: "",
  });

  // Carga datos actuales del semestre y sucursal
  useEffect(() => {
    if (
      datosSemestre[year] &&
      datosSemestre[year][semestre] &&
      datosSemestre[year][semestre][tabActivo]
    ) {
      const sucursalData = datosSemestre[year][semestre][tabActivo];
      setHorarios(sucursalData.horarios || []);
      setAsignaciones(sucursalData.asignaciones || []);
    } else if (
      // Si no hay datos, copiar del semestre anterior mismo año para conservar horarios y asignaciones
      datosSemestre[year] &&
      datosSemestre[year][semestre === "II" ? "I" : "II"] &&
      datosSemestre[year][semestre === "II" ? "I" : "II"][tabActivo]
    ) {
      const prevSemestre =
        datosSemestre[year][semestre === "II" ? "I" : "II"][tabActivo];
      setHorarios(prevSemestre.horarios || []);
      setAsignaciones(prevSemestre.asignaciones || []);
    } else {
      setHorarios([]);
      setAsignaciones([]);
    }
    // Reset modal edits cuando cambian semestre o sucursal
    setEditIndexHorario(null);
  }, [year, semestre, tabActivo, datosSemestre]);

  // Guardar datos locales (horarios y asignaciones) en datosSemestre
  const guardarDatosSucursal = (horariosNew, asignacionesNew) => {
    setDatosSemestre((prev) => {
      const yearData = { ...(prev[year] || {}) };
      const semestreData = { ...(yearData[semestre] || {}) };
      semestreData[tabActivo] = {
        horarios: horariosNew,
        asignaciones: asignacionesNew,
      };
      yearData[semestre] = semestreData;
      return { ...prev, [year]: yearData };
    });
  };

  // Toggle Días para modal horario
  const toggleDia = (abrev) => {
    setDiasSeleccionados((prev) =>
      prev.includes(abrev) ? prev.filter((d) => d !== abrev) : [...prev, abrev]
    );
  };

  // Validar que horario con mismo tiempo no exista ya (ignorando días)
  const existeHorarioDuplicado = (
    hInicio,
    hFin,
    diasSel,
    ignoreIndex = null
  ) => {
    return horarios.some((h, i) => {
      if (ignoreIndex !== null && i === ignoreIndex) return false;
      // Si las horas coinciden (inicio y fin)
      if (h.horaInicio === hInicio && h.horaFin === hFin) {
        // Revisar si alguno de los días se superpone (intersección)
        const diasNew = diasSel;
        const diasViejos = h.dias.split(", ").map((d) => d.charAt(0));
        const interseccion = diasNew.some((d) => diasViejos.includes(d));
        return interseccion;
      }
      return false;
    });
  };

  const handleAgregarHorario = () => {
    if (!horaInicio || !horaFin) {
      alert("Por favor ingresa hora de inicio y hora de fin");
      return;
    }
    if (diasSeleccionados.length === 0) {
      alert("Debe seleccionar al menos un día");
      return;
    }
    if (horaFin <= horaInicio) {
      alert("La hora fin debe ser posterior a la hora inicio");
      return;
    }
    if (
      existeHorarioDuplicado(
        horaInicio,
        horaFin,
        diasSeleccionados,
        editIndexHorario
      )
    ) {
      alert(
        "Ya existe un horario que se superpone con días y horas ingresadas"
      );
      return;
    }

    const nuevoHorario = {
      horaInicio,
      horaFin,
      dias: diasSeleccionados.join(", "),
    };

    let horariosNew;
    if (editIndexHorario !== null) {
      horariosNew = [...horarios];
      horariosNew[editIndexHorario] = nuevoHorario;
      setEditIndexHorario(null);
    } else {
      horariosNew = [...horarios, nuevoHorario];
    }

    setHorarios(horariosNew);
    // Limpiar inputs
    setHoraInicio("");
    setHoraFin("");
    setDiasSeleccionados([]);

    // Guardar datos actualizado
    guardarDatosSucursal(horariosNew, asignaciones);
    setModalHorarioOpen(false);
  };

  const handleEliminarHorario = (index) => {
    const nuevosHorarios = horarios.filter((_, i) => i !== index);
    // Eliminar asignaciones relacionadas a ese rango horario y días
    const horasEliminada = horarios[index];
    const diasEliminar = horasEliminada.dias
      .split(", ")
      .map((d) => d.charAt(0));
    const asignacionesFiltradas = asignaciones.filter((a) => {
      if (a.hora === horasEliminada.horaInicio) {
        return !diasEliminar.includes(a.dia.charAt(0));
      }
      return true;
    });
    setHorarios(nuevosHorarios);
    setAsignaciones(asignacionesFiltradas);
    guardarDatosSucursal(nuevosHorarios, asignacionesFiltradas);
  };

  const handleEditarHorario = (index) => {
    const horario = horarios[index];
    setHoraInicio(horario.horaInicio);
    setHoraFin(horario.horaFin);
    setDiasSeleccionados(horario.dias.split(", ").map((d) => d.charAt(0)));
    setEditIndexHorario(index);
    setModalHorarioOpen(true);
  };

  // Funciones modal asignacion
  function openModalAsignacion(sucursal, dia, hora, aula) {
    const asignacionExistente = asignaciones.find(
      (a) =>
        a.sucursal === sucursal &&
        a.dia === dia &&
        a.hora === hora &&
        a.aula === aula
    );

    if (asignacionExistente) {
      setModalData({ ...asignacionExistente });
    } else {
      setModalData({ sucursal, dia, hora, curso: "", facilitador: "", aula });
    }
    setModalAsignacionOpen(true);
  }

  function handleGuardarAsignacion(e) {
    e.preventDefault();
    if (!modalData.curso || !modalData.facilitador) {
      alert("Por favor, completa curso y facilitador.");
      return;
    }

    const asignacionesNew = asignaciones.filter(
      (a) =>
        !(
          a.sucursal === modalData.sucursal &&
          a.dia === modalData.dia &&
          a.hora === modalData.hora &&
          a.aula === modalData.aula
        )
    );
    asignacionesNew.push(modalData);
    setAsignaciones(asignacionesNew);
    guardarDatosSucursal(horarios, asignacionesNew);
    setModalAsignacionOpen(false);
  }

  // Convertir abreviatura de días a nombre completo
  const diasHorarios =
    horarios.length > 0
      ? horarios[0].dias.split(", ").map((d) => {
          const idx = diasAbrev.indexOf(d.charAt(0));
          return diasTodos[idx] || d;
        })
      : [];

  // Exportar PDF
  const exportarPDF = async () => {
    try {
      const html2pdf = await import("html2pdf.js");
      const elemento = document.getElementById("tabla-horarios-print");
      if (!elemento) {
        alert("No se encontró la tabla para exportar.");
        return;
      }
      const opciones = {
        margin: 0.5,
        filename: `Horario_${tabActivo}_${year}_Semestre_${semestre}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
      };
      html2pdf().set(opciones).from(elemento).save();
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert(
        "Hubo un problema al exportar el PDF. Revisa la consola para más detalles."
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header semestre y año */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-[#13678A] border-b pb-2 flex-1 min-w-[200px]">
          HORARIOS
        </h2>
        <div className="flex items-center space-x-2">
          <label htmlFor="year" className="font-semibold text-gray-700">
            Año:
          </label>
          <input
            id="year"
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded px-2 py-1 w-20 text-center"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="semestre" className="font-semibold text-gray-700">
            Semestre:
          </label>
          <select
            id="semestre"
            value={semestre}
            onChange={(e) => setSemestre(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {SEMESTRES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs sucursales */}
      <ul className="flex border-b mb-8" role="tablist">
        {sucursales.map((s) => (
          <li key={s}>
            <button
              className={`px-4 py-2 border-b-4 font-semibold ${
                tabActivo === s
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-blue-600"
              }`}
              onClick={() => setTabActivo(s)}
              role="tab"
              aria-selected={tabActivo === s}
            >
              {s}
            </button>
          </li>
        ))}
      </ul>

      {/* Botones acciones */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <button
          className="bg-green-600 text-white px-5 py-2 rounded font-semibold hover:bg-green-700"
          onClick={() => {
            setHoraInicio("");
            setHoraFin("");
            setDiasSeleccionados([]);
            setEditIndexHorario(null);
            setModalHorarioOpen(true);
          }}
        >
          + Agregar Horario
        </button>
        {horarios.length > 0 && (
          <button
            className="bg-blue-600 text-white px-5 py-2 rounded font-semibold hover:bg-blue-700"
            onClick={exportarPDF}
          >
            Descargar Horario PDF
          </button>
        )}
      </div>

      {/* Tabla horarios */}
      {horarios.length > 0 ? (
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full border text-center">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-black">Horario</th>
                <th className="border px-4 py-2 text-black">Días</th>
                <th className="border px-4 py-2 text-black">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {horarios.map((horario, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2 text-black">
                    {`${horario.horaInicio} - ${horario.horaFin}`}
                  </td>
                  <td className="border px-4 py-2 text-black">
                    {horario.dias}
                  </td>
                  <td className="border px-4 py-2 text-black">
                    <button
                      onClick={() => handleEditarHorario(index)}
                      className="text-blue-600 hover:underline text-sm mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminarHorario(index)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Tabla asignaciones – incluir id para PDF */}
      {horarios.length > 0 ? (
        <>
          <h3 className="text-xl font-semibold mt-8 mb-4">
            Asignaciones para {tabActivo} - {year} Semestre {semestre}
          </h3>
          <div className="overflow-x-auto" id="tabla-horarios-print">
            <table className="min-w-full border text-center">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-black">Hora</th>
                  <th className="border px-4 py-2 text-black">Aula</th>
                  {diasHorarios.map((dia) => (
                    <th key={dia} className="border px-4 py-2 text-black">
                      {dia}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horarios.map((horario) =>
                  aulasConNombres.map((aula) => (
                    <tr key={`${horario.horaInicio}-${aula}`}>
                      <td className="border px-4 py-2 text-black">{`${horario.horaInicio} - ${horario.horaFin}`}</td>
                      <td className="border px-4 py-2 text-black">{aula}</td>
                      {diasHorarios.map((dia) => {
                        const asignacion = asignaciones.find(
                          (a) =>
                            a.sucursal === tabActivo &&
                            a.dia === dia &&
                            a.hora === horario.horaInicio &&
                            a.aula === aula
                        );

                        return (
                          <td
                            key={dia}
                            className="border px-4 py-2 text-black cursor-pointer hover:bg-blue-100"
                            onClick={() =>
                              openModalAsignacion(
                                tabActivo,
                                dia,
                                horario.horaInicio,
                                aula
                              )
                            }
                            title={
                              asignacion
                                ? `Curso: ${asignacion.curso}\nFacilitador: ${asignacion.facilitador}`
                                : "Asignar curso y facilitador"
                            }
                            style={{
                              backgroundColor: asignacion
                                ? obtenerColorCurso(asignacion.curso)
                                : "transparent",
                            }}
                          >
                            {asignacion ? (
                              <>
                                <div className="font-semibold">
                                  {asignacion.curso}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {asignacion.facilitador}
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {/* Modal agregar/editar horario */}
      {modalHorarioOpen && (
        <div
          className="fixed inset-0 bg-black/25 flex items-center justify-center z-50 p-4"
          onClick={() => setModalHorarioOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalHorarioTitle"
          >
            <h5
              id="modalHorarioTitle"
              className="text-xl font-semibold mb-4 text-black"
            >
              {editIndexHorario !== null ? "Editar Horario" : "Agregar Horario"}
            </h5>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm text-gray-700 mb-1"
                  htmlFor="horaInicio"
                >
                  Hora inicio
                </label>
                <input
                  id="horaInicio"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label
                  className="block text-sm text-gray-700 mb-1"
                  htmlFor="horaFin"
                >
                  Hora fin
                </label>
                <input
                  id="horaFin"
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-700 mb-1">
                Días aplicables
              </label>
              <div className="flex flex-wrap gap-2">
                {diasAbrev.map((dia) => {
                  const seleccionado = diasSeleccionados.includes(dia);
                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDia(dia)}
                      className={`w-10 h-10 rounded-full border text-sm font-semibold 
                        ${
                          seleccionado
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700"
                        } 
                        hover:bg-blue-500 hover:text-white transition`}
                      aria-pressed={seleccionado}
                      aria-label={`Día ${dia}`}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>
            </div>

            {horarios.length === 0 && (
              <p className="text-gray-600 mt-4">
                No hay horarios agregados para {tabActivo}.
              </p>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setModalHorarioOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700"
                onClick={handleAgregarHorario}
              >
                {editIndexHorario !== null
                  ? "Actualizar Horario"
                  : "Agregar Horario"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal asignar curso y facilitador */}
      {modalAsignacionOpen && (
        <div
          className="fixed inset-0 bg-black/25 flex items-center justify-center z-50 p-4"
          onClick={() => setModalAsignacionOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalAsignacionTitle"
          >
            <div className="flex justify-between items-center mb-4">
              <h5
                id="modalAsignacionTitle"
                className="text-xl font-semibold text-black"
              >
                Asignar Curso y Facilitador
              </h5>
              <button
                className="text-gray-600 hover:text-gray-900"
                onClick={() => setModalAsignacionOpen(false)}
                aria-label="Cerrar"
              >
                X
              </button>
            </div>

            <form
              onSubmit={handleGuardarAsignacion}
              className="space-y-4 text-black"
            >
              <div>
                <label className="block font-semibold mb-1">Sucursal</label>
                <input
                  type="text"
                  value={modalData.sucursal}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Día</label>
                <input
                  type="text"
                  value={modalData.dia}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Hora</label>
                <input
                  type="text"
                  value={modalData.hora}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Aula</label>
                <input
                  type="text"
                  value={modalData.aula}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Curso</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={modalData.curso}
                  onChange={(e) =>
                    setModalData((d) => ({ ...d, curso: e.target.value }))
                  }
                  required
                >
                  <option value="">Seleccione un curso</option>
                  {cursos.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Facilitador</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={modalData.facilitador}
                  onChange={(e) =>
                    setModalData((d) => ({ ...d, facilitador: e.target.value }))
                  }
                  required
                >
                  <option value="">Seleccione un facilitador</option>
                  {facilitadores.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-700"
                  onClick={() => {
                    // Eliminar asignación si existe
                    setAsignaciones((prev) =>
                      prev.filter(
                        (a) =>
                          !(
                            a.sucursal === modalData.sucursal &&
                            a.dia === modalData.dia &&
                            a.hora === modalData.hora &&
                            a.aula === modalData.aula
                          )
                      )
                    );
                    guardarDatosSucursal(
                      horarios,
                      asignaciones.filter(
                        (a) =>
                          !(
                            a.sucursal === modalData.sucursal &&
                            a.dia === modalData.dia &&
                            a.hora === modalData.hora &&
                            a.aula === modalData.aula
                          )
                      )
                    );
                    setModalAsignacionOpen(false);
                  }}
                >
                  Borrar
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
