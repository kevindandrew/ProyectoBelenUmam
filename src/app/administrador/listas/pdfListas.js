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

// ==========================================
// UTILS COMPACTOS DE FECHAS
// ==========================================
function formatoDDMMYYYY(f) {
  if (!f) return "";
  const d = f instanceof Date ? f : new Date(String(f).split("T")[0]);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getDate() + 1).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ==========================================
// ESTILOS INSTITUCIONALES UNIFICADOS
// ==========================================
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
    width: "40%",
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
  // Anchos simétricos calculados para las columnas de la lista
  c1: { width: "4%" },
  c2: { width: "24%" },
  c3: { width: "19%" },
  c4: { width: "19%" },
  c5: { width: "11%" },
  c6: { width: "12%" },
  c7: { width: "10%" },
});

export const ListaEstudiantesPDF = ({ estudiantes = [], infoGrupo = {} }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* ENCABEZADO INSTITUCIONAL */}
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
            LISTA DE ESTUDIANTES
          </Text>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#4b5563" }}>
            GESTIÓN {infoGrupo.gestion || "2026"}
          </Text>
        </View>
      </View>

      {/* DETALLES DEL GRUPO / CURSO */}
      <View style={styles.grid}>
        <View style={styles.block}>
          <Text style={styles.label}>Curso / Taller</Text>
          <Text style={styles.value}>
            {(infoGrupo.curso || "Sin especificar").toUpperCase()}
          </Text>
        </View>
        <View style={styles.block}>
          <Text style={styles.label}>Sucursal / Aula</Text>
          <Text style={styles.value}>
            {(infoGrupo.sucursal || "Sin especificar").toUpperCase()}
          </Text>
        </View>
        <View style={styles.block}>
          <Text style={styles.label}>Facilitador(a)</Text>
          <Text style={styles.value}>
            {(infoGrupo.facilitador || "Sin asignar").toUpperCase()}
          </Text>
        </View>
        <View style={styles.block}>
          <Text style={styles.label}>Horario</Text>
          <Text style={styles.value}>
            {(infoGrupo.horario || "Sin especificar").toUpperCase()}
          </Text>
        </View>
      </View>

      {/* TABLA DE INSCRITOS */}
      <View>
        <Text style={styles.sectionHeader}>Alumnos Inscritos</Text>

        {/* TH */}
        <View style={[styles.row, styles.th]}>
          <Text style={[styles.thText, styles.c1, styles.center]}>N°</Text>
          <Text style={[styles.thText, styles.c2]}>Nombres</Text>
          <Text style={[styles.thText, styles.c3]}>Ap. Paterno</Text>
          <Text style={[styles.thText, styles.c4]}>Ap. Materno</Text>
          <Text style={[styles.thText, styles.c5, styles.center]}>C.I.</Text>
          <Text style={[styles.thText, styles.c6, styles.center]}>Celular</Text>
          <Text style={[styles.thText, styles.c7, styles.center]}>F. Nac.</Text>
        </View>

        {/* TD */}
        {estudiantes.length === 0 ? (
          <Text
            style={{
              fontSize: 9.5,
              color: "#6b7280",
              padding: 10,
              fontStyle: "italic",
            }}
          >
            No existen estudiantes inscritos en este bloque.
          </Text>
        ) : (
          estudiantes.map((est, idx) => (
            <View key={idx} style={styles.row} wrap={false}>
              <Text style={[styles.tdText, styles.c1, styles.center]}>
                {idx + 1}
              </Text>
              <Text style={[styles.tdText, styles.c2]}>
                {(est.nombres || "").toUpperCase()}
              </Text>
              <Text style={[styles.tdText, styles.c3]}>
                {(est.ap_paterno || "").toUpperCase()}
              </Text>
              <Text style={[styles.tdText, styles.c4]}>
                {(est.ap_materno || "").toUpperCase()}
              </Text>
              <Text style={[styles.tdText, styles.c5, styles.center]}>
                {est.ci || "-"}
              </Text>
              <Text style={[styles.tdText, styles.c6, styles.center]}>
                {est.telefono || "-"}
              </Text>
              <Text style={[styles.tdText, styles.c7, styles.center]}>
                {formatoDDMMYYYY(est.fecha_nacimiento)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* RESUMEN INFERIOR */}
      <View
        style={{
          marginTop: 15,
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: 5,
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: "bold", color: "#374151" }}>
          Total Estudiantes Matriculados:{" "}
          <Text style={{ color: "#111827" }}>{estudiantes.length}</Text>
        </Text>
      </View>
    </Page>
  </Document>
);

export const generarPDFLista = async (estudiantes = [], infoGrupo = {}) => {
  if (typeof window === "undefined") return;
  try {
    const blob = await pdf(
      <ListaEstudiantesPDF estudiantes={estudiantes} infoGrupo={infoGrupo} />,
    ).toBlob();

    // Generación dinámica limpia del nombre del archivo descargable
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Lista_${(infoGrupo.curso || "Curso").replace(/\s+/g, "_")}_2026.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Error al compilar lista PDF:", e);
  }
};
