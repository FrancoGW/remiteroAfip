/**
 * Envío de emails con adjuntos (PDF del remito) vía SMTP
 * Requiere: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (opcional)
 */

export interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Envía el PDF del remito por email.
 */
export async function enviarRemitoPorEmail(
  destinatario: string,
  pdfBuffer: Buffer,
  numeroRemito: string
): Promise<EmailResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    return {
      success: false,
      error: "Email no configurado: faltan SMTP_HOST, SMTP_USER o SMTP_PASS",
    };
  }

  try {
    const nodemailer = await import("nodemailer");
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const transporter = nodemailer.default.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: from,
      to: destinatario,
      subject: `Remito Nº ${numeroRemito}`,
      text: `Adjunto remito Nº ${numeroRemito}.`,
      attachments: [
        {
          filename: `remito-${numeroRemito}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error enviando email:", error?.message || error);
    return {
      success: false,
      error: error?.message || "Error al enviar email",
    };
  }
}
