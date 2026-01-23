import { NextRequest, NextResponse } from "next/server";
import { PDFService } from "@/lib/pdf/pdfService";
import { remitosStorageService } from "@/lib/storage/remitosStorage";

/**
 * OPTIONS /api/remitos/[id]/pdf
 * Maneja preflight requests para CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * GET /api/remitos/[id]/pdf
 * Genera y descarga el PDF de un remito específico usando el nuevo servicio PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Obtener remito de MongoDB
    const remito = await remitosStorageService.getById(id);

    if (!remito) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Remito no encontrado",
        },
        { status: 404 }
      );
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }

    // Generar PDF usando el nuevo servicio (pdfmake)
    const pdfBuffer = await PDFService.generarRemitoPDF(remito);

    // Convertir Buffer a Uint8Array para NextResponse
    const pdfArray = new Uint8Array(pdfBuffer);

    // Retornar PDF como respuesta
    return new NextResponse(pdfArray, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="remito-${remito.numeroRemito || remito.id}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error: any) {
    console.error("Error generando PDF:", error);
    const response = NextResponse.json(
      {
        success: false,
        error: error.message || "Error al generar el PDF",
      },
      { status: 500 }
    );
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
}

