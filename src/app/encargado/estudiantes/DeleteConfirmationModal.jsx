export default function DeleteConfirmationModal({
  estudiante,
  onConfirm,
  onCancel,
  isDeleting = false, // ← Añade esta prop con valor por defecto
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50"></div>
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow w-full max-w-md z-50">
          <h2 className="text-xl font-bold mb-4">Confirmar Eliminación</h2>
          <p>
            ¿Está seguro de que desea eliminar a{" "}
            <strong>
              {estudiante?.nombres} {estudiante?.ap_paterno}
            </strong>
            ?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
