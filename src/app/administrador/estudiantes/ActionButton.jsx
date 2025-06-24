"use client";

export default function ActionButton({
  onClick,
  icon,
  color = "blue",
  ariaLabel,
  disabled = false,
  className = "",
  size = "md",
  actionData = null, // Nuevo prop para pasar datos
}) {
  const colorClasses = {
    indigo: "text-indigo-600 hover:text-indigo-800",
    green: "text-green-600 hover:text-green-800",
    blue: "text-blue-600 hover:text-blue-800",
    red: "text-red-600 hover:text-red-800",
    gray: "text-gray-500 hover:text-gray-700",
  };

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && onClick) {
      onClick(actionData || e); // Pasa actionData si existe
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${
        colorClasses[color]
      } ${className} inline-flex items-center justify-center mx-1 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      aria-label={ariaLabel}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className={sizeClasses[size]}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
    </button>
  );
}
