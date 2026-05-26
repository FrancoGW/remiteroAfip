import { NextResponse } from "next/server";
import { afipService } from "@/lib/afip/afipService";
import { getServiceToken } from "@/lib/afip/wsaa";
import { getTiposCbte, getPuntosVenta } from "@/lib/afip/wsfev1";

/**
 * GET /api/afip/diagnostico
 * Consulta AFIP y devuelve los tipos de comprobante y puntos de venta
 * habilitados para este CUIT en el ambiente configurado (homo o prod).
 * Útil para detectar por qué falla un CbteTipo o PtoVta.
 */
export async function GET() {
  try {
    if (!afipService.hasCertificates()) {
      return NextResponse.json({
        error: "Sin certificados cargados. Configurá AFIP_CERT_PATH y AFIP_KEY_PATH.",
      }, { status: 400 });
    }

    const cuit = afipService.getCuit();
    const production = afipService.isProduction();

    // Accedemos a cert/key por medio del servicio (ya los tiene cargados)
    // Usamos el mismo método interno para obtener el token
    const cert = (afipService as any).cert as string;
    const key = (afipService as any).key as string;

    const token = await getServiceToken("wsfe", cert, key, production);

    const [tiposCbte, puntosVenta] = await Promise.all([
      getTiposCbte(cuit, token, production),
      getPuntosVenta(cuit, token, production),
    ]);

    return NextResponse.json({
      ambiente: production ? "PRODUCCIÓN" : "Homologación",
      cuit,
      tiposCbte,
      puntosVenta,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error consultando AFIP" },
      { status: 500 }
    );
  }
}
