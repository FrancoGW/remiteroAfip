import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import RemitoModel from "@/lib/db/models/Remito";

/**
 * GET /api/dashboard/series?dias=30
 * Serie diaria de remitos creados, separando reales de los marcados
 * esPrueba (el frontend decide si sumarlos o no según el toggle "incluir
 * pruebas", sin necesidad de volver a pedir datos).
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const dias = parseInt(request.nextUrl.searchParams.get("dias") || "30", 10);
    const desde = new Date();
    desde.setDate(desde.getDate() - (dias - 1));
    desde.setHours(0, 0, 0, 0);

    const agregados = await RemitoModel.aggregate([
      { $match: { createdAt: { $gte: desde } } },
      {
        $group: {
          _id: {
            fecha: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            esPrueba: { $ifNull: ["$esPrueba", false] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Completar todos los días del rango (incluso sin remitos) para un gráfico continuo.
    const porFecha = new Map<string, { fecha: string; real: number; prueba: number }>();
    for (let i = 0; i < dias; i++) {
      const d = new Date(desde);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      porFecha.set(key, { fecha: key, real: 0, prueba: 0 });
    }

    for (const item of agregados) {
      const entry = porFecha.get(item._id.fecha);
      if (!entry) continue;
      if (item._id.esPrueba) entry.prueba += item.count;
      else entry.real += item.count;
    }

    const serie = Array.from(porFecha.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));

    return NextResponse.json({ success: true, serie });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener la serie del dashboard" },
      { status: 500 }
    );
  }
}
