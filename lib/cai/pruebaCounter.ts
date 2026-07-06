import connectDB from "@/lib/db/mongodb";
import ContadorPruebaModel from "@/lib/db/models/ContadorPrueba";

const CONTADOR_ID = "remito_prueba";

/** Placeholder inequívoco: nunca puede confundirse con un CAI real de AFIP. */
export const CAI_PLACEHOLDER_PRUEBA = "PRUEBA-NO-VALIDO";

/**
 * Devuelve el próximo número correlativo para un remito de PRUEBA. Totalmente
 * independiente del rango/numeración real de CAI — nunca lo descuenta ni lo
 * consulta.
 */
export async function obtenerProximoNumeroPrueba(): Promise<number> {
  await connectDB();

  const doc = await ContadorPruebaModel.findByIdAndUpdate(
    CONTADOR_ID,
    { $inc: { valor: 1 } },
    { upsert: true, new: true }
  );

  return doc.valor;
}
