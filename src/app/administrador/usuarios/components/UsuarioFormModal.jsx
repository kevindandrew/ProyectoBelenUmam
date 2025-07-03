export default function UsuarioFormModal({
  user,
  editingUser,
  sucursales,
  onChange,
  onSubmit,
  onClose,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={onSubmit}
        className="bg-white p-6 rounded shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormField
            label="Nombres*"
            name="nombres"
            value={user.nombres}
            onChange={onChange}
            required
            maxLength={50}
          />

          <FormField
            label="Apellido Paterno*"
            name="ap_paterno"
            value={user.ap_paterno}
            onChange={onChange}
            required
            maxLength={50}
          />

          <FormField
            label="Apellido Materno"
            name="ap_materno"
            value={user.ap_materno}
            onChange={onChange}
            maxLength={50}
          />

          <FormField
            label="CI*"
            name="ci"
            value={user.ci}
            onChange={onChange}
            required
            maxLength={15}
            type="number"
          />

          <FormField
            label="Teléfono"
            name="telefono"
            value={user.telefono}
            onChange={onChange}
            maxLength={15}
            type="number"
          />

          <div>
            <label className="block text-sm font-medium mb-1">Rol*</label>
            <select
              name="rol_id"
              value={user.rol_id}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value={1}>Admin</option>
              <option value={2}>Encargado</option>
              <option value={3}>Facilitador</option>
            </select>
          </div>

          {user.rol_id === 2 && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Sucursal*
              </label>
              <select
                name="sucursal_id"
                value={user.sucursal_id || ""}
                onChange={onChange}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Seleccionar</option>
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

          <FormField
            label="Usuario"
            name="username"
            value={user.username}
            readOnly
            maxLength={20}
          />

          <FormField
            label="Contraseña"
            name="password"
            value={user.password}
            readOnly
            maxLength={20}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
          >
            {editingUser ? "Guardar Cambios" : "Registrar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// 💡 Actualizamos el componente FormField
function FormField({
  label,
  name,
  value,
  onChange,
  required = false,
  readOnly = false,
  maxLength = 100,
  type = "text",
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => {
          // Validación para solo números en campos tipo number
          if (type === "number" && e.target.value !== "") {
            const regex = /^[0-9\b]+$/;
            if (!regex.test(e.target.value)) return;
          }
          onChange(e);
        }}
        readOnly={readOnly}
        required={required}
        maxLength={maxLength}
        className={`w-full border rounded px-3 py-2 ${
          readOnly ? "bg-gray-100" : ""
        }`}
      />
    </div>
  );
}
