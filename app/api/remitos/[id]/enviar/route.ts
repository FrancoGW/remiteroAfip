import { NextRequest, NextResponse } from "next/server";
import { remitosStorageService } from "@/lib/storage/remitosStorage";
import { PDFService } from "@/lib/pdf/pdfService";
import { enviarRemitoPorWhatsApp } from "@/lib/send/whatsapp";
import { enviarRemitoPorEmail } from "@/lib/send/email";

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "https://remitero-afip.vercel.app";
}

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
    const baseUrl = getBaseUrl();
    const pdfUrl = `${baseUrl}/api/remitos/${id}/pdf`;

    const resultadosWhatsApp: { numero: string; success: boolean; error?: string }[] = [];
    const resultadosEmail: { email: string; success: boolean; error?: string }[] = [];
    const errores: string[] = [];

    // WhatsApp: Twilio descarga el PDF desde nuestra URL
    for (const numero of whatsapp) {
      const n = String(numero).trim();
      if (!n) continue;
      const r = await enviarRemitoPorWhatsApp(n, pdfUrl, numeroRemito);
      resultadosWhatsApp.push({ numero: n, success: r.success, error: r.error });
      if (!r.success && r.error) errores.push(`WhatsApp ${n}: ${r.error}`);
    }

    // Email: generamos el PDF y lo adjuntamos
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await PDFService.generarRemitoPDF(remito);
    } catch (e: any) {
      errores.push(`PDF: ${e?.message || "No se pudo generar el PDF"}`);
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

    const success = errores.length === 0;
    const res = NextResponse.json({
      success,
      enviados: {
        whatsapp: resultadosWhatsApp,
        email: resultadosEmail,
      },
      ...(errores.length > 0 ? { errores } : {}),
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
