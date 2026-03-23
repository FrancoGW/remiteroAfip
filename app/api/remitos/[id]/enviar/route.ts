import { NextRequest, NextResponse } from "next/server";
import { remitosStorageService } from "@/lib/storage/remitosStorage";
import { PDFService } from "@/lib/pdf/pdfService";
import { enviarRemitoPorWhatsApp } from "@/lib/send/whatsapp";
import { enviarRemitoPorEmail } from "@/lib/send/email";
import { getPdfUrlForTwilio } from "@/lib/send/twilioPdfUrl";

/**
 * POST /api/remitos/[id]/enviar
 * Envía el PDF del remito por WhatsApp y/o email.
 *
 * Body (JSON):
 *   whatsapp?: string[]  — números (ej: ["5491112345678"])
 *   email?: string[]     — direcciones de email
 *
 * Al menos uno de los dos debe enviarse.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const remito = await remitosStorageService.getById(id);

    if (!remito) {
      const res = NextResponse.json(
        { success: false, error: "Remito no encontrado" },
        { status: 404 }
      );
      res.headers.set("Access-Control-Allow-Origin", "*");
      return res;
    }

    const body = await request.json().catch(() => ({}));
    const whatsapp: string[] = Array.isArray(body.whatsapp) ? body.whatsapp : [];
    const email: string[] = Array.isArray(body.email) ? body.email : [];

    if (whatsapp.length === 0 && email.length === 0) {
      const res = NextResponse.json(
        {
          success: false,
          error: "Indique al menos un destino: whatsapp (array de números) o email (array de emails)",
        },
        { status: 400 }
      );
      res.headers.set("Access-Control-Allow-Origin", "*");
      return res;
    }

    const numeroRemito = String(remito.numeroRemito ?? remito.id ?? id);

    const resultadosWhatsApp: { numero: string; success: boolean; error?: string }[] = [];
    const resultadosEmail: { email: string; success: boolean; error?: string }[] = [];
    const errores: string[] = [];

    // Generar PDF una vez (WhatsApp + email). Twilio error 63019 suele ser porque no puede
    // descargar a tiempo desde /api/.../pdf; con Vercel Blob la URL es estable y rápida.
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await PDFService.generarRemitoPDF(remito);
    } catch (e: any) {
      errores.push(`PDF: ${e?.message || "No se pudo generar el PDF"}`);
    }

    let pdfUrlParaTwilio: string | null = null;
    if (whatsapp.length > 0 && pdfBuffer) {
      try {
        pdfUrlParaTwilio = await getPdfUrlForTwilio(id, pdfBuffer);
      } catch (e: any) {
        errores.push(`Subida PDF para WhatsApp: ${e?.message || e}`);
      }
    }

    for (const numero of whatsapp) {
      const n = String(numero).trim();
      if (!n) continue;
      if (!pdfUrlParaTwilio) {
        resultadosWhatsApp.push({
          numero: n,
          success: false,
          error: pdfBuffer
            ? "No se pudo preparar la URL del PDF para Twilio"
            : "No se pudo generar el PDF",
        });
        continue;
      }
      const r = await enviarRemitoPorWhatsApp(n, pdfUrlParaTwilio, numeroRemito);
      resultadosWhatsApp.push({ numero: n, success: r.success, error: r.error });
      if (!r.success && r.error) errores.push(`WhatsApp ${n}: ${r.error}`);
    }

    if (pdfBuffer) {
      for (const dest of email) {
        const e = String(dest).trim();
        if (!e) continue;
        const r = await enviarRemitoPorEmail(e, pdfBuffer, numeroRemito);
        resultadosEmail.push({ email: e, success: r.success, error: r.error });
        if (!r.success && r.error) errores.push(`Email ${e}: ${r.error}`);
      }
    } else {
      for (const e of email) {
        resultadosEmail.push({
          email: String(e).trim(),
          success: false,
          error: "No se pudo generar el PDF",
        });
      }
    }

    const whatsappOk =
      whatsapp.length === 0 || resultadosWhatsApp.every((r) => r.success);
    const emailOk =
      email.length === 0 || resultadosEmail.every((r) => r.success);
    const success = whatsappOk && emailOk;

    const res = NextResponse.json({
      success,
      enviados: {
        whatsapp: resultadosWhatsApp,
        email: resultadosEmail,
      },
      ...(errores.length > 0 ? { errores } : {}),
      ...(!process.env.BLOB_READ_WRITE_TOKEN && whatsapp.length > 0
        ? {
            aviso:
              "Para evitar error 63019 de Twilio, configure BLOB_READ_WRITE_TOKEN (Vercel Blob) en Vercel.",
          }
        : {}),
    });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  } catch (error: any) {
    console.error("Error en enviar remito:", error);
    const res = NextResponse.json(
      { success: false, error: error?.message || "Error al enviar" },
      { status: 500 }
    );
    res.headers.set("Access-Control-Allow-Origin", "*");
    return res;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
