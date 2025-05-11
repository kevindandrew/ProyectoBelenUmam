export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">
        Bienvenido al Panel de Fcilitador
      </h1>

      <p className="text-gray-600">
        Aquí podrás gestionar usuarios, cursos, estudiantes, reportes y más. Usa
        el menú lateral para navegar.
      </p>

      {/* Resumen opcional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-900">
            Estudiantes
          </h2>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Cursos</h2>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-900">
            Reportes Generados
          </h2>
          <p className="text-3xl font-bold text-purple-600">0</p>
        </div>
      </div>
    </div>
  );
}
