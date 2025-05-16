"use client";

import { useState, useEffect } from "react";

const sucursales = ["BASERI", "KOLLASUYO"];
const cursos = ["Dioses", "C", "Matemáticas", "Inglés"];
const facilitadores = ["Juan Pérez", "Ana Gómez", "Luis Martínez"];

const gestionActual = "1/2025";

// Ejemplo de estudiantes inscritos para diferentes combinaciones (podrías traerlos desde backend)
const estudiantesPorCurso = {
    "BASERI-Dioses-Juan Pérez": [
        {
            id: 1,
            nombres: "Carlos",
            apellidoPaterno: "Lopez",
            apellidoMaterno: "Garcia",
            celular: "78945612",
            referencia: "75757575",
            notaFinal: 0,
        },
        {
            id: 2,
            nombres: "Maria",
            apellidoPaterno: "Perez",
            apellidoMaterno: "Rodriguez",
            celular: "78912345",
            referencia: "7251255",
            notaFinal: 0,
        },
    ],
    "KOLLASUYO-C-Maria Gomez": [
        {
            id: 3,
            nombres: "Pedro",
            apellidoPaterno: "Flores",
            apellidoMaterno: "Salazar",
            celular: "71234567",
            referencia: "7777777",
            notaFinal: 0,
        },
    ],
    // agrega más combinaciones según necesites
};

export default function InscripcionesPage() {
    const [filtros, setFiltros] = useState({
        sucursal: "",
        curso: "",
        facilitador: "",
    });

    const [estudiantes, setEstudiantes] = useState([]);

    // Cuando cambian los filtros, actualizamos la lista de estudiantes si hay coincidencia
    useEffect(() => {
        const key = `${filtros.sucursal}-${filtros.curso}-${filtros.facilitador}`;
        if (
            filtros.sucursal &&
            filtros.curso &&
            filtros.facilitador &&
            estudiantesPorCurso[key]
        ) {
            setEstudiantes(estudiantesPorCurso[key]);
        } else {
            setEstudiantes([]);
        }
    }, [filtros]);

    function handleNotaChange(id, valor) {
        setEstudiantes((prev) =>
            prev.map((est) =>
                est.id === id ? { ...est, notaFinal: valor } : est
            )
        );
    }

    return (
        <div className="p-6 ">
            <h1 className="text-2xl text-black text-bold font-bold mb-6">Listas de Cursos</h1>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="text-black block mb-1 font-semibold">Sucursal</label>
                    <select
                        value={filtros.sucursal}
                        onChange={(e) =>
                            setFiltros((f) => ({ ...f, sucursal: e.target.value }))
                        }
                        className="text-black w-full border rounded px-3 py-2"
                    >
                        <option value="">Selecciona sucursal</option>
                        {sucursales.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-black block mb-1 font-semibold">Curso</label>
                    <select
                        value={filtros.curso}
                        onChange={(e) =>
                            setFiltros((f) => ({ ...f, curso: e.target.value }))
                        }
                        className="text-black w-full border rounded px-3 py-2"
                    >
                        <option value="">Selecciona curso</option>
                        {cursos.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-black block mb-1 font-semibold">Facilitador</label>
                    <select
                        value={filtros.facilitador}
                        onChange={(e) =>
                            setFiltros((f) => ({ ...f, facilitador: e.target.value }))
                        }
                        className="text-black w-full border rounded px-3 py-2"
                    >
                        <option value="">Selecciona facilitador</option>
                        {facilitadores.map((f) => (
                            <option key={f} value={f}>
                                {f}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Mostrar info de curso seleccionado y tabla solo si hay estudiantes */}
            {estudiantes.length > 0 ? (
                <>
                    <div className="mb-4 text-black bg-gray-200 p-4 rounded shadow">
                        <p>
                            <strong>Sucursal:</strong> {filtros.sucursal}
                        </p>
                        <p>
                            <strong>Facilitador:</strong> {filtros.facilitador}
                        </p>
                        <p>
                            <strong>Curso:</strong> {filtros.curso}
                        </p>
                        <p>
                            <strong>Gestión:</strong> {gestionActual}
                        </p>
                    </div>

                    <table className="text-black min-w-full border text-left">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="border px-3 py-2">Nombres</th>
                                <th className="border px-3 py-2">Apellido Paterno</th>
                                <th className="border px-3 py-2">Apellido Materno</th>
                                <th className="border px-3 py-2">Celular</th>
                                <th className="border px-3 py-2">Referencia</th>
                                <th className="border px-3 py-2">Nota Final</th>
                            </tr>
                        </thead>
                        <tbody>
                            {estudiantes.map((est) => (
                                <tr key={est.id} className="odd:bg-white even:bg-gray-50">
                                    <td className="border px-3 py-2">{est.nombres}</td>
                                    <td className="border px-3 py-2">{est.apellidoPaterno}</td>
                                    <td className="border px-3 py-2">{est.apellidoMaterno}</td>
                                    <td className="border px-3 py-2">{est.celular}</td>
                                    <td className="border px-3 py-2">{est.referencia}</td>
                                    <td className="border px-3 py-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={est.notaFinal}
                                            onChange={(e) =>
                                                handleNotaChange(est.id, Number(e.target.value))
                                            }
                                            className="w-16 border rounded px-1 py-0.5 text-center"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            ) : (
                <p className="text-gray-600 mt-4">No hay estudiantes para los filtros seleccionados.</p>
            )}
        </div>
    );
}
