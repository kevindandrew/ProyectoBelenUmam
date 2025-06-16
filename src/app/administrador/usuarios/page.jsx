"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import UsuariosTable from "./components/UsuariosTable";
import UsuarioFormModal from "./components/UsuarioFormModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import UserDetailsModal from "./components/UserDetailsModal";
import SearchBar from "./components/SearchBar";
import ErrorAlert from "@/components/ui/ErrorAlert";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState(initialUserState);
  const [sucursales, setSucursales] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = "https://api-umam-1.onrender.com";

  // Función para resetear el formulario
  const resetForm = () => {
    setNewUser(initialUserState);
    setEditingUser(null);
  };

  // Función para manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name.endsWith("_id") ? parseInt(value) || null : value;

    setNewUser((prev) => ({ ...prev, [name]: finalValue }));

    // Generación automática de username
    if (["nombres", "ap_paterno", "ap_materno", "ci"].includes(name)) {
      const nombres = name === "nombres" ? value : newUser.nombres;
      const ap_paterno = name === "ap_paterno" ? value : newUser.ap_paterno;
      const ap_materno = name === "ap_materno" ? value : newUser.ap_materno;
      const ci = name === "ci" ? value : newUser.ci;

      const username = generateUsername(nombres, ap_paterno, ap_materno, ci);
      setNewUser((prev) => ({ ...prev, username }));
    }

    // Establecer CI como contraseña por defecto
    if (name === "ci") {
      setNewUser((prev) => ({ ...prev, password: value }));
    }
  };

  // Función para generar username
  const generateUsername = (nombres, apellidoPaterno, apellidoMaterno, ci) => {
    let usernameBase = "";
    if (nombres.length > 0) usernameBase += nombres.charAt(0).toLowerCase();
    if (apellidoPaterno.length > 0) {
      usernameBase += apellidoPaterno.charAt(0).toLowerCase();
    } else if (apellidoMaterno.length > 0) {
      usernameBase += apellidoMaterno.charAt(0).toLowerCase();
    }
    if (ci.length > 0) usernameBase += ci;
    return usernameBase;
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Validación mejorada de campos
      if (
        !newUser.nombres?.trim() ||
        !newUser.ap_paterno?.trim() ||
        !newUser.ci?.trim()
      ) {
        throw new Error("Por favor complete todos los campos requeridos");
      }

      // Prepara los datos del usuario
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

      // Solo incluir username si estamos creando un nuevo usuario
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
        }
      );
      // Si la respuesta no es OK, maneja el error
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || errorData.message || `Error ${response.status}`;
        throw new Error(errorMessage);
      }

      // Procesa la respuesta exitosa
      const result = await response.json();

      // Actualiza el estado según si es edición o creación
      if (editingUser) {
        setUsuarios(
          usuarios.map((u) =>
            u.id === editingUser.id ? { ...u, ...result } : u
          )
        );
      } else {
        setUsuarios([...usuarios, result]);
      }

      // Cierra el formulario y resetea
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  // Función para buscar usuarios
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Función para abrir el formulario de edición
  const openEditForm = async (usuario) => {
    try {
      setLoading(true);
      const usuarioCompleto = await fetchUsuarioById(usuario.id);

      setEditingUser(usuarioCompleto);
      setNewUser({
        nombres: usuarioCompleto.nombres,
        ap_paterno: usuarioCompleto.ap_paterno,
        ap_materno: usuarioCompleto.ap_materno,
        ci: usuarioCompleto.ci,
        telefono: usuarioCompleto.telefono,
        rol_id: usuarioCompleto.rol_id,
        sucursal_id: usuarioCompleto.sucursal_id,
        username: usuarioCompleto.username,
        password: "********", // No mostrar la contraseña real
      });

      setShowForm(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir el modal de eliminación
  const openDeleteModal = (usuario) => {
    setUserToDelete(usuario);
    setShowDeleteModal(true);
  };

  // Función para confirmar eliminación
  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/usuarios/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${Cookies.get("access_token")}`,
        },
      });

      if (!response.ok) throw new Error("Error al eliminar usuario");

      setUsuarios(usuarios.filter((u) => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Función para abrir el modal de visualización
  const openViewModal = async (usuario) => {
    try {
      const usuarioCompleto = await fetchUsuarioById(usuario.id);
      setSelectedUser(usuarioCompleto || usuario);
      setShowViewModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Función para obtener un usuario por ID
  const fetchUsuarioById = async (id) => {
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Error ${response.status}: ${response.statusText}`
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
      throw new Error(
        "No se pudo cargar la información del usuario. Por favor intente nuevamente."
      );
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [usuariosRes, sucursalesRes] = await Promise.all([
          fetch(`${API_URL}/usuarios/`, {
            headers: {
              Authorization: `bearer ${Cookies.get("access_token")}`,
            },
          }),
          fetch(`${API_URL}/sucursales/`, {
            headers: {
              Authorization: `bearer ${Cookies.get("access_token")}`,
            },
          }),
        ]);

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

  // Filtrar usuarios según término de búsqueda
  const filteredUsuarios = usuarios.filter((usuario) =>
    `${usuario.nombres} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno} ${usuario.ci}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

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
      />

      {error && <ErrorAlert error={error} onClose={() => setError(null)} />}

      <UsuariosTable
        usuarios={filteredUsuarios}
        loading={loading}
        onEdit={openEditForm}
        onDelete={openDeleteModal}
        onView={openViewModal}
      />

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
