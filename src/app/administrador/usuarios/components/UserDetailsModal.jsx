export default function UserDetailsModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Detalles del Usuario</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailItem label="ID" value={user.id} />
          <DetailItem label="Nombres" value={user.nombres} />
          <DetailItem label="Apellido Paterno" value={user.apellidoPaterno} />
          <DetailItem label="Apellido Materno" value={user.apellidoMaterno} />
          <DetailItem label="CI" value={user.ci} />
          <DetailItem label="Teléfono" value={user.celular} />
          <DetailItem label="Rol" value={user.rol} />
          {user.rol === "Encargado" && (
            <DetailItem label="Sucursal" value={user.sucursal} />
          )}
          <DetailItem label="Usuario" value={user.username} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="font-medium">{label}:</p>
      <p>{value || "-"}</p>
    </div>
  );
}
