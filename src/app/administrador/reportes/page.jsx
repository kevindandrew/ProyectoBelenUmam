// src/app/administrador/reportes/page.jsx
'use client';
import { useState } from 'react';

// Datos para la pestaña General
const estudiantesPorGestion = [
    { gestion: "2022", estudiantes: 320 },
    { gestion: "2023", estudiantes: 450 },
    { gestion: "2024", estudiantes: 520 },
];

const estudiantesPorSucursal = [
    { nombre: "Central", value: 250, color: "#0088FE" },
    { nombre: "Sur", value: 180, color: "#00C49F" },
    { nombre: "Norte", value: 120, color: "#FFBB28" },
];

const estudiantesPorCurso = [
    { nombre: "Talleres", value: 300, color: "#FF8042" },
    { nombre: "Gestorías", value: 220, color: "#8884d8" },
];

const facilitadoresPorGestion = [
    { gestion: "2022", facilitadores: 20 },
    { gestion: "2023", facilitadores: 25 },
    { gestion: "2024", facilitadores: 28 },
];

// Datos para la pestaña Detalle
const talleres = [
    "CHOCOLATERIA", "COCINA Y REPOSTERIA", "COMPUTACION",
    "COMPUTACION AVANZADA", "CONTABILIDAD PRODUCTIVA", "EMPREDEDURISMO",
    "DANZA FOLKLORICA", "DANZATERAPIA", "DIBUJO Y PINTURA",
    "HUERTOS URBANOS", "INGLES BASICO", "INGLES INTERMEDIO",
    "KINESIOLOGÍA PRÁCTICA", "MANUALIDADES", "MÚSICA: CANTO Y GUITARRA",
    "NUTRICION", "PSICOLOGIA", "PSICOMOTRICIDAD",
    "REPOSTERIA Y PASTELERIA", "TAI CHI Y CHI KUNG",
    "USO DE NUEVAS TIC's", "USO DE NUEVAS TIC's AVANZADO"
];

const gestorias = [
    "GESTORIA ORIENTACION LEGAL", "GESTORIA DE TURISMO",
    "GESTORIA DE SALUD", "GESTORIA DE NUEVAS TECNOLOGIAS"
];

const sucursales = ["Central", "Sur", "Norte", "San Antonio", "Max Paredes"];
const gestiones = ["I", "II"];
const añosAcademicos = ["2022", "2023", "2024"];

// Datos de ejemplo para la tabla detallada
const datosDetallados = [
    { año: "2023", gestion: "I", sucursal: "San Antonio", curso: "Manualidades", inscritos: 25, aprobados: 22, reprobados: 2, abandonos: 1 },
    { año: "2023", gestion: "II", sucursal: "Max Paredes", curso: "Computación", inscritos: 18, aprobados: 15, reprobados: 1, abandonos: 2 },
    { año: "2024", gestion: "I", sucursal: "Central", curso: "Repostería y Pastelería", inscritos: 30, aprobados: 28, reprobados: 1, abandonos: 1 },
    { año: "2024", gestion: "I", sucursal: "Sur", curso: "Inglés Básico", inscritos: 22, aprobados: 20, reprobados: 1, abandonos: 1 },
    { año: "2024", gestion: "II", sucursal: "Norte", curso: "Gestoría de Salud", inscritos: 15, aprobados: 14, reprobados: 0, abandonos: 1 },
    { año: "2023", gestion: "I", sucursal: "Central", curso: "Danza Folklórica", inscritos: 20, aprobados: 18, reprobados: 1, abandonos: 1 },
    { año: "2023", gestion: "II", sucursal: "Sur", curso: "Computación Avanzada", inscritos: 12, aprobados: 11, reprobados: 0, abandonos: 1 },
    { año: "2024", gestion: "I", sucursal: "Norte", curso: "Gestoría de Turismo", inscritos: 10, aprobados: 9, reprobados: 0, abandonos: 1 },
];

export default function DashboardUMAM() {
    const [tabActiva, setTabActiva] = useState('general');
    const [filtros, setFiltros] = useState({
        año: '',
        gestion: '',
        sucursal: '',
        curso: '',
        busqueda: ''
    });

    // Función para renderizar gráficos de torta
    const renderPieChart = (data, size = 40) => {
        let currentAngle = 0;
        return data.map((item, index) => {
            const percentage = (item.value / data.reduce((sum, i) => sum + i.value, 0)) * 100;
            const angle = (percentage / 100) * 360;
            const largeArcFlag = percentage > 50 ? 1 : 0;

            const x1 = 50 + Math.cos(currentAngle * Math.PI / 180) * size;
            const y1 = 50 + Math.sin(currentAngle * Math.PI / 180) * size;
            currentAngle += angle;
            const x2 = 50 + Math.cos(currentAngle * Math.PI / 180) * size;
            const y2 = 50 + Math.sin(currentAngle * Math.PI / 180) * size;

            return (
                <path
                    key={index}
                    d={`M 50 50 L ${x1} ${y1} A ${size} ${size} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={item.color}
                    className="opacity-90 hover:opacity-100"
                />
            );
        });
    };

    // Filtrar datos según los filtros seleccionados
    const datosFiltrados = datosDetallados.filter(item => {
        return (
            (filtros.año === '' || item.año === filtros.año) &&
            (filtros.gestion === '' || item.gestion === filtros.gestion) &&
            (filtros.sucursal === '' || item.sucursal.includes(filtros.sucursal)) &&
            (filtros.curso === '' || item.curso.includes(filtros.curso)) &&
            (filtros.busqueda === '' ||
                item.sucursal.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                item.curso.toLowerCase().includes(filtros.busqueda.toLowerCase()))
        );
    });

    // Función para descargar lista de aprobados
    const descargarAprobados = () => {
        const aprobados = datosFiltrados.map(item => ({
            Sucursal: item.sucursal,
            Curso: item.curso,
            Aprobados: item.aprobados,
            Porcentaje: Math.round((item.aprobados / item.inscritos) * 100) + '%'
        }));

        const csvContent = [
            "Sucursal,Curso,Aprobados,Porcentaje",
            ...aprobados.map(item => `${item.Sucursal},${item.Curso},${item.Aprobados},${item.Porcentaje}`)
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `aprobados_umam_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-[#13678A] border-b pb-2">REPORTES</h1>

            {/* Pestañas */}
            <div className="flex border-b border-gray-200">
                <button
                    className={`py-2 px-4 font-medium ${tabActiva === 'general' ? 'text-[#13678A] border-b-2 border-[#13678A]' : 'text-gray-500'}`}
                    onClick={() => setTabActiva('general')}
                >
                    General
                </button>
                <button
                    className={`py-2 px-4 font-medium ${tabActiva === 'detalle' ? 'text-[#13678A] border-b-2 border-[#13678A]' : 'text-gray-500'}`}
                    onClick={() => setTabActiva('detalle')}
                >
                    Detalle
                </button>
            </div>

            {/* Contenido de pestañas */}
            {tabActiva === 'general' ? (
                /* Contenido General */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Estudiantes por Sucursal */}
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                        <h2 className="text-xl font-semibold text-[#012030] mb-4">Estudiantes por Sucursal</h2>
                        <div className="flex flex-col md:flex-row items-center">
                            <div className="relative w-48 h-48 mb-4 md:mb-0 md:mr-4">
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    {renderPieChart(estudiantesPorSucursal, 40)}
                                    <circle cx="50" cy="50" r="15" fill="white" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                {estudiantesPorSucursal.map((item, index) => (
                                    <div key={index} className="flex items-center">
                                        <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm">
                                            {item.nombre}: <span className="font-medium">{item.value}</span> ({Math.round((item.value / estudiantesPorSucursal.reduce((sum, i) => sum + i.value, 0)) * 100)}%)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Estudiantes por Gestión */}
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                        <h2 className="text-xl font-semibold text-[#012030] mb-4">Estudiantes por Gestión</h2>
                        <div className="space-y-4">
                            {estudiantesPorGestion.map((item) => {
                                const percentage = (item.estudiantes / 600) * 100;
                                return (
                                    <div key={item.gestion}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{item.gestion}</span>
                                            <span className="text-gray-600">{item.estudiantes} estudiantes</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3">
                                            <div
                                                className="bg-[#13678A] h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <div className="text-right text-xs text-gray-500 mt-1">
                                            {Math.round(percentage)}% del total
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Estudiantes por Curso */}
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                        <h2 className="text-xl font-semibold text-[#012030] mb-4">Estudiantes por Curso</h2>
                        <div className="relative h-48">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                {renderPieChart(estudiantesPorCurso, 30)}
                                <circle cx="50" cy="50" r="15" fill="white" />
                            </svg>
                        </div>
                        <div className="flex justify-center gap-4 mt-4">
                            {estudiantesPorCurso.map((item, index) => (
                                <div key={index} className="flex items-center">
                                    <div
                                        className="w-3 h-3 rounded-full mr-1"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-xs">{item.nombre} ({item.value})</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Facilitadores por Gestión */}
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 md:col-span-2 lg:col-span-1">
                        <h2 className="text-xl font-semibold text-[#012030] mb-4">Facilitadores por Gestión</h2>
                        <div className="flex justify-between gap-4">
                            {facilitadoresPorGestion.map((item) => {
                                const growth = item.gestion !== "2022"
                                    ? Math.round(((item.facilitadores - facilitadoresPorGestion[0].facilitadores) / facilitadoresPorGestion[0].facilitadores) * 100)
                                    : 0;

                                return (
                                    <div key={item.gestion} className="flex-1 text-center">
                                        <div className="text-3xl font-bold text-[#FF8042]">{item.facilitadores}</div>
                                        <div className="text-sm mt-1 bg-gray-100 py-1 rounded">
                                            {item.gestion}
                                            {growth !== 0 && (
                                                <span className={`ml-1 ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    ({growth > 0 ? '+' : ''}{growth}%)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Botón de descarga general */}
                    <div className="flex justify-center pt-6 col-span-full">
                        <button className="bg-[#13678A] hover:bg-[#012030] text-white px-6 py-3 rounded-lg shadow-md transition-colors flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Descargar Base de Estudiantes
                        </button>
                    </div>
                </div>
            ) : (
                /* Contenido Detalle */
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-[#012030]">Detalle por Sucursal y Curso</h2>

                    {/* Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Año académico</label>
                            <select
                                className="w-full border border-gray-300 rounded-md p-2"
                                value={filtros.año}
                                onChange={(e) => setFiltros({ ...filtros, año: e.target.value })}
                            >
                                <option value="">Todos</option>
                                {añosAcademicos.map(año => (
                                    <option key={año} value={año}>{año}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gestión</label>
                            <select
                                className="w-full border border-gray-300 rounded-md p-2"
                                value={filtros.gestion}
                                onChange={(e) => setFiltros({ ...filtros, gestion: e.target.value })}
                            >
                                <option value="">Todas</option>
                                {gestiones.map(gestion => (
                                    <option key={gestion} value={gestion}>{gestion}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                            <select
                                className="w-full border border-gray-300 rounded-md p-2"
                                value={filtros.sucursal}
                                onChange={(e) => setFiltros({ ...filtros, sucursal: e.target.value })}
                            >
                                <option value="">Todas</option>
                                {sucursales.map(sucursal => (
                                    <option key={sucursal} value={sucursal}>{sucursal}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                            <select
                                className="w-full border border-gray-300 rounded-md p-2"
                                value={filtros.curso}
                                onChange={(e) => setFiltros({ ...filtros, curso: e.target.value })}
                            >
                                <option value="">Todos</option>
                                <optgroup label="Talleres">
                                    {talleres.map(taller => (
                                        <option key={taller} value={taller}>{taller}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Gestorías">
                                    {gestorias.map(gestoria => (
                                        <option key={gestoria} value={gestoria}>{gestoria}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        <div className="md:col-span-2 lg:col-span-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-md p-2"
                                placeholder="Buscar por sucursal o curso..."
                                value={filtros.busqueda}
                                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Tabla de resultados */}
                    <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sucursal</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscritos</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aprobados</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Aprobación</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reprobados</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abandonos</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {datosFiltrados.length > 0 ? (
                                        datosFiltrados.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sucursal}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.curso}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.inscritos}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.aprobados}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {Math.round((item.aprobados / item.inscritos) * 100)}%
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.reprobados}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.abandonos}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                                No se encontraron resultados con los filtros seleccionados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Botón de descarga */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={descargarAprobados}
                            className="bg-[#13678A] hover:bg-[#012030] text-white px-6 py-3 rounded-lg shadow-md transition-colors flex items-center gap-2"
                            disabled={datosFiltrados.length === 0}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Descargar lista de aprobados
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}