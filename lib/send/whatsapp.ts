/**
 * Envío de mensajes/archivos por WhatsApp vía Twilio
 *
 * Modo plantilla (recomendado, fuera de ventana 24 h):
 *   TWILIO_WHATSAPP_CONTENT_SID = HX... (Content Template aprobado por WhatsApp)
 *   Variables del template: {{1}} nombre, {{2}} nº remito, {{3}} URL pública del PDF
 *
 * Modo libre (solo si el usuario te escribió en las últimas 24 h):
 *   Sin TWILIO_WHATSAPP_CONTENT_SID → body + mediaUrl
 */

/** Leer env dentro de la función: en Vercel/Next el valor en el módulo puede quedar vacío y caer en modo libre (error 63016). */
function getTwilioEnv() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_WHATSAPP_FROM,
    contentSid: process.env.TWILIO_WHATSAPP_CONTENT_SID?.trim() || "",
  };
}

export interface WhatsAppResult {
  success: boolean;
  sid?: string;
  error?: string;
}

function normalizeToWhatsApp(numero: string): string {
  const to = numero.replace(/\D/g, "").replace(/^0/, "");
  return to.startsWith("54") ? `whatsapp:+${to}` : `whatsapp:+54${to}`;
}

function normalizeFrom(fromNumber: string): string {
  return fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`;
}

/**
 * Envía el PDF del remito por WhatsApp.
 * Si TWILIO_WHATSAPP_CONTENT_SID está definido, usa plantilla aprobada (Content API).
 * Si no, mensaje libre + mediaUrl (requiere ventana 24 h o sandbox).
 */
export async function enviarRemitoPorWhatsApp(
  numero: string,
  pdfUrl: string,
  numeroRemito?: string,
  nombreCliente?: string
): Promise<WhatsAppResult> {
  const { accountSid, authToken, fromNumber, contentSid } = getTwilioEnv();

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: "WhatsApp no configurado: faltan TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN o TWILIO_WHATSAPP_FROM",
    };
  }

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(accountSid, authToken);
    const toWhatsApp = normalizeToWhatsApp(numero);
    const from = normalizeFrom(fromNumber);

    if (contentSid) {
      const nombre = (nombreCliente || "Cliente").trim() || "Cliente";
      const nro = numeroRemito || "";
      const variables: Record<string, string> = {
        "1": nombre,
        "2": nro,
        "3": pdfUrl,
      };

      const message = await client.messages.create({
        from,
        to: toWhatsApp,
        contentSid,
        contentVariables: JSON.stringify(variables),
      });

      return { success: true, sid: message.sid };
    }

    const body = numeroRemito
      ? `Remito Nº ${numeroRemito} - Adjunto el comprobante en PDF.`
      : "Adjunto remito en PDF.";

    const message = await client.messages.create({
      from,
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
