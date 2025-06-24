import FormField from "./FormField";

export default function FormSection({ title, fields, className = "" }) {
  return (
    <div className={`mb-6 ${className}`}>
      {title && (
        <h5 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">
          {title}
        </h5>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field, index) => (
          <div
            key={index}
            className={field.colSpan === 2 ? "md:col-span-2" : ""}
            style={field.hidden ? { display: "none" } : {}}
          >
            <FormField {...field} />
          </div>
        ))}
      </div>
    </div>
  );
}
