export const gestiones = [
  { value: "2025-I", label: "2025 - Semestre I" },
  { value: "2025-II", label: "2025 - Semestre II" },
  { value: "2024-I", label: "2024 - Semestre I" },
  { value: "2024-II", label: "2024 - Semestre II" },
];

export const sucursales = [
  { value: "baseri", label: "BASERI" },
  { value: "kollasuyo", label: "KOLLASUYO" },
  { value: "americas", label: "AMERICAS" },
  { value: "savedra", label: "SAVEDRA" },
];

export const timeSlots = ["09:00 - 10:30", "10:30 - 12:00", "14:30 - 16:00"];

export const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

export const classroomsBySucursal = {
  baseri: ["A1 - BIBLIOTECA", "A2 - COCINA", "B2 - GYM", "D3 - COMPUTACIÓN"],
  kollasuyo: [
    "K1 - AULA MAGNA",
    "K2 - LABORATORIO",
    "K3 - BIBLIOTECA",
    "K4 - AUDITORIO",
  ],
  americas: [
    "AM1 - SALA A",
    "AM2 - SALA B",
    "AM3 - LABORATORIO",
    "AM4 - BIBLIOTECA",
  ],
  savedra: [
    "S1 - AULA 101",
    "S2 - AULA 102",
    "S3 - LABORATORIO",
    "S4 - BIBLIOTECA",
  ],
};

export const scheduleData = [
  {
    id: "1",
    subject: "Dioses",
    professor: "Juan Pérez",
    classroom: "A1 - BIBLIOTECA",
    time: "09:00 - 10:30",
    day: "Lunes",
    color: "bg-pink-200 border-pink-300 text-pink-800",
    gestion: "2025-I",
    sucursal: "baseri",
  },
  {
    id: "2",
    subject: "C",
    professor: "Ana Gómez",
    classroom: "A2 - COCINA",
    time: "09:00 - 10:30",
    day: "Martes",
    color: "bg-cyan-200 border-cyan-300 text-cyan-800",
    gestion: "2025-I",
    sucursal: "baseri",
  },
  {
    id: "3",
    subject: "Inglés",
    professor: "Ana Gómez",
    classroom: "D3 - COMPUTACIÓN",
    time: "09:00 - 10:30",
    day: "Miércoles",
    color: "bg-green-200 border-green-300 text-green-800",
    gestion: "2025-I",
    sucursal: "baseri",
  },
  {
    id: "4",
    subject: "Matemáticas",
    professor: "Luis Martínez",
    classroom: "A1 - BIBLIOTECA",
    time: "10:30 - 12:00",
    day: "Lunes",
    color: "bg-blue-200 border-blue-300 text-blue-800",
    gestion: "2025-I",
    sucursal: "baseri",
  },
  {
    id: "5",
    subject: "Matemáticas",
    professor: "Luis Martínez",
    classroom: "B2 - GYM",
    time: "10:30 - 12:00",
    day: "Jueves",
    color: "bg-blue-200 border-blue-300 text-blue-800",
    gestion: "2025-I",
    sucursal: "baseri",
  },
  {
    id: "6",
    subject: "Dioses",
    professor: "Juan Pérez",
    classroom: "A1 - BIBLIOTECA",
    time: "14:30 - 16:00",
    day: "Martes",
    color: "bg-pink-200 border-pink-300 text-pink-800",
    gestion: "2025-I",
    sucursal: "baseri",
  },
];
