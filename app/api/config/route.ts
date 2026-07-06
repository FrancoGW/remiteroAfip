import { NextRequest, NextResponse } from "next/server";
import {
  getWhatsappTestNumber,
  setWhatsappTestNumber,
  getEstadoIntegraciones,
} from "@/lib/config/appConfig";
import { isProductionEnv } from "@/lib/config/env";

/**
 * GET /api/config
 * Config no sensible para el panel: si estamos en producción (para gatear el
 * botón de prueba de WhatsApp), el número de WhatsApp de pruebas, y el
 * estado (configurado/no) de WhatsApp/email/Vercel Blob.
 */
export async function GET() {
  try {
    const [whatsappTestNumber, integraciones] = await Promise.all([
      getWhatsappTestNumber(),
      Promise.resolve(getEstadoIntegraciones()),
    ]);

    return NextResponse.json({
      success: true,
      isProduction: isProductionEnv(),
      whatsappTestNumber,
      integraciones,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener la configuración" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/config
 * Actualiza el número de WhatsApp de pruebas.
 * @body { whatsappTestNumber: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.whatsappTestNumber || typeof body.whatsappTestNumber !== "string") {
      return NextResponse.json(
        { success: false, error: "whatsappTestNumber es requerido" },
        { status: 400 }
      );
    }

    const whatsappTestNumber = await setWhatsappTestNumber(body.whatsappTestNumber);

    return NextResponse.json({ success: true, whatsappTestNumber });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar la configuración" },
      { status: 500 }
    );
  }
}
