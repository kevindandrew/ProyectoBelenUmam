// Función para generar PDF de lista de estudiantes inscritos en un curso

function parseFechaLocal(fechaValor) {
          widths: [22, 105, 80, 80, 56, 62, 76],

  if (fechaValor instanceof Date) {
    return new Date(
      fechaValor.getFullYear(),
      fechaValor.getMonth(),
      fechaValor.getDate(),
    );
  }

  if (typeof fechaValor === "string") {
    const [anio, mes, dia] = fechaValor.split("T")[0].split("-").map(Number);
    if (Number.isFinite(anio) && Number.isFinite(mes) && Number.isFinite(dia)) {
      return new Date(anio, mes - 1, dia);
    }
  }

  const fecha = new Date(fechaValor);
  if (Number.isNaN(fecha.getTime())) return null;
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function formatoDDMMYYYY(fechaValor) {
  const fecha = parseFechaLocal(fechaValor);
  if (!fecha) return "";
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

export const generarPDFLista = async (
  estudiantes,
  infoGrupo, // { curso, horario, facilitador, sucursal, gestion }
) => {
  if (typeof window === "undefined") return;

  const pdfMake = (await import("pdfmake/build/pdfmake")).default;
  const pdfFonts = await import("pdfmake/build/vfs_fonts");
  pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.default?.vfs;

  // Función para cargar el logo desde public
  const getLogoBase64 = async () => {
    try {
      const response = await fetch("/logo_alcaldia.jpg");
      if (!response.ok) return "";
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result || "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error cargando logo:", error);
      return "";
    }
  };

  const logoBase64 = await getLogoBase64();

  // Encabezado con logo (mismo formato que ficha de inscripción)
  const tablaEncabezado = {
    table: {
      widths: [75, "*", 130],
      body: [
        [
          {
            image: logoBase64 || undefined,
            fit: [65, 65],
            rowSpan: 3,
            margin: [2, 2, 2, 2],
          },
          {
            stack: [
              {
                text: "Secretaría Municipal de Educación y Desarrollo Social",
                fontSize: 8.5,
                bold: true,
                margin: [0, 0, 0, 1],
              },
              {
                text: "Dirección de Atención Social Integral",
                fontSize: 8.5,
                bold: true,
                margin: [0, 0, 0, 1],
              },
              {
                text: "Unidad del Adulto Mayor",
                fontSize: 8.5,
                bold: true,
              },
            ],
            alignment: "left",
            rowSpan: 3,
            margin: [5, 8, 0, 0],
          },
          {
            text: "LISTA DE ESTUDIANTES",
            fontSize: 10,
            bold: true,
            alignment: "right",
            margin: [0, 8, 5, 2],
          },
        ],
        ["", "", ""],
        ["", "", ""],
      ],
    },
    layout: {
      hLineWidth: (i, node) =>
        i === 0 || i === node.table.body.length ? 1.5 : 0,
      vLineWidth: (i, node) =>
        i === 0 || i === node.table.widths.length ? 1.5 : 0,
      hLineColor: () => "#000000",
      vLineColor: () => "#000000",
      paddingLeft: () => 3,
      paddingRight: () => 3,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    margin: [0, 0, 0, 10],
  };

  // Información del curso y facilitador
  const infoCurso = {
    table: {
      widths: ["auto", "*"],
      body: [
        [
          { text: "Curso:", bold: true, fontSize: 11 },
          {
            text: infoGrupo.curso || "Sin especificar",
            fontSize: 11,
          },
        ],
        [
          { text: "Sucursal:", bold: true, fontSize: 11 },
          {
            text: infoGrupo.sucursal || "Sin especificar",
            fontSize: 11,
          },
        ],
        [
          { text: "Facilitador:", bold: true, fontSize: 11 },
          {
            text: infoGrupo.facilitador || "Sin asignar",
            fontSize: 11,
          },
        ],
        [
          { text: "Horario:", bold: true, fontSize: 11 },
          {
            text: infoGrupo.horario || "Sin especificar",
            fontSize: 11,
          },
        ],
      ],
    },
    layout: "noBorders",
    margin: [0, 0, 0, 15],
  };

  // Tabla de estudiantes
  const tablaEstudiantes = [
    [
      {
        text: "N°",
        bold: true,
        fontSize: 10,
        alignment: "center",
        fillColor: "#2c5f8d",
        color: "#ffffff",
        margin: [3, 5, 3, 5],
      },
      {
        text: "Nombres",
        bold: true,
        fontSize: 10,
        fillColor: "#2c5f8d",
        color: "#ffffff",
        margin: [3, 5, 3, 5],
      },
      {
        text: "Apellido Paterno",
        bold: true,
        fontSize: 10,
        fillColor: "#2c5f8d",
        color: "#ffffff",
        margin: [3, 5, 3, 5],
      },
      {
        text: "Apellido Materno",
        bold: true,
        fontSize: 10,
        fillColor: "#2c5f8d",
        color: "#ffffff",
        margin: [3, 5, 3, 5],
      },
      {
        text: "CI",
        bold: true,
        fontSize: 10,
        alignment: "center",
        noWrap: true,
        fillColor: "#2c5f8d",
        color: "#ffffff",
        margin: [3, 5, 3, 5],
      },
      {
        text: "Celular",
        bold: true,
        fontSize: 10,
        alignment: "center",
        noWrap: true,
        fillColor: "#2c5f8d",
        color: "#ffffff",
        margin: [3, 5, 3, 5],
      },
      {
        text: "Fecha Nacimiento",
        bold: true,
        fontSize: 10,
        alignment: "center",
        noWrap: true,
        fillColor: "#2c5f8d",
        color: "#ffffff",
        margin: [3, 5, 3, 5],
      },
      {
        text: "Estado",
        bold: true,
        fontSize: 10,
        alignment: "center",
        fillColor: "#2c5f8d",
        color: "#ffffff",
        margin: [3, 5, 3, 5],
      },
    ],
  ];

  // Agregar cada estudiante a la tabla
  estudiantes.forEach((est, index) => {
    tablaEstudiantes.push([
      {
        text: (index + 1).toString(),
        fontSize: 10,
        alignment: "center",
        margin: [3, 3, 3, 3],
      },
      {
        text: (est.nombres || "").toUpperCase(),
        fontSize: 10,
        margin: [3, 3, 3, 3],
      },
      {
        text: (est.ap_paterno || "").toUpperCase(),
        fontSize: 10,
        margin: [3, 3, 3, 3],
      },
      {
        text: (est.ap_materno || "").toUpperCase(),
        fontSize: 10,
        margin: [3, 3, 3, 3],
      },
      {
        text: est.ci || "",
        fontSize: 10,
        alignment: "center",
        noWrap: true,
        margin: [3, 3, 3, 3],
      },
      {
        text: est.telefono || "",
        fontSize: 10,
        alignment: "center",
        noWrap: true,
        margin: [3, 3, 3, 3],
      },
      {
        text: formatoDDMMYYYY(est.fecha_nacimiento),
        fontSize: 10,
        alignment: "center",
        noWrap: true,
        margin: [3, 3, 3, 3],
      },
      {
        text: est.estado ? String(est.estado).toUpperCase() : "-",
        fontSize: 10,
        alignment: "center",
        margin: [3, 3, 3, 3],
      },
    ]);
          widths: [22, 120, 90, 90, 60, 70, 80],

  // Resumen al final
  const resumenFinal = {
    text: [
      { text: "Total de estudiantes: ", bold: true, fontSize: 11 },
      { text: estudiantes.length.toString(), fontSize: 11 },
    ],
    margin: [0, 10, 0, 0],
  };

  const docDefinition = {
    content: [
      tablaEncabezado,
      infoCurso,
      {
        table: {
          widths: [22, "*", "*", "*", 48, 52, 62, 50],
          body: tablaEstudiantes,
        },
        layout: {
          paddingTop: () => 0,
          paddingBottom: () => 0,
          hLineWidth: (i, node) => {
            if (i === 0 || i === node.table.body.length) return 1.5;
            if (i === 1) return 1; // Línea después del encabezado
            return 0.5;
          },
          vLineWidth: (i, node) => {
            if (i === 0 || i === node.table.widths.length) return 1.5;
            return 0.5;
          },
          hLineColor: (i) => (i === 0 || i === 1 ? "#000000" : "#cccccc"),
          vLineColor: (i, node) =>
            i === 0 || i === node.table.widths.length ? "#000000" : "#cccccc",
        },
      },
      resumenFinal,
    ],
    pageSize: "LETTER",
    pageOrientation: "portrait",
    pageMargins: [30, 40, 30, 40],
    defaultStyle: {
      fontSize: 10,
    },
  };

  const nombreArchivo = `Lista_${infoGrupo.curso?.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;
  pdfMake.createPdf(docDefinition).download(nombreArchivo);
};
