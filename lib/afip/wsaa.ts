/**
 * WSAA - Web Service de Autenticación y Autorización de AFIP/ARCA
 *
 * Implementación directa sin intermediarios de pago.
 *
 * Flujo:
 *  1. Construir el XML LoginTicketRequest (TRA)
 *  2. Firmarlo como PKCS#7 / CMS con la clave privada y el certificado
 *  3. Enviarlo al WSAA via SOAP → recibir Token + Sign
 *  4. Cachear el ticket en disco y memoria durante su vigencia (hasta 12 horas)
 *     El caché en disco sobrevive reinicios del servidor, evitando el error
 *     "alreadyAuthenticated" cuando AFIP ya tiene un TA vigente.
 *
 * Documentación oficial:
 *  https://www.afip.gob.ar/ws/documentacion/wsaa.asp
 */

import * as forge from "node-forge";
import * as soap from "soap";
import fs from "fs";
import path from "path";

// ─── Endpoints ───────────────────────────────────────────────────────────────

const WSAA_WSDL_TESTING =
  "https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl";
const WSAA_WSDL_PROD = "https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TokenAuth {
  token: string;
  sign: string;
  expiration: Date;
}

// ─── Cache en memoria ─────────────────────────────────────────────────────────
// Clave: `${service}:${production ? "prod" : "homo"}`

const tokenCache = new Map<string, TokenAuth>();

// ─── Cache en disco (sobrevive reinicios del servidor) ────────────────────────

const TOKEN_CACHE_DIR = path.resolve(process.cwd(), "certs");
const TOKEN_CACHE_FILE = path.join(TOKEN_CACHE_DIR, ".token-cache.json");

function readDiskCache(): Record<string, { token: string; sign: string; expiration: string }> {
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      const raw = fs.readFileSync(TOKEN_CACHE_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch {
    // Si el archivo está corrupto lo ignoramos
  }
  return {};
}

function writeDiskCache(
  key: string,
  auth: TokenAuth
): void {
  try {
    const all = readDiskCache();
    all[key] = {
      token: auth.token,
      sign: auth.sign,
      expiration: auth.expiration.toISOString(),
    };
    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(all, null, 2), "utf8");
  } catch {
    // No bloquear si no se puede escribir
  }
}

function getFromDiskCache(key: string): TokenAuth | null {
  try {
    const all = readDiskCache();
    const entry = all[key];
    if (!entry) return null;
    const expiration = new Date(entry.expiration);
    if (expiration <= new Date(Date.now() + 5 * 60 * 1000)) return null;
    return { token: entry.token, sign: entry.sign, expiration };
  } catch {
    return null;
  }
}

// ─── Cliente SOAP (se reutiliza para evitar refetch del WSDL) ─────────────────

let soapClientTesting: soap.Client | null = null;
let soapClientProd: soap.Client | null = null;

async function getSoapClient(production: boolean): Promise<soap.Client> {
  if (production) {
    if (!soapClientProd) {
      soapClientProd = await soap.createClientAsync(WSAA_WSDL_PROD);
    }
    return soapClientProd;
  }
  if (!soapClientTesting) {
    soapClientTesting = await soap.createClientAsync(WSAA_WSDL_TESTING);
  }
  return soapClientTesting;
}

// ─── Construcción del TRA (Ticket de Requerimiento de Acceso) ─────────────────

function buildTRA(service: string): string {
  const now = new Date();

  // Generar tiempo de generación (5 minutos antes para tolerar desfase de reloj)
  const genTime = new Date(now.getTime() - 5 * 60 * 1000);
  // Expiración: 12 horas desde ahora (máximo permitido por AFIP)
  const expTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);

  const formatDate = (d: Date) =>
    d.toISOString().replace(/\.\d{3}Z$/, "-00:00");

  const uniqueId = Math.floor(now.getTime() / 1000);

  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${formatDate(genTime)}</generationTime>
    <expirationTime>${formatDate(expTime)}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`;
}

// ─── Firma PKCS#7 / CMS del TRA ──────────────────────────────────────────────

function signTRA(tra: string, certPem: string, privateKeyPem: string): string {
  const certificate = forge.pki.certificateFromPem(certPem);
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(tra, "utf8");
  p7.addCertificate(certificate);
  p7.addSigner({
    key: privateKey,
    certificate: certificate,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date().toISOString() },
    ],
  });

  p7.sign();

  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  return forge.util.encode64(der);
}

// ─── Parsing de la respuesta XML del WSAA ────────────────────────────────────

function parseLoginResponse(xml: string): {
  token: string;
  sign: string;
  expiration: Date;
} {
  const extract = (tag: string): string => {
    const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
    if (!match) throw new Error(`WSAA: no se encontró el tag <${tag}> en la respuesta`);
    return match[1].trim();
  };

  const token = extract("token");
  const sign = extract("sign");
  const expirationStr = extract("expirationTime");
  const expiration = new Date(expirationStr);

  return { token, sign, expiration };
}

// ─── Función principal exportada ──────────────────────────────────────────────

/**
 * Obtiene (o reutiliza desde cache) el Token + Sign de AFIP para un servicio dado.
 *
 * @param service   Identificador del WS de negocio (ej: "wsfe")
 * @param certPem   Certificado digital en formato PEM
 * @param keyPem    Clave privada en formato PEM
 * @param production true = producción, false = homologación (testing)
 */
export async function getServiceToken(
  service: string,
  certPem: string,
  keyPem: string,
  production: boolean
): Promise<TokenAuth> {
  const cacheKey = `${service}:${production ? "prod" : "homo"}`;

  // 1. Cache en memoria
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiration > new Date(Date.now() + 5 * 60 * 1000)) {
    return cached;
  }

  // 2. Cache en disco (sobrevive reinicios — evita "alreadyAuthenticated")
  const diskCached = getFromDiskCache(cacheKey);
  if (diskCached) {
    tokenCache.set(cacheKey, diskCached);
    console.log(`🔑 Token WSAA recuperado de caché en disco (expira: ${diskCached.expiration.toISOString()})`);
    return diskCached;
  }

  // 3. Pedir token nuevo a AFIP
  const tra = buildTRA(service);
  const cmsSigned = signTRA(tra, certPem, keyPem);

  const client = await getSoapClient(production);

  let result: any;
  try {
    [result] = await client.loginCmsAsync({ in0: cmsSigned });
  } catch (soapErr: any) {
    const msg: string = soapErr?.message || soapErr?.toString() || "";
    // Si AFIP dice que ya hay un TA válido pero no lo tenemos cacheado,
    // no podemos recuperarlo — informamos con instrucciones claras.
    if (msg.includes("alreadyAuthenticated")) {
      throw new Error(
        "WSAA: AFIP indica que ya existe un Token activo para este certificado, " +
        "pero el servidor no lo tiene en caché. " +
        "Esperá a que expire (~12 hs desde la última autenticación exitosa) o reiniciá el token " +
        "revocando y re-autorizando el certificado en WSASS."
      );
    }
    throw soapErr;
  }

  if (!result || !result.loginCmsReturn) {
    throw new Error("WSAA: respuesta vacía o inválida");
  }

  const auth = parseLoginResponse(result.loginCmsReturn);

  // Guardar en memoria y en disco
  tokenCache.set(cacheKey, auth);
  writeDiskCache(cacheKey, auth);
  console.log(`🔑 Token WSAA obtenido y cacheado (expira: ${auth.expiration.toISOString()})`);

  return auth;
}
