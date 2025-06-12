"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    nombres: "",
    ap_paterno: "", // Cambiado de apellidoPaterno
    ap_materno: "", // Cambiado de apellidoMaterno
    ci: "",
    telefono: "", // Cambiado de celular
    rol_id: 1, // Valor numérico por defecto (1 para Admin)
    sucursal_id: null, // Inicialmente null
    username: "",
    password: "", // Ahora se envía explícitamente
  });
  const [sucursales, setSucursales] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = "https://api-umam-1.onrender.com";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch usuarios y sucursales en paralelo
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

        if (!usuariosRes.ok) {
          throw new Error(
            `Error al obtener usuarios: ${usuariosRes.status} ${usuariosRes.statusText}`
          );
        }
        if (!sucursalesRes.ok) {
          throw new Error(
            `Error al obtener sucursales: ${sucursalesRes.status} ${sucursalesRes.statusText}`
          );
        }

        const usuariosData = await usuariosRes.json();
        const sucursalesData = await sucursalesRes.json();

        console.log("Datos de usuarios de la API:", usuariosData);
        console.log("Datos de sucursales de la API:", sucursalesData);

        const usuariosMapeados = usuariosData.map((usuario) => ({
          id: usuario.usuario_id,
          usuario_id: usuario.usuario_id,
          nombres: usuario.nombres,
          apellidoPaterno: usuario.ap_paterno, // Mantener compatibilidad con la tabla
          apellidoMaterno: usuario.ap_materno, // Mantener compatibilidad con la tabla
          ap_paterno: usuario.ap_paterno, // Nuevo formato
          ap_materno: usuario.ap_materno, // Nuevo formato
          ci: usuario.ci,
          celular: usuario.telefono, // Mantener compatibilidad
          telefono: usuario.telefono, // Nuevo formato
          rol_id: usuario.rol_id,
          rol: usuario.rol?.nombre || "Sin rol",
          sucursal_id: usuario.sucursal_id,
          sucursal: usuario.sucursal?.nombre || "",
          username: usuario.username,
          password: usuario.password,
        }));

        setUsuarios(usuariosMapeados);
        setSucursales(sucursalesData);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchUsuarioById = async (id) => {
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, {
        headers: {
          Authorization: `bearer ${Cookies.get("access_token")}`,
        },
      });
      if (!response.ok)
        throw new Error(`Error al obtener usuario: ${response.status}`);

      const usuario = await response.json();

      return {
        id: usuario.usuario_id,
        usuario_id: usuario.usuario_id,
        nombres: usuario.nombres,
        apellidoPaterno: usuario.ap_paterno,
        apellidoMaterno: usuario.ap_materno,
        ci: usuario.ci,
        celular: usuario.telefono,
        rol: usuario.rol?.nombre || "Sin rol",
        rolCompleto: usuario.rol,
        sucursal: usuario.sucursal?.nombre || "",
        sucursalCompleta: usuario.sucursal,
        username: usuario.username,
        password: usuario.ci || "****",
      };
    } catch (err) {
      console.error("Error al obtener usuario por ID:", err);
      setError(err.message);
      return null;
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const resetForm = () => {
    setNewUser({
      nombres: "",
      ap_paterno: "",
      ap_materno: "",
      ci: "",
      telefono: "",
      rol_id: 1,
      sucursal_id: null,
      username: "",
      password: "",
    });
    setEditingUser(null);
  };

  const openEditForm = async (usuario) => {
    try {
      const usuarioCompleto = await fetchUsuarioById(usuario.id);
      setEditingUser(usuarioCompleto || usuario);
      setNewUser({
        nombres: usuario.nombres,
        ap_paterno: usuario.apellidoPaterno || usuario.ap_paterno, // Compatibilidad con ambos formatos
        ap_materno: usuario.apellidoMaterno || usuario.ap_materno, // Compatibilidad con ambos formatos
        ci: usuario.ci,
        telefono: usuario.celular || usuario.telefono, // Compatibilidad con ambos formatos
        rol_id:
          usuario.rol_id ||
          (usuario.rol === "Admin" ? 1 : usuario.rol === "Encargado" ? 2 : 3),
        sucursal_id: usuario.sucursal_id || null,
        username: usuario.username,
        password: usuario.password || usuario.ci, // Usar CI como contraseña por defecto
      });
      setShowForm(true);
    } catch (err) {
      setError(err.message);
    }
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Manejar campos numéricos
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

  const handleSubmit = async (e) => {
    const API_URL = "https://api-umam-1.onrender.com";
    e.preventDefault();
    setError(null); // Limpiar errores anteriores

    try {
      // Validación básica de campos
      if (!newUser.nombres || !newUser.apellidoPaterno || !newUser.ci) {
        throw new Error("Por favor complete todos los campos requeridos");
      }

      const userData = {
        username: newUser.username,
        nombres: newUser.nombres,
        ap_paterno: newUser.ap_paterno,
        ap_materno: newUser.ap_materno,
        ci: newUser.ci,
        telefono: newUser.telefono,
        rol_id: newUser.rol_id,
        sucursal_id: newUser.rol_id === 2 ? newUser.sucursal_id : null, // Solo para Encargados (rol_id 2)
        password: newUser.password,
      };
      console.log("Datos a enviar:", userData);

      const method = editingUser ? "PUT" : "POST";
      const url = editingUser
        ? `${API_URL}/usuarios/${editingUser.id}`
        : `${API_URL}/usuarios/`;

      const response = await fetch(/*...*/);

      if (!response.ok) {
        // Intenta obtener el mensaje de error del backend
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          console.error("Error parsing JSON:", jsonError);
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // Maneja diferentes formatos de error del backend
        const errorMessage =
          errorData.detail ||
          errorData.message ||
          JSON.stringify(errorData) ||
          `Error ${response.status}: ${response.statusText}`;

        throw new Error(errorMessage);
      }

      const result = await response.json();
    } catch (err) {
      console.error("Error completo:", err);

      // Asegúrate de mostrar solo el mensaje de error, no el objeto completo
      setError(
        err.message || "Ocurrió un error desconocido al procesar la solicitud"
      );
    }
  };

  const openDeleteModal = (usuario) => {
    setUserToDelete(usuario);
    setShowDeleteModal(true);
  };

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

  const openViewModal = async (usuario) => {
    try {
      // Obtener datos completos del usuario
      const usuarioCompleto = await fetchUsuarioById(usuario.id);
      setSelectedUser(usuarioCompleto || usuario);
      setShowViewModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredUsuarios = usuarios.filter((usuario) =>
    `${usuario.nombres} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno} ${usuario.ci}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <h2 className="text-lg font-bold mb-2">Error de conexión</h2>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="text-gray-900 relative p-4">
      <h1 className="text-3xl font-bold text-[#13678A] border-b pb-2 mb-6">
        USUARIOS
      </h1>
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
            placeholder="Buscar usuario..."
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <button
          className="bg-teal-500 text-white px-4 py-2 rounded text-sm hover:bg-teal-600 self-start sm:self-auto"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          aria-label="Nuevo Usuario"
        >
          + Nuevo Usuario
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border text-sm bg-white min-w-max">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border-b">ID</th>
              <th className="px-4 py-2 border-b">NOMBRES</th>
              <th className="px-4 py-2 border-b">APELLIDO PATERNO</th>
              <th className="px-4 py-2 border-b">APELLIDO MATERNO</th>
              <th className="px-4 py-2 border-b">CI</th>
              <th className="px-4 py-2 border-b">CELULAR</th>
              <th className="px-4 py-2 border-b">ROL</th>

              <th className="px-4 py-2 border-b">ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-gray-500">
                  Cargando usuarios...
                </td>
              </tr>
            ) : filteredUsuarios.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-gray-500">
                  {usuarios.length === 0
                    ? "No hay usuarios registrados"
                    : "No se encontraron usuarios que coincidan con la búsqueda"}
                </td>
              </tr>
            ) : (
              filteredUsuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{usuario.usuario_id}</td>
                  <td className="px-4 py-2 border-b">{usuario.nombres}</td>
                  <td className="px-4 py-2 border-b">
                    {usuario.apellidoPaterno}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {usuario.apellidoMaterno}
                  </td>
                  <td className="px-4 py-2 border-b">{usuario.ci}</td>
                  <td className="px-4 py-2 border-b">{usuario.celular}</td>
                  <td className="px-4 py-2 border-b">{usuario.rol}</td>

                  <td className="px-4 py-2 border-b flex gap-3 items-center">
                    <button
                      onClick={() => openViewModal(usuario)}
                      title="Ver"
                      className="text-blue-600 hover:text-blue-800"
                      aria-label={`Ver usuario ${usuario.nombres} ${usuario.apellidoPaterno}`}
                    >
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>

                    <button
                      onClick={() => openEditForm(usuario)}
                      title="Editar"
                      className="text-green-600 hover:text-green-800"
                      aria-label={`Editar usuario ${usuario.nombres} ${usuario.apellidoPaterno}`}
                    >
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-5-5l5-5m-5 5L9 9m0 0l5-5m-5 5v10"
                        />
                      </svg>
                    </button>

                    <button
                      onClick={() => openDeleteModal(usuario)}
                      title="Eliminar"
                      className="text-red-600 hover:text-red-800"
                      aria-label={`Eliminar usuario ${usuario.nombres} ${usuario.apellidoPaterno}`}
                    >
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
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end items-center gap-4 mt-4">
        <button className="text-sm text-gray-500 hover:text-black">
          Anterior
        </button>
        <button className="text-sm text-gray-500 hover:text-black">
          Siguiente
        </button>
      </div>

      {showForm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-black/25 flex items-center justify-center z-50"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          />
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded shadow w-full max-w-4xl z-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              aria-label="Cerrar modal"
            >
              &#10005;
            </button>

            <h2 className="text-xl font-bold mb-6 text-gray-800">
              {editingUser ? "Editar Usuario" : "Registrar Nuevo Usuario"}
            </h2>

            <h3 className="text-lg font-semibold mb-3 text-gray-700">
              Datos del Usuario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className="block text-sm font-semibold mb-1 text-gray-700"
                  htmlFor="nombres"
                >
                  Nombres
                </label>
                <input
                  id="nombres"
                  type="text"
                  name="nombres"
                  placeholder="Nombres"
                  value={newUser.nombres}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-1 text-gray-700"
                  htmlFor="ap_paterno"
                >
                  Apellido Paterno
                </label>
                <input
                  id="ap_paterno"
                  type="text"
                  name="ap_paterno"
                  placeholder="Apellido Paterno"
                  value={newUser.ap_paterno}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-1 text-gray-700"
                  htmlFor="ap_materno"
                >
                  Apellido Materno
                </label>
                <input
                  id="ap_materno"
                  type="text"
                  name="ap_materno"
                  placeholder="Apellido Materno"
                  value={newUser.ap_materno}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-1 text-gray-700"
                  htmlFor="ci"
                >
                  CI
                </label>
                <input
                  id="ci"
                  type="text"
                  name="ci"
                  placeholder="CI"
                  value={newUser.ci}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-1 text-gray-700"
                  htmlFor="telefono"
                >
                  Celular
                </label>
                <input
                  id="telefono"
                  type="text"
                  name="telefono"
                  placeholder="Celular"
                  value={newUser.telefono}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Campo Rol (ahora numérico) */}
              <div>
                <label
                  className="block text-sm font-semibold mb-1 text-gray-700"
                  htmlFor="rol_id"
                >
                  Rol
                </label>
                <select
                  id="rol_id"
                  name="rol_id"
                  value={newUser.rol_id}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={1}>Admin</option>
                  <option value={2}>Encargado</option>
                  <option value={3}>Facilitador</option>
                </select>
              </div>

              {/* Campo Sucursal (solo para Encargados) */}
              {newUser.rol_id === 2 && (
                <div>
                  <label
                    className="block text-sm font-semibold mb-1 text-gray-700"
                    htmlFor="sucursal_id"
                  >
                    Sucursal
                  </label>
                  <select
                    id="sucursal_id"
                    name="sucursal_id"
                    value={newUser.sucursal_id || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required={newUser.rol_id === 2}
                  >
                    <option value="">Seleccionar Sucursal</option>
                    {sucursales.map((sucursal) => (
                      <option
                        key={sucursal.sucursal_id}
                        value={sucursal.sucursal_id}
                      >
                        {sucursal.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label
                  className="block text-sm font-semibold mb-1 text-gray-700"
                  htmlFor="username"
                >
                  Nombre de Usuario
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Nombre de Usuario"
                  value={newUser.username}
                  readOnly
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                  aria-readonly="true"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-1 text-gray-700"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Contraseña"
                  value={newUser.password}
                  readOnly
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
                  aria-readonly="true"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600"
              >
                {editingUser ? "Guardar Cambios" : "Registrar"}
              </button>
            </div>
          </form>
        </>
      )}

      {showDeleteModal && (
        <>
          <div className="fixed inset-0 bg-black bg-black/25 flex items-center justify-center z-50"></div>
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow w-full max-w-md z-50">
              <h2 className="text-xl font-bold mb-4">Confirmar Eliminación</h2>
              <p>
                ¿Está seguro de que desea eliminar a{" "}
                <strong>
                  {userToDelete?.nombres} {userToDelete?.apellidoPaterno}
                </strong>
                ?
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
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
        </>
      )}

      {showViewModal && selectedUser && (
        <>
          <div
            className="fixed inset-0 bg-black bg-black/25 z-40"
            onClick={() => setShowViewModal(false)}
          ></div>
          <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
            <div
              className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                onClick={() => setShowViewModal(false)}
                aria-label="Cerrar modal"
              >
                &#10005;
              </button>

              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Detalles de Usuario
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                <p>
                  <strong>ID:</strong> {selectedUser.id}
                </p>
                <p>
                  <strong>Nombres:</strong> {selectedUser.nombres}
                </p>
                <p>
                  <strong>Apellido Paterno:</strong>{" "}
                  {selectedUser.apellidoPaterno}
                </p>
                <p>
                  <strong>Apellido Materno:</strong>{" "}
                  {selectedUser.apellidoMaterno}
                </p>
                <p>
                  <strong>CI:</strong> {selectedUser.ci}
                </p>
                <p>
                  <strong>Celular:</strong> {selectedUser.celular}
                </p>
                <p>
                  <strong>Rol:</strong> {selectedUser.rol}
                </p>
                {selectedUser.rol === "Encargado" && (
                  <p>
                    <strong>Sucursal:</strong> {selectedUser.sucursal}
                  </p>
                )}
                <p>
                  <strong>Nombre de Usuario:</strong> {selectedUser.username}
                </p>
                <p>
                  <strong>Contraseña:</strong> {selectedUser.password}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
