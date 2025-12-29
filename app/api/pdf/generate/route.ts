import { NextRequest, NextResponse } from "next/server";
import { PDFService } from "@/lib/pdf/pdfService";
import { Remito } from "@/lib/types/remito";

/**
 * POST /api/pdf/generate
 * Servicio separado para generar PDFs usando pdfmake
 * Este servicio funciona mejor en entornos serverless como Vercel
 */
export async function POST(request: NextRequest) {
  try {
    const remito: Remito = await request.json();

    // Generar PDF usando el nuevo servicio
    const pdfBuffer = await PDFService.generarRemitoPDF(remito);

    // Convertir Buffer a base64 para respuesta
    const pdfBase64 = pdfBuffer.toString("base64");

    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
    });
  } catch (error: any) {
    console.error("Error generando PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al generar el PDF",
      },
      { status: 500 }
    );
  }
}

