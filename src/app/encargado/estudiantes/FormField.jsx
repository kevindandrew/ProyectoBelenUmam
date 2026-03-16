const EMPTY_OPTIONS = [];

export default function FormField({
  type = "text",
  name,
  label,
  value,
  onChange,
  options = EMPTY_OPTIONS,
  required = false,
  placeholder = "",
  disabled = false,
  className = "",
  inputMode = "text",
  pattern,
  colSpan,
  hidden,
  ...props
}) {
  return (
    <div
      className={`mb-3 ${className}`}
      style={hidden ? { display: "none" } : {}}
    >
      {label && type !== "checkbox" && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      {type === "select" ? (
        <select
          name={name}
          value={value || ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="w-full border rounded px-3 py-2 bg-white"
          {...props}
        >
          <option value="">Seleccione...</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          value={value || ""}
          onChange={(e) => {
            const upperValue = e.target.value.toUpperCase();
            onChange({
              ...e,
              target: {
                ...e.target,
                name: name,
                value: upperValue,
              },
            });
          }}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full border rounded px-3 py-2"
          style={{ textTransform: "uppercase" }}
          {...props}
        />
      ) : type === "checkbox" ? (
        <label className="flex items-center">
          <input
            type="checkbox"
            name={name}
            checked={value || false}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className="h-4 w-4"
            {...props}
          />
          <span className="ml-2 text-sm text-gray-700">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </span>
        </label>
      ) : (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={(e) => {
            // Convertir a mayúsculas solo para campos de texto
            if (type === "text" && !["ci", "telefono"].includes(name)) {
              const upperValue = e.target.value.toUpperCase();
              onChange({
                ...e,
                target: {
                  ...e.target,
                  name: name,
                  value: upperValue,
                },
              });
            } else {
              onChange(e);
            }
          }}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full border rounded px-3 py-2"
          inputMode={inputMode}
          pattern={pattern}
          style={
            type === "text" && !["ci", "telefono"].includes(name)
              ? { textTransform: "uppercase" }
              : {}
          }
          {...props}
        />
      )}
    </div>
  );
}
