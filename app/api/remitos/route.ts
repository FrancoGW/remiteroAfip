import { NextRequest, NextResponse } from "next/server";
import { afipService } from "@/lib/afip/afipService";
import { Remito } from "@/lib/types/remito";

// Almacenamiento en memoria (en producción, usar base de datos)
let remitosStorage: Remito[] = [];

/**
 * GET /api/remitos
 * Obtiene la lista de remitos
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      remitos: remitosStorage,
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

/**
 * POST /api/remitos
 * Genera un nuevo remito en AFIP
 */
export async function POST(request: NextRequest) {
  try {
    const remito: Remito = await request.json();

    // Validar datos básicos
    if (!remito.cuitEmisor || !remito.cuitReceptor) {
      return NextResponse.json(
        {
          success: false,
          errores: ["CUIT del emisor y receptor son requeridos"],
        },
        { status: 400 }
      );
    }

    // Generar remito en AFIP
    const resultado = await afipService.generarRemito(remito);

    if (resultado.success) {
      // Guardar en el almacenamiento
      const nuevoRemito: Remito = {
        ...remito,
        id: Date.now().toString(),
        cae: resultado.cae,
        vencimientoCae: resultado.vencimientoCae,
        numeroRemito: resultado.numeroRemito,
        estado: "approved",
        fechaCreacion: new Date().toISOString(),
      };

      remitosStorage.push(nuevoRemito);

      return NextResponse.json({
        success: true,
        cae: resultado.cae,
        vencimientoCae: resultado.vencimientoCae,
        numeroRemito: resultado.numeroRemito,
        observaciones: resultado.observaciones,
        remito: nuevoRemito,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          errores: resultado.errores,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error en POST /api/remitos:", error);
    return NextResponse.json(
      {
        success: false,
        errores: [error.message || "Error al procesar el remito"],
      },
      { status: 500 }
    );
  }
}

