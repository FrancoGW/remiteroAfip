/**
 * Configuración de datos de la empresa (precargados)
 * Estos datos se pueden configurar en variables de entorno o en un archivo de configuración
 */
export const EMPRESA_CONFIG = {
  nombre: process.env.EMPRESA_NOMBRE || "Empresas Verdes Argentina S.A.",
  direccion: process.env.EMPRESA_DIRECCION || "2DA. SECCION - PREDIO LA NUEVA",
  localidad: process.env.EMPRESA_LOCALIDAD || "3346 LA CRUZ - CORRIENTES",
  cuit: process.env.EMPRESA_CUIT || "30-69378728-5",
  ingresosBrutos: process.env.EMPRESA_INGRESOS_BRUTOS || "30-69378728-5",
  fechaInicio: process.env.EMPRESA_FECHA_INICIO || "NOVIEMBRE 1997",
  condicionIva: process.env.EMPRESA_CONDICION_IVA || "IVA RESPONSABLE INSCRIPTO",
  codigo: process.env.EMPRESA_CODIGO || "091",
};


