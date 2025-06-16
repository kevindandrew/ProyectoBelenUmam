"use client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function UsuariosTable({
  usuarios,
  loading,
  onEdit,
  onDelete,
  onView,
}) {
  return (
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
            <th className="px-4 py-2 border-b">USUARIO</th>
            <th className="px-4 py-2 border-b">ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="9" className="text-center py-4 text-gray-500">
                <LoadingSpinner />
              </td>
            </tr>
          ) : usuarios.length === 0 ? (
            <tr>
              <td colSpan="9" className="text-center py-4 text-gray-500">
                No hay usuarios registrados
              </td>
            </tr>
          ) : (
            usuarios.map((usuario) => (
              <TableRow
                key={usuario.usuario_id}
                usuario={usuario}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TableRow({ usuario, onEdit, onDelete, onView }) {
  // Asegúrate de mostrar el nombre del rol como string, no el objeto completo
  const nombreRol =
    typeof usuario.rol === "object" ? usuario.rol.nombre : usuario.rol;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 border-b">{usuario.usuario_id}</td>
      <td className="px-4 py-2 border-b">{usuario.nombres}</td>
      <td className="px-4 py-2 border-b">
        {usuario.apellidoPaterno || usuario.ap_paterno}
      </td>
      <td className="px-4 py-2 border-b">
        {usuario.apellidoMaterno || usuario.ap_materno}
      </td>
      <td className="px-4 py-2 border-b">{usuario.ci}</td>
      <td className="px-4 py-2 border-b">
        {usuario.celular || usuario.telefono}
      </td>
      <td className="px-4 py-2 border-b">{nombreRol || "Sin rol"}</td>
      <td className="px-4 py-2 border-b">{usuario.username}</td>
      <td className="px-4 py-2 border-b">
        <ActionButtons
          onView={() => onView(usuario)}
          onEdit={() => onEdit(usuario)}
          onDelete={() => onDelete(usuario)}
        />
      </td>
    </tr>
  );
}

function ActionButtons({ onView, onEdit, onDelete }) {
  return (
    <div className="flex gap-3 items-center">
      <button
        onClick={onView}
        className="text-blue-600 hover:text-blue-800"
        aria-label="Ver usuario"
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
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </button>

      <button
        onClick={onEdit}
        className="text-green-600 hover:text-green-800"
        aria-label="Editar usuario"
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
        onClick={onDelete}
        className="text-red-600 hover:text-red-800"
        aria-label="Eliminar usuario"
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
    </div>
  );
}
