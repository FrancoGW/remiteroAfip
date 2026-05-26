/**
 * CUIT empresa para remitos, AFIP y PDFs (11 dígitos sin guiones).
 * Debe coincidir con AFIP_CUIT en `.env`; el certificado .crt debe ser de este CUIT.
 */
export const CUIT_EMISOR_PRINCIPAL = "30693787285";

export function cuitConGuiones(digitos: string): string {
  const d = digitos.replace(/\D/g, "");
  if (d.length !== 11) return digitos;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}
