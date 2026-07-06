/**
 * Determina si estamos en un ambiente de producción real (no dev, no
 * preview/staging de Vercel). Se usa para decidir si el botón de prueba de
 * WhatsApp requiere confirmación explícita antes de enviar.
 */
export function isProductionEnv(): boolean {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  return process.env.NODE_ENV === "production";
}
