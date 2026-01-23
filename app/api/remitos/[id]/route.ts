import { NextRequest, NextResponse } from "next/server";
import { remitosStorageService } from "@/lib/storage/remitosStorage";

/**
 * GET /api/remitos/[id]
 * Obtiene los detalles de un remito específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const remito = await remitosStorageService.getById(id);

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

