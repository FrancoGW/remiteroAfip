import { NextRequest, NextResponse } from "next/server";

// En producción, esto vendría de una base de datos
let remitosStorage: any[] = [];

/**
 * GET /api/remitos/[id]
 * Obtiene los detalles de un remito específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const remito = remitosStorage.find((r) => r.id === params.id);

    if (!remito) {
      return NextResponse.json(
        {
          success: false,
          error: "Remito no encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      remito,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

