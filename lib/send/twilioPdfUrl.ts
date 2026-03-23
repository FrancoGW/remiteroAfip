/**
 * URL pública del PDF que Twilio pueda descargar sin timeout.
 * - Si hay BLOB_READ_WRITE_TOKEN (Vercel Blob): sube el PDF y devuelve URL estable en CDN.
 * - Si no: URL de nuestra API (puede fallar en Twilio con error 63019 por timeout o 503).
 */

export function getPublicAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://remitero-afip.vercel.app";
}

/**
 * Sube el PDF a Vercel Blob (requiere BLOB_READ_WRITE_TOKEN en Vercel) y devuelve la URL pública.
 */
export async function getPdfUrlForTwilio(
  remitoId: string,
  pdfBuffer: Buffer
): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(
      `remitos/${remitoId}-${Date.now()}.pdf`,
      pdfBuffer,
      {
        access: "public",
        contentType: "application/pdf",
      }
    );
    return url;
  }

  return `${getPublicAppBaseUrl()}/api/remitos/${remitoId}/pdf`;
}
