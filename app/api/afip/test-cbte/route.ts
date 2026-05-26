import { NextResponse } from "next/server";
import { afipService } from "@/lib/afip/afipService";
import { getServiceToken } from "@/lib/afip/wsaa";
import { getLastVoucher, requestCAE } from "@/lib/afip/wsfev1";

/**
 * GET /api/afip/test-cbte
 * Emite un comprobante de PRUEBA con CbteTipo 1 (Factura A) en homologación
 * para verificar que el flujo WSFEv1 completo funciona de punta a punta.
 * NO usar en producción.
 */
export async function GET() {
  if (afipService.isProduction()) {
    return NextResponse.json(
      { error: "Este endpoint solo funciona en homologación (AFIP_PRODUCTION=false)" },
      { status: 400 }
    );
  }

  if (!afipService.hasCertificates()) {
    return NextResponse.json(
      { error: "Sin certificados. Configurá AFIP_CERT_PATH y AFIP_KEY_PATH." },
      { status: 400 }
    );
  }

  try {
    const cuit = afipService.getCuit();
    const puntoVenta = parseInt(process.env.AFIP_PUNTO_VENTA || "10", 10);
    const cert = (afipService as any).cert as string;
    const key = (afipService as any).key as string;
    const production = false;

    const CBTE_TIPO_FACTURA_A = 1;

    // 1. Obtener token
    const token = await getServiceToken("wsfe", cert, key, production);

    // 2. Último número autorizado para CbteTipo 1
    const lastNumber = await getLastVoucher(
      cuit,
      puntoVenta,
      CBTE_TIPO_FACTURA_A,
      token,
      production
    );
    const nextNumber = lastNumber + 1;

    // 3. Solicitar CAE con datos mínimos válidos para Factura A
    const hoy = new Date();
    const cbteFch = parseInt(
      `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}${String(hoy.getDate()).padStart(2, "0")}`,
      10
    );

    // Llamada directa a SOAP para ver la respuesta cruda y parsearla correctamente
    const { default: soap } = await import("soap");
    const WSDL = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL";
    const client = await soap.createClientAsync(WSDL);

    const params = {
      Auth: { Token: token.token, Sign: token.sign, Cuit: cuit },
      FeCAEReq: {
        FeCabReq: {
          CantReg: 1,
          PtoVta: puntoVenta,
          CbteTipo: CBTE_TIPO_FACTURA_A,
        },
        FeDetReq: {
          FECAEDetRequest: {
            Concepto: 1,
            DocTipo: 80,
            DocNro: 20000000001, // CUIT de prueba homologación
            CbteDesde: nextNumber,
            CbteHasta: nextNumber,
            CbteFch: cbteFch,
            ImpTotal: 121,
            ImpTotConc: 0,
            ImpNeto: 100,
            ImpOpEx: 0,
            ImpIVA: 21,
            ImpTrib: 0,
            MonId: "PES",
            MonCotiz: 1,
            CondicionIVAReceptorId: 1,
            Iva: {
              AlicIva: {
                Id: 5, // 21%
                BaseImp: 100,
                Importe: 21,
              },
            },
          },
        },
      },
    };

    const [result] = await client.FECAESolicitarAsync(params);

    // Log completo para diagnóstico
    console.log("📦 Respuesta raw AFIP:", JSON.stringify(result, null, 2));

    const res = result?.FECAESolicitarResult;
    const det = res?.FeDetResp?.FECAEDetResponse;

    if (!det) {
      return NextResponse.json({
        success: false,
        error: "Respuesta de detalle vacía",
        raw: res,
      }, { status: 500 });
    }

    // AFIP puede devolver array o objeto según la cantidad de items
    const detObj = Array.isArray(det) ? det[0] : det;

    if (detObj?.Resultado !== "A") {
      const obs = detObj?.Observaciones?.Obs;
      const obsMsg = obs
        ? (Array.isArray(obs) ? obs.map((o: any) => `[${o.Code}] ${o.Msg}`).join(", ") : `[${obs.Code}] ${obs.Msg}`)
        : "sin observaciones";
      return NextResponse.json({
        success: false,
        error: `Comprobante rechazado (${detObj?.Resultado}): ${obsMsg}`,
        raw: detObj,
      }, { status: 500 });
    }

    const rawDate = String(detObj.CAEFchVto);
    const vencimientoCae = rawDate.length === 8
      ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      : rawDate;

    return NextResponse.json({
      success: true,
      mensaje: "✅ Flujo WSFEv1 completo funcionando en homologación",
      detalle: {
        ambiente: "Homologación",
        cuit,
        puntoVenta,
        cbteTipo: CBTE_TIPO_FACTURA_A,
        cbteDesc: "Factura A (prueba — no tiene validez fiscal)",
        numeroComprobante: detObj.CbteDesde,
        cae: detObj.CAE,
        vencimientoCae,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error en prueba WSFEv1" },
      { status: 500 }
    );
  }
}
