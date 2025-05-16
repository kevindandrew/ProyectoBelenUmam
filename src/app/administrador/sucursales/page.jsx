"use client";

import { useState, useEffect } from "react";

export default function SucursalesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState([]);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [dias, setDias] = useState([]);
  const [modalAulaOpen, setModalAulaOpen] = useState(false);
  const [nombreAula, setNombreAula] = useState("");
  const [capacidadAula, setCapacidadAula] = useState("");
  const [aulas, setAulas] = useState([]);



  useEffect(() => {
    const fetchSucursales = async () => {
      setLoading(true);
      setTimeout(() => {
        const data = [
          {
            id: 1,
            nombre: "Kollasuyo",
            direccion: "Av. Kollasuyo, laso Mercado Santa Cruz",
            encargado: "Jose Perez",
            celular: "7777777",
          },
          {
            id: 2,
            nombre: "Centro Americas",
            direccion: "Puente de las Americas, calle Juan P",
            encargado: "Juan Perez",
            celular: "7888888",
          },
        ];
        setSucursales(data);
        setLoading(false);
      }, 1000);
    };

    fetchSucursales();
  }, []);

  const handleAgregarHorario = () => {
    const nuevoHorario = {
      horaInicio,
      horaFin,
      dias: dias.join(", "), // Convertimos el array de días a string
    };
    setHorarios([...horarios, nuevoHorario]);
    setHoraInicio("");
    setHoraFin("");
    setDias([]);
  };

  const handleEliminarHorario = (index) => {
    const nuevosHorarios = horarios.filter((_, i) => i !== index);
    setHorarios(nuevosHorarios);
  };

  return (
    <div className="text-gray-900">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">SUCURSALES</h1>

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
          />
        </div>

        <button
          onClick={() => setModalOpen(true)}
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
                    <td className="border px-2 py-1 text-center">{aula.capacidad}</td>
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


      {/* Modal */}
      {
        modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/25">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-2 right-2 text-gray-500"
              >
                X
              </button>
              <h2 className="text-xl font-semibold mb-4">NUEVA SUCURSAL</h2>
              {/* Formulario de nueva sucursal */}
              <form className="grid grid-cols-2 gap-4">
                {/* Campo: Nombre */}
                <div>
                  <label htmlFor="nombre" className="block text-sm text-gray-700">Nombre</label>
                  <input
                    id="nombre"
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>

                {/* Campo: Dirección */}
                <div>
                  <label htmlFor="direccion" className="block text-sm text-gray-700">Dirección</label>
                  <input
                    id="direccion"
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>

                {/* Campo: Encargado */}
                <div>
                  <label htmlFor="encargado" className="block text-sm text-gray-700">Encargado</label>
                  <input
                    id="encargado"
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>

                {/* Campo: Celular */}
                <div>
                  <label htmlFor="celular" className="block text-sm text-gray-700">Celular</label>
                  <input
                    id="celular"
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>

                {/* Horarios Semanales (ocupa toda la fila) */}
                <div className="col-span-2">
                  <h1 className="text-lg font-semibold">Horarios Semanales</h1>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-sm text-gray-700">Hora inicio:</label>
                      <input
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700">Hora fin:</label>
                      <input
                        type="time"
                        value={horaFin}
                        onChange={(e) => setHoraFin(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="block text-sm text-gray-700">Días aplicables:</label>
                    <div className="flex flex-wrap gap-2">
                      {["L", "M", "X", "J", "V", "S", "D"].map((dia) => {
                        const seleccionado = dias.includes(dia);
                        return (
                          <button
                            key={dia}
                            type="button"
                            onClick={() => {
                              if (seleccionado) {
                                setDias(dias.filter((d) => d !== dia));
                              } else {
                                setDias([...dias, dia]);
                              }
                            }}
                            className={`w-10 h-10 rounded-full border text-sm font-semibold 
          ${seleccionado ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"} 
          hover:bg-blue-500 hover:text-white transition`}
                          >
                            {dia}
                          </button>
                        );
                      })}
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={handleAgregarHorario}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 mt-2"
                  >
                    + Agregar Horario
                  </button>
                </div>

                {/* Mostrar horarios agregados (toda la fila) */}
                <div className="col-span-2">
                  <h4 className="text-lg font-semibold mt-4">Horarios Agregados</h4>
                  {horarios.length > 0 ? (
                    <table className="w-full mt-2">
                      <thead>
                        <tr>
                          <th className="border px-4 py-2 text-left">Horario</th>
                          <th className="border px-4 py-2 text-left">Días</th>
                          <th className="border px-4 py-2 text-left">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {horarios.map((horario, index) => (
                          <tr key={index}>
                            <td className="border px-4 py-2">{`${horario.horaInicio} - ${horario.horaFin}`}</td>
                            <td className="border px-4 py-2">{horario.dias}</td>
                            <td className="border px-4 py-2">
                              <button
                                onClick={() => handleEliminarHorario(index)}
                                className="text-red-600 hover:underline text-sm"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No hay horarios agregados.</p>
                  )}
                </div>

                {/* Botón final (toda la fila) */}
                <div className="col-span-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 w-full mt-2"
                  >
                    Crear Sucursal
                  </button>
                </div>
              </form>

            </div>
          </div>
        )
      }

      {/* Tabla de sucursales */}
      <div className="overflow-auto">
        <table className="w-full border text-sm bg-white">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border-b">ID</th>
              <th className="px-4 py-2 border-b">NOMBRE SUCURSAL</th>
              <th className="px-4 py-2 border-b">DIRECCION</th>
              <th className="px-4 py-2 border-b">ENCARGADO</th>
              <th className="px-4 py-2 border-b">CELULAR</th>
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
            ) : sucursales.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No hay sucursales
                </td>
              </tr>
            ) : (
              sucursales.map((sucursal) => (
                <tr key={sucursal.id}>
                  <td className="px-4 py-2 border-b">{sucursal.id}</td>
                  <td className="px-4 py-2 border-b">{sucursal.nombre}</td>
                  <td className="px-4 py-2 border-b">{sucursal.direccion}</td>
                  <td className="px-4 py-2 border-b">{sucursal.encargado}</td>
                  <td className="px-4 py-2 border-b">{sucursal.celular}</td>
                  <td className="px-4 py-2 border-b">


                    <button
                      type="button"
                      onClick={() => setModalAulaOpen(true)}
                      className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700"
                    >
                      Aulas
                    </button>


                  </td>
                  <td className="px-4 py-2 border-b">
                    <button className="text-blue-600 hover:underline text-sm">
                      Editar
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
    </div >
  );
}
