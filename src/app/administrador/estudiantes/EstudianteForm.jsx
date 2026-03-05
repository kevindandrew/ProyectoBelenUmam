"use client";
import FormSection from "./FormSection";
import ArraySection from "./ArraySection";

export default function EstudianteForm({
  estudiante,
  isEditing,
  onInputChange,
  onSubmit,
  onAddArrayItem,
  onRemoveArrayItem,
  onClose,
  isSubmitting,
  onOpenOCR,
}) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/25 flex items-center justify-center z-50"
        onClick={onClose}
      />
      <form
        onSubmit={onSubmit}
        className="bg-white p-6 rounded shadow w-full max-w-4xl z-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
          onClick={onClose}
          aria-label="Cerrar modal"
          disabled={isSubmitting}
        >
          &#10005;
        </button>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? "Editar Estudiante" : "NUEVO REGISTRO"}
          </h2>
        </div>

        <div className="card mb-4">
          <div className="card-header text-center bg-primary text-white py-2">
            <strong>
              FICHA DE INCRIPCIÓN (UNIVERSIDAD MUNICIPAL DEL ADULTO MAYOR)
            </strong>
          </div>
          <div className="card-body">
            <FormSection
              title="DATOS DE REGISTRO"
              fields={[
                {
                  type: "select",
                  name: "como_se_entero",
                  label: "Cómo se enteró del proyecto:",
                  options: [
                    "Facebook",
                    "Televisión",
                    "Radio",
                    "Amistades",
                    "Familia",
                    "Otros",
                  ],
                  value: estudiante.como_se_entero,
                  onChange: onInputChange,
                },
              ]}
            />

            <hr className="bg-primary border-2 border-top border-primary my-4" />

            <FormSection
              title="DATOS PERSONALES"
              fields={[
                {
                  type: "text",
                  name: "ap_paterno",
                  label: "Apellido paterno:",
                  value: estudiante.ap_paterno,
                  onChange: onInputChange,
                  required: true,
                  maxLength: 60,
                },
                {
                  type: "text",
                  name: "ap_materno",
                  label: "Apellido materno:",
                  value: estudiante.ap_materno,
                  onChange: onInputChange,
                  required: true,
                  maxLength: 60,
                },
                {
                  type: "text",
                  name: "nombres",
                  label: "Nombres:",
                  value: estudiante.nombres,
                  onChange: onInputChange,
                  required: true,
                  maxLength: 60,
                  pattern: "^[a-zA-ZÁÉÍÓÚáéíóúÑñ\\s]+$",
                  title: "Solo letras y espacios",
                },
                {
                  type: "date",
                  name: "fecha_nacimiento",
                  label: "Fecha nacimiento:",
                  value: estudiante.fecha_nacimiento,
                  onChange: onInputChange,
                  required: true,
                  max: new Date().toISOString().split("T")[0],
                },
                {
                  type: "text",
                  name: "ci",
                  label: "Carnet Identidad:",
                  value: estudiante.ci,
                  onChange: (e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    if (numericValue.length <= 10) {
                      onInputChange({
                        ...e,
                        target: {
                          ...e.target,
                          name: "ci",
                          value: numericValue,
                        },
                      });
                    }
                  },
                  required: true,
                  inputMode: "numeric",
                  pattern: "\\d{5,10}",
                  maxLength: 10,
                  title: "Solo números, entre 5 y 10 dígitos",
                },
                {
                  type: "select",
                  name: "genero",
                  label: "Género:",
                  options: ["MASCULINO", "FEMENINO", "OTRO"],
                  value: estudiante.genero,
                  onChange: onInputChange,
                },
                {
                  type: "select",
                  name: "lugar_nacimiento",
                  label: "Lugar de nacimiento:",
                  options: [
                    "La Paz",
                    "Oruro",
                    "Potosí",
                    "Chuquisaca",
                    "Tarija",
                    "Cochabamba",
                    "Beni",
                    "Pando",
                    "Santa Cruz",
                    "El Alto",
                  ],
                  value: estudiante.lugar_nacimiento,
                  onChange: onInputChange,
                },
                {
                  type: "text",
                  name: "telefono",
                  label: "Número de celular (WhatsApp):",
                  value: estudiante.telefono,
                  onChange: (e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    if (numericValue.length <= 15) {
                      onInputChange({
                        ...e,
                        target: {
                          ...e.target,
                          name: "telefono",
                          value: numericValue,
                        },
                      });
                    }
                  },
                  inputMode: "numeric",
                  pattern: "\\d*",
                  maxLength: 15,
                  title: "Solo números entre 6 y 15 dígitos",
                },
                {
                  type: "select",
                  name: "estado_civil",
                  label: "Estado Civil:",
                  options: [
                    "SOLTERO",
                    "CASADO",
                    "VIUDO",
                    "DIVORCIADO",
                    "CONVIVIENTE",
                  ],
                  value: estudiante.estado_civil,
                  onChange: onInputChange,
                  required: true,
                },
                {
                  type: "select",
                  name: "macrodistrito",
                  label: "Macrodistrito:",
                  options: [
                    "Cotahuma",
                    "Max Paredes",
                    "Periférica",
                    "San Antonio",
                    "Sur",
                    "Mallasa",
                    "Centro",
                    "Zongo",
                    "Hampaturi",
                  ],
                  value: estudiante.macrodistrito,
                  onChange: onInputChange,
                },
                {
                  type: "text",
                  name: "direccion",
                  label: "Dirección:",
                  value: estudiante.direccion,
                  onChange: onInputChange,
                  maxLength: 100,
                },
              ]}
            />

            <hr className="bg-primary border-2 border-top border-primary my-4" />

            <FormSection
              title="DATOS ACADÉMICOS"
              fields={[
                {
                  type: "select",
                  name: "grado_institucion",
                  label: "Grado de instrucción:",
                  options: [
                    "Ninguno",
                    "Primaria",
                    "Secundaria",
                    "Bachiller",
                    "Técnico",
                    "Licenciatura",
                    "Maestría",
                    "Doctorado",
                  ],
                  value: estudiante.grado_institucion,
                  onChange: onInputChange,
                },
                {
                  type: "text",
                  name: "ultimo_cargo",
                  label: "Último cargo:",
                  value: estudiante.ultimo_cargo,
                  onChange: onInputChange,
                  maxLength: 100,
                  placeholder: "Ej: Delegado",
                },
                {
                  type: "text",
                  name: "anios_servicio",
                  label: "Años de servicio:",
                  value: estudiante.anios_servicio,
                  onChange: (e) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    if (numericValue.length <= 3) {
                      onInputChange({
                        ...e,
                        target: {
                          ...e.target,
                          name: "anios_servicio",
                          value: numericValue,
                        },
                      });
                    }
                  },
                  inputMode: "numeric",
                  placeholder: "Ej: 5",
                },
              ]}
            />

            <hr className="bg-primary border-2 border-top border-primary my-4" />

            <ArraySection
              title="DATOS FAMILIARES"
              arrayName="datos_familiares"
              items={estudiante.datos_familiares}
              onAdd={() => onAddArrayItem("datos_familiares")}
              onRemove={(index) => onRemoveArrayItem("datos_familiares", index)}
              fields={[
                {
                  type: "text",
                  name: "ap_paterno",
                  label: "Apellido paterno:",
                },
                {
                  type: "text",
                  name: "ap_materno",
                  label: "Apellido materno:",
                },
                {
                  type: "text",
                  name: "nombres",
                  label: "Nombres:",
                },
                {
                  type: "select",
                  name: "parentesco",
                  label: "Parentesco:",
                  options: [
                    "Padre",
                    "Madre",
                    "Hijo",
                    "Hija",
                    "Hermano",
                    "Hermana",
                    "Otro",
                  ],
                },
                {
                  type: "text",
                  name: "telefono",
                  label: "Teléfono:",
                  onChange: (e, index) => {
                    const numericValue = e.target.value.replace(/\D/g, "");
                    const name = `datos_familiares.${index}.telefono`;
                    onInputChange({
                      ...e,
                      target: {
                        ...e.target,
                        name,
                        value: numericValue,
                      },
                    });
                  },
                  inputMode: "numeric",
                },
                {
                  type: "text",
                  name: "direccion",
                  label: "Dirección:",
                  colSpan: 3,
                },
              ]}
              onInputChange={(e, index) => {
                const name = `datos_familiares.${index}.${e.target.name}`;
                const syntheticEvent = {
                  target: {
                    name: name,
                    value: e.target.value,
                    type: e.target.type,
                    checked: e.target.checked,
                  },
                };
                onInputChange(syntheticEvent);
              }}
            />

            <hr className="bg-primary border-2 border-top border-primary my-4" />

            <ArraySection
              title="DATOS MÉDICOS"
              arrayName="datos_medicos"
              items={estudiante.datos_medicos}
              onAdd={() => onAddArrayItem("datos_medicos")}
              onRemove={(index) => onRemoveArrayItem("datos_medicos", index)}
              fields={[
                {
                  type: "select",
                  name: "sistema_salud",
                  label: "Sistema de salud:",
                  options: ["Público", "Privado", "Seguro", "Ninguno"],
                },
                {
                  type: "text",
                  name: "enfermedad_base",
                  label: "Enfermedad de base:",
                  placeholder: "Ej: Diabetes, Hipertensión",
                },
                {
                  type: "text",
                  name: "tratamiento_especifico",
                  label: "Tratamiento específico:",
                  placeholder: "Ej: Antialérgicos",
                  colSpan: 2,
                },
              ]}
              onInputChange={(e, index) => {
                const name = `datos_medicos.${index}.${e.target.name}`;
                const syntheticEvent = {
                  target: {
                    name: name,
                    value: e.target.value,
                    type: e.target.type,
                    checked: e.target.checked,
                  },
                };
                onInputChange(syntheticEvent);
              }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onOpenOCR}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Escanear Carnet
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isEditing ? "Guardando..." : "Registrando..."}
              </>
            ) : isEditing ? (
              "Guardar Cambios"
            ) : (
              "Guardar"
            )}
          </button>
        </div>
      </form>
    </>
  );
}
