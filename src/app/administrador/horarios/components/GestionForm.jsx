"use client";
import React, { useState, useEffect } from "react";
import { X, Check, Loader2, Plus } from "lucide-react";
import { fetchWithAuth } from "../utils/api";

const GestionForm = ({ onSubmit, onCancel, isLoading, error }) => {
  const [yearsData, setYearsData] = useState([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [yearsError, setYearsError] = useState(null);

  const [showYearForm, setShowYearForm] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [addingYear, setAddingYear] = useState(false);

  const [formData, setFormData] = useState({
    year_id: "",
    year: "",
    semester: "1",
  });

  const [errors, setErrors] = useState({
    year_id: "",
    year: "",
    semester: "",
    newYear: "",
  });

  // Cargar años disponibles
  useEffect(() => {
    const loadYears = async () => {
      try {
        setLoadingYears(true);
        const years = await fetchWithAuth(
          "https://api-umam-1.onrender.com/cursos/years"
        );
        setYearsData(years);
      } catch (err) {
        setYearsError("Error al cargar los años disponibles");
        console.error("Error loading years:", err);
      } finally {
        setLoadingYears(false);
      }
    };

    loadYears();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación
    if (!formData.year_id) {
      setErrors((prev) => ({ ...prev, year_id: "Seleccione un año" }));
      return;
    }

    const selectedYear = yearsData.find(
      (y) => y.year_id.toString() === formData.year_id
    );

    if (!selectedYear) {
      setErrors((prev) => ({ ...prev, year_id: "Año no válido" }));
      return;
    }

    onSubmit({
      year: selectedYear.year,
      year_id: selectedYear.year_id,
      semester: formData.semester,
    });
  };

  const handleAddNewYear = async () => {
    const yearNumber = parseInt(newYear);
    if (isNaN(yearNumber) || yearNumber < 2000 || yearNumber > 2100) {
      setErrors((prev) => ({
        ...prev,
        newYear: "Ingrese un año válido entre 2000 y 2100",
      }));
      return;
    }

    try {
      setAddingYear(true);
      setErrors((prev) => ({ ...prev, newYear: "" }));

      // Crear nuevo año
      const response = await fetchWithAuth(
        "https://api-umam-1.onrender.com/cursos/year",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            year: newYear,
          }),
        }
      );

      // Recargar la lista de años
      const updatedYears = await fetchWithAuth(
        "https://api-umam-1.onrender.com/cursos/years"
      );
      setYearsData(updatedYears);

      // Seleccionar el nuevo año automáticamente
      const createdYear = updatedYears.find((y) => y.year === newYear);
      if (createdYear) {
        setFormData({
          year_id: createdYear.year_id.toString(),
          year: createdYear.year,
          semester: "1",
        });
      }

      setShowYearForm(false);
      setNewYear("");
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        newYear: err.message || "Error al crear el año",
      }));
      console.error("Error creating year:", err);
    } finally {
      setAddingYear(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Nueva Gestión</h2>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <X size={20} />
        </button>
      </div>

      {(error || yearsError) && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {error || yearsError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Año *
            </label>
            <button
              type="button"
              onClick={() => setShowYearForm(!showYearForm)}
              disabled={loadingYears}
              className="text-xs flex items-center text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <Plus size={12} className="mr-1" />
              {showYearForm ? "Cancelar" : "Añadir año"}
            </button>
          </div>

          {showYearForm ? (
            <div className="space-y-2 mb-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={newYear}
                  onChange={(e) => {
                    setNewYear(e.target.value);
                    if (errors.newYear)
                      setErrors((prev) => ({ ...prev, newYear: "" }));
                  }}
                  placeholder="Ej: 2026"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={addingYear}
                />
                <button
                  type="button"
                  onClick={handleAddNewYear}
                  disabled={addingYear}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {addingYear ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <Check size={16} />
                  )}
                </button>
              </div>
              {errors.newYear && (
                <p className="text-sm text-red-600">{errors.newYear}</p>
              )}
            </div>
          ) : (
            <>
              <select
                name="year_id"
                value={formData.year_id}
                onChange={(e) => {
                  const selected = yearsData.find(
                    (y) => y.year_id.toString() === e.target.value
                  );
                  setFormData({
                    year_id: e.target.value,
                    year: selected?.year || "",
                    semester: "1",
                  });
                  if (errors.year_id)
                    setErrors((prev) => ({ ...prev, year_id: "" }));
                }}
                disabled={isLoading || loadingYears}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.year_id ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
              >
                <option value="">
                  {loadingYears ? "Cargando años..." : "Seleccione un año"}
                </option>
                {yearsData.map((year) => (
                  <option key={year.year_id} value={year.year_id.toString()}>
                    {year.year}
                  </option>
                ))}
              </select>
              {errors.year_id && (
                <p className="mt-1 text-sm text-red-600">{errors.year_id}</p>
              )}
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Semestre *
          </label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="semester"
                value="1"
                checked={formData.semester === "1"}
                onChange={(e) =>
                  setFormData({ ...formData, semester: e.target.value })
                }
                disabled={isLoading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2">Semestre I</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="semester"
                value="2"
                checked={formData.semester === "2"}
                onChange={(e) =>
                  setFormData({ ...formData, semester: e.target.value })
                }
                disabled={isLoading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2">Semestre II</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || loadingYears || !formData.year_id}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Creando...
              </>
            ) : (
              <>
                <Check size={16} />
                Crear Gestión
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GestionForm;
