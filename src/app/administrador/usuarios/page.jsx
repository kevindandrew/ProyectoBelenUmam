"use client";

import { useEffect, useState } from "react";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulamos una llamada a una API con setTimeout
  useEffect(() => {
    const fetchUsuarios = async () => {
      setLoading(true);
      // Simula espera de la API
      setTimeout(() => {
        const data = [
          {
            id: 1,
            nombre: "Juan Perez",
            correo: "juan@example.com",
            rol: "Estudiante",
            estado: "Activo",
          },
          {
            id: 2,
            nombre: "Maria Gomez",
            correo: "maria@example.com",
            rol: "Curso",
            estado: "Inactivo",
          },
        ];
        setUsuarios(data);
        setLoading(false);
      }, 1000); // 1 segundo de simulación
    };

    fetchUsuarios();
  }, []);

  return (
    <div className="text-gray-900">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">USUARIOS</h1>

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
            placeholder="Buscar usuario..."
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 self-start sm:self-auto">
          + Nuevo Usuario
        </button>
      </div>

      {/* Tabla de usuarios */}
      <div className="overflow-auto">
        <table className="w-full border text-sm bg-white">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border-b">ID</th>
              <th className="px-4 py-2 border-b">NOMBRE</th>
              <th className="px-4 py-2 border-b">CORREO</th>
              <th className="px-4 py-2 border-b">ROL</th>
              <th className="px-4 py-2 border-b">ESTADO</th>
              <th className="px-4 py-2 border-b">ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  Cargando usuarios...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="px-4 py-2 border-b">{usuario.id}</td>
                  <td className="px-4 py-2 border-b">{usuario.nombre}</td>
                  <td className="px-4 py-2 border-b">{usuario.correo}</td>
                  <td className="px-4 py-2 border-b">{usuario.rol}</td>
                  <td className="px-4 py-2 border-b">{usuario.estado}</td>
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
    </div>
  );
}
