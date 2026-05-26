import { NextResponse } from "next/server";
import { getServiceToken } from "@/lib/afip/wsaa";
import { getLastVoucher, requestCAE, CBTE_TIPO_REMITO_R, COND_IVA } from "@/lib/afip/wsfev1";
import { afipService } from "@/lib/afip/afipService";
import fs from "fs";
import path from "path";

/**
 * POST /api/afip/test-produccion
 *
 * Emite un Remito R real en AFIP PRODUCCIÓN usando el Punto de Venta 17.
 * Requiere AFIP_PRODUCTION=true en .env.local (o Vercel env).
 *
 * Body (todos opcionales — tiene defaults de prueba):
 * {
 *   "cuitReceptor": "30567890123",
 *   "puntoVenta": 17,
 *   "condicionIva": "RESPONSABLE INSCRIPTO"
 * }
 */
export async function POST(request: Request) {
  // Seguridad: solo en producción
  if (process.env.AFIP_PRODUCTION !== "true") {
    return NextResponse.json(
      {
        error:
          "Este endpoint requiere AFIP_PRODUCTION=true. " +
          "Cambiá la variable de entorno y reiniciá el servidor.",
      },
      { status: 400 }
    );
  }

  // Leer certificados: primero desde env vars (Vercel), luego desde archivos (local)
  let certPem = process.env.AFIP_CERT_PEM?.replace(/\\n/g, "\n").trim() || "";
  let keyPem  = process.env.AFIP_KEY_PEM?.replace(/\\n/g, "\n").trim()  || "";

  if (!certPem || !keyPem) {
    const certPath = path.resolve(process.env.AFIP_CERT_PATH || "./certs/cert.crt");
    const keyPath  = path.resolve(process.env.AFIP_KEY_PATH  || "./certs/private.key");

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      return NextResponse.json(
        {
          error:
            "No se encontraron los certificados. " +
            "En Vercel configurá AFIP_CERT_PEM y AFIP_KEY_PEM con el contenido PEM completo.",
        },
        { status: 400 }
      );
    }

    certPem = fs.readFileSync(certPath, "utf8");
    keyPem  = fs.readFileSync(keyPath,  "utf8");
  }
  const cuit    = parseInt((process.env.AFIP_CUIT || "30693787285").replace(/\D/g, ""), 10);

  let body: any = {};
  try { body = await request.json(); } catch { /* body vacío */ }

  const puntoVenta   = parseInt(body.puntoVenta ?? "17", 10);
  const cuitReceptor = parseInt(
    String(body.cuitReceptor ?? "30567890123").replace(/\D/g, ""),
    10
  );
  const condIva = body.condicionIva?.toUpperCase?.().includes("MONO")
    ? COND_IVA.MONOTRIBUTISTA
    : body.condicionIva?.toUpperCase?.().includes("EXENTO")
    ? COND_IVA.EXENTO
    : COND_IVA.RESPONSABLE_INSCRIPTO;

  const hoy = new Date();
  const cbteFch = parseInt(
    `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}${String(hoy.getDate()).padStart(2, "0")}`,
    10
  );

  try {
    // 1. Token WSAA producción
    const token = await getServiceToken("wsfe", certPem, keyPem, true);

    // 2. Último número autorizado para Remito R (CbteTipo 91) en PV 17
    const lastNumber = await getLastVoucher(cuit, puntoVenta, CBTE_TIPO_REMITO_R, token, true);
    const nextNumber = lastNumber + 1;

    // 3. Solicitar CAE — Remito R (sin importe)
    const cae = await requestCAE(
      {
        cuitEmisor: cuit,
        puntoVenta,
        cbteTipo: CBTE_TIPO_REMITO_R,
        cbteFch,
        docTipo: 80,
        docNro: cuitReceptor,
        condicionIvaReceptorId: condIva,
      },
      nextNumber,
      token,
      true
    );

    return NextResponse.json({
      success: true,
      mensaje: "✅ Remito R autorizado en AFIP PRODUCCIÓN",
      detalle: {
        ambiente: "PRODUCCIÓN",
        cuit,
        puntoVenta,
        cbteTipo: CBTE_TIPO_REMITO_R,
        cbteDesc: "Remito R (CbteTipo 91)",
        numeroRemito: cae.cbteDesde,
        cae: cae.cae,
        vencimientoCae: cae.caeFchVto,
        fecha: hoy.toISOString().split("T")[0],
        cuitReceptor,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al conectar con AFIP",
      },
      { status: 500 }
    );
  }
}
