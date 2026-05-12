// Función para generar PDF de reporte de actividades de facilitadores
export const generarPDFControlFacilitadores = async (registros, infoHeader) => {
  if (typeof window === "undefined") return;

  const pdfMake = (await import("pdfmake/build/pdfmake")).default;
  const pdfFonts = await import("pdfmake/build/vfs_fonts");
  pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.default?.vfs;

  const TIPO_LABELS = {
    asistencia_eventos: "Asistencia a UMAM",
    clases: "Asistencia Actividad",
    creacion_material: "Elaboración de Material"
  };

  function formatDuration(hours) {
    if (hours == null) return "0h";
    const h = Math.floor(hours), m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }

  function formatDateLocal(dateStr) {
    if (!dateStr) return "—";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  // Cargar el logo de la alcaldía
  let logoBase64 = null;
  try {
    const response = await fetch("/logo_alcaldia.jpg");
    const blob = await response.blob();
    logoBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("No se pudo cargar el logo para el PDF:", error);
  }

  const tablaEncabezado = {
    table: {
      widths: [100, "*", 150],
      body: [
        [
          {
            image: logoBase64,
            width: 80,
            rowSpan: 3,
            alignment: "center",
            margin: [0, 5, 0, 0]
          } || { text: "", rowSpan: 3 },
          {
            text: "Secretaría Municipal de Educación y Desarrollo Social",
            fontSize: 10,
            bold: true,
            margin: [5, 8, 0, 2],
          },
          {
            text: "HORARIO DE VOLUNTARIADO",
            fontSize: 14,
            bold: true,
            alignment: "center",
            rowSpan: 2,
            margin: [0, 8, 0, 0],
          },
        ],
        [
          "",
          {
            text: "Dirección de Atención Social Integral",
            fontSize: 10,
            bold: true,
            margin: [5, 2, 0, 2],
          },
          "",
        ],
        [
          "",
          {
            text: "Universidad Municipal del Adulto Mayor (UMAM)",
            fontSize: 10,
            bold: true,
            margin: [5, 2, 0, 8],
          },
          {
            text: `${infoHeader.periodo || ""}`,
            fontSize: 12,
            bold: true,
            alignment: "center",
            margin: [0, 5, 0, 0],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: (i, node) => i === 0 || i === node.table.body.length ? 1.5 : 0,
      vLineWidth: (i, node) => i === 0 || i === node.table.widths.length ? 1.5 : 0,
    },
    margin: [0, 0, 0, 15],
  };

  const infoSujeto = {
    table: {
      widths: ["auto", "*", "auto", "*"],
      body: [
        [
          { text: "Facilitador:", bold: true, fontSize: 10 },
          { text: infoHeader.facilitador || "Todos los facilitadores", fontSize: 10 },
          { text: "CI:", bold: true, fontSize: 10 },
          { text: infoHeader.ci || "—", fontSize: 10 },
        ],
        [
          { text: "Celular:", bold: true, fontSize: 10 },
          { text: infoHeader.celular || "—", fontSize: 10 },
          { text: "Sucursal:", bold: true, fontSize: 10 },
          { text: infoHeader.sucursal || "—", fontSize: 10 },
        ],
        [
          { text: "Cursos:", bold: true, fontSize: 10 },
          { text: infoHeader.cursos || "—", fontSize: 10, colSpan: 3 },
          {}, {}
        ],
        [
          { text: "Horarios:", bold: true, fontSize: 10 },
          { text: infoHeader.horarios || "—", fontSize: 10, colSpan: 3 },
          {}, {}
        ],
        [
          { text: "Total Horas:", bold: true, fontSize: 10 },
          { text: infoHeader.totalHoras || "0h", fontSize: 11, color: "#13678A", bold: true, colSpan: 3 },
          {}, {}
        ],
      ],
    },
    layout: "noBorders",
    margin: [0, 0, 0, 15],
  };

  const tablaActividades = [
    [
      { text: "Fecha", bold: true, fontSize: 10, fillColor: "#2c5f8d", color: "#ffffff", alignment: "center" },
      { text: "Actividad", bold: true, fontSize: 10, fillColor: "#2c5f8d", color: "#ffffff" },
      { text: "Inicio", bold: true, fontSize: 10, fillColor: "#2c5f8d", color: "#ffffff", alignment: "center" },
      { text: "Fin", bold: true, fontSize: 10, fillColor: "#2c5f8d", color: "#ffffff", alignment: "center" },
      { text: "Duración", bold: true, fontSize: 10, fillColor: "#2c5f8d", color: "#ffffff", alignment: "center" },
      { text: "Descripción / Observaciones", bold: true, fontSize: 10, fillColor: "#2c5f8d", color: "#ffffff" },
    ]
  ];

  registros.forEach((r) => {
    const obs = r.observaciones || "";
    const tm = obs.match(/Hora inicio: (\d{2}:\d{2}) \| Hora fin: (\d{2}:\d{2})/);
    const hInicio = tm ? tm[1] : "—";
    const hFin = tm ? tm[2] : "—";
    const desc = tm ? obs.split(" — ")[0] || "—" : obs || "—";

    // Calcular duracion para el PDF
    let dur = "—";
    if (r.fecha && tm) {
      const diff = (new Date(`${r.fecha}T${tm[2]}:00`) - new Date(`${r.fecha}T${tm[1]}:00`)) / 3600000;
      dur = formatDuration(diff);
    }

    tablaActividades.push([
      { text: formatDateLocal(r.fecha), fontSize: 9, alignment: "center", margin: [0, 3, 0, 3] },
      { text: TIPO_LABELS[r.tipo_servicio] || r.tipo_servicio, fontSize: 9, margin: [0, 3, 0, 3] },
      { text: hInicio, fontSize: 9, alignment: "center", margin: [0, 3, 0, 3] },
      { text: hFin, fontSize: 9, alignment: "center", margin: [0, 3, 0, 3] },
      { text: dur, fontSize: 9, alignment: "center", bold: true, margin: [0, 3, 0, 3] },
      { text: desc, fontSize: 9, italic: true, margin: [0, 3, 0, 3] },
    ]);
  });

  const docDefinition = {
    content: [
      tablaEncabezado,
      infoSujeto,
      {
        table: {
          widths: [55, 100, 40, 40, 50, "*"],
          headerRows: 1,
          body: tablaActividades,
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length) ? 1 : 0.5,
          hLineColor: (i) => (i === 0 || i === 1) ? "#000000" : "#cccccc",
          vLineColor: (i, node) => (i === 0 || i === node.table.widths.length) ? "#000000" : "#cccccc",
        }
      },
      {
        text: `Generado el: ${new Date().toLocaleString()}`,
        fontSize: 8,
        margin: [0, 20, 0, 0],
        alignment: "right",
        color: "#999999"
      }
    ],
    pageSize: "LETTER",
    pageMargins: [40, 40, 40, 40],
  };

  const filename = `Reporte_Actividades_${infoHeader.facilitador?.replace(/\s+/g, "_") || "General"}_${infoHeader.periodo?.replace(/\s+/g, "_")}.pdf`;
  pdfMake.createPdf(docDefinition).download(filename);
};
