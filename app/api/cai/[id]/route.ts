import { NextRequest, NextResponse } from "next/server";
import { caiStorageService } from "@/lib/cai/caiStorage";

/**
 * GET /api/cai/[id]
 * Obtiene un CAI específico.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cai = await caiStorageService.getById(id);

    if (!cai) {
      return NextResponse.json({ success: false, error: "CAI no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, cai });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener el CAI" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cai/[id]
 * Edita la fecha de vencimiento o cambia el estado (p. ej. "cancelado" para
 * dar de baja un CAI cargado por error).
 *
 * @body { fechaVencimiento?: string, estado?: "activo" | "cancelado" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const cambios: { fechaVencimiento?: string; estado?: "activo" | "cancelado" } = {};
    if (body.fechaVencimiento) cambios.fechaVencimiento = body.fechaVencimiento;
    if (body.estado) {
      if (body.estado !== "activo" && body.estado !== "cancelado") {
        return NextResponse.json(
          { success: false, error: 'estado debe ser "activo" o "cancelado"' },
          { status: 400 }
        );
      }
      cambios.estado = body.estado;
    }

    const cai = await caiStorageService.update(id, cambios);
    if (!cai) {
      return NextResponse.json({ success: false, error: "CAI no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, cai });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar el CAI" },
      { status: 500 }
    );
  }
}
