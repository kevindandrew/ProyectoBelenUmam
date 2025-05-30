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
    try {
      let response;
      if (editingCurso) {
        // Actualizar curso existente
        response = await fetch(`${API_URL}/${editingCurso.curso_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `bearer ${Cookies.get("access_token")}`,
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Crear nuevo curso
        response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `bearer ${Cookies.get("access_token")}`,
          },
          body: JSON.stringify(formData),
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
  const cursosFiltrados = cursos.filter((curso) =>
    curso.nombre.toLowerCase().includes(searchTerm.toLowerCase())
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
            value={searchTerm}
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
              cursosFiltrados.map((curso, index) => (
                <tr key={curso.curso_id}>
                  <td className="px-4 py-2 border-b">{index + 1}</td>
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
                      onClick={() => eliminarCurso(curso.curso_id)}
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
      </div>

      {/* Modal para crear/editar curso */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
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
    </div>
  );
}
