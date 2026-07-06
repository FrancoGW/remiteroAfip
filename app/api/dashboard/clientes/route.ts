import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import RemitoModel from "@/lib/db/models/Remito";

/**
 * GET /api/dashboard/clientes?dias=30&limite=10
 * Ranking de clientes (nombreReceptor) por cantidad de remitos, separando
 * reales de los marcados esPrueba.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const dias = parseInt(request.nextUrl.searchParams.get("dias") || "30", 10);
    const limite = parseInt(request.nextUrl.searchParams.get("limite") || "10", 10);
    const desde = new Date();
    desde.setDate(desde.getDate() - (dias - 1));
    desde.setHours(0, 0, 0, 0);

    const agregados = await RemitoModel.aggregate([
      { $match: { createdAt: { $gte: desde } } },
      {
        $group: {
          _id: {
            cliente: "$nombreReceptor",
            esPrueba: { $ifNull: ["$esPrueba", false] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const porCliente = new Map<string, { cliente: string; real: number; prueba: number }>();
    for (const item of agregados) {
      const nombre = item._id.cliente || "Sin nombre";
      if (!porCliente.has(nombre)) {
        porCliente.set(nombre, { cliente: nombre, real: 0, prueba: 0 });
      }
      const entry = porCliente.get(nombre)!;
      if (item._id.esPrueba) entry.prueba += item.count;
      else entry.real += item.count;
    }

    const clientes = Array.from(porCliente.values())
      .sort((a, b) => b.real + b.prueba - (a.real + a.prueba))
      .slice(0, limite);

    return NextResponse.json({ success: true, clientes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener el ranking de clientes" },
      { status: 500 }
    );
  }
}
