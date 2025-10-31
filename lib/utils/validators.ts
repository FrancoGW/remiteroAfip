/**
 * Valida un CUIT argentino
 */
export function validarCUIT(cuit: string): boolean {
  if (!cuit || cuit.length !== 11) {
    return false;
  }

  // Verificar que todos los caracteres sean dígitos
  if (!/^\d+$/.test(cuit)) {
    return false;
  }

  // Algoritmo de verificación del CUIT
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = cuit.split("").map(Number);
  const verificador = digits[10];

  let suma = 0;
  for (let i = 0; i < 10; i++) {
    suma += digits[i] * multiplicadores[i];
  }

  const resto = suma % 11;
  const digitoCalculado = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;

  return digitoCalculado === verificador;
}

/**
 * Formatea un CUIT con guiones: XX-XXXXXXXX-X
 */
export function formatearCUIT(cuit: string): string {
  if (cuit.length !== 11) {
    return cuit;
  }
  return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`;
}

/**
 * Valida una patente argentina
 */
export function validarPatente(patente: string): boolean {
  if (!patente) {
    return false;
  }

  // Formato viejo: ABC123 o AB123CD
  const formatoViejo = /^[A-Z]{3}\d{3}$|^[A-Z]{2}\d{3}[A-Z]{2}$/;
  // Formato nuevo (Mercosur): AA123BC
  const formatoNuevo = /^[A-Z]{2}\d{3}[A-Z]{2}$/;

  return formatoViejo.test(patente) || formatoNuevo.test(patente);
}

/**
 * Valida código postal argentino
 */
export function validarCodigoPostal(cp: string): boolean {
  if (!cp) {
    return false;
  }

  // Formato: 4 dígitos (viejo) o formato CPA (nuevo): A1234BCD
  return /^\d{4}$/.test(cp) || /^[A-Z]\d{4}[A-Z]{3}$/.test(cp);
}

