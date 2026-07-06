import { NextRequest, NextResponse } from "next/server";
import { caiStorageService } from "@/lib/cai/caiStorage";
import { calcularEstadoCai, calcularEstadoPunto } from "@/lib/cai/estado";

/**
 * GET /api/cai
 * Lista todos los CAI cargados, con el estado calculado (vigente/por vencer/
 * vencido/agotado/cancelado) para mostrar en el panel.
 */
export async function GET() {
  try {
    const cais = await caiStorageService.getAll();
    const ahora = new Date();

    const cont = cais.map((cai) => {
      const estadoCalculado = calcularEstadoCai(cai, ahora);
      const vencido = estadoCalculado === "vencido" || estadoCalculado === "cancelado";
      return {
        ...cai,
        estadoCalculado,
        puntos: cai.puntos.map((p) => ({
          ...p,
          estadoCalculado: calcularEstadoPunto(p, vencido),
        })),
      };
    });

    return NextResponse.json({ success: true, cais: cont });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener los CAI" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cai
 * Da de alta un nuevo CAI con uno o más puntos de venta.
 *
 * @body { cai, cuit, contribuyente?, fechaAutorizacion, fechaVencimiento, puntos: [{ puntoVenta, domicilio, tipoComprobante, numeroDesde, numeroHasta }] }
 */
export async function POST(request: NextRequest) {
  try {
    const input = await request.json();

    const errores = await caiStorageService.validar(input);
    if (errores.length > 0) {
      return NextResponse.json({ success: false, errores }, { status: 400 });
    }

    const cai = await caiStorageService.create(input);
    return NextResponse.json({ success: true, cai }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, errores: [error.message || "Error al crear el CAI"] },
      { status: 500 }
    );
  }
}
