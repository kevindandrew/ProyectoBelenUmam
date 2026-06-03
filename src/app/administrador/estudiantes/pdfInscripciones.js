import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  pdf,
} from "@react-pdf/renderer";

import logoUMAM from "../../../../public/LOGO_UMAM.png";
import logoAlcaldia from "../../../../public/LOGO_ALCALDIA.png";

const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontSize: 10,
    fontFamily: "Helvetica",
  },

  header: {
    border: 1,
    borderColor: "#1e3a8a",
    marginBottom: 10,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },

  logo: {
    width: 60,
    height: 40,
  },

  logoRight: {
    width: 65,
    height: 65,
  },

  institutionInfo: {
    flex: 1,
    paddingHorizontal: 10,
    alignItems: "center",
  },

  institutionText: {
    textAlign: "center",
    fontSize: 9,
    fontWeight: "bold",
    flexWrap: "wrap",
    marginBottom: 2,
  },

  titleContainer: {
    backgroundColor: "#1E1E20",
    paddingVertical: 8,
  },

  title: {
    textAlign: "center",
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },

  studentCard: {
    border: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    backgroundColor: "#f9fafb",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  studentColumn: {
    flex: 1,
    flexDirection: "column",
    gap: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontWeight: "bold",
    color: "#374151",
    width: 60,
  },
  value: {
    color: "#1f2937",
  },

  sectionTitle: {
    backgroundColor: "#1E1E20",
    color: "#fff",
    padding: 6,
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 12,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#9ca3af",
    paddingVertical: 6,
    alignItems: "center",
  },

  tableRow: {
    fontSize: 9,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    alignItems: "center",
  },

  colCell: {
    borderRightWidth: 0.5,
    borderRightColor: "#e5e7eb",
    paddingHorizontal: 4,
  },

  colCurso: {
    flex: 2,
    paddingHorizontal: 4,
  },

  colFacilitador: {
    flex: 1.5,
    paddingHorizontal: 4,
  },

  colCelular: {
    flex: 1,
    paddingHorizontal: 4,
  },

  colAula: {
    flex: 0.8,
    paddingHorizontal: 4,
  },

  colHorario: {
    flex: 1.8,
    paddingHorizontal: 4,
  },

  taller: {
    color: "#2563eb",
    fontSize: 8,
    marginTop: 2,
  },

  gestoria: {
    color: "#7c3aed",
    fontSize: 8,
    marginTop: 2,
  },
});

function parseFechaLocal(fechaValor) {
  if (!fechaValor) return null;
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

export const PDFInscripciones = ({
  estudiante,
  inscripcionesPorSucursal,
  gestionTitulo,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Image src={logoUMAM.src} style={styles.logo} />

          <View style={styles.institutionInfo}>
            <Text style={styles.institutionText} allowsFontScaling={true}>
              Secretaría Municipal de Ciudad de Cuidados y Derechos
            </Text>

            <Text style={styles.institutionText}>
              Dirección de Atención Social Integral
            </Text>

            <Text style={styles.institutionText} allowsFontScaling={true}>
              Unidad de Ciudad Longeva Activa y Redes de Cuidado
              Intergeneracional
            </Text>

            <Text style={styles.institutionText} allowsFontScaling={true}>
              Universidad Municipal del Adulto Mayor
            </Text>
          </View>

          <Image src={logoAlcaldia.src} style={styles.logoRight} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>MATERIAS INSCRITAS - {gestionTitulo}</Text>
        </View>
      </View>

      <View style={styles.studentCard}>
        {/* Columna Izquierda */}
        <View style={styles.studentColumn}>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>
              {`${estudiante.nombres} ${estudiante.ap_paterno} ${estudiante.ap_materno || ""}`}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>C.I.:</Text>
            <Text style={styles.value}>{estudiante.ci}</Text>
          </View>
        </View>

        {/* Columna Derecha */}
        <View style={styles.studentColumn}>
          <View style={styles.row}>
            <Text style={styles.label}>Registro:</Text>
            <Text style={styles.value}>{estudiante.numero_registro}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha:</Text>
            <Text style={styles.value}>{formatoDDMMYYYY(new Date())}</Text>
          </View>
        </View>
      </View>

      {Object.entries(inscripcionesPorSucursal).map(([sucursal, cursos]) => (
        <View key={sucursal}>
          <Text style={styles.sectionTitle}>
            SUCURSAL: {sucursal.toUpperCase()}
          </Text>

          <View style={styles.tableHeader}>
            <Text style={styles.colCurso}>Curso</Text>
            <Text style={styles.colFacilitador}>Facilitador</Text>
            <Text style={styles.colCelular}>Celular</Text>
            <Text style={styles.colAula}>Aula</Text>
            <Text style={styles.colHorario}>Horario</Text>
          </View>
          {(Array.isArray(cursos) ? cursos : []).map((insc, idx) => {
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

            return (
              <View key={idx} style={styles.tableRow}>
                <View style={styles.colCurso}>
                  <Text style={{ fontWeight: "bold" }}>
                    {curso.nombre || "Sin nombre"}
                  </Text>
                  <Text
                    style={curso.gestoria ? styles.gestoria : styles.taller}
                  >
                    {curso.gestoria ? "[GESTORÍA]" : "[TALLER]"}
                  </Text>
                </View>

                <Text style={styles.colFacilitador}>
                  {`${facilitador.nombres || ""} ${facilitador.apellido || ""}`.trim() ||
                    "Sin asignar"}
                </Text>

                <Text style={styles.colCelular}>
                  {facilitador.telefono || "Sin teléfono"}
                </Text>

                <Text style={styles.colAula}>{aula.nombre || "Sin aula"}</Text>

                <Text style={styles.colHorario}>
                  {horarioText || "Sin horario"}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </Page>
  </Document>
);

export const generarPDFInscripciones = async (
  estudiante,
  inscripcionesPorSucursal,
  gestionTitulo,
) => {
  try {
    console.log(window.location.origin);

    const blob = await pdf(
      <PDFInscripciones
        estudiante={estudiante}
        inscripcionesPorSucursal={inscripcionesPorSucursal}
        gestionTitulo={gestionTitulo}
      />,
    ).toBlob();

    const url = URL.createObjectURL(blob);

    window.open(url, "_blank");
  } catch (error) {
    console.error("Error generando PDF:", error);
  }
};
