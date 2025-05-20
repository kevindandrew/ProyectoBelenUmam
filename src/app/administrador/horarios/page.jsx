"use client";

import { useState } from "react";

const sucursales = ["BASERI", "KOLLASUYO"];
const cursos = ["Dioses", "C", "Matemáticas", "Inglés"];
const facilitadores = ["Juan Pérez", "Ana Gómez", "Luis Martínez"];
const aulasConNombres = [
    "A1 - BIBLIOTECA",
    "A2 - COCINA",
    "B2 - GYM",
    "D 3-COMPUTACIÓN",
];

const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const horarios = ["9:00-10:30", "10:30-12:00", "14:30-16:00"];

// Lista de colores para cursos (puedes agregar o quitar)
const coloresCurso = [
    "#FFCDD2", // rojo claro
    "#F8BBD0", // rosa claro
    "#E1BEE7", // morado claro
    "#D1C4E9", // lila claro
    "#C5CAE9", // azul claro
    "#BBDEFB", // celeste claro
    "#B3E5FC", // celeste pastel
    "#B2EBF2", // turquesa claro
    "#B2DFDB", // verde agua
    "#C8E6C9", // verde claro
    "#DCEDC8", // verde muy claro
    "#F0F4C3", // amarillo claro
    "#FFF9C4", // amarillo pastel
    "#FFECB3", // amarillo dorado
    "#FFE0B2", // naranja claro
];

function obtenerColorCurso(curso) {
    // Función simple para asignar un color de forma consistente según el nombre del curso
    let hash = 0;
    for (let i = 0; i < curso.length; i++) {
        hash = curso.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % coloresCurso.length;
    return coloresCurso[index];
}

export default function HorariosPage() {
    // Estado de asignaciones con aula incluida
    const [asignaciones, setAsignaciones] = useState([
        {
            sucursal: "BASERI",
            dia: "Lunes",
            hora: "9:00-10:30",
            curso: "PSICOLOGÍA: Taller Bienestar Emocional",
            facilitador: "Juan Pérez",
            aula: "A1 - BIBLIOTECA",
        },
        {
            sucursal: "BASERI",
            dia: "Lunes",
            hora: "9:00-10:30",
            curso: "Kinesiología Práctica - A",
            facilitador: "Ana Gómez",
            aula: "B2 - GYM",
        },
        {
            sucursal: "BASERI",
            dia: "Lunes",
            hora: "9:00-10:30",
            curso: "Computación - A",
            facilitador: "Luis Martínez",
            aula: "D 3-COMPUTACIÓN",
        },
        // Puedes agregar más
    ]);


    const [filtros, setFiltros] = useState({
        sucursal: "",
        curso: "",
        facilitador: "",
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState({
        sucursal: "",
        dia: "",
        hora: "",
        curso: "",
        facilitador: "",
        aula: "",
    });

    function openModal(sucursal, dia, hora, aula) {
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

        setModalOpen(true);
    }

    function handleGuardar(e) {
        e.preventDefault();

        if (!modalData.curso || !modalData.facilitador || !modalData.aula) {
            alert("Por favor, completa curso, facilitador y aula.");
            return;
        }

        setAsignaciones((prev) => {
            const otros = prev.filter(
                (a) =>
                    !(
                        a.sucursal === modalData.sucursal &&
                        a.dia === modalData.dia &&
                        a.hora === modalData.hora
                    )
            );
            return [...otros, modalData];
        });

        setModalOpen(false);
    }

    async function exportarPDF(sucursal) {
        try {
            const html2pdf = await import("html2pdf.js");

            const elemento = document.getElementById(`horario-pdf-${sucursal}`);

            const opciones = {
                margin: 0.5,
                filename: `Horarios_${sucursal}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
            };

            html2pdf().set(opciones).from(elemento).save();
        } catch (error) {
            console.error("Error al exportar PDF:", error);
            alert("Hubo un problema al exportar el PDF. Revisa la consola para más detalles.");
        }
    }

    const asignacionesFiltradas = asignaciones.filter((a) => {
        return (
            (filtros.sucursal === "" || a.sucursal === filtros.sucursal) &&
            (filtros.curso === "" || a.curso === filtros.curso) &&
            (filtros.facilitador === "" || a.facilitador === filtros.facilitador)
        );
    });

    const [tabActivo, setTabActivo] = useState(sucursales[0]);

    return (
        <div className="p-6">
            {/* Encabezado */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[#13678A] border-b pb-2">HORARIOS</h2>
            </div>

            <button
                onClick={() => exportarPDF(tabActivo)}
                className="bg-teal-500 text-white px-4 py-2 rounded text-sm hover:bg-teal-600 self-start sm:self-auto"
            >
                Exportar Horarios en PDF
            </button>

            {/* Filtros */}
            <div className="bg-gray-200 shadow rounded mb-6 p-4">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div>
                        <label
                            htmlFor="cursoFilter"
                            className="block text-sm font-bold mb-1 text-gray-900 "
                        >
                            Curso
                        </label>
                        <select
                            id="cursoFilter"
                            className="w-full border-gray-500 rounded px-3 py-2 text-gray-900 bg-gray-300"
                            value={filtros.curso}
                            onChange={(e) =>
                                setFiltros((f) => ({ ...f, curso: e.target.value }))
                            }
                        >
                            <option value="">Todos los cursos</option>
                            {cursos.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <ul className="flex border-b mb-4" role="tablist">
                {sucursales.map((s) => (
                    <li key={s}>
                        <button
                            className={`px-4 py-2 border-b-2 font-semibold ${tabActivo === s
                                ? "border-blue-600 text-blue-600"
                                : "text-gray-600 hover:text-blue-600"
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

            {/* Tabla horarios */}
            <div>
                <h4 className="text-lg text-black font-semibold mb-2">{tabActivo}</h4>
                <div className="overflow-x-auto">
                    <div id={`horario-pdf-${tabActivo}`} className="overflow-x-auto">
                        <table className="min-w-full text-center border">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="text-black border px-4 py-2">Hora</th>
                                    <th className="text-black border px-4 py-2">Aula</th>
                                    {dias.map((dia) => (
                                        <th key={dia} className="text-black border px-4 py-2">
                                            {dia}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {horarios.map((hora) =>
                                    aulasConNombres.map((aula) => (
                                        <tr key={`${hora}-${aula}`}>
                                            <td className="text-black border px-4 py-2">{hora}</td>
                                            <td className="text-black border px-4 py-2">{aula}</td>

                                            {dias.map((dia) => {
                                                const asignacion = asignaciones.find(
                                                    (a) =>
                                                        a.sucursal === tabActivo &&
                                                        a.dia === dia &&
                                                        a.hora === hora &&
                                                        a.aula === aula
                                                );

                                                return (
                                                    <td
                                                        key={dia}
                                                        className="text-black border px-4 py-2 cursor-pointer hover:bg-blue-100"
                                                        onClick={() => openModal(tabActivo, dia, hora, aula)}
                                                        title={
                                                            asignacion
                                                                ? `Curso: ${asignacion.curso}\nFacilitador: ${asignacion.facilitador}\nAula: ${asignacion.aula}`
                                                                : "Asignar horario"
                                                        }
                                                        style={{
                                                            backgroundColor: asignacion
                                                                ? obtenerColorCurso(asignacion.curso)
                                                                : "transparent",
                                                        }}
                                                    >
                                                        {asignacion ? (
                                                            <>
                                                                <div className="font-semibold">{asignacion.curso}</div>
                                                                <div className="text-sm text-gray-600">{asignacion.facilitador}</div>
                                                                <div className="text-sm text-gray-500">Aula: {asignacion.aula}</div>
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
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 bg-black/25 flex items-center justify-center z-50"
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h5 className="text-xl text-black font-semibold">Asignar Horario</h5>
                            <button
                                className="text-gray-600 hover:text-gray-900"
                                onClick={() => setModalOpen(false)}
                            >
                                X
                            </button>
                        </div>

                        <form onSubmit={handleGuardar} className="space-y-4 text-black">
                            {/* Sucursal, Día, Hora (solo lectura) */}
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

                            {/* Aula (también readonly porque se asigna desde la tabla) */}
                            <div>
                                <label className="block font-semibold mb-1">Aula</label>
                                <input
                                    type="text"
                                    value={modalData.aula}
                                    readOnly
                                    className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                                />
                            </div>

                            {/* Selección de curso */}
                            <div>
                                <label className="block font-semibold mb-1">Curso</label>
                                <select
                                    className="w-full border rounded px-3 py-2"
                                    value={modalData.curso}
                                    onChange={(e) =>
                                        setModalData((d) => ({ ...d, curso: e.target.value }))
                                    }
                                >
                                    <option value="">Seleccione un curso</option>
                                    {cursos.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selección de facilitador */}
                            <div>
                                <label className="block font-semibold mb-1">Facilitador</label>
                                <select
                                    className="w-full border rounded px-3 py-2"
                                    value={modalData.facilitador}
                                    onChange={(e) =>
                                        setModalData((d) => ({ ...d, facilitador: e.target.value }))
                                    }
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
                                        setModalOpen(false);
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
