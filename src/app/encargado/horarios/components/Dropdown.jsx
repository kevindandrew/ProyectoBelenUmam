"use client";
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const Dropdown = ({
  options = [],
  selected = { value: "", label: "Seleccionar..." },
  onSelect = () => {},
  className = "",
  placeholder = "Seleccionar...",
  disabled = false,
  icon = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Manejo seguro de valores nulos
  const selectedLabel = selected?.label || placeholder;
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <div className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          <span>{selectedLabel}</span>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""} ${
            disabled ? "opacity-50" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {safeOptions.length > 0 ? (
            safeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                  option.value === selected?.value
                    ? "bg-blue-50 text-blue-600"
                    : ""
                }`}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No hay opciones disponibles
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
