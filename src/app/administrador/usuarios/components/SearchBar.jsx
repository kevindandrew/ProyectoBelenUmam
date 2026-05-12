import { Search, ChevronDown } from "lucide-react";

export default function SearchBar({
  searchTerm,
  onSearch,
  recordsPerPage,
  onRecordsPerPageChange,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Selector de registros */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label htmlFor="registros" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Mostrar
        </label>
        <div className="relative">
          <select
            id="registros"
            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
            value={recordsPerPage}
            onChange={(e) => onRecordsPerPageChange(Number(e.target.value))}
          >
            <option value={10}>10 registros</option>
            <option value={25}>25 registros</option>
            <option value={50}>50 registros</option>
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Buscador principal */}
      <div className="md:col-span-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label htmlFor="buscar" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Búsqueda Inteligente
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={18} />
          </span>
          <input
            id="buscar"
            type="text"
            placeholder="Buscar por nombres, apellidos o CI..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            value={searchTerm}
            maxLength={100}
            onChange={onSearch}
          />
        </div>
      </div>
    </div>
  );
}

