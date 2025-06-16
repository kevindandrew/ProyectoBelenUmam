"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { generarFichaEstudiante } from "@/app/administrador/estudiantes/pdf";
import HistorialAcademicoModal from "@/app/administrador/estudiantes/historial";
import ModalInscripcionAlumno from "@/app/administrador/estudiantes/inscripcion";

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEstudiante, setEditingEstudiante] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [estudianteToDelete, setEstudianteToDelete] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [modalInscripcionOpen, setModalInscripcionOpen] = useState(false);

  const openInscripcionModal = (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setModalInscripcionOpen(true);
  };

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
  const API_URL = "https://api-umam-1.onrender.com";

  useEffect(() => {
    const fetchEstudiantes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/estudiantes/`, {
          headers: {
            Authorization: `bearer ${Cookies.get("access_token")}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();

        const estudiantesMapeados = data.map((estudiante) => ({
          ...estudiante,
          medio_informacion: estudiante.como_se_entero,
          ...(estudiante.datos_familiares?.length > 0 && {
            sfap_paterno: estudiante.datos_familiares[0].ap_paterno,
            sfap_materno: estudiante.datos_familiares[0].ap_materno,
            sfnombres: estudiante.datos_familiares[0].nombres,
            sf_pfamilia: estudiante.datos_familiares[0].parentesco,
            relacion: estudiante.datos_familiares[0].relacion,
            rfnro_celular: estudiante.datos_familiares[0].telefono,
            rfdireccion: estudiante.datos_familiares[0].direccion,
          }),
          ...(estudiante.datos_academicos?.length > 0 && {
            grado_instruccion: estudiante.datos_academicos[0].grado_institucion,
            anios_servicio: estudiante.datos_academicos[0].anios_servicio,
            ultimo_cargo: estudiante.datos_academicos[0].ultimo_cargo,
            otras_habilidades: estudiante.datos_academicos[0].otras_habilidades,
          }),
          ...(estudiante.datos_medicos?.length > 0 && {
            sistema_salud: estudiante.datos_medicos[0].sistema_salud,
            frecuencia_medico: estudiante.datos_medicos[0].frecuencia_medico,
            fiumam_enfermedad_cod: estudiante.datos_medicos[0].enfermedad_base,
            fiumam_alergia_cod: estudiante.datos_medicos[0].alergias,
            tratamiento_especifico:
              estudiante.datos_medicos[0].tratamiento_especifico,
            tuvo_covid: estudiante.datos_medicos[0].tuvo_covid ? "SI" : "NO",
          }),
        }));

        setEstudiantes(estudiantesMapeados);
      } catch (error) {
        console.error("Error fetching estudiantes:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEstudiantes();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const openAcademicHistoryModal = (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setModalOpen(true);
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
      edad: estudiante.edad || calculateAge(estudiante.fecha_nacimiento),

      nombres: estudiante.nombres || "",
      ap_paterno: estudiante.ap_paterno || "",
      ap_materno: estudiante.ap_materno || "",
      ci: estudiante.ci || "",
      nro_whatsapp: estudiante.telefono || "",
      fecha_nacimiento: estudiante.fecha_nacimiento || "",
      genero: estudiante.genero || "",
      lugar_nacimiento: estudiante.lugar_nacimiento || "",
      estado_civil: estudiante.estado_civil || "",
      direccion: estudiante.direccion || "",
      medio_informacion: estudiante.medio_informacion || "",

      genero: estudiante.genero || "MASCULINO",
      lugar_nacimiento: estudiante.lugar_nacimiento || "LA PAZ",
      estado_civil: estudiante.estado_civil || "SOLTERO/A",
      grado_instruccion: estudiante.grado_instruccion || "PRIMARIA",
      sistema_salud: estudiante.sistema_salud || "PUBLICO",
      frecuencia_medico: estudiante.frecuencia_medico || "1 VEZ AL MES",
      tuvo_covid: estudiante.tuvo_covid || "NO",
      conquien_vive: estudiante.conquien_vive || "SOLO",
      relacion: estudiante.relacion || "BUENA",
    });
    setShowForm(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const estudianteData = {
        nombres: newEstudiante.nombres,
        ap_paterno: newEstudiante.ap_paterno,
        ap_materno: newEstudiante.ap_materno,
        ci: newEstudiante.ci,
        telefono: newEstudiante.telefono,
        fecha_nacimiento: newEstudiante.fecha_nacimiento,
        genero: newEstudiante.genero,
        lugar_nacimiento: newEstudiante.lugar_nacimiento,
        estado_civil: newEstudiante.estado_civil,
        direccion: newEstudiante.direccion,
        como_se_entero: newEstudiante.medio_informacion,
        datos_familiares: [
          {
            tipo: "convive",
            ap_paterno: newEstudiante.sfap_paterno,
            ap_materno: newEstudiante.sfap_materno,
            nombres: newEstudiante.sfnombres,
            parentesco: newEstudiante.sf_pfamilia,
            relacion: newEstudiante.relacion,
            telefono: newEstudiante.rfnro_celular,
            direccion: newEstudiante.rfdireccion,
          },
        ],
        datos_academicos: [
          {
            grado_institucion: newEstudiante.grado_instruccion,
            anios_servicio: newEstudiante.anios_servicio,
            ultimo_cargo: newEstudiante.ultimo_cargo,
            otras_habilidades: newEstudiante.otras_habilidades,
          },
        ],
        datos_medicos: [
          {
            sistema_salud: newEstudiante.sistema_salud,
            frecuencia_medico: newEstudiante.frecuencia_medico,
            enfermedad_base: newEstudiante.fiumam_enfermedad_cod,
            alergias: newEstudiante.fiumam_alergia_cod,
            tratamiento_especifico: newEstudiante.tratamiento_especifico,
            tuvo_covid: newEstudiante.tuvo_covid === "SI",
          },
        ],
      };

      let response;
      const url = `${API_URL}/estudiantes/${
        editingEstudiante ? editingEstudiante.estudiante_id : ""
      }`;

      if (editingEstudiante) {
        response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `bearer ${Cookies.get("access_token")}`,
          },
          body: JSON.stringify(estudianteData),
        });
      } else {
        response = await fetch(`${API_URL}/estudiantes/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `bearer ${Cookies.get("access_token")}`,
          },
          body: JSON.stringify(estudianteData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar estudiante");
      }

      const result = await response.json();

      // Actualizar el estado local
      if (editingEstudiante) {
        setEstudiantes(
          estudiantes.map((e) =>
            e.estudiante_id === editingEstudiante.estudiante_id ? result : e
          )
        );
      } else {
        setEstudiantes([...estudiantes, result]);
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error al guardar estudiante:", error);
      setError(error.message);
    }
  };

  const openDeleteModal = (estudiante) => {
    setEstudianteToDelete(estudiante);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `${API_URL}/estudiantes/${estudianteToDelete.estudiante_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `bearer ${Cookies.get("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar estudiante");
      }

      setEstudiantes(
        estudiantes.filter(
          (e) => e.estudiante_id !== estudianteToDelete.estudiante_id
        )
      );
      setShowDeleteModal(false);
      setEstudianteToDelete(null);
    } catch (error) {
      console.error("Error al eliminar estudiante:", error);
      setError(error.message);
    }
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
              <th className="px-4 py-2 border-b">NOMBRES</th>
              <th className="px-4 py-2 border-b">APELLIDO PATERNO</th>
              <th className="px-4 py-2 border-b">APELLIDO MATERNO</th>
              <th className="px-4 py-2 border-b">CI</th>
              <th className="px-4 py-2 border-b">INSCRIPCION</th>
              <th className="px-4 py-2 border-b">HISTORIAL ACADÉMICO</th>
              <th className="px-4 py-2 border-b">ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  Cargando estudiantes...
                </td>
              </tr>
            ) : estudiantes.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No hay estudiantes registrados
                </td>
              </tr>
            ) : (
              estudiantes.map((estudiante) => (
                <tr key={estudiante.estudiante_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">
                    {estudiante.estudiante_id}
                  </td>
                  <td className="px-4 py-2 border-b">{estudiante.nombres}</td>
                  <td className="px-4 py-2 border-b">
                    {estudiante.ap_paterno}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {estudiante.ap_materno}
                  </td>
                  <td className="px-4 py-2 border-b">{estudiante.ci}</td>
                  <td className="px-4 py-2 border-b">
                    <button
                      onClick={() => openInscripcionModal(estudiante)}
                      title="Inscribir estudiante"
                      className="text-indigo-600 hover:text-indigo-800"
                      aria-label={`Inscribir a ${estudiante.nombres} ${estudiante.ap_paterno}`}
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
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    </button>
                  </td>
                  <td className="px-4 py-2 border-b items-center">
                    <button
                      onClick={() => openAcademicHistoryModal(estudiante)}
                      title="Ver Historial Académico"
                      className="text-green-600 hover:text-green-800"
                      aria-label={`Ver historial académico ${estudiante.nombres} ${estudiante.ap_paterno}`}
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
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                    </button>
                  </td>
                  <td className="px-4 py-2 border-b gap-3 items-center">
                    <button
                      onClick={() => generarFichaEstudiante(estudiante)}
                      title="Ver ficha PDF"
                      className="text-blue-600 hover:text-blue-800"
                      aria-label={`Ver ficha de ${estudiante.nombres} ${estudiante.ap_paterno}`}
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
        <HistorialAcademicoModal
          estudiante={estudianteSeleccionado}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />

        {modalInscripcionOpen && (
          <ModalInscripcionAlumno
            estudiante={estudianteSeleccionado}
            isOpen={modalInscripcionOpen}
            onClose={() => setModalInscripcionOpen(false)}
          />
        )}
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
              <div className="card-header text-center bg-teal-500 text-white py-2">
                <strong>
                  FICHA DE INCRIPCIÓN (UNIVERSIDAD MUNICIPAL DEL ADULTO MAYOR)
                </strong>
              </div>
              <div className="card-body">
                <div className="mb-6">
                  <h5 className="text-lg font-semibold bg-teal-500/20 text-center  mb-3 text-gray-700 border-b pb-1">
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

                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-center bg-teal-500/20 mb-3 text-gray-700 border-b pb-1">
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

                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-center bg-teal-500/20 mb-3 text-gray-700 border-b pb-1">
                    REFERENCIA FAMILIAR
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
                  </div>
                </div>

                <hr className="bg-primary border-2 border-top bg-teal-500/20 border-primary my-4" />

                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-center bg-teal-500/20 mb-3 text-gray-700 border-b pb-1">
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

                <div className="mb-6">
                  <h5 className="text-lg font-semibold mb-3 bg-teal-500/20 text-center text-gray-700 border-b pb-1">
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
    </div>
  );
}
