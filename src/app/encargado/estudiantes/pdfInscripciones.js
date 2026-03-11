// Sin logo por ahora (evita errores de PNG corrupto)
const logoBase64 = "";

function formatoDDMMYYYY(fechaISO) {
  if (!fechaISO) return "";
  const fecha = new Date(fechaISO);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

export const generarPDFInscripciones = async (
  estudiante,
  inscripciones,
  gestionTitulo,
) => {
  if (typeof window === "undefined") return;

  const pdfMake = (await import("pdfmake/build/pdfmake")).default;
  const pdfFonts = await import("pdfmake/build/vfs_fonts");
  pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.default?.vfs;

  // Agrupar inscripciones por sucursal
  const inscripcionesPorSucursal = inscripciones.reduce((acc, insc) => {
    const sucursalNombre = insc.horario?.sucursal?.nombre || "Sin sucursal";
    if (!acc[sucursalNombre]) {
      acc[sucursalNombre] = [];
    }
    acc[sucursalNombre].push(insc);
    return acc;
  }, {});

  // Tabla de encabezado - mismo estilo que historial académico
  const tablaEncabezado = {
    table: {
      widths: [255, "*"],
      body: [
        [
          {
            text: "Secretaría Municipal de Educación y Desarrollo Social",
            fontSize: 9,
            bold: true,
          },
          "",
        ],
        [
          {
            text: "Dirección de Atención Social Integral",
            fontSize: 9,
            bold: true,
          },
          { text: "MATERIAS INSCRITAS", fontSize: 11, bold: true },
        ],
        [
          {
            text: "Unidad del Adulto Mayor",
            fontSize: 9,
            bold: true,
          },
          { text: `GESTIÓN ${gestionTitulo}`, fontSize: 10, bold: true },
        ],
      ],
    },
    layout: {
      paddingTop: () => 1,
      paddingBottom: () => 0.5,
      hLineWidth: (i, node) =>
        i === 0 || i === node.table.body.length ? 1 : 0,
      vLineWidth: (i, node) =>
        i === 0 || i === node.table.widths.length ? 1 : 0,
      hLineColor: () => "black",
      vLineColor: () => "black",
    },
  };

  // Información del estudiante
  const infoEstudiante = [
    [
      { text: "Nombre: ", bold: true },
      {
        text: `${estudiante.nombres} ${estudiante.ap_paterno} ${estudiante.ap_materno || ""}`,
        colSpan: 2,
      },
      {},
      { text: "Cod. Registro: ", bold: true },
      estudiante.estudiante_id,
      "",
    ],
    [
      { text: "Carnet de Identidad: ", bold: true },
      estudiante.ci || "",
      "",
      { text: "Fecha: ", bold: true },
      formatoDDMMYYYY(new Date()),
      "",
    ],
  ];

  const content = [
    tablaEncabezado,
    { text: "\n" },
    {
      table: {
        widths: ["auto", "*", "*", "auto", "auto", "*"],
        body: infoEstudiante,
      },
      layout: "noBorders",
    },
    { text: "\n" },
  ];

  // Generar tabla para cada sucursal
  Object.keys(inscripcionesPorSucursal).forEach((sucursalNombre, idx) => {
    const cursos = inscripcionesPorSucursal[sucursalNombre];

    const tablaCursos = [
      [
        {
          text: sucursalNombre.toUpperCase(),
          colSpan: 5,
          fillColor: "#2c5f8d",
          alignment: "center",
          fontSize: 11,
          bold: true,
          color: "#ffffff",
          margin: [0, 5, 0, 5],
        },
        {},
        {},
        {},
        {},
      ],
      [
        {
          text: "Curso",
          bold: true,
          fontSize: 9,
          fillColor: "#e8e8e8",
          margin: [3, 3, 3, 3],
        },
        {
          text: "Facilitador",
          bold: true,
          fontSize: 9,
          fillColor: "#e8e8e8",
          margin: [3, 3, 3, 3],
        },
        {
          text: "Celular",
          bold: true,
          fontSize: 9,
          alignment: "center",
          fillColor: "#e8e8e8",
          margin: [3, 3, 3, 3],
        },
        {
          text: "Aula",
          bold: true,
          fontSize: 9,
          alignment: "center",
          fillColor: "#e8e8e8",
          margin: [3, 3, 3, 3],
        },
        {
          text: "Horario",
          bold: true,
          fontSize: 9,
          fillColor: "#e8e8e8",
          margin: [3, 3, 3, 3],
        },
      ],
    ];

    cursos.forEach((insc) => {
      const horario = insc.horario || {};
      const curso = horario.curso || {};
      const facilitador = horario.facilitador || {};
      const aula = horario.aula || {};
      const diasClase = horario.dias_clase || [];

      const horarioText = diasClase
        .map((dc) => {
          const dia = dc.dia_semana?.dia_semana || "";
          const inicio = dc.hora?.hora_inicio?.slice(0, 5) || "";
          const fin = dc.hora?.hora_fin?.slice(0, 5) || "";
          return `${dia} ${inicio}-${fin}`;
        })
        .join("\n");

      const tipoText = curso.gestoria ? "[Gestoría]" : "[Taller]";
      const tipoColor = curso.gestoria ? "#7c3aed" : "#2563eb";

      tablaCursos.push([
        {
          text: [
            { text: `${curso.nombre || "Sin nombre"}\n`, fontSize: 9 },
            {
              text: tipoText,
              fontSize: 8,
              color: tipoColor,
              bold: true,
            },
          ],
          margin: [3, 5, 3, 5],
        },
        {
          text:
            `${facilitador.nombres || ""} ${facilitador.apellido || ""}`.trim() ||
            "Sin asignar",
          fontSize: 9,
          margin: [3, 5, 3, 5],
        },
        {
          text: facilitador.telefono || "Sin teléfono",
          fontSize: 9,
          alignment: "center",
          margin: [3, 5, 3, 5],
        },
        {
          text: aula.nombre || "Sin aula",
          fontSize: 9,
          alignment: "center",
          margin: [3, 5, 3, 5],
        },
        {
          text: horarioText || "Sin horario",
          fontSize: 8,
          margin: [3, 5, 3, 5],
        },
      ]);
    });

    content.push({
      table: {
        widths: ["*", 100, 70, 50, 100],
        body: tablaCursos,
      },
      layout: {
        paddingTop: () => 0,
        paddingBottom: () => 0,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        hLineWidth: (i, node) => {
          if (i === 0 || i === node.table.body.length) return 1.5;
          if (i === 2) return 1; // Línea después de la cabecera
          return 0.5;
        },
        vLineWidth: (i, node) => {
          if (i === 0 || i === node.table.widths.length) return 1.5;
          return 0.5;
        },
        hLineColor: (i, node) => {
          if (i === 0 || i === node.table.body.length) return "#000000";
          return "#cccccc";
        },
        vLineColor: (i, node) => {
          if (i === 0 || i === node.table.widths.length) return "#000000";
          return "#cccccc";
        },
      },
      margin: [0, idx === 0 ? 0 : 15, 0, 0],
    });
  });

  const docDefinition = {
    content,
    styles: {
      header: { fontSize: 12, bold: true },
    },
    defaultStyle: {
      fontSize: 10,
    },
    pageMargins: [40, 60, 40, 40],
  };

  pdfMake.createPdf(docDefinition).open();
};
