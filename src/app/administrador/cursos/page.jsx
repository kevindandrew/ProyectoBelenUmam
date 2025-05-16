"use client";

import { useEffect, useState } from "react";

export default function CursosPage() {
    const [cursos, setCursos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [nuevoCurso, setNuevoCurso] = useState({
        nombrecurso: "",
        tipo: "Taller",
        duracionCantidad: 1,
        duracionUnidad: "meses",
    });

    const calcularDuracion = () => {
        return nuevoCurso.tipo === "Gestoría"
            ? "9 meses"
            : `${nuevoCurso.duracionCantidad} ${nuevoCurso.duracionUnidad}`;
    };

    const guardarCurso = () => {
        const nuevo = {
            id: cursos.length + 1,
            nombrecurso: nuevoCurso.nombrecurso,
            tipo: nuevoCurso.tipo,
            duracion: calcularDuracion(),
        };

        setCursos([...cursos, nuevo]);
        setModalAbierto(false);
        setNuevoCurso({
            nombrecurso: "",
            tipo: "Taller",
            duracionCantidad: 1,
            duracionUnidad: "meses",
        });
    };




    // Simulamos una llamada a una API con setTimeout
    useEffect(() => {
        const fetchCursos = async () => {
            setLoading(true);
            // Simula espera de la API
            setTimeout(() => {
                const data = [
                    {
                        id: 1,
                        nombrecurso: "Nuevas Tecnologías",
                        tipo: "Gestoría",
                        duracion: "9 meses",
                    },
                    {
                        id: 2,
                        nombrecurso: "Repostería",
                        tipo: "Taller",
                        duracion: "3 meses",
                    },
                ];
                setCursos(data);
                setLoading(false);
            }, 1000); // 1 segundo de simulación
        };

        fetchCursos();
    }, []);

    return (


        <div className="text-gray-900">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">CURSOS</h1>

            {/* Controles superiores */}
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
                        placeholder="Buscar cursos..."
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                </div>

                <button
                    onClick={() => setModalAbierto(true)}
                    className="bg-teal-500 text-white px-4 py-2 rounded text-sm hover:bg-teal-600 self-start sm:self-auto"
                >
                    + Nuevo Curso
                </button>

            </div>

            {/* Tabla de cursos */}
            <div className="overflow-auto">
                <table className="w-full border text-sm bg-white">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="px-4 py-2 border-b">ID</th>
                            <th className="px-4 py-2 border-b">NOMBRE CURSO</th>
                            <th className="px-4 py-2 border-b">TIPO</th>
                            <th className="px-4 py-2 border-b">DURACION</th>
                            <th className="px-4 py-2 border-b">ACCIÓN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-gray-500">
                                    Cargando cursos...
                                </td>
                            </tr>
                        ) : cursos.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-gray-500">
                                    No hay cursos registrados
                                </td>
                            </tr>
                        ) : (
                            cursos.map((curso) => (
                                <tr key={curso.id}>
                                    <td className="px-4 py-2 border-b">{curso.id}</td>
                                    <td className="px-4 py-2 border-b">{curso.nombrecurso}</td>
                                    <td className="px-4 py-2 border-b">{curso.tipo}</td>
                                    <td className="px-4 py-2 border-b">{curso.duracion}</td>
                                    <td className="px-4 py-2 border-b">
                                        <button className="text-blue-600 hover:underline text-sm">
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="flex justify-end items-center gap-4 mt-4">
                <button className="text-sm text-gray-500 hover:text-black">
                    Anterior
                </button>
                <button className="text-sm text-gray-500 hover:text-black">
                    Siguiente
                </button>
            </div>

            {modalAbierto && (
                <div className="fixed inset-0 bg-black bg-black/25 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Nuevo Curso</h2>

                        {/* Campo: nombre del curso */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium">Nombre del Curso</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 px-3 py-2 rounded mt-1"
                                value={nuevoCurso.nombrecurso}
                                onChange={(e) =>
                                    setNuevoCurso({ ...nuevoCurso, nombrecurso: e.target.value })
                                }
                            />
                        </div>

                        {/* Campo: tipo de curso */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium">Tipo</label>
                            <select
                                className="w-full border border-gray-300 px-3 py-2 rounded mt-1"
                                value={nuevoCurso.tipo}
                                onChange={(e) => {
                                    const tipo = e.target.value;
                                    setNuevoCurso({
                                        ...nuevoCurso,
                                        tipo,
                                        duracionCantidad: tipo === "Gestoría" ? 9 : nuevoCurso.duracionCantidad,
                                        duracionUnidad: tipo === "Gestoría" ? "meses" : nuevoCurso.duracionUnidad,
                                    });
                                }}
                            >
                                <option value="Gestorias">Gestoría</option>
                                <option value="Taller">Taller</option>
                            </select>
                        </div>

                        {/* Campos de duración (solo para Taller) */}
                        {nuevoCurso.tipo !== "Gestoría" && (
                            <div className="mb-4 flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium">Duración</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="w-full border border-gray-300 px-3 py-2 rounded mt-1"
                                        value={nuevoCurso.duracionCantidad}
                                        onChange={(e) =>
                                            setNuevoCurso({
                                                ...nuevoCurso,
                                                duracionCantidad: Math.max(1, parseInt(e.target.value || "1")),
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium">Unidad</label>
                                    <select
                                        className="w-full border border-gray-300 px-3 py-2 rounded mt-1"
                                        value={nuevoCurso.duracionUnidad}
                                        onChange={(e) =>
                                            setNuevoCurso({ ...nuevoCurso, duracionUnidad: e.target.value })
                                        }
                                    >
                                        <option value="días">Días</option>
                                        <option value="semanas">Semanas</option>
                                        <option value="meses">Meses</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setModalAbierto(false)}
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarCurso}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>

    );
}
