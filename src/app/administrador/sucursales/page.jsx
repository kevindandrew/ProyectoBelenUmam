"use client";

import { useState, useEffect } from "react";

export default function SucursalesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAulaOpen, setModalAulaOpen] = useState(false);
  const [nombreAula, setNombreAula] = useState("");
  const [capacidadAula, setCapacidadAula] = useState("");
  const [aulas, setAulas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSucursal, setEditingSucursal] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    celular: "",
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sucursalToDelete, setSucursalToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  const [loadingAulas, setLoadingAulas] = useState(true);

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://api-umam-1.onrender.com/sucursales/",
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZWx1Y2l0YSIsInR5cGUiOiJhY2Nlc3MiLCJleHAiOjE3NDg0NTcyNTV9.Hk-lPdpiSDW063RA4S54ST6JhNS-PXgvnNLp-LJLlHc",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Error al cargar las sucursales");
        }
        const data = await response.json();
        setSucursales(data);
      } catch (error) {
        console.error(error);
        // Aquí puedes mostrar un mensaje visual al usuario si quieres
      } finally {
        setLoading(false);
      }
    };

    fetchSucursales();
  }, []);

  useEffect(() => {
    const fetchAulas = async () => {
      try {
        setLoadingAulas(true);
        const response = await fetch("https://api-umam-1.onrender.com/aulas/", {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZWx1Y2l0YSIsInR5cGUiOiJhY2Nlc3MiLCJleHAiOjE3NDg0NTg5NTF9.RkMF9iUseQSd3ju3vyzytGQLdGouSZ-1uSUybLThjjA",
          },
        });
        if (!response.ok) {
          throw new Error("Error al cargar las aulas");
        }
        const data = await response.json();
        setAulas(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingAulas(false);
      }
    };

    fetchAulas();
  }, []);

  const sucursalesFiltradas = sucursales.filter((sucursal) =>
    sucursal.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal para nueva sucursal o para editar existente
  const openModal = (sucursal = null) => {
    if (sucursal) {
      setEditingSucursal(sucursal);
      setFormData({
        nombre: sucursal.nombre,
        direccion: sucursal.direccion,
      });
    } else {
      setEditingSucursal(null);
      setFormData({ nombre: "", direccion: "" });
    }
    setModalOpen(true);
  };

  // Manejo de cambio en formulario
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Guardar sucursal (nuevo o editado)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSucursal) {
      // Editar sucursal existente
      setSucursales((prev) =>
        prev.map((s) =>
          s.id === editingSucursal.id ? { ...s, ...formData } : s
        )
      );
    } else {
      // Agregar nueva sucursal con id incremental
      const newId =
        sucursales.length > 0
          ? Math.max(...sucursales.map((s) => s.id)) + 1
          : 1;
      setSucursales((prev) => [...prev, { id: newId, ...formData }]);
    }
    setModalOpen(false);
  };

  // Abrir modal de confirmación para eliminar sucursal
  const openDeleteModal = (sucursal) => {
    setSucursalToDelete(sucursal);
    setDeleteModalOpen(true);
  };

  // Confirmar eliminación de sucursal
  const confirmDelete = () => {
    if (sucursalToDelete) {
      setSucursales((prev) => prev.filter((s) => s.id !== sucursalToDelete.id));
    }
    setDeleteModalOpen(false);
    setSucursalToDelete(null);
  };

  // Cancelar eliminación
  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setSucursalToDelete(null);
  };

  // Íconos SVG
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

  return (
    <div className="text-gray-900">
      <h1 className="text-3xl font-bold text-[#13678A] border-b pb-2">
        SUCURSALES
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
            placeholder="Buscar sucursal..."
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={() => openModal()}
          className="bg-teal-500 text-white px-4 py-2 rounded text-sm hover:bg-teal-600 self-start sm:self-auto"
        >
          + Nueva Sucursal
        </button>
      </div>

      {modalAulaOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/25">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
            <h2 className="text-xl font-semibold mb-4">AGREGAR AULAS</h2>

            {/* FORM PARA NOMBRE Y CAPACIDAD */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-700">Nombre del Aula</label>
                <input
                  value={nombreAula}
                  onChange={(e) => setNombreAula(e.target.value)}
                  type="text"
                  className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700">Capacidad</label>
                <input
                  type="number"
                  min="1"
                  value={capacidadAula}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 1 || e.target.value === "") {
                      setCapacidadAula(e.target.value);
                    }
                  }}
                  className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-semibold">AULAS DISPONIBLES</h4>
              <button
                onClick={() => {
                  if (nombreAula.trim() && capacidadAula.trim()) {
                    setAulas([
                      ...aulas,
                      {
                        nombre: nombreAula,
                        capacidad: parseInt(capacidadAula),
                      },
                    ]);
                    setNombreAula("");
                    setCapacidadAula("");
                  }
                }}
                className="bg-teal-600 text-white text-sm px-3 py-1 rounded hover:bg-teal-700"
              >
                + Agregar Aula
              </button>
            </div>

            {/* TABLA DE AULAS */}
            <table className="w-full text-sm border mb-4">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="border px-2 py-1">Nro.</th>
                  <th className="border px-2 py-1">NOMBRE</th>
                  <th className="border px-2 py-1">CAPACIDAD</th>
                  <th className="border px-2 py-1">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {aulas.map((aula, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1 text-center">{idx + 1}</td>
                    <td className="border px-2 py-1">{aula.nombre}</td>
                    <td className="border px-2 py-1 text-center">
                      {aula.capacidad}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        onClick={() => {
                          const nuevasAulas = aulas.filter((_, i) => i !== idx);
                          setAulas(nuevasAulas);
                        }}
                        className="text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* BOTONES GUARDAR Y CANCELAR */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setModalAulaOpen(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Aquí podrías pasar `aulas` al formulario principal
                  setModalAulaOpen(false);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal NUEVA SUCURSAL */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/25">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500"
            >
              X
            </button>
            <h2 className="text-xl font-semibold mb-4">
              {editingSucursal ? "EDITAR SUCURSAL" : "NUEVA SUCURSAL"}
            </h2>
            {/* Formulario de sucursal */}
            <form className="grid-cols-1 gap-4" onSubmit={handleSubmit}>
              {/* Campo: Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm text-gray-700">
                  Nombre
                </label>
                <input
                  id="nombre"
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Campo: Dirección */}
              <div>
                <label
                  htmlFor="direccion"
                  className="block text-sm text-gray-700"
                >
                  Dirección
                </label>
                <input
                  id="direccion"
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Botón final (toda la fila) */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  {editingSucursal ? "Guardar Cambios" : "Crear Sucursal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminar */}
      {deleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Confirmar eliminación
            </h3>
            <p className="mb-6 text-gray-700">
              ¿Estás seguro de que deseas eliminar la sucursal{" "}
              <span className="font-semibold">{sucursalToDelete?.nombre}</span>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelDelete}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de sucursales */}
      <div className="overflow-auto">
        <table className="w-full border text-sm bg-white">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border-b">ID</th>
              <th className="px-4 py-2 border-b">NOMBRE SUCURSAL</th>
              <th className="px-4 py-2 border-b">DIRECCION</th>
              <th className="px-4 py-2 border-b">AULAS</th>
              <th className="px-4 py-2 border-b">ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  Cargando sucursales...
                </td>
              </tr>
            ) : sucursalesFiltradas.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No hay sucursales
                </td>
              </tr>
            ) : (
              sucursalesFiltradas.map((sucursal) => (
                <tr key={sucursal.sucursal_id}>
                  <td className="px-4 py-2 border-b">{sucursal.sucursal_id}</td>
                  <td className="px-4 py-2 border-b">{sucursal.nombre}</td>
                  <td className="px-4 py-2 border-b">{sucursal.direccion}</td>
                  <td className="px-4 py-2 border-b">
                    <button
                      type="button"
                      onClick={() => {
                        setModalAulaOpen(true);
                        // Aquí podrías pasar las aulas para mostrarlas
                        setAulasSeleccionadas(sucursal.aulas);
                      }}
                      className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700"
                    >
                      Aulas
                    </button>
                  </td>
                  <td className="px-4 py-2 border-b flex gap-2">
                    <button
                      onClick={() => openModal(sucursal)}
                      aria-label="Editar"
                      className="text-blue-600 hover:text-blue-800 p-1 rounded"
                      title="Editar"
                      type="button"
                    >
                      {/* SVG editar */}
                    </button>
                    <button
                      onClick={() => openDeleteModal(sucursal)}
                      aria-label="Eliminar"
                      className="text-red-600 hover:text-red-800 p-1 rounded"
                      title="Eliminar"
                      type="button"
                    >
                      {/* SVG eliminar */}
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
    </div>
  );
}
