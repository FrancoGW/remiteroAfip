/**
 * Configuración de datos de la empresa (precargados)
 * Estos datos se pueden configurar en variables de entorno o en un archivo de configuración
 */
import { CUIT_EMISOR_PRINCIPAL, cuitConGuiones } from "./cuitEmpresa";

/** CUIT del emisor: AFIP_CUIT > EMPRESA_CUIT > constante 30693787285 */
export function getEmisorCuitDigitos(): string {
  const a = process.env.AFIP_CUIT?.replace(/\D/g, "");
  if (a?.length === 11) return a;
  const e = process.env.EMPRESA_CUIT?.replace(/\D/g, "");
  if (e?.length === 11) return e;
  return CUIT_EMISOR_PRINCIPAL;
}

export const EMPRESA_CONFIG = {
  nombre: process.env.EMPRESA_NOMBRE || "Empresas Verdes Argentina S.A.",
  direccion: process.env.EMPRESA_DIRECCION || "2DA. SECCION - PREDIO LA NUEVA",
  localidad: process.env.EMPRESA_LOCALIDAD || "3346 LA CRUZ - CORRIENTES",
  cuit: process.env.EMPRESA_CUIT || cuitConGuiones(getEmisorCuitDigitos()),
  ingresosBrutos:
    process.env.EMPRESA_INGRESOS_BRUTOS ||
    cuitConGuiones(getEmisorCuitDigitos()),
  fechaInicio: process.env.EMPRESA_FECHA_INICIO || "NOVIEMBRE 1997",
  condicionIva: process.env.EMPRESA_CONDICION_IVA || "IVA RESPONSABLE INSCRIPTO",
  codigo: process.env.EMPRESA_CODIGO || "091",
};


