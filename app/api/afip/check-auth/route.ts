import { NextResponse } from "next/server";
import * as forge from "node-forge";
import * as soap from "soap";
import fs from "fs";
import path from "path";

/**
 * GET /api/afip/check-auth
 * Prueba la autenticación WSAA con distintos nombres de servicio
 * para determinar cuál está autorizado en ARCA para este certificado.
 */

function loadCertKey() {
  const certPem = process.env.AFIP_CERT_PEM?.replace(/\\n/g, "\n").trim() || "";
  const keyPem  = process.env.AFIP_KEY_PEM?.replace(/\\n/g, "\n").trim()  || "";
  if (certPem && keyPem) return { certPem, keyPem };

  const certPath = path.resolve(process.env.AFIP_CERT_PATH || "./certs/cert.crt");
  const keyPath  = path.resolve(process.env.AFIP_KEY_PATH  || "./certs/private.key");
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return {
      certPem: fs.readFileSync(certPath, "utf8"),
      keyPem:  fs.readFileSync(keyPath,  "utf8"),
    };
  }
  return null;
}

function buildTRA(service: string): string {
  const now     = new Date();
  const genTime = new Date(now.getTime() - 5 * 60 * 1000);
  const expTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "-00:00");
  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(now.getTime() / 1000)}</uniqueId>
    <generationTime>${fmt(genTime)}</generationTime>
    <expirationTime>${fmt(expTime)}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`;
}

function signTRA(tra: string, certPem: string, keyPem: string): string {
  const certificate = forge.pki.certificateFromPem(certPem);
  const privateKey  = forge.pki.privateKeyFromPem(keyPem);
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(tra, "utf8");
  p7.addCertificate(certificate);
  p7.addSigner({
    key: privateKey,
    certificate,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date().toISOString() },
    ],
  });
  p7.sign();
  return forge.util.encode64(forge.asn1.toDer(p7.toAsn1()).getBytes());
}

async function probarServicio(
  service: string,
  certPem: string,
  keyPem: string,
  production: boolean
): Promise<{ service: string; ok: boolean; error?: string }> {
  const wsdl = production
    ? "https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl"
    : "https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl";
  try {
    const tra    = buildTRA(service);
    const signed = signTRA(tra, certPem, keyPem);
    const client = await soap.createClientAsync(wsdl);
    const [result] = await client.loginCmsAsync({ in0: signed });
    if (result?.loginCmsReturn) return { service, ok: true };
    return { service, ok: false, error: "Respuesta vacía" };
  } catch (e: any) {
    return { service, ok: false, error: e.message };
  }
}

export async function GET() {
  const creds = loadCertKey();
  if (!creds) {
    return NextResponse.json({ error: "Certificados no encontrados" }, { status: 400 });
  }

  const production = process.env.AFIP_PRODUCTION === "true";

  // Leer info del certificado
  const cert = forge.pki.certificateFromPem(creds.certPem);
  const certInfo = {
    cn:     cert.subject.getField("CN")?.value,
    serial: cert.serialNumber,
    issuer: cert.issuer.getField("CN")?.value,
    validFrom: cert.validity.notBefore.toISOString(),
    validTo:   cert.validity.notAfter.toISOString(),
  };

  // Probar los nombres de servicio más comunes
  const servicios = ["wsfe", "wsfev1", "wsfev2", "wsremcarne", "wsremarba"];
  const resultados = await Promise.all(
    servicios.map((s) => probarServicio(s, creds.certPem, creds.keyPem, production))
  );

  const autorizados = resultados.filter((r) => r.ok).map((r) => r.service);
  const errores     = resultados.filter((r) => !r.ok);

  return NextResponse.json({
    ambiente: production ? "PRODUCCIÓN" : "Homologación",
    cuit: process.env.AFIP_CUIT,
    certificado: certInfo,
    servicios_autorizados: autorizados,
    servicios_no_autorizados: errores,
  });
}
