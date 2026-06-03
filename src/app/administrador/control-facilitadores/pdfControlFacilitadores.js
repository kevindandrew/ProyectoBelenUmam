import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from "@react-pdf/renderer";
import logoAlcaldia from "../../../../public/LOGO_ALCALDIA.png";

const TIPO_LABELS = {
  asistencia_eventos: "Asistencia a UMAM",
  clases: "Asistencia Actividad",
  creacion_material: "Elaboración de Material",
};

function formatDuration(hours) {
  if (hours == null || isNaN(hours)) return "0h";
  const h = Math.floor(hours),
    m = Math.round((hours - h) * 60);
  return h === 0 ? `${m}min` : m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function formatDateLocal(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 40,
    paddingVertical: 35,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#1f2937",
  },
  logoPlaceholder: {
    width: 55,
    height: 65,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1.5 solid #1f2937",
    paddingBottom: 12,
    marginBottom: 15,
  },
  headerText: {
    flex: 1,
    paddingRight: 15,
    fontSize: 8,
    fontWeight: "bold",
    color: "#374151",
    gap: 2,
  },
  titleStack: { alignItems: "flex-end" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  block: {
    flexDirection: "column",
    width: "50%",
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 10,
    color: "#111827",
    borderBottom: "0.5 solid #e5e7eb",
    paddingBottom: 2,
    minHeight: 14,
  },
  sectionHeader: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    padding: 5,
    borderRadius: 2,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: "0.5 solid #e5e7eb",
    alignItems: "center",
  },
  th: { backgroundColor: "#f9fafb", borderBottom: "1 solid #d1d5db" },
  thText: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#374151",
    textTransform: "uppercase",
  },
  tdText: { fontSize: 9, color: "#111827" },
  center: { textAlign: "center" },

  c1: { width: "12%" },
  c2: { width: "22%" },
  c3: { width: "10%" },
  c4: { width: "10%" },
  c5: { width: "12%" },
  c6: { width: "34%" },
});

export const ReporteFacilitadorPDF = ({ registros = [], infoHeader = {} }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image src={logoAlcaldia.src} style={styles.logoPlaceholder} />
        <View style={styles.headerText}>
          <Text>Secretaría Municipal de Ciudad de Cuidados y Derechos</Text>
          <Text>Dirección de Atención Social Integral</Text>
          <Text>
            Unidad de Ciudad Longeva Activa y Redes de Cuidado Intergeneracional
          </Text>
          <Text>Universidad Municipal del Adulto Mayor (UMAM)</Text>
        </View>
        <View style={styles.titleStack}>
          <Text style={{ fontSize: 12, fontWeight: "bold" }}>
            HORARIO DE VOLUNTARIADO
          </Text>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#4b5563" }}>
            {infoHeader.periodo}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.block}>
          <Text style={styles.label}>Facilitador</Text>
          <Text style={styles.value}>{infoHeader.facilitador || "Todos"}</Text>
        </View>
        <View style={styles.block}>
          <Text style={styles.label}>CI</Text>
          <Text style={styles.value}>{infoHeader.ci || "—"}</Text>
        </View>
        <View style={styles.block}>
          <Text style={styles.label}>Sucursal</Text>
          <Text style={styles.value}>{infoHeader.sucursal || "—"}</Text>
        </View>
        <View style={styles.block}>
          <Text style={styles.label}>Total Horas</Text>
          <Text
            style={[styles.value, { color: "#13678A", fontWeight: "bold" }]}
          >
            {infoHeader.totalHoras || "0h"}
          </Text>
        </View>
        <View style={[styles.block, { width: "100%" }]}>
          <Text style={styles.label}>Cursos</Text>
          <Text style={styles.value}>{infoHeader.cursos || "—"}</Text>
        </View>
      </View>

      <View>
        <Text style={styles.sectionHeader}>Registro de Actividades</Text>
        <View style={[styles.row, styles.th]}>
          <Text style={[styles.thText, styles.c1, styles.center]}>Fecha</Text>
          <Text style={[styles.thText, styles.c2]}>Actividad</Text>
          <Text style={[styles.thText, styles.c3, styles.center]}>Inicio</Text>
          <Text style={[styles.thText, styles.c4, styles.center]}>Fin</Text>
          <Text style={[styles.thText, styles.c5, styles.center]}>
            Duración
          </Text>
          <Text style={[styles.thText, styles.c6]}>Observaciones</Text>
        </View>

        {registros.map((r, i) => {
          const tm = (r.observaciones || "").match(
            /Hora inicio: (\d{2}:\d{2}) \| Hora fin: (\d{2}:\d{2})/,
          );
          const dur =
            r.fecha && tm
              ? formatDuration(
                  (new Date(`${r.fecha}T${tm[2]}:00`) -
                    new Date(`${r.fecha}T${tm[1]}:00`)) /
                    3600000,
                )
              : "—";
          return (
            <View key={i} style={styles.row} wrap={false}>
              <Text style={[styles.tdText, styles.c1, styles.center]}>
                {formatDateLocal(r.fecha)}
              </Text>
              <Text style={[styles.tdText, styles.c2]}>
                {TIPO_LABELS[r.tipo_servicio] || r.tipo_servicio}
              </Text>
              <Text style={[styles.tdText, styles.c3, styles.center]}>
                {tm ? tm[1] : "—"}
              </Text>
              <Text style={[styles.tdText, styles.c4, styles.center]}>
                {tm ? tm[2] : "—"}
              </Text>
              <Text
                style={[
                  styles.tdText,
                  styles.c5,
                  styles.center,
                  { fontWeight: "bold" },
                ]}
              >
                {dur}
              </Text>
              <Text style={[styles.tdText, styles.c6, { fontStyle: "italic" }]}>
                {tm ? r.observaciones.split(" — ")[0] : r.observaciones}
              </Text>
            </View>
          );
        })}
      </View>
    </Page>
  </Document>
);

export const generarPDFControlFacilitadores = async (registros, infoHeader) => {
  if (typeof window === "undefined") return;
  try {
    const blob = await pdf(
      <ReporteFacilitadorPDF registros={registros} infoHeader={infoHeader} />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Reporte_${infoHeader.facilitador?.replace(/\s+/g, "_") || "General"}_${infoHeader.periodo?.replace(/\s+/g, "_") || "Periodo"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    console.error("Error al generar PDF:", e);
  }
};
