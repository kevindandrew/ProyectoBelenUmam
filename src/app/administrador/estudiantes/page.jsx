"use client";

import { useEffect, useState } from "react";

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEstudiante, setEditingEstudiante] = useState(null);
  const [newEstudiante, setNewEstudiante] = useState({
    medio_informacion: "TELEVISION",
    ap_paterno: "",
    ap_materno: "",
    nombres: "",
    fecha_nacimiento: "",
    ci: "",
    edad: 0,
    genero: "MASCULINO",
    lugar_nacimiento: "LA PAZ",
    estado_civil: "SOLTERO/A",
    direccion: "",
    macro: "",
    nro_whatsapp: "",
    // Referencia familiar
    rfap_paterno: "",
    rfap_materno: "",
    rfnombres: "",
    rf_pfamilia: "",
    rfnro_celular: "",
    rfdireccion: "",
    // Datos académicos
    grado_instruccion: "PRIMARIA",
    anios_servicio: "",
    ultimo_cargo: "",
    otras_habilidades: "",
    // Datos médicos
    sistema_salud: "PUBLICO",
    frecuencia_medico: "1 VEZ AL MES",
    tuvo_covid: "NO",
    fiumam_enfermedad_cod: "",
    fiumam_alergia_cod: "",
    tratamiento_especifico: "",
    // Situación familiar
    conquien_vive: "SOLO",
    sf_pfamilia: "",
    relacion: "BUENA",
    sfap_paterno: "",
    sfap_materno: "",
    sfnombres: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [estudianteToDelete, setEstudianteToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);

  useEffect(() => {
    const fetchEstudiantes = async () => {
      setLoading(true);
      setTimeout(() => {
        const data = [
          {
            id: 1,
            ap_paterno: "Perez",
            ap_materno: "Lopez",
            nombres: "Juan Carlos",
            fecha_nacimiento: "1950-05-15",
            ci: "12345678",
            edad: 73,
            genero: "MASCULINO",
            lugar_nacimiento: "LA PAZ",
            estado_civil: "CASADO/A",
            direccion: "Av. Siempre Viva 123",
            macro: "DISTRITO 1",
            nro_whatsapp: "123456789",
            grado_instruccion: "SECUNDARIA",
            sistema_salud: "PUBLICO",
          },
          {
            id: 2,
            ap_paterno: "Gomez",
            ap_materno: "Martinez",
            nombres: "Maria",
            fecha_nacimiento: "1945-08-20",
            ci: "87654321",
            edad: 78,
            genero: "FEMENINO",
            lugar_nacimiento: "EL ALTO",
            estado_civil: "VIUDO/A",
            direccion: "Calle Falsa 123",
            macro: "DISTRITO 2",
            nro_whatsapp: "987654321",
            grado_instruccion: "PRIMARIA",
            sistema_salud: "PRIVADO",
          },
        ];
        setEstudiantes(data);
        setLoading(false);
      }, 1000);
    };

    fetchEstudiantes();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDateObj.getDate())
    ) {
      age--;
    }

    return age;
  };

  const resetForm = () => {
    setNewEstudiante({
      medio_informacion: "TELEVISION",
      ap_paterno: "",
      ap_materno: "",
      nombres: "",
      fecha_nacimiento: "",
      ci: "",
      edad: 0,
      genero: "MASCULINO",
      lugar_nacimiento: "LA PAZ",
      estado_civil: "SOLTERO/A",
      direccion: "",
      macro: "",
      nro_whatsapp: "",
      rfap_paterno: "",
      rfap_materno: "",
      rfnombres: "",
      rf_pfamilia: "",
      rfnro_celular: "",
      rfdireccion: "",
      grado_instruccion: "PRIMARIA",
      anios_servicio: "",
      ultimo_cargo: "",
      otras_habilidades: "",
      sistema_salud: "PUBLICO",
      frecuencia_medico: "1 VEZ AL MES",
      tuvo_covid: "NO",
      fiumam_enfermedad_cod: "",
      fiumam_alergia_cod: "",
      tratamiento_especifico: "",
      conquien_vive: "SOLO",
      sf_pfamilia: "",
      relacion: "BUENA",
      sfap_paterno: "",
      sfap_materno: "",
      sfnombres: "",
    });
    setEditingEstudiante(null);
  };

  const openEditForm = (estudiante) => {
    setEditingEstudiante(estudiante);
    setNewEstudiante({
      ...estudiante,
      fecha_nacimiento: estudiante.fecha_nacimiento || "",
      edad: estudiante.edad || calculateAge(estudiante.fecha_nacimiento),
    });
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "fecha_nacimiento") {
      const edad = calculateAge(value);
      setNewEstudiante((prev) => ({
        ...prev,
        [name]: value,
        edad: edad,
      }));
    } else {
      setNewEstudiante((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingEstudiante) {
      const updatedEstudiantes = estudiantes.map((e) =>
        e.id === editingEstudiante.id ? { ...e, ...newEstudiante } : e
      );
      setEstudiantes(updatedEstudiantes);
    } else {
      const newId =
        estudiantes.length > 0
          ? Math.max(...estudiantes.map((e) => e.id)) + 1
          : 1;
      const newEstudianteObj = {
        id: newId,
        ...newEstudiante,
      };
      setEstudiantes([...estudiantes, newEstudianteObj]);
    }

    setShowForm(false);
    resetForm();
  };

  const openDeleteModal = (estudiante) => {
    setEstudianteToDelete(estudiante);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setEstudiantes(estudiantes.filter((e) => e.id !== estudianteToDelete.id));
    setShowDeleteModal(false);
    setEstudianteToDelete(null);
  };

  const openViewModal = (estudiante) => {
    setSelectedEstudiante(estudiante);
    setShowViewModal(true);
  };

  const filteredEstudiantes = estudiantes.filter((estudiante) =>
    `${estudiante.ap_paterno} ${estudiante.ap_materno} ${estudiante.nombres} ${estudiante.ci}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="text-gray-900 relative p-4">
      <h1 className="text-3xl font-bold text-[#13678A] border-b pb-2 mb-6">
        ESTUDIANTES
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
            placeholder="Buscar estudiante..."
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
          aria-label="Nuevo Estudiante"
        >
          + Nuevo Estudiante
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border text-sm bg-white min-w-max">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border-b">ID</th>
              <th className="px-4 py-2 border-b">APELLIDOS</th>
              <th className="px-4 py-2 border-b">NOMBRES</th>
              <th className="px-4 py-2 border-b">CI</th>
              <th className="px-4 py-2 border-b">EDAD</th>
              <th className="px-4 py-2 border-b">GÉNERO</th>
              <th className="px-4 py-2 border-b">DIRECCIÓN</th>
              <th className="px-4 py-2 border-b">ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  Cargando estudiantes...
                </td>
              </tr>
            ) : filteredEstudiantes.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  No hay estudiantes registrados
                </td>
              </tr>
            ) : (
              filteredEstudiantes.map((estudiante) => (
                <tr key={estudiante.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{estudiante.id}</td>
                  <td className="px-4 py-2 border-b">
                    {estudiante.ap_paterno} {estudiante.ap_materno}
                  </td>
                  <td className="px-4 py-2 border-b">{estudiante.nombres}</td>
                  <td className="px-4 py-2 border-b">{estudiante.ci}</td>
                  <td className="px-4 py-2 border-b">{estudiante.edad}</td>
                  <td className="px-4 py-2 border-b">{estudiante.genero}</td>
                  <td className="px-4 py-2 border-b">{estudiante.direccion}</td>
                  <td className="px-4 py-2 border-b flex gap-3 items-center">
                    <button
                      onClick={() => openViewModal(estudiante)}
                      title="Ver"
                      className="text-blue-600 hover:text-blue-800"
                      aria-label={`Ver estudiante ${estudiante.nombres} ${estudiante.ap_paterno}`}
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
                      onClick={() => openEditForm(estudiante)}
                      title="Editar"
                      className="text-green-600 hover:text-green-800"
                      aria-label={`Editar estudiante ${estudiante.nombres} ${estudiante.ap_paterno}`}
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
                      onClick={() => openDeleteModal(estudiante)}
                      title="Eliminar"
                      className="text-red-600 hover:text-red-800"
                      aria-label={`Eliminar estudiante ${estudiante.nombres} ${estudiante.ap_paterno}`}
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

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingEstudiante ? "Editar Estudiante" : "NUEVO REGISTRO"}
              </h2>
              <button
                type="button"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
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
                    d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
                  />
                </svg>
                Obtener datos
              </button>
            </div>

            <div className="card mb-4">
              <div className="card-header text-center bg-primary text-white py-2">
                <strong>
                  FICHA DE INCRIPCIÓN (UNIVERSIDAD MUNICIPAL DEL ADULTO MAYOR)
                </strong>
              </div>
              <div className="card-body">
                {/* Sección: DATOS DE REGISTRO */}
                <div className="mb-6">
                  <h5 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">
                    DATOS DE REGISTRO
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Cómo se enteró del proyecto:
                      </label>
                      <select
                        name="medio_informacion"
                        value={newEstudiante.medio_informacion}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="TELEVISION">TELEVISION</option>
                        <option value="RADIO">RADIO</option>
                        <option value="REDES SOCIALES">REDES SOCIALES</option>
                        <option value="AMISTADES">AMISTADES</option>
                        <option value="FAMILIA">FAMILIA</option>
                        <option value="OTROS">OTROS</option>
                      </select>
                    </div>
                  </div>
                </div>

                <hr className="bg-primary border-2 border-top border-primary my-4" />

                {/* Sección: DATOS PERSONALES */}
                <div className="mb-6">
                  <h5 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">
                    DATOS PERSONALES
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700 required-field">
                        Apellido paterno:
                      </label>
                      <input
                        type="text"
                        name="ap_paterno"
                        value={newEstudiante.ap_paterno}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700 required-field">
                        Apellido materno:
                      </label>
                      <input
                        type="text"
                        name="ap_materno"
                        value={newEstudiante.ap_materno}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700 required-field">
                        Nombres:
                      </label>
                      <input
                        type="text"
                        name="nombres"
                        value={newEstudiante.nombres}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700 required-field">
                        Fecha nacimiento:
                      </label>
                      <input
                        type="date"
                        name="fecha_nacimiento"
                        value={newEstudiante.fecha_nacimiento}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700 required-field">
                        Carnet Identidad:
                      </label>
                      <input
                        type="text"
                        name="ci"
                        value={newEstudiante.ci}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Edad:
                      </label>
                      <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
                        {newEstudiante.edad} años
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Género:
                      </label>
                      <select
                        name="genero"
                        value={newEstudiante.genero}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="MASCULINO">MASCULINO</option>
                        <option value="FEMENINO">FEMENINO</option>
                        <option value="OTROS">OTROS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Lugar de nacimiento:
                      </label>
                      <select
                        name="lugar_nacimiento"
                        value={newEstudiante.lugar_nacimiento}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="LA PAZ">LA PAZ</option>
                        <option value="ORURO">ORURO</option>
                        <option value="POTOSI">POTOSI</option>
                        <option value="CHUQUISACA">CHUQUISACA</option>
                        <option value="TARIJA">TARIJA</option>
                        <option value="COCHABAMBA">COCHABAMBA</option>
                        <option value="BENI">BENI</option>
                        <option value="PANDO">PANDO</option>
                        <option value="SANTA CRUZ">SANTA CRUZ</option>
                        <option value="EL ALTO">EL ALTO</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Estado Civil:
                      </label>
                      <select
                        name="estado_civil"
                        value={newEstudiante.estado_civil}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="SOLTERO/A">SOLTERO/A</option>
                        <option value="CASADO/A">CASADO/A</option>
                        <option value="VIUDO/A">VIUDO/A</option>
                        <option value="DIVORCIADO/A">DIVORCIADO/A</option>
                        <option value="CONYUGE">CONYUGE</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Dirección:
                      </label>
                      <input
                        type="text"
                        name="direccion"
                        value={newEstudiante.direccion}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Macrodistrito:
                      </label>
                      <select
                        name="macro"
                        value={newEstudiante.macro}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seleccione</option>
                        <option value="DISTRITO 1">DISTRITO 1</option>
                        <option value="DISTRITO 2">DISTRITO 2</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        No. P/Grupo Whatsapp:
                      </label>
                      <input
                        type="text"
                        name="nro_whatsapp"
                        value={newEstudiante.nro_whatsapp}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <hr className="bg-primary border-2 border-top border-primary my-4" />

                {/* Sección: REFERENCIA FAMILIAR */}
                <div className="mb-6">
                  <h5 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">
                    REFERENCIA FAMILIAR
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Apellido paterno:
                      </label>
                      <input
                        type="text"
                        name="rfap_paterno"
                        value={newEstudiante.rfap_paterno}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Apellido materno:
                      </label>
                      <input
                        type="text"
                        name="rfap_materno"
                        value={newEstudiante.rfap_materno}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Nombres:
                      </label>
                      <input
                        type="text"
                        name="rfnombres"
                        value={newEstudiante.rfnombres}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Parentesco:
                      </label>
                      <select
                        name="rf_pfamilia"
                        value={newEstudiante.rf_pfamilia}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seleccione</option>
                        <option value="PADRE">PADRE</option>
                        <option value="MADRE">MADRE</option>
                        <option value="HIJO/A">HIJO/A</option>
                        <option value="HERMANO/A">HERMANO/A</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        No. de celular:
                      </label>
                      <input
                        type="text"
                        name="rfnro_celular"
                        value={newEstudiante.rfnro_celular}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Dirección:
                      </label>
                      <input
                        type="text"
                        name="rfdireccion"
                        value={newEstudiante.rfdireccion}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <hr className="bg-primary border-2 border-top border-primary my-4" />

                {/* Sección: DATOS ACADEMICOS */}
                <div className="mb-6">
                  <h5 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">
                    DATOS ACADEMICOS
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Grado de Instruccion:
                      </label>
                      <select
                        name="grado_instruccion"
                        value={newEstudiante.grado_instruccion}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="PRIMARIA">PRIMARIA</option>
                        <option value="SECUNDARIA">SECUNDARIA</option>
                        <option value="LICENCIATURA">LICENCIATURA</option>
                        <option value="MAESTRIA">MAESTRIA</option>
                        <option value="OTROS">OTROS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Años de servicio y/o trabajo:
                      </label>
                      <input
                        type="number"
                        name="anios_servicio"
                        value={newEstudiante.anios_servicio}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Ultimo cargo:
                      </label>
                      <input
                        type="text"
                        name="ultimo_cargo"
                        value={newEstudiante.ultimo_cargo}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Otras habilidades:
                      </label>
                      <input
                        type="text"
                        name="otras_habilidades"
                        value={newEstudiante.otras_habilidades}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <hr className="bg-primary border-2 border-top border-primary my-4" />

                {/* Sección: DATOS MEDICOS */}
                <div className="mb-6">
                  <h5 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">
                    DATOS MEDICOS
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Sistema de salud:
                      </label>
                      <select
                        name="sistema_salud"
                        value={newEstudiante.sistema_salud}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="PUBLICO">PUBLICO</option>
                        <option value="PRIVADO">PRIVADO</option>
                        <option value="MEDICINA TRADICIONAL">
                          MEDICINA TRADICIONAL
                        </option>
                        <option value="OTROS">OTROS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Frecuencia que acude al medico:
                      </label>
                      <select
                        name="frecuencia_medico"
                        value={newEstudiante.frecuencia_medico}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="1 VEZ AL MES">1 VEZ AL MES</option>
                        <option value="2 VECES AL MES">2 VECES AL MES</option>
                        <option value="CUANDO SE ENFERMA">
                          CUANDO SE ENFERMA
                        </option>
                        <option value="NO ACUDE">NO ACUDE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Tuvo COVID:
                      </label>
                      <select
                        name="tuvo_covid"
                        value={newEstudiante.tuvo_covid}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Enfermedad de base:
                      </label>
                      <select
                        name="fiumam_enfermedad_cod"
                        value={newEstudiante.fiumam_enfermedad_cod}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seleccione</option>
                        <option value="DIABETES">DIABETES</option>
                        <option value="HIPERTENSION">HIPERTENSION</option>
                        <option value="ASMA">ASMA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Alergias:
                      </label>
                      <select
                        name="fiumam_alergia_cod"
                        value={newEstudiante.fiumam_alergia_cod}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seleccione</option>
                        <option value="ALIMENTOS">ALIMENTOS</option>
                        <option value="MEDICAMENTOS">MEDICAMENTOS</option>
                        <option value="ESTACIONALES">ESTACIONALES</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Tratamiento especifico:
                      </label>
                      <input
                        type="text"
                        name="tratamiento_especifico"
                        value={newEstudiante.tratamiento_especifico}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <hr className="bg-primary border-2 border-top border-primary my-4" />

                {/* Sección: SITUACION FAMILIAR */}
                <div className="mb-6">
                  <h5 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">
                    SITUACION FAMILIAR
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Con quien vive?:
                      </label>
                      <select
                        name="conquien_vive"
                        value={newEstudiante.conquien_vive}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="SOLO">SOLO</option>
                        <option value="CONYUGE/PAREJA">CONYUGE/PAREJA</option>
                        <option value="FAMILIARES">FAMILIARES</option>
                        <option value="OTROS">OTROS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Parentesco:
                      </label>
                      <select
                        name="sf_pfamilia"
                        value={newEstudiante.sf_pfamilia}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seleccione</option>
                        <option value="PADRE">PADRE</option>
                        <option value="MADRE">MADRE</option>
                        <option value="HIJO/A">HIJO/A</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Relacion:
                      </label>
                      <select
                        name="relacion"
                        value={newEstudiante.relacion}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="BUENA">BUENA</option>
                        <option value="MALA">MALA</option>
                        <option value="REGULAR">REGULAR</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Apellido paterno:
                      </label>
                      <input
                        type="text"
                        name="sfap_paterno"
                        value={newEstudiante.sfap_paterno}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Apellido materno:
                      </label>
                      <input
                        type="text"
                        name="sfap_materno"
                        value={newEstudiante.sfap_materno}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">
                        Nombres:
                      </label>
                      <input
                        type="text"
                        name="sfnombres"
                        value={newEstudiante.sfnombres}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
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
                {editingEstudiante ? "Guardar Cambios" : "Guardar"}
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
                  {estudianteToDelete?.nombres} {estudianteToDelete?.ap_paterno}
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

      {showViewModal && selectedEstudiante && (
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
                Detalles de Estudiante
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                <p>
                  <strong>ID:</strong> {selectedEstudiante.id}
                </p>
                <p>
                  <strong>Apellido Paterno:</strong>{" "}
                  {selectedEstudiante.ap_paterno}
                </p>
                <p>
                  <strong>Apellido Materno:</strong>{" "}
                  {selectedEstudiante.ap_materno}
                </p>
                <p>
                  <strong>Nombres:</strong> {selectedEstudiante.nombres}
                </p>
                <p>
                  <strong>CI:</strong> {selectedEstudiante.ci}
                </p>
                <p>
                  <strong>Edad:</strong> {selectedEstudiante.edad}
                </p>
                <p>
                  <strong>Género:</strong> {selectedEstudiante.genero}
                </p>
                <p>
                  <strong>Dirección:</strong> {selectedEstudiante.direccion}
                </p>
                <p>
                  <strong>Macrodistrito:</strong> {selectedEstudiante.macro}
                </p>
                <p>
                  <strong>Teléfono:</strong> {selectedEstudiante.nro_whatsapp}
                </p>
                <p>
                  <strong>Grado de Instrucción:</strong>{" "}
                  {selectedEstudiante.grado_instruccion}
                </p>
                <p>
                  <strong>Sistema de Salud:</strong>{" "}
                  {selectedEstudiante.sistema_salud}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
