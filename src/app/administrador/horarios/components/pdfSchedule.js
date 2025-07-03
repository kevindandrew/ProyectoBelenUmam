// Importación compatible con Next.js/React (solo en cliente)
let pdfMake;
if (typeof window !== "undefined") {
  // Usar require solo en cliente para evitar errores SSR
  // y proteger el acceso a pdfMake.vfs
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  pdfMake = require("pdfmake/build/pdfmake");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfFonts = require("pdfmake/build/vfs_fonts");
  if (pdfMake && pdfFonts && pdfFonts.pdfMake) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  }
}

export function generateSchedulePDF({
  timeSlots = [],
  availableClassrooms = [],
  days = [],
  courses = [],
  sucursal = "",
  gestion = "",
}) {
  if (!pdfMake) {
    alert("La generación de PDF solo está disponible en el navegador.");
    return;
  }
  // Construir cabecera de la tabla
  const tableHeader = [
    { text: "Hora", style: "tableHeader" },
    { text: "Aula", style: "tableHeader" },
    ...days.map((d) => ({ text: d.name, style: "tableHeader" })),
  ];
  // Construir filas de la tabla
  const tableBody = [tableHeader];
  timeSlots.forEach((time) => {
    availableClassrooms.forEach((classroom, classroomIndex) => {
      const row = [];
      // Hora solo en la primera fila de cada bloque de aulas
      if (classroomIndex === 0) {
        row.push({
          text: time,
          rowSpan: availableClassrooms.length,
          style: "timeCell",
          alignment: "center",
          fillColor: "#e3f0fa",
        });
      } else {
        row.push("");
      }
      // Aula
      row.push({
        text: classroom.label,
        style: "classroomCell",
        alignment: "center",
        fillColor: "#f5f5f5",
      });
      // Celdas de días
      days.forEach((day) => {
        const course = courses.find(
          (c) =>
            c.classroom.value === classroom.value &&
            c.time === time &&
            c.day === day.id
        );
        if (course) {
          row.push({
            stack: [
              { text: course.subject, bold: true, fontSize: 10 },
              { text: course.professor, fontSize: 9 },
            ],
            fillColor: "#d1f7c4",
            margin: [0, 2, 0, 2],
            alignment: "center",
          });
        } else {
          row.push({ text: "", fillColor: "#fff" });
        }
      });
      tableBody.push(row);
    });
    // Fila separadora visual (opcional)
    // tableBody.push(days.map(() => ({})));
  });

  const docDefinition = {
    pageOrientation: "landscape",
    content: [
      {
        text: `Horario de Clases${sucursal ? ` de ${sucursal}` : ""}${
          gestion ? ` - Gestión ${gestion}` : ""
        }`,
        style: "title",
        margin: [0, 0, 0, 16],
      },
      {
        table: {
          headerRows: 1,
          body: tableBody,
        },
        layout: {
          fillColor: (rowIndex, node, columnIndex) => {
            if (rowIndex > 0 && rowIndex % availableClassrooms.length === 0) {
              return "#f0f4f8";
            }
            return null;
          },
        },
      },
    ],
    styles: {
      title: {
        fontSize: 18,
        bold: true,
        alignment: "center",
      },
      tableHeader: {
        fillColor: "#13678A",
        color: "white",
        bold: true,
        fontSize: 12,
        alignment: "center",
      },
      timeCell: {
        fontSize: 11,
        bold: true,
      },
      classroomCell: {
        fontSize: 10,
        bold: true,
      },
    },
    defaultStyle: {
      // Eliminar font: 'Helvetica' para usar la fuente por defecto de pdfmake
    },
  };

  pdfMake.createPdf(docDefinition).download("horario.pdf");
}
