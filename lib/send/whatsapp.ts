/**
 * Envío de mensajes/archivos por WhatsApp vía Twilio
 * Requiere: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // ej: whatsapp:+14155238886

export interface WhatsAppResult {
  success: boolean;
  sid?: string;
  error?: string;
}

/**
 * Envía el PDF del remito por WhatsApp a un número.
 * Twilio necesita una URL pública del PDF; usamos la URL de nuestra API.
 */
export async function enviarRemitoPorWhatsApp(
  numero: string,
  pdfUrl: string,
  numeroRemito?: string
): Promise<WhatsAppResult> {
  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: "WhatsApp no configurado: faltan TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN o TWILIO_WHATSAPP_FROM",
    };
  }

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(accountSid, authToken);

    const to = numero.replace(/\D/g, "").replace(/^0/, ""); // solo dígitos, quitar 0 inicial
    const toWhatsApp = to.startsWith("54") ? `whatsapp:+${to}` : `whatsapp:+54${to}`;

    const body = numeroRemito
      ? `Remito Nº ${numeroRemito} - Adjunto el comprobante en PDF.`
      : "Adjunto remito en PDF.";

    const message = await client.messages.create({
      from: fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`,
      to: toWhatsApp,
      body,
      mediaUrl: [pdfUrl],
    });

    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error("Error enviando WhatsApp:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Error al enviar por WhatsApp",
    };
  }
}
