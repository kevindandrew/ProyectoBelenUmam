"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

// Componentes de iconos
const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 4.487a2.062 2.062 0 112.91 2.91l-9.193 9.193a2.062 2.062 0 01-1.035.556l-3.47.694a.516.516 0 01-.605-.605l.694-3.47a2.062 2.062 0 01.556-1.035l9.193-9.193z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 7.5l-1.25 1.25"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export default function CursosPage() {
  const API_URL = "https://api-umam-1.onrender.com/cursos";
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCurso, setEditingCurso] = useState(null);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  const [paginaActual, setPaginaActual] = useState(1);
  const [cursoAEliminar, setCursoAEliminar] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    gestoria: false,
  });

  // Obtener cursos de la API
  useEffect(() => {
    const fetchCursos = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `bearer ${Cookies.get("access_token")}`,
          },
        });

        if (!response.ok) throw new Error("Error al cargar cursos");
        const data = await response.json();
        setCursos(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCursos();
  }, []);

  // Crear o actualizar curso
  const guardarCurso = async () => {
    const nombreValido = formData.nombre.trim();

    if (nombreValido.length === 0) {
      alert("El nombre del curso no puede estar vacío.");
      return;
    }

    if (nombreValido.length > 100) {
      alert("El nombre del curso no puede superar los 100 caracteres.");
      return;
    }

    try {
      let response;
      if (editingCurso) {
        response = await fetch(`${API_URL}/${editingCurso.curso_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `bearer ${Cookies.get("access_token")}`,
          },
          body: JSON.stringify({ ...formData, nombre: nombreValido }),
        });
      } else {
        response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `bearer ${Cookies.get("access_token")}`,
          },
          body: JSON.stringify({ ...formData, nombre: nombreValido }),
        });
      }

      if (!response.ok) throw new Error("Error al guardar el curso");

      const cursoActualizado = await response.json();

      if (editingCurso) {
        setCursos(
          cursos.map((c) =>
            c.curso_id === editingCurso.curso_id ? cursoActualizado : c
          )
        );
      } else {
        setCursos([...cursos, cursoActualizado]);
      }

      cerrarModal();
    } catch (error) {
      alert(error.message);
    }
  };

  // Eliminar curso
  const eliminarCurso = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este curso?")) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `bearer ${Cookies.get("access_token")}`,
        },
      });

      if (!response.ok) throw new Error("Error al eliminar curso");

      setCursos(cursos.filter((curso) => curso.curso_id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  // Abrir modal para edición
  const abrirEdicion = (curso) => {
    setEditingCurso(curso);
    setFormData({
      nombre: curso.nombre,
      gestoria: curso.gestoria,
    });
    setModalAbierto(true);
  };

  // Cerrar modal y resetear estado
  const cerrarModal = () => {
    setModalAbierto(false);
    setEditingCurso(null);
    setFormData({
      nombre: "",
      gestoria: false,
    });
  };
  // Filtrar cursos por término de búsqueda
  const cursosFiltrados = cursos.filter((curso) => {
    const terminoBusqueda = searchTerm.toLowerCase();
    const nombreCurso = curso.nombre.toLowerCase();
    const tipoCurso = curso.gestoria ? "gestoría" : "taller";

    return (
      nombreCurso.includes(terminoBusqueda) ||
      tipoCurso.includes(terminoBusqueda)
    );
  });

  const totalPaginas = Math.ceil(cursosFiltrados.length / registrosPorPagina);
  const inicio = (paginaActual - 1) * registrosPorPagina;
  const cursosPaginados = cursosFiltrados.slice(
    inicio,
    inicio + registrosPorPagina
  );

  return (
    <div className="text-gray-900">
      <h1 className="text-3xl font-bold text-[#13678A] border-b pb-2">
        CURSOS
      </h1>

      {/* Controles superiores */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="registros" className="text-sm text-gray-900">
            Mostrar
          </label>
          <select
            id="registros"
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={registrosPorPagina}
            onChange={(e) => {
              setRegistrosPorPagina(parseInt(e.target.value));
              setPaginaActual(1); // Reiniciar a la primera página
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
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
            value={searchTerm}
            maxLength={100}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              <th className="px-4 py-2 border-b">N°</th>
              <th className="px-4 py-2 border-b">NOMBRE CURSO</th>
              <th className="px-4 py-2 border-b">TIPO</th>
              <th className="px-4 py-2 border-b">ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  Cargando cursos...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-red-500">
                  {error}
                </td>
              </tr>
            ) : cursosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  No hay cursos registrados
                </td>
              </tr>
            ) : (
              cursosPaginados.map((curso, index) => (
                <tr key={curso.curso_id}>
                  <td className="px-4 py-2 border-b">{inicio + index + 1}</td>
                  <td className="px-4 py-2 border-b">{curso.nombre}</td>
                  <td className="px-4 py-2 border-b">
                    {curso.gestoria ? "Gestoría" : "Taller"}
                  </td>
                  <td className="px-4 py-2 border-b flex gap-2">
                    <button
                      onClick={() => abrirEdicion(curso)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Editar"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => setCursoAEliminar(curso)}
                      className="text-red-500 hover:text-red-700"
                      title="Eliminar"
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="mt-4 flex justify-between items-center text-sm">
          <div>
            Página {paginaActual} de {totalPaginas}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              className={`px-3 py-1 rounded border ${
                paginaActual === 1
                  ? "text-gray-400 border-gray-300"
                  : "text-blue-600 border-blue-600 hover:bg-blue-50"
              }`}
            >
              Anterior
            </button>
            <button
              onClick={() =>
                setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
              }
              disabled={paginaActual === totalPaginas}
              className={`px-3 py-1 rounded border ${
                paginaActual === totalPaginas
                  ? "text-gray-400 border-gray-300"
                  : "text-blue-600 border-blue-600 hover:bg-blue-50"
              }`}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar curso */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md mx-4 sm:mx-0">
            <h2 className="text-xl font-bold mb-4">
              {editingCurso ? "EDITAR CURSO" : "NUEVO CURSO"}
            </h2>

            {/* Campo: nombre del curso */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Nombre del Curso *
              </label>
              <input
                type="text"
                maxLength={100}
                className="w-full border border-gray-300 px-3 py-2 rounded"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                required
              />
            </div>

            {/* Campo: tipo de curso */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Tipo *</label>
              <select
                className="w-full border border-gray-300 px-3 py-2 rounded"
                value={formData.gestoria ? "Gestoría" : "Taller"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gestoria: e.target.value === "Gestoría",
                  })
                }
                required
              >
                <option value="Gestoría">Gestoría</option>
                <option value="Taller">Taller</option>
              </select>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={cerrarModal}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarCurso}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {editingCurso ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {cursoAEliminar && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm mx-4 sm:mx-0">
            <h2 className="text-lg font-semibold mb-4 text-red-600">
              Confirmar Eliminación
            </h2>
            <p className="mb-4 text-sm">
              ¿Estás seguro de que deseas eliminar el curso{" "}
              <strong>{cursoAEliminar.nombre}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCursoAEliminar(null)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await eliminarCurso(cursoAEliminar.curso_id);
                  setCursoAEliminar(null);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
