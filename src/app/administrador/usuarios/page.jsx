"use client";

import { useEffect, useState } from "react";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    ci: "",
    celular: "",
    rol: "Admin",
    sucursal: "",
    username: "",
    password: "",
  });
  const [sucursales] = useState(["Sucursal 1", "Sucursal 2", "Sucursal 3"]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // New states for OCR functionality
  const [anversoImage, setAnversoImage] = useState(null); // Stores the URL for the anverso image preview
  const [reversoImage, setReversoImage] = useState(null); // Stores the URL for the reverso image preview
  const [isOcrProcessing, setIsOcrProcessing] = useState(false); // Indicates if OCR is in progress
  const [ocrMessage, setOcrMessage] = useState(""); // Messages from OCR process

  useEffect(() => {
    const fetchUsuarios = async () => {
      setLoading(true);
      setTimeout(() => {
        const data = [
          {
            id: 1,
            nombres: "Juan",
            apellidoPaterno: "Perez",
            apellidoMaterno: "Lopez",
            ci: "12345678",
            celular: "123456789",
            rol: "Estudiante",
            username: "jp",
            password: "12345678",
          },
          {
            id: 2,
            nombres: "Maria",
            apellidoPaterno: "Gomez",
            apellidoMaterno: "Martinez",
            ci: "87654321",
            celular: "987654321",
            rol: "Curso",
            username: "mg",
            password: "87654321",
          },
        ];
        setUsuarios(data);
        setLoading(false);
      }, 1000);
    };

    fetchUsuarios();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const resetForm = () => {
    setNewUser({
      nombres: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      ci: "",
      celular: "",
      rol: "Admin",
      sucursal: "",
      username: "",
      password: "",
    });
    setEditingUser(null);
    // Reset OCR related states
    setAnversoImage(null);
    setReversoImage(null);
    setIsOcrProcessing(false);
    setOcrMessage("");
  };

  const openEditForm = (usuario) => {
    setEditingUser(usuario);
    setNewUser({
      nombres: usuario.nombres,
      apellidoPaterno: usuario.apellidoPaterno,
      apellidoMaterno: usuario.apellidoMaterno,
      ci: usuario.ci,
      celular: usuario.celular,
      rol: usuario.rol,
      sucursal: usuario.sucursal || "",
      username: usuario.username,
      password: usuario.password,
    });
    // Ensure OCR states are cleared when opening edit form as OCR is for new user registration
    setAnversoImage(null);
    setReversoImage(null);
    setIsOcrProcessing(false);
    setOcrMessage("");
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));

    if (["nombres", "apellidoPaterno", "apellidoMaterno"].includes(name)) {
      const nombres = name === "nombres" ? value : newUser.nombres;
      const apellidoPaterno =
        name === "apellidoPaterno" ? value : newUser.apellidoPaterno;
      const apellidoMaterno =
        name === "apellidoMaterno" ? value : newUser.apellidoMaterno;
      let usernameBase = "";
      if (nombres.length > 0) usernameBase += nombres.charAt(0).toLowerCase();
      if (apellidoPaterno.length > 0)
        usernameBase += apellidoPaterno.charAt(0).toLowerCase();
      else if (apellidoMaterno.length > 0)
        usernameBase += apellidoMaterno.charAt(0).toLowerCase();
      setNewUser((prev) => ({ ...prev, username: usernameBase }));
    }

    if (name === "ci") {
      setNewUser((prev) => ({ ...prev, password: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = newUser.username || "";
    const password = newUser.password || "";

    if (editingUser) {
      const updatedUsuarios = usuarios.map((u) =>
        u.id === editingUser.id ? { ...u, ...newUser, username, password } : u
      );
      setUsuarios(updatedUsuarios);
    } else {
      const newId =
        usuarios.length > 0 ? Math.max(...usuarios.map((u) => u.id)) + 1 : 1;
      const newUsuario = {
        id: newId,
        ...newUser,
        username,
        password,
      };
      setUsuarios([...usuarios, newUsuario]);
    }
    setShowForm(false);
    resetForm();
  };

  const openDeleteModal = (usuario) => {
    setUserToDelete(usuario);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setUsuarios(usuarios.filter((u) => u.id !== userToDelete.id));
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const openViewModal = (usuario) => {
    setSelectedUser(usuario);
    setShowViewModal(true);
  };

  const filteredUsuarios = usuarios.filter((usuario) =>
    `${usuario.nombres} ${usuario.nombres} ${usuario.apellidoPaterno} ${usuario.apellidoMaterno}` // search includes all names
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // --- OCR related functions ---

  const handleImageCapture = (e, side) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === "anverso") {
          setAnversoImage(reader.result);
        } else {
          setReversoImage(reader.result);
        }
        setOcrMessage(""); // Clear previous OCR messages on new image capture
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateOcrProcess = async () => {
    if (!anversoImage) {
      setOcrMessage("Por favor, capture al menos el anverso del carnet.");
      return;
    }

    setIsOcrProcessing(true);
    setOcrMessage("Procesando imágenes, por favor espere...");

    // Simular tiempo de procesamiento
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simular diferentes formatos de carnet (50% probabilidad para cada formato)
    const isFormat1 = Math.random() > 0.5;

    // Datos simulados para formato 1 (datos completos en anverso)
    const format1Data = {
      nombres: "JUAN CARLOS",
      apellidoPaterno: "PEREZ",
      apellidoMaterno: "LOPEZ",
      ci: "12345678",
      message: "Formato 1 detectado: Datos completos en anverso",
    };
    const format2Data = {
      nombreCompleto: "MARIA GOMEZ MARTINEZ",
      ci: "87654321",
      message: "Formato 2 detectado: CI en anverso, nombres en reverso",
    };

    const ocrSuccess = Math.random() > 0.1;

    if (ocrSuccess) {
      if (isFormat1) {
        // Procesamiento para formato 1
        setNewUser((prev) => ({
          ...prev,
          nombres: format1Data.nombres,
          apellidoPaterno: format1Data.apellidoPaterno,
          apellidoMaterno: format1Data.apellidoMaterno,
          ci: format1Data.ci,
          password: format1Data.ci,
        }));
        setOcrMessage(format1Data.message);
      } else {
        // Procesamiento para formato 2 - necesitamos dividir el nombre completo
        const nameParts = format2Data.nombreCompleto.split(" ");
        let nombres, apellidoPaterno, apellidoMaterno;

        // Lógica para dividir nombres y apellidos según patrones comunes
        if (nameParts.length >= 3) {
          // Caso más común: 2 nombres + 2 apellidos
          if (nameParts.length === 4) {
            nombres = `${nameParts[0]} ${nameParts[1]}`;
            apellidoPaterno = nameParts[2];
            apellidoMaterno = nameParts[3];
          }
          // Caso: 1 nombre + 2 apellidos
          else if (nameParts.length === 3) {
            nombres = nameParts[0];
            apellidoPaterno = nameParts[1];
            apellidoMaterno = nameParts[2];
          }
        } else {
          // Caso inesperado, dejar todo en nombres
          nombres = format2Data.nombreCompleto;
          apellidoPaterno = "";
          apellidoMaterno = "";
        }

        setNewUser((prev) => ({
          ...prev,
          nombres: nombres,
          apellidoPaterno: apellidoPaterno,
          apellidoMaterno: apellidoMaterno,
          ci: format2Data.ci,
          password: format2Data.ci,
        }));
        setOcrMessage(
          `${format2Data.message} - Nombre dividido automáticamente`
        );
      }
      const newUsernameBase =
        (newUser.nombres.charAt(0) || "") +
        (newUser.apellidoPaterno.charAt(0) || "");
      setNewUser((prev) => ({
        ...prev,
        username: newUsernameBase.toLowerCase(),
      }));

      setOcrMessage((prev) => prev + " Revise y corrija si es necesario.");
    } else {
      setOcrMessage(
        "Error al procesar el carnet. Revise la calidad de la imagen o ingrese los datos manualmente."
      );
    }

    setIsOcrProcessing(false);
  };

  const clearOcrData = () => {
    setAnversoImage(null);
    setReversoImage(null);
    setIsOcrProcessing(false);
    setOcrMessage("");
    // Optionally clear the pre-filled fields if OCR data is cleared
    setNewUser((prev) => ({
      ...prev,
      nombres: editingUser ? prev.nombres : "", // Don't clear if editing existing user
      apellidoPaterno: editingUser ? prev.apellidoPaterno : "",
      apellidoMaterno: editingUser ? prev.apellidoMaterno : "",
      ci: editingUser ? prev.ci : "",
      password: editingUser ? prev.password : "",
      username: editingUser ? prev.username : "",
    }));
  };

  return (
    <div className="text-gray-900 relative p-4">
      {" "}
      {/* Added padding to the main div */}
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
        {" "}
        {/* Use overflow-x-auto for table responsiveness */}
        <table className="w-full border text-sm bg-white min-w-max">
          {" "}
          {/* min-w-max ensures table doesn't shrink too much */}
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border-b">ID</th>
              <th className="px-4 py-2 border-b">NOMBRES</th>
              <th className="px-4 py-2 border-b">APELLIDO PATERNO</th>
              <th className="px-4 py-2 border-b">APELLIDO MATERNO</th>
              <th className="px-4 py-2 border-b">CI</th>
              <th className="px-4 py-2 border-b">CELULAR</th>
              <th className="px-4 py-2 border-b">ROL</th>
              <th className="px-4 py-2 border-b">USUARIO</th>
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
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              filteredUsuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{usuario.id}</td>
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
                  <td className="px-4 py-2 border-b">{usuario.username}</td>
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
            className="bg-white p-6 rounded shadow w-full max-w-4xl z-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-y-auto max-h-[90vh]" // Added overflow-y-auto and max-h
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

            {!editingUser && ( // Show OCR section only for new user registration
              <div className="mb-6 border-b pb-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  Captura de Carnet de Identidad (OCR)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Anverso Capture */}
                  <div className="flex flex-col items-center">
                    <label
                      htmlFor="anverso-upload"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Anverso del Carnet
                    </label>
                    <input
                      id="anverso-upload"
                      type="file"
                      accept="image/*"
                      capture="environment" // 'user' for front camera, 'environment' for rear camera
                      onChange={(e) => handleImageCapture(e, "anverso")}
                      className="hidden" // Hide the default input
                    />
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("anverso-upload").click()
                      }
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2 mb-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175M4.916 11.233c-.76-.118-1.52-.249-2.268-.37A1.5 1.5 0 0 0 1 12.394V16.5c0 .66.67 1.34 1.34 1.34H11.5c.66 0 1.34-.67 1.34-1.34v-3.725a1.5 1.5 0 0 0-1.173-1.467c-.76-.118-1.52-.249-2.268-.37"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 12.394V16.5c0 .66.67 1.34 1.34 1.34H22c.66 0 1.34-.67 1.34-1.34v-3.725a1.5 1.5 0 0 0-1.173-1.467c-.76-.118-1.52-.249-2.268-.37m-7.233-5.228a2.31 2.31 0 0 1-1.642-1.055L9.5 3.5m4.5 9.094a2.5 2.5 0 0 0 3.828 0m-3.828 0h3.828"
                        />
                      </svg>
                      {anversoImage ? "Recapturar Anverso" : "Capturar Anverso"}
                    </button>
                    {anversoImage && (
                      <img
                        src={anversoImage}
                        alt="Anverso del Carnet"
                        className="mt-2 max-w-full h-32 object-contain border rounded shadow"
                      />
                    )}
                  </div>

                  {/* Reverso Capture */}
                  <div className="flex flex-col items-center">
                    <label
                      htmlFor="reverso-upload"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Reverso del Carnet
                    </label>
                    <input
                      id="reverso-upload"
                      type="file"
                      accept="image/*"
                      capture="environment" // 'user' for front camera, 'environment' for rear camera
                      onChange={(e) => handleImageCapture(e, "reverso")}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("reverso-upload").click()
                      }
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2 mb-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175M4.916 11.233c-.76-.118-1.52-.249-2.268-.37A1.5 1.5 0 0 0 1 12.394V16.5c0 .66.67 1.34 1.34 1.34H11.5c.66 0 1.34-.67 1.34-1.34v-3.725a1.5 1.5 0 0 0-1.173-1.467c-.76-.118-1.52-.249-2.268-.37"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 12.394V16.5c0 .66.67 1.34 1.34 1.34H22c.66 0 1.34-.67 1.34-1.34v-3.725a1.5 1.5 0 0 0-1.173-1.467c-.76-.118-1.52-.249-2.268-.37m-7.233-5.228a2.31 2.31 0 0 1-1.642-1.055L9.5 3.5m4.5 9.094a2.5 2.5 0 0 0 3.828 0m-3.828 0h3.828"
                        />
                      </svg>
                      {reversoImage ? "Recapturar Reverso" : "Capturar Reverso"}
                    </button>
                    {reversoImage && (
                      <img
                        src={reversoImage}
                        alt="Reverso del Carnet"
                        className="mt-2 max-w-full h-32 object-contain border rounded shadow"
                      />
                    )}
                  </div>
                </div>

                {/* OCR Action Buttons & Status */}
                <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center items-center">
                  <button
                    type="button"
                    onClick={simulateOcrProcess}
                    disabled={
                      isOcrProcessing || (!anversoImage && !reversoImage)
                    }
                    className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isOcrProcessing && (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    {isOcrProcessing ? "Procesando..." : "Procesar OCR"}
                  </button>
                  <button
                    type="button"
                    onClick={clearOcrData}
                    className="bg-gray-400 text-white px-5 py-2 rounded hover:bg-gray-500"
                  >
                    Limpiar OCR
                  </button>
                </div>
                {ocrMessage && (
                  <p
                    className={`mt-2 text-center text-sm ${
                      ocrMessage.includes("Error")
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    {ocrMessage}
                  </p>
                )}
              </div>
            )}

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
                  htmlFor="apellidoPaterno"
                >
                  Apellido Paterno
                </label>
                <input
                  id="apellidoPaterno"
                  type="text"
                  name="apellidoPaterno"
                  placeholder="Apellido Paterno"
                  value={newUser.apellidoPaterno}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-1 text-gray-700"
                  htmlFor="apellidoMaterno"
                >
                  Apellido Materno
                </label>
                <input
                  id="apellidoMaterno"
                  type="text"
                  name="apellidoMaterno"
                  placeholder="Apellido Materno"
                  value={newUser.apellidoMaterno}
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
                  htmlFor="celular"
                >
                  Celular
                </label>
                <input
                  id="celular"
                  type="text"
                  name="celular"
                  placeholder="Celular"
                  value={newUser.celular}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-1 text-gray-700"
                  htmlFor="rol"
                >
                  Rol
                </label>
                <select
                  id="rol"
                  name="rol"
                  value={newUser.rol}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Admin">Admin</option>
                  <option value="Encargado">Encargado</option>
                  <option value="Facilitador">Facilitador</option>
                </select>
              </div>

              {newUser.rol === "Encargado" && (
                <div>
                  <label
                    className="block text-sm font-semibold mb-1 text-gray-700"
                    htmlFor="sucursal"
                  >
                    Sucursal
                  </label>
                  <select
                    id="sucursal"
                    name="sucursal"
                    value={newUser.sucursal}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar Sucursal</option>
                    {sucursales.map((sucursal, index) => (
                      <option key={index} value={sucursal}>
                        {sucursal}
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
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
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
