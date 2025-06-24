"use client";
import ActionButton from "./ActionButton";

export default function EstudiantesTable({
  estudiantes = [],
  loading = false,
  onViewAcademicHistory,
  onInscripcion,
  onViewPDF,
  onEdit,
  onDelete,
}) {
  // Función mejorada para generar keys únicas
  const generateUniqueKey = (estudiante) => {
    if (!estudiante?.estudiante_id) {
      console.error("Estudiante sin ID:", estudiante);
      throw new Error("Estudiante no tiene estudiante_id");
    }
    return estudiante.estudiante_id.toString(); // Asegurar que sea string
  };

  // Validación de datos en desarrollo
  if (process.env.NODE_ENV === "development") {
    const ids = estudiantes
      .map((e) => e?.estudiante_id || e?.id)
      .filter(Boolean);
    if (new Set(ids).size !== ids.length) {
      console.log(
        "Advertencia: IDs duplicados encontrados",
        ids.filter((id, i) => ids.indexOf(id) !== i)
      );
    }
  }
  // Handler seguro para acciones
  const handleAction = (action, estudiante) => {
    if (!estudiante || !estudiante.id) {
      console.error("Estudiante inválido recibido:", estudiante);
      return;
    }
    if (typeof action === "function") {
      action(estudiante);
    }
  };

  // Filtrar estudiantes inválidos
  const estudiantesValidos = estudiantes.filter(
    (est) => est && (est.id || est.estudiante_id || est.ci)
  );

  // Handler seguro para acciones
  const createActionHandler = (action, estudiante) => (e) => {
    e?.stopPropagation();
    if (action && estudiante) {
      action(estudiante);
    } else {
      console.error("Acción o estudiante no definido", { action, estudiante });
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border text-sm bg-white min-w-max">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2 border-b">ID</th>
            <th className="px-4 py-2 border-b">APELLIDOS</th>
            <th className="px-4 py-2 border-b">NOMBRES</th>
            <th className="px-4 py-2 border-b">CI</th>
            <th className="px-4 py-2 border-b">INSCRIPCIÓN</th>
            <th className="px-4 py-2 border-b">HISTORIAL</th>
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
          ) : estudiantesValidos.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center py-4 text-gray-500">
                No hay estudiantes registrados
              </td>
            </tr>
          ) : (
            estudiantesValidos.map((estudiante) => {
              const uniqueKey = generateUniqueKey(estudiante);
              const nombreCompleto = `${estudiante.nombres || ""} ${
                estudiante.ap_paterno || ""
              }`.trim();

              return (
                <tr key={uniqueKey} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">
                    {estudiante.estudiante_id}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {[estudiante.ap_paterno, estudiante.ap_materno]
                      .filter(Boolean)
                      .join(" ") || "N/A"}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {estudiante.nombres || "N/A"}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {estudiante.ci || "N/A"}
                  </td>

                  {/* Botones de acción */}
                  <td className="px-4 py-2 border-b">
                    <ActionButton
                      onClick={onInscripcion}
                      actionData={estudiante}
                      icon="M12 4.5v15m7.5-7.5h-15"
                      color="indigo"
                      ariaLabel={`Inscribir a ${nombreCompleto}`}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <ActionButton
                      onClick={onViewAcademicHistory}
                      actionData={estudiante}
                      icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      color="green"
                      ariaLabel={`Ver historial de ${nombreCompleto}`}
                    />
                  </td>
                  <td className="px-4 py-2 border-b flex items-center gap-2">
                    <ActionButton
                      onClick={onViewPDF}
                      actionData={estudiante}
                      icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      color="blue"
                      ariaLabel={`Ver PDF de ${nombreCompleto}`}
                    />
                    <ActionButton
                      onClick={onEdit}
                      actionData={estudiante}
                      icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-5-5l5-5m-5 5L9 9m0 0l5-5m-5 5v10"
                      color="green"
                      ariaLabel={`Editar ${nombreCompleto}`}
                    />
                    <ActionButton
                      onClick={onDelete}
                      actionData={estudiante}
                      icon="M6 18L18 6M6 6l12 12"
                      color="red"
                      ariaLabel={`Eliminar ${nombreCompleto}`}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
