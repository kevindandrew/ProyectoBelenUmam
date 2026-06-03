import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  pdf,
} from "@react-pdf/renderer";
import logoAlcaldia from "../../../../public/LOGO_ALCALDIA.png";

function formatoDDMMYYYY(f) {
  if (!f) return "";
  const d = f instanceof Date ? f : new Date(String(f).split("T")[0]);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getDate() + 1).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function calcularEdad(f) {
  if (!f) return "N/A";
  const n = new Date(String(f).split("T")[0]);
  if (isNaN(n.getTime())) return "N/A";
  const hoy = new Date();
  let e = hoy.getFullYear() - n.getFullYear();
  if (
    hoy.getMonth() < n.getMonth() ||
    (hoy.getMonth() === n.getMonth() && hoy.getDate() < n.getDate())
  )
    e--;
  return `${e} Años`;
}

// ==========================================
// ESTILOS MINIMALISTAS COMPRIMIDOS
// ==========================================
const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 40,
    paddingVertical: 35,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#1f2937",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1f2937",
    paddingBottom: 12,
    marginBottom: 15,
  },
  logoPlaceholder: {
    width: 55,
    height: 65,
  },
  headerText: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 8,
    fontWeight: "bold",
    flexDirection: "column",
    color: "#374151",
    lineHeight: 1.3,
    gap: 2,
  },
  titleStack: { alignItems: "flex-end" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  block: { flexDirection: "column", padding: 4 },
  label: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 1,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 10,
    color: "#111827",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 2,
    minHeight: 14,
  },
  section: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    padding: 5,
    borderRadius: 2,

    marginBottom: 6,
    textTransform: "uppercase",
  },
  row: { flexDirection: "row", padding: 5, borderBottom: "0.5 solid #e5e7eb" },
  th: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#374151",
    backgroundColor: "#f9fafb",
    borderBottom: "1 solid #d1d5db",
  },
});

const TablaCursos = ({ titulo, cursos }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={styles.section}>{titulo}</Text>
    {!cursos || cursos.length === 0 ? (
      <Text style={{ fontSize: 9.5, color: "#6b7280", padding: 5 }}>
        No hay registros disponibles.
      </Text>
    ) : (
      <>
        <View style={[styles.row, styles.th]}>
          <Text style={{ width: "8%", textAlign: "center" }}>Nro.</Text>
          <Text style={{ width: "44%" }}>Curso / Taller</Text>
          <Text style={{ width: "12%", textAlign: "center" }}>Nota</Text>
          <Text style={{ width: "12%", textAlign: "center" }}>Gestión</Text>
          <Text style={{ width: "12%", textAlign: "center" }}>Estado</Text>
          <Text style={{ width: "12%", textAlign: "center" }}>Matrícula</Text>
        </View>
        {cursos.map((c, i) => (
          <View key={i} style={styles.row} wrap={false}>
            <Text style={{ width: "8%", textAlign: "center", fontSize: 9 }}>
              {i + 1}
            </Text>
            <Text style={{ width: "44%", fontSize: 9 }}>
              {c.curso?.toUpperCase() || ""}
            </Text>
            <Text style={{ width: "12%", textAlign: "center", fontSize: 9 }}>
              {c.nota_final || "-"}
            </Text>
            <Text style={{ width: "12%", textAlign: "center", fontSize: 9 }}>
              {c.gestion || "-"}
            </Text>
            <Text style={{ width: "12%", textAlign: "center", fontSize: 9 }}>
              {c.estado?.toUpperCase() || "-"}
            </Text>
            <Text style={{ width: "12%", textAlign: "center", fontSize: 9 }}>
              {formatoDDMMYYYY(c.fecha_matricula)}
            </Text>
          </View>
        ))}
      </>
    )}
  </View>
);

export const HistorialAcademicoPDF = ({
  estudiante = {},
  gestorias = [],
  talleres = [],
}) => (
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
          <Text>Universidad Municipal del Adulto Mayor</Text>
        </View>
        <View style={styles.titleStack}>
          <Text style={{ fontSize: 12, fontWeight: "bold" }}>
            HISTORIAL ACADÉMICO
          </Text>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#4b5563" }}>
            GESTIÓN - 2026
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={[styles.block, { width: "60%" }]}>
          <Text style={styles.label}>Nombre del Estudiante</Text>
          <Text style={styles.value}>
            {`${estudiante.nombres || ""} ${estudiante.ap_paterno || ""} ${estudiante.ap_materno || ""}`.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.block, { width: "40%" }]}>
          <Text style={styles.label}>Cod. Registro</Text>
          <Text style={styles.value}>
            {estudiante.numero_registro || "N/A"}
          </Text>
        </View>
        <View style={[styles.block, { width: "40%" }]}>
          <Text style={styles.label}>Carnet de Identidad</Text>
          <Text style={styles.value}>{estudiante.ci || ""}</Text>
        </View>
        <View style={[styles.block, { width: "30%" }]}>
          <Text style={styles.label}>Fecha Emisión PDF</Text>
          <Text style={styles.value}>{formatoDDMMYYYY(new Date())}</Text>
        </View>
        <View style={[styles.block, { width: "30%" }]}>
          <Text style={styles.label}>Edad Actual</Text>
          <Text style={styles.value}>
            {calcularEdad(estudiante.fecha_nacimiento)}
          </Text>
        </View>
      </View>

      <TablaCursos titulo="Gestorías" cursos={gestorias} />
      <TablaCursos titulo="Talleres" cursos={talleres} />
    </Page>
  </Document>
);

export const generarHistorial = async (estudiante = {}, historial = []) => {
  if (typeof window === "undefined") return;
  try {
    const blob = await pdf(
      <HistorialAcademicoPDF
        estudiante={estudiante}
        gestorias={historial.filter((i) => i?.gestoria === true)}
        talleres={historial.filter((i) => i?.gestoria !== true)}
      />,
    ).toBlob();
    window.open(URL.createObjectURL(blob), "_blank");
  } catch (e) {
    console.error(e);
  }
};
