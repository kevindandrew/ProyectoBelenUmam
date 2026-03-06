"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Cookies from "js-cookie";
import UsuariosTable from "./components/UsuariosTable";
import UsuarioFormModal from "./components/UsuarioFormModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import UserDetailsModal from "./components/UserDetailsModal";
import SearchBar from "./components/SearchBar";
import ErrorAlert from "@/components/ui/ErrorAlert";

const initialUserState = {
  nombres: "",
  ap_paterno: "",
  ap_materno: "",
  ci: "",
  telefono: "",
  rol_id: 1,
  sucursal_id: null,
  username: "",
  password: "",
};

const API_URL = "https://api-umam-1.onrender.com";

// Función helper para detectar sesiones expiradas
const handleFetchResponse = async (response) => {
  if (response.status === 401) {
    // Disparar evento de sesión expirada
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sessionExpired"));
    }
    Cookies.remove("access_token");
    Cookies.remove("user_data");
    throw new Error("Sesión expirada. Por favor, vuelve a iniciar sesión.");
  }
  return response;
};

export default function UsuariosPage() {
  // Estados agrupados por categoría
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [usuarios, setUsuarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState(initialUserState);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Función para resetear el formulario
  const resetForm = useCallback(() => {
    setNewUser(initialUserState);
    setEditingUser(null);
  }, []);

  // Función para generar username (memoizada)
  const generateUsername = useCallback(
    (nombres, apellidoPaterno, apellidoMaterno, ci) => {
      let usernameBase = "";
      if (nombres.length > 0) usernameBase += nombres.charAt(0).toLowerCase();
      if (apellidoPaterno.length > 0) {
        usernameBase += apellidoPaterno.charAt(0).toLowerCase();
      } else if (apellidoMaterno.length > 0) {
        usernameBase += apellidoMaterno.charAt(0).toLowerCase();
      }
      if (ci.length > 0) usernameBase += ci;
      return usernameBase;
    },
    [],
  );

  // Manejador de cambios en inputs (memoizado)
  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const finalValue = name.endsWith("_id") ? parseInt(value) || null : value;

      setNewUser((prev) => {
        const updatedUser = { ...prev, [name]: finalValue };

        // Generación automática de username
        if (["nombres", "ap_paterno", "ap_materno", "ci"].includes(name)) {
          const nombres = name === "nombres" ? value : prev.nombres;
          const ap_paterno = name === "ap_paterno" ? value : prev.ap_paterno;
          const ap_materno = name === "ap_materno" ? value : prev.ap_materno;
          const ci = name === "ci" ? value : prev.ci;

          updatedUser.username = generateUsername(
            nombres,
            ap_paterno,
            ap_materno,
            ci,
          );
        }

        // Establecer CI como contraseña por defecto
        if (name === "ci") {
          updatedUser.password = value;
        }

        return updatedUser;
      });
    },
    [generateUsername],
  );

  // Función para obtener un usuario por ID (memoizada)
  const fetchUsuarioById = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      await handleFetchResponse(response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Error ${response.status}: ${response.statusText}`,
        );
      }

      const usuario = await response.json();

      return {
        id: usuario.usuario_id,
        usuario_id: usuario.usuario_id,
        nombres: usuario.nombres,
        apellidoPaterno: usuario.ap_paterno,
        apellidoMaterno: usuario.ap_materno,
        ap_paterno: usuario.ap_paterno,
        ap_materno: usuario.ap_materno,
        ci: usuario.ci,
        celular: usuario.telefono,
        telefono: usuario.telefono,
        rol_id: usuario.rol_id,
        rol: usuario.rol?.nombre || "Sin rol",
        sucursal_id: usuario.sucursal_id,
        sucursal: usuario.sucursal?.nombre || "",
        username: usuario.username,
        password: usuario.password || "******",
      };
    } catch (err) {
      console.error("Error al obtener usuario por ID:", err);
      throw err;
    }
  }, []);

  // Función para abrir el formulario de edición (memoizada)
  const openEditForm = useCallback(
    async (usuario) => {
      try {
        const usuarioCompleto = await fetchUsuarioById(usuario.id);

        setEditingUser(usuarioCompleto);
        setNewUser((prev) => ({
          ...prev,
          nombres: usuarioCompleto.nombres,
          ap_paterno: usuarioCompleto.ap_paterno,
          ap_materno: usuarioCompleto.ap_materno,
          ci: usuarioCompleto.ci,
          telefono: usuarioCompleto.telefono,
          rol_id: usuarioCompleto.rol_id,
          sucursal_id: usuarioCompleto.sucursal_id,
          username: usuarioCompleto.username,
          password: "********", // No mostrar la contraseña real
        }));

        setShowForm(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchUsuarioById],
  );

  // Función para manejar el envío del formulario (memoizada)
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);

      try {
        if (
          !newUser.nombres?.trim() ||
          !newUser.ap_paterno?.trim() ||
          !newUser.ci?.trim()
        ) {
          throw new Error("Por favor complete todos los campos requeridos");
        }

        const userData = {
          nombres: newUser.nombres.trim(),
          ap_paterno: newUser.ap_paterno.trim(),
          ap_materno: newUser.ap_materno?.trim() || null,
          ci: newUser.ci.trim(),
          telefono: newUser.telefono?.trim() || null,
          rol_id: newUser.rol_id,
          sucursal_id: newUser.rol_id === 2 ? newUser.sucursal_id : null,
          password: newUser.password || newUser.ci,
        };

        if (!editingUser) {
          userData.username = newUser.username;
        }

        const response = await fetch(
          editingUser
            ? `${API_URL}/usuarios/${editingUser.id}`
            : `${API_URL}/usuarios/`,
          {
            method: editingUser ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Cookies.get("access_token")}`,
            },
            body: JSON.stringify(userData),
          },
        );
        await handleFetchResponse(response);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || errorData.message || `Error ${response.status}`,
          );
        }

        const result = await response.json();

        if (editingUser) {
          setUsuarios((prev) =>
            prev.map((u) =>
              u.id === editingUser.id ? { ...u, ...result } : u,
            ),
          );
          setSuccessMessage("Usuario actualizado exitosamente");
        } else {
          setUsuarios((prev) => [...prev, result]);
          setSuccessMessage("Usuario creado exitosamente");
        }

        setTimeout(() => setSuccessMessage(null), 5000); // Ocultar después de 5 segundos
        setShowForm(false);
        resetForm();
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    },
    [newUser, editingUser, resetForm],
  );

  // Funciones para manejar modales (memoizadas)
  const openDeleteModal = useCallback((usuario) => {
    setUserToDelete(usuario);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/usuarios/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
      });
      await handleFetchResponse(response);

      if (!response.ok) {
        // Intentar obtener el mensaje de error del backend
        let errorMessage = "No se puede eliminar este usuario";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // Si no se puede parsear el JSON, usar mensaje genérico
          errorMessage =
            "Este usuario tiene datos relacionados (horarios, cursos, etc.) y no puede ser eliminado. Debe eliminar primero todas sus asignaciones.";
        }
        throw new Error(errorMessage);
      }

      setUsuarios((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      setError(null); // Limpiar cualquier error previo
      setSuccessMessage("Usuario eliminado exitosamente");
      setTimeout(() => setSuccessMessage(null), 5000); // Ocultar después de 5 segundos
    } catch (err) {
      setError(err.message);
      setShowDeleteModal(false); // Cerrar modal para que el usuario vea el mensaje de error
      setUserToDelete(null);
    }
  }, [userToDelete]);

  const openViewModal = useCallback(
    async (usuario) => {
      try {
        const usuarioCompleto = await fetchUsuarioById(usuario.id);
        setSelectedUser(usuarioCompleto || usuario);
        setShowViewModal(true);
      } catch (err) {
        setError(err.message);
      }
    },
    [fetchUsuarioById],
  );

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [usuariosRes, sucursalesRes] = await Promise.all([
          fetch(`${API_URL}/usuarios/`, {
            headers: {
              Authorization: `Bearer ${Cookies.get("access_token")}`,
            },
          }),
          fetch(`${API_URL}/sucursales/`, {
            headers: {
              Authorization: `Bearer ${Cookies.get("access_token")}`,
            },
          }),
        ]);
        await handleFetchResponse(usuariosRes);
        await handleFetchResponse(sucursalesRes);

        if (!usuariosRes.ok) throw new Error("Error al obtener usuarios");
        if (!sucursalesRes.ok) throw new Error("Error al obtener sucursales");

        const usuariosData = await usuariosRes.json();
        const sucursalesData = await sucursalesRes.json();

        const usuariosMapeados = usuariosData.map((usuario) => ({
          id: usuario.usuario_id,
          usuario_id: usuario.usuario_id,
          nombres: usuario.nombres,
          apellidoPaterno: usuario.ap_paterno,
          apellidoMaterno: usuario.ap_materno,
          ci: usuario.ci,
          celular: usuario.telefono,
          rol: usuario.rol?.nombre || "Sin rol",
          sucursal: usuario.sucursal?.nombre || "",
          username: usuario.username,
        }));

        setUsuarios(usuariosMapeados);
        setSucursales(sucursalesData);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Datos derivados memoizados
  const filteredUsuarios = useMemo(
    () =>
      usuarios.filter((usuario) =>
        `${usuario.nombres} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno} ${usuario.ci}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [usuarios, searchTerm],
  );

  const paginatedUsuarios = useMemo(
    () =>
      filteredUsuarios.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage,
      ),
    [filteredUsuarios, currentPage, recordsPerPage],
  );

  const totalPages = useMemo(
    () => Math.ceil(filteredUsuarios.length / recordsPerPage),
    [filteredUsuarios.length, recordsPerPage],
  );

  // Manejador de búsqueda memoizado
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Resetear a la primera página al buscar
  }, []);

  // Manejador de cambio de registros por página
  const handleRecordsPerPageChange = useCallback((value) => {
    setRecordsPerPage(value);
    setCurrentPage(1);
  }, []);

  return (
    <div className="text-gray-900 relative p-4">
      <h1 className="text-3xl font-bold text-[#13678A] border-b pb-2 mb-6">
        USUARIOS
      </h1>

      <SearchBar
        searchTerm={searchTerm}
        onSearch={handleSearch}
        onAddUser={() => {
          resetForm();
          setShowForm(true);
        }}
        recordsPerPage={recordsPerPage}
        onRecordsPerPageChange={handleRecordsPerPageChange}
      />

      {error && <ErrorAlert error={error} onClose={() => setError(null)} />}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-600 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      <UsuariosTable
        usuarios={paginatedUsuarios}
        loading={loading}
        onEdit={openEditForm}
        onDelete={openDeleteModal}
        onView={openViewModal}
      />

      {filteredUsuarios.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Mostrando {(currentPage - 1) * recordsPerPage + 1} a{" "}
            {Math.min(currentPage * recordsPerPage, filteredUsuarios.length)} de{" "}
            {filteredUsuarios.length} registros
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <UsuarioFormModal
          user={newUser}
          editingUser={editingUser}
          sucursales={sucursales}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmationModal
          user={userToDelete}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {showViewModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setShowViewModal(false)}
        />
      )}
    </div>
  );
}
