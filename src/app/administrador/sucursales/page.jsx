"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { usePageTitle } from "@/lib/usePageTitle";
import { toast } from "react-toastify";

const API_URL = "https://api-umam-1.onrender.com";

const handleFetchResponse = async (response) => {
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent("sessionExpired"));
    Cookies.remove("access_token");
    Cookies.remove("user_data");
    throw new Error("Sesión expirada...");
  }
  return response;
};

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

export default function SucursalesPage() {
  usePageTitle("Sucursales");
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
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sucursalToDelete, setSucursalToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  const [loadingAulas, setLoadingAulas] = useState(true);
  const [aulasSeleccionadas, setAulasSeleccionadas] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [editingAula, setEditingAula] = useState(null);

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/sucursales/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${Cookies.get("access_token")}`,
          },
        });
        await handleFetchResponse(response);

        if (!response.ok) {
          throw new Error("Error al cargar las sucursales");
        }
        const data = await response.json();
        setSucursales(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSucursales();
  }, []);

  const createSucursal = async (sucursalData) => {
    try {
      const response = await fetch(`${API_URL}/sucursales/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify(sucursalData),
      });
      await handleFetchResponse(response);
      if (!response.ok) throw new Error("Error al crear sucursal");
      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const updateSucursal = async (sucursalId, sucursalData) => {
    try {
      const response = await fetch(`${API_URL}/sucursales/${sucursalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify(sucursalData),
      });
      await handleFetchResponse(response);
      if (!response.ok) throw new Error("Error al actualizar sucursal");
      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const deleteSucursal = async (sucursalId) => {
    try {
      const response = await fetch(`${API_URL}/sucursales/${sucursalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
      });
      await handleFetchResponse(response);
      if (!response.ok) throw new Error("Error al eliminar sucursal");
      return true;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const fetchAulasBySucursal = async (sucursalId) => {
    try {
      setLoadingAulas(true);
      const response = await fetch(`${API_URL}/sucursales/${sucursalId}/aulas`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
      });
      await handleFetchResponse(response);
      if (!response.ok) throw new Error("Error al cargar las aulas");
      const data = await response.json();
      return Array.isArray(data) ? data.map(normalizeAula) : [];
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setLoadingAulas(false);
    }
  };

  const updateAula = async (aulaId, aulaData) => {
    try {
      const dataToSend = {
        nombre_aula: aulaData.nombre || aulaData.nombre_aula,
        capacidad: parseInt(aulaData.capacidad),
      };
      const response = await fetch(`${API_URL}/sucursales/aulas/${aulaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify(dataToSend),
      });
      await handleFetchResponse(response);
      if (!response.ok) throw new Error("Error al actualizar aula");
      const updatedAula = await response.json();
      setAulasSeleccionadas((prev) =>
        prev.map((a) => a.aula_id === aulaId ? normalizeAula(updatedAula) : a)
      );
      setEditingAula(null);
    } catch (error) {
      console.error("Error al actualizar aula:", error);
      toast.error(`Error al actualizar aula: ${error.message}`);
    }
  };

  const deleteAula = async (aulaId) => {
    try {
      const response = await fetch(`${API_URL}/sucursales/aulas/${aulaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${Cookies.get("access_token")}` },
      });
      await handleFetchResponse(response);
      if (!response.ok) throw new Error("Error al eliminar aula");
      setAulasSeleccionadas((prev) => prev.filter((a) => a.aula_id !== aulaId));
    } catch (error) {
      console.error("Error al eliminar aula:", error);
      toast.error(`Error al eliminar aula: ${error.message}`);
    }
  };

  const handleCreateAula = async () => {
    if (!nombreAula.trim() || !capacidadAula.trim()) {
      toast.warning("Por favor, complete todos los campos.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/sucursales/${sucursalSeleccionada.sucursal_id}/aulas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          nombre_aula: nombreAula,
          capacidad: parseInt(capacidadAula),
          sucursal_id: sucursalSeleccionada.sucursal_id,
        }),
      });
      await handleFetchResponse(response);
      if (!response.ok) throw new Error("Error al crear aula");
      const nuevaAula = normalizeAula(await response.json());
      setAulasSeleccionadas((prev) => [...prev, nuevaAula]);
      setNombreAula("");
      setCapacidadAula("");
    } catch (error) {
      toast.error(`Error al crear aula: ${error.message}`);
    }
  };

  const normalizeAula = (aula) => ({
    aula_id: aula?.aula_id,
    nombre: aula?.nombre || aula?.nombre_aula || "Sin nombre",
    capacidad: aula?.capacidad ? parseInt(aula.capacidad) : 0,
    sucursal_id: aula?.sucursal_id,
  });

  const sucursalesFiltradas = sucursales
    .filter((s) => s.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.sucursal_id - b.sucursal_id);

  const openModal = (sucursal = null) => {
    if (sucursal) {
      setEditingSucursal(sucursal);
      setFormData({ nombre: sucursal.nombre, direccion: sucursal.direccion });
    } else {
      setEditingSucursal(null);
      setFormData({ nombre: "", direccion: "" });
    }
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSucursal) {
        const updated = await updateSucursal(editingSucursal.sucursal_id, formData);
        setSucursales((prev) => prev.map((s) => s.sucursal_id === editingSucursal.sucursal_id ? updated : s));
      } else {
        const newlyCreated = await createSucursal(formData);
        setSucursales((prev) => [...prev, newlyCreated]);
      }
      setModalOpen(false);
    } catch (error) {
      toast.error("Ocurrió un error al guardar la sucursal");
    }
  };

  const openDeleteModal = (sucursal) => {
    setSucursalToDelete(sucursal);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (sucursalToDelete) {
        await deleteSucursal(sucursalToDelete.sucursal_id);
        setSucursales((prev) => prev.filter((s) => s.sucursal_id !== sucursalToDelete.sucursal_id));
      }
      setDeleteModalOpen(false);
      setSucursalToDelete(null);
    } catch (error) {
      toast.error("Ocurrió un error al eliminar la sucursal");
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setSucursalToDelete(null);
  };

  return (
    <>
      {/* Header Premium */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white shadow-xl mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Gestión de Sucursales
          </h1>
          <p className="mt-1 text-sm text-slate-300">Administra las sedes físicas y las aulas disponibles en cada una.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nueva Sucursal
        </button>
      </div>

      {/* Filtros Refinados */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="registros" className="text-xs font-bold uppercase text-slate-500">Mostrar</label>
          <select
            id="registros"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none"
            value={registrosPorPagina}
            onChange={(e) => { setRegistrosPorPagina(parseInt(e.target.value)); setCurrentPage(1); }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-xs font-bold uppercase text-slate-500">registros</span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </span>
            <input
              id="buscar"
              type="text"
              placeholder="Buscar sucursal..."
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {modalAulaOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/25" onClick={() => setModalAulaOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-slate-800">AULAS: {sucursalSeleccionada?.nombre?.toUpperCase()}</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Nombre</label>
                <input value={nombreAula} onChange={(e) => setNombreAula(e.target.value)} type="text" className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Capacidad</label>
                <input type="number" value={capacidadAula} onChange={(e) => setCapacidadAula(e.target.value)} className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end mb-6">
              <button onClick={handleCreateAula} className="bg-teal-600 text-white text-sm px-4 py-2 rounded-xl font-bold hover:bg-teal-700">+ Agregar Aula</button>
            </div>
            <div className="overflow-auto max-h-64 border border-slate-100 rounded-xl mb-6">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">NRO.</th>
                    <th className="px-4 py-2 text-left">NOMBRE</th>
                    <th className="px-4 py-2 text-center">CAPACIDAD</th>
                    <th className="px-4 py-2 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {aulasSeleccionadas.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-4 text-slate-400 italic">Sin aulas registradas</td></tr>
                  ) : (
                    aulasSeleccionadas.map((aula, idx) => (
                      <tr key={aula.aula_id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2">{idx + 1}</td>
                        <td className="px-4 py-2 font-medium">{aula.nombre}</td>
                        <td className="px-4 py-2 text-center">{aula.capacidad}</td>
                        <td className="px-4 py-2">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingAula(aula)} className="text-blue-600 hover:underline font-bold">Editar</button>
                            <button onClick={() => deleteAula(aula.aula_id)} className="text-red-600 hover:underline font-bold">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setModalAulaOpen(false)} className="bg-slate-100 text-slate-600 px-6 py-2 rounded-xl font-bold hover:bg-slate-200">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/25" onClick={() => setModalOpen(false)}>
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6 text-slate-800">{editingSucursal ? "EDITAR SUCURSAL" : "NUEVA SUCURSAL"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Nombre</label>
                <input id="nombre" type="text" value={formData.nombre} onChange={handleInputChange} className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Dirección</label>
                <input id="direccion" type="text" value={formData.direccion} onChange={handleInputChange} className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" required />
              </div>
              <div className="flex justify-end gap-2 mt-8">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40" onClick={cancelDelete}>
          <div className="bg-white p-6 rounded-2xl max-w-sm shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Confirmar eliminación</h3>
            <p className="text-slate-600 mb-6">¿Estás seguro de eliminar la sucursal <span className="font-bold text-slate-900">{sucursalToDelete?.nombre}</span>?</p>
            <div className="flex justify-center gap-3">
              <button onClick={cancelDelete} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
              <button onClick={confirmDelete} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-900/20">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {editingAula && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/25">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-6">EDITAR AULA</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Nombre</label>
                <input type="text" value={editingAula.nombre} onChange={(e) => setEditingAula({...editingAula, nombre: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Capacidad</label>
                <input type="number" value={editingAula.capacidad} onChange={(e) => setEditingAula({...editingAula, capacidad: e.target.value})} className="w-full border border-slate-200 p-2.5 rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-2 mt-8">
                <button onClick={() => setEditingAula(null)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
                <button onClick={() => updateAula(editingAula.aula_id, editingAula)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-auto bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 border-b">
            <tr className="text-left text-xs font-bold uppercase text-slate-500">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">NOMBRE SUCURSAL</th>
              <th className="px-6 py-4">DIRECCIÓN</th>
              <th className="px-6 py-4">AULAS</th>
              <th className="px-6 py-4 text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sucursalesFiltradas.slice((currentPage - 1) * registrosPorPagina, currentPage * registrosPorPagina).map((s) => (
              <tr key={s.sucursal_id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{s.sucursal_id}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{s.nombre}</td>
                <td className="px-6 py-4 text-slate-600">{s.direccion}</td>
                <td className="px-6 py-4">
                  <button onClick={async () => { setSucursalSeleccionada(s); const data = await fetchAulasBySucursal(s.sucursal_id); setAulasSeleccionadas(data); setModalAulaOpen(true); }} className="text-teal-600 font-bold hover:text-teal-700 transition-colors inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    Ver Aulas
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openModal(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><EditIcon /></button>
                    <button onClick={() => openDeleteModal(s)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><DeleteIcon /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 mb-6">
        <p className="text-sm text-slate-500 italic">Mostrando página {currentPage} de {Math.ceil(sucursalesFiltradas.length / registrosPorPagina)}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all">Anterior</button>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(sucursalesFiltradas.length / registrosPorPagina)))} disabled={currentPage >= Math.ceil(sucursalesFiltradas.length / registrosPorPagina)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all">Siguiente</button>
        </div>
      </div>
    </>
  );
}
