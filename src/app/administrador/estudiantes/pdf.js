import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import logoAlcaldia from "../../../../public/LOGO_ALCALDIA.png";

function parseFechaLocal(fechaValor) {
  if (!fechaValor) return null;
  if (fechaValor instanceof Date) return fechaValor;

  const fechaTexto = String(fechaValor).trim();
  if (!fechaTexto) return null;

  const fechaBase = fechaTexto.split("T")[0];
  const partes = fechaBase.split("-");
  if (partes.length === 3) {
    const anio = Number(partes[0]);
    const mes = Number(partes[1]);
    const dia = Number(partes[2]);
    if (!Number.isNaN(anio) && !Number.isNaN(mes) && !Number.isNaN(dia)) {
      return new Date(anio, mes - 1, dia);
    }
  }

  const fecha = new Date(fechaTexto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function formatoDDMMYYYY(fechaISO) {
  if (!fechaISO) return "";
  const fecha = parseFechaLocal(fechaISO);
  if (!fecha) return "";
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return "";
  const hoy = new Date();
  const nacimiento = parseFechaLocal(fechaNacimiento);
  if (!nacimiento) return "";
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad + " Años";
}

function extraerMacrodistrito(direccionCompleta) {
  if (!direccionCompleta) return "";
  const partes = direccionCompleta.split(", ");
  return partes[0] || "";
}

function extraerDireccion(direccionCompleta) {
  if (!direccionCompleta) return "";
  const partes = direccionCompleta.split(", ");
  return partes.slice(1).join(", ") || "";
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 40,
    paddingVertical: 35,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  headerContainer: {
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
  headerTextStack: {
    flex: 1,
    paddingHorizontal: 15,
    flexDirection: "column",
    gap: 2,
  },
  headerInstitution: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#374151",
    lineHeight: 1.3,
  },
  headerRightStack: {
    alignItems: "flex-end",
    gap: 2,
  },
  pdfTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
  },
  pdfSubtitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#4b5563",
  },

  sectionHeader: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 2,

    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  dataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 5,
  },

  fieldBlock3: {
    width: "33.33%",
    flexDirection: "column",
    paddingVertical: 4,

    paddingHorizontal: 4,
  },
  fieldBlock2: {
    width: "50%",
    flexDirection: "column",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  fieldBlock1: {
    width: "100%",

    flexDirection: "column",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 8,

    fontWeight: "bold",
    color: "#374151",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 10,
    color: "#000000",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 2,
    minHeight: 14,
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 70,
    paddingHorizontal: 30,
  },
  signatureBox: {
    width: "40%",
    borderTopWidth: 1,
    borderTopColor: "#9ca3af",
    paddingTop: 8,
    alignItems: "center",
  },
  signatureText: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    color: "#374151",
  },
});

export const FichaEstudiantePDF = ({ estudiante = {} }) => {
  const fechaFormateada = formatoDDMMYYYY(estudiante.fecha_registro);
  const numeroRegistro =
    estudiante.numero_registro || estudiante.registro_id || "N/A";

  const familiar = estudiante.datos_familiares?.[0] || {};
  const academico = estudiante.datos_academicos?.[0] || {}; // <-- Con 'ad'
  const medico = estudiante.datos_medicos?.[0] || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ENCABEZADO INSTITUCIONAL */}
        <View style={styles.headerContainer}>
          <Image src={logoAlcaldia.src} style={styles.logoPlaceholder} />

          <View style={styles.headerTextStack}>
            <Text style={styles.headerInstitution}>
              Secretaría Municipal de Ciudad de Cuidados y Derechos
            </Text>
            <Text style={styles.headerInstitution}>
              Dirección de Atención Social Integral
            </Text>
            <Text style={styles.headerInstitution}>
              Unidad de Ciudad Longeva Activa y Redes de Cuidado
              Intergeneracional
            </Text>
            <Text style={styles.headerInstitution}>
              Universidad Municipal del Adulto Mayor
            </Text>
          </View>
          <View style={styles.headerRightStack}>
            <Text style={styles.pdfTitle}>FICHA DE INSCRIPCIÓN</Text>
            <Text style={styles.pdfSubtitle}>GESTIÓN 2026</Text>
          </View>
        </View>

        {/* 1. DATOS DE REGISTRO */}
        <Text style={styles.sectionHeader}>Datos de Registro</Text>
        <View style={styles.dataRow}>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Nro. Registro</Text>
            <Text style={styles.value}>{numeroRegistro}</Text>
          </View>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Fecha de registro</Text>
            <Text style={styles.value}>{fechaFormateada}</Text>
          </View>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>¿Cómo te enteraste del proyecto?</Text>
            <Text style={styles.value}>
              {estudiante.como_se_entero?.toUpperCase() || ""}
            </Text>
          </View>
        </View>

        {/* 2. DATOS PERSONALES */}
        <Text style={styles.sectionHeader}>Datos Personales</Text>
        <View style={styles.dataRow}>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Apellido Paterno</Text>
            <Text style={styles.value}>
              {estudiante.ap_paterno?.toUpperCase() || ""}
            </Text>
          </View>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Apellido Materno</Text>
            <Text style={styles.value}>
              {estudiante.ap_materno?.toUpperCase() || ""}
            </Text>
          </View>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Nombres</Text>
            <Text style={styles.value}>
              {estudiante.nombres?.toUpperCase() || ""}
            </Text>
          </View>
        </View>

        <View style={styles.dataRow}>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Fecha de Nacimiento</Text>
            <Text style={styles.value}>
              {formatoDDMMYYYY(estudiante.fecha_nacimiento) || ""}
            </Text>
          </View>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Carnet de Identidad</Text>
            <Text style={styles.value}>{estudiante.ci || ""}</Text>
          </View>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Edad</Text>
            <Text style={styles.value}>
              {calcularEdad(estudiante.fecha_nacimiento)}
            </Text>
          </View>
        </View>

        <View style={styles.dataRow}>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Género</Text>
            <Text style={styles.value}>
              {estudiante.genero?.toUpperCase() || ""}
            </Text>
          </View>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Lugar de Nacimiento</Text>
            <Text style={styles.value}>
              {estudiante.lugar_nacimiento?.toUpperCase() || ""}
            </Text>
          </View>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Estado Civil</Text>
            <Text style={styles.value}>
              {estudiante.estado_civil?.toUpperCase() || ""}
            </Text>
          </View>
        </View>

        <View style={styles.dataRow}>
          <View style={styles.fieldBlock2}>
            <Text style={styles.label}>Macrodistrito</Text>
            <Text style={styles.value}>
              {(
                estudiante.macro_distrito ||
                extraerMacrodistrito(estudiante.direccion)
              )?.toUpperCase() || ""}
            </Text>
          </View>
          <View style={styles.fieldBlock2}>
            <Text style={styles.label}>Nro. Celular / WhatsApp</Text>
            <Text style={styles.value}>{estudiante.telefono || ""}</Text>
          </View>
        </View>

        <View style={styles.dataRow}>
          <View style={styles.fieldBlock1}>
            <Text style={styles.label}>
              Dirección Actual (Avenida/Calle Nº de puerta)
            </Text>
            <Text style={styles.value}>
              {(estudiante.macro_distrito
                ? estudiante.direccion
                : extraerDireccion(estudiante.direccion)
              )?.toUpperCase() || ""}
            </Text>
          </View>
        </View>

        {/* 3. REFERENCIA FAMILIAR */}
        <Text style={styles.sectionHeader}>Referencia Familiar</Text>
        <View style={styles.dataRow}>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Apellido Paterno</Text>
            <Text style={styles.value}>
              {familiar.ap_paterno?.toUpperCase() || ""}
            </Text>
          </View>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Apellido Materno</Text>
            <Text style={styles.value}>
              {familiar.ap_materno?.toUpperCase() || ""}
            </Text>
          </View>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Nombres</Text>
            <Text style={styles.value}>
              {familiar.nombres?.toUpperCase() || ""}
            </Text>
          </View>
        </View>

        <View style={styles.dataRow}>
          <View style={styles.fieldBlock2}>
            <Text style={styles.label}>Parentesco o afinidad</Text>
            <Text style={styles.value}>
              {familiar.parentesco?.toUpperCase() || ""}
            </Text>
          </View>
          <View style={styles.fieldBlock2}>
            <Text style={styles.label}>Número de celular</Text>
            <Text style={styles.value}>{familiar.telefono || ""}</Text>
          </View>
        </View>

        <View style={styles.dataRow}>
          <View style={styles.fieldBlock1}>
            <Text style={styles.label}>Dirección Actual Familiar</Text>
            <Text style={styles.value}>
              {familiar.direccion?.toUpperCase() || ""}
            </Text>
          </View>
        </View>

        {/* 4. DATOS ACADÉMICOS Y MÉDICOS */}
        <Text style={styles.sectionHeader}>Información Académica y Médica</Text>
        <View style={styles.dataRow}>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Grado de Instrucción</Text>
            <Text style={styles.value}>
              {academico.grado_institucion?.toUpperCase() || ""}
            </Text>
          </View>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Años de servicio</Text>
            <Text style={styles.value}>{academico.anios_servicio || ""}</Text>
          </View>
          <View style={styles.fieldBlock3}>
            <Text style={styles.label}>Último Cargo</Text>
            <Text style={styles.value}>
              {academico.ultimo_cargo?.toUpperCase() || ""}
            </Text>
          </View>
        </View>

        <View style={styles.dataRow}>
          <View style={styles.fieldBlock2}>
            <Text style={styles.label}>Sistema de Salud</Text>
            <Text style={styles.value}>
              {medico.sistema_salud?.toUpperCase() || ""}
            </Text>
          </View>
          <View style={styles.fieldBlock2}>
            <Text style={styles.label}>Enfermedad de base</Text>
            <Text style={styles.value}>
              {medico.enfermedad_base?.toUpperCase() || ""}
            </Text>
          </View>
        </View>

        <View style={styles.dataRow}>
          <View style={styles.fieldBlock1}>
            <Text style={styles.label}>Tratamiento Específico</Text>
            <Text style={styles.value}>
              {medico.tratamiento_especifico?.toUpperCase() || ""}
            </Text>
          </View>
        </View>

        {/* SECCIÓN DE FIRMAS */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>
              Firma y sello del responsable
            </Text>
            <Text
              style={[
                styles.signatureText,
                { fontWeight: "normal", fontSize: 8, marginTop: 2 },
              ]}
            >
              de registro
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>Firma del solicitante</Text>
            <Text
              style={[
                styles.signatureText,
                { fontWeight: "normal", fontSize: 8, marginTop: 2 },
              ]}
            >
              Nombre Completo y C.I.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
export const generarFichaEstudiante = async (estudiante) => {
  try {
    // Genera el blob del documento de manera asíncrona
    const blob = await pdf(
      <FichaEstudiantePDF estudiante={estudiante} />,
    ).toBlob();

    // Crea una URL para el blob y lo abre en una nueva pestaña
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch (error) {
    console.error("Error al generar la ficha del estudiante:", error);
  }
};
