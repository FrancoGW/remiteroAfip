import { NextRequest, NextResponse } from "next/server";
import {
  getWhatsappTestNumber,
  setWhatsappTestNumber,
  getEmailTestAddress,
  setEmailTestAddress,
  getEstadoIntegraciones,
} from "@/lib/config/appConfig";
import { isProductionEnv } from "@/lib/config/env";

/**
 * GET /api/config
 * Config no sensible para el panel: si estamos en producción (para gatear el
 * botón de prueba de WhatsApp), el número de WhatsApp/email de pruebas, y el
 * estado (configurado/no) de WhatsApp/email/Vercel Blob.
 */
export async function GET() {
  try {
    const [whatsappTestNumber, emailTestAddress, integraciones] = await Promise.all([
      getWhatsappTestNumber(),
      getEmailTestAddress(),
      Promise.resolve(getEstadoIntegraciones()),
    ]);

    return NextResponse.json({
      success: true,
      isProduction: isProductionEnv(),
      whatsappTestNumber,
      emailTestAddress,
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
 * Actualiza el número de WhatsApp y/o la dirección de email de pruebas.
 * @body { whatsappTestNumber?: string, emailTestAddress?: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.whatsappTestNumber && !body.emailTestAddress) {
      return NextResponse.json(
        { success: false, error: "Indique whatsappTestNumber y/o emailTestAddress" },
        { status: 400 }
      );
    }

    const resultado: { whatsappTestNumber?: string; emailTestAddress?: string } = {};

    if (body.whatsappTestNumber && typeof body.whatsappTestNumber === "string") {
      resultado.whatsappTestNumber = await setWhatsappTestNumber(body.whatsappTestNumber);
    }
    if (body.emailTestAddress && typeof body.emailTestAddress === "string") {
      resultado.emailTestAddress = await setEmailTestAddress(body.emailTestAddress);
    }

    return NextResponse.json({ success: true, ...resultado });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar la configuración" },
      { status: 500 }
    );
  }
}
