import { useState } from "react";

export default function UsuarioFormModal({
  user,
  editingUser,
  sucursales,
  onChange,
  onSubmit,
  onClose,
  loading = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        className="bg-white p-6 rounded shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
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

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            <span className="ml-3 text-gray-600">
              Cargando datos del usuario...
            </span>
          </div>
        ) : (
          <>
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
                readOnly={editingUser ? true : false}
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

              <div>
                <label className="block text-sm font-medium mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={showPassword ? user.ci : user.password}
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-100 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                    title={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                          clipRule="evenodd"
                        />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
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
                disabled={loading}
              >
                {editingUser ? "Guardar Cambios" : "Registrar"}
              </button>
            </div>
          </>
        )}
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
