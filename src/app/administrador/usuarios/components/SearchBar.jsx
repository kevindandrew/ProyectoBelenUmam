export default function SearchBar({
  searchTerm,
  onSearch,
  onAddUser,
  recordsPerPage,
  onRecordsPerPageChange,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="registros" className="text-sm text-gray-900">
          Mostrar
        </label>
        <select
          id="registros"
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={recordsPerPage}
          onChange={(e) => onRecordsPerPageChange(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span className="text-sm">registros</span>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="buscar" className="text-sm">
          Buscar:
        </label>
        <input
          id="buscar"
          type="text"
          placeholder="Buscar usuario..."
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={searchTerm}
          onChange={onSearch}
        />
      </div>

      <button
        className="bg-teal-500 text-white px-4 py-2 rounded text-sm hover:bg-teal-600 self-start sm:self-auto"
        onClick={onAddUser}
      >
        + Nuevo Usuario
      </button>
    </div>
  );
}
