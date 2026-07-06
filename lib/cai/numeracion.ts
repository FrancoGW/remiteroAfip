import connectDB from "@/lib/db/mongodb";
import CaiAutorizacionModel from "@/lib/db/models/CaiAutorizacion";
import { CBTE_TIPO_REMITO_R } from "@/lib/types/cai";

export interface NumeroRemitoAsignado {
  numero: number;
  cai: string;
  vencimientoCai: Date;
}

/**
 * Asigna el próximo número disponible para un punto de venta dentro de los
 * CAI vigentes, e incrementa el contador de forma atómica (findOneAndUpdate).
 *
 * Nota de concurrencia: la condición `puntos.proximoNumero <= numeroHasta` se
 * incluye tanto en el filtro principal como en el arrayFilter, usando el
 * numeroHasta (inmutable) capturado en la lectura previa. Esto evita el uso
 * de $expr comparando campos hermanos dentro de $elemMatch/arrayFilters (no
 * soportado de forma confiable) y, como el filtro se re-evalúa contra el
 * estado ACTUAL del documento en el momento del update atómico (no contra el
 * valor leído), es seguro ante carreras: si dos requests concurrentes intentan
 * tomar el mismo número, sólo uno logra incrementar; el otro no encuentra
 * coincidencia (findOneAndUpdate devuelve null) y pasa al siguiente candidato.
 */
export async function obtenerProximoNumeroRemito(
  puntoVenta: number,
  tipoComprobante: number = CBTE_TIPO_REMITO_R
): Promise<NumeroRemitoAsignado> {
  await connectDB();
  const ahora = new Date();

  const candidatos = await CaiAutorizacionModel.find({
    estado: "activo",
    fechaVencimiento: { $gte: ahora },
    puntos: { $elemMatch: { puntoVenta, tipoComprobante } },
  })
    .sort({ fechaAutorizacion: 1 })
    .lean();

  for (const candidato of candidatos) {
    const punto = candidato.puntos.find(
      (p: any) => p.puntoVenta === puntoVenta && p.tipoComprobante === tipoComprobante
    );
    if (!punto || punto.proximoNumero > punto.numeroHasta) continue;

    const numeroHasta = punto.numeroHasta;

    const resultado = await CaiAutorizacionModel.findOneAndUpdate(
      {
        _id: candidato._id,
        estado: "activo",
        fechaVencimiento: { $gte: ahora },
        puntos: {
          $elemMatch: { puntoVenta, tipoComprobante, proximoNumero: { $lte: numeroHasta } },
        },
      },
      { $inc: { "puntos.$[p].proximoNumero": 1 } },
      {
        arrayFilters: [
          { "p.puntoVenta": puntoVenta, "p.tipoComprobante": tipoComprobante, "p.proximoNumero": { $lte: numeroHasta } },
        ],
        returnDocument: "after",
      }
    ).lean();

    if (!resultado) continue; // otro proceso agotó el rango justo antes; probar el siguiente candidato

    const puntoActualizado = (resultado as any).puntos.find(
      (p: any) => p.puntoVenta === puntoVenta && p.tipoComprobante === tipoComprobante
    );

    return {
      numero: puntoActualizado.proximoNumero - 1,
      cai: (resultado as any).cai,
      vencimientoCai: (resultado as any).fechaVencimiento,
    };
  }

  throw new Error(
    `No hay CAI vigente con numeración disponible para el punto de venta ${puntoVenta}. Cargar un nuevo CAI en el panel.`
  );
}
