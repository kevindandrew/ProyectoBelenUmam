"use client";

export default function ArraySection({
  title,
  items = [],
  fields = [],
  onAdd,
  onRemove,
  onInputChange,
}) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          + Añadir
        </button>
      </div>

      {items.map((item, index) => (
        <div key={index} className="border rounded p-4 mb-4 relative">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            aria-label="Eliminar"
          >
            &#10005;
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field, fieldIndex) => (
              <div
                key={fieldIndex}
                className={field.colSpan === 2 ? "md:col-span-2" : ""}
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    name={field.name}
                    value={item[field.name] || ""}
                    onChange={(e) =>
                      field.onChange
                        ? field.onChange(e, index)
                        : onInputChange(e, index)
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Seleccione...</option>
                    {field.options.map((option, i) => (
                      <option key={i} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={item[field.name] || false}
                      onChange={(e) => onInputChange(e, index)}
                      className="h-4 w-4"
                    />
                    <span className="ml-2">{field.label}</span>
                  </label>
                ) : (
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    value={item[field.name] || ""}
                    onChange={(e) =>
                      field.onChange
                        ? field.onChange(e, index)
                        : onInputChange(e, index)
                    }
                    placeholder={field.placeholder}
                    className="w-full border rounded px-3 py-2"
                    inputMode={field.inputMode}
                    pattern={field.pattern}
                    maxLength={100}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
