/**
 * WSFEv1 - Web Service de Facturación Electrónica v1 de AFIP/ARCA
 *
 * Implementación directa, sin intermediarios de pago.
 *
 * Para el sector forestal (sin WS específico de remitos),
 * se usa WSFEv1 con CbteTipo 91 = Remito R (Responsable Inscripto).
 *
 * Documentación oficial:
 *  https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp
 */

import * as soap from "soap";
import * as https from "https";
import axios from "axios";
import { TokenAuth } from "./wsaa";

// Servidores legados de AFIP negocian DH con claves débiles que OpenSSL 3.x
// rechaza en su nivel de seguridad por defecto (SECLEVEL=2).
const afipHttpsAgent = new https.Agent({ ciphers: "DEFAULT@SECLEVEL=1" });
const afipAxios = axios.create({ httpsAgent: afipHttpsAgent });

// ─── Endpoints ───────────────────────────────────────────────────────────────

const WSFEV1_WSDL_TESTING =
  "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL";
const WSFEV1_WSDL_PROD =
  "https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL";

// ─── Tipos de comprobante AFIP (CbteTipo) ─────────────────────────────────────
// 91 = Remito R  (Responsable Inscripto)

export const CBTE_TIPO_REMITO_R = 91;

// ─── Condición IVA receptor ──────────────────────────────────────────────────
export const COND_IVA = {
  RESPONSABLE_INSCRIPTO: 1,
  EXENTO: 4,
  CONSUMIDOR_FINAL: 5,
  MONOTRIBUTISTA: 6,
} as const;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface VoucherData {
  cuitEmisor: number;
  puntoVenta: number;
  cbteTipo: number;
  cbteFch: number; // YYYYMMDD como entero
  docTipo: number; // 80 = CUIT
  docNro: number;  // CUIT del receptor sin guiones
  condicionIvaReceptorId: number;
  /** Descripción de los ítems (para observaciones, no va al WS) */
  descripcion?: string;
}

export interface CAEResponse {
  cae: string;
  caeFchVto: string; // YYYY-MM-DD
  cbteDesde: number;
}

// ─── Cliente SOAP cacheado ────────────────────────────────────────────────────

let clientTesting: soap.Client | null = null;
let clientProd: soap.Client | null = null;

async function getClient(production: boolean): Promise<soap.Client> {
  if (production) {
    if (!clientProd) {
      clientProd = await soap.createClientAsync(WSFEV1_WSDL_PROD, {
        request: afipAxios,
      } as soap.IOptions);
    }
    return clientProd;
  }
  if (!clientTesting) {
    clientTesting = await soap.createClientAsync(WSFEV1_WSDL_TESTING);
  }
  return clientTesting;
}

// ─── Objeto Auth para cada llamada ────────────────────────────────────────────

function buildAuth(cuit: number, token: TokenAuth) {
  return {
    Token: token.token,
    Sign: token.sign,
    Cuit: cuit,
  };
}

// ─── Obtener último número de comprobante autorizado ─────────────────────────

/**
 * Consulta el último número de comprobante autorizado en un punto de venta.
 * Retorna 0 si nunca se emitió uno.
 */
export async function getLastVoucher(
  cuitEmisor: number,
  puntoVenta: number,
  cbteTipo: number,
  token: TokenAuth,
  production: boolean
): Promise<number> {
  const client = await getClient(production);

  const params = {
    Auth: buildAuth(cuitEmisor, token),
    PtoVta: puntoVenta,
    CbteTipo: cbteTipo,
  };

  const [result] = await client.FECompUltimoAutorizadoAsync(params);

  if (result?.FECompUltimoAutorizadoResult?.Errors) {
    const err = result.FECompUltimoAutorizadoResult.Errors.Err;
    const msg = Array.isArray(err) ? err[0].Msg : err?.Msg;
    throw new Error(`WSFEv1 FECompUltimoAutorizado: ${msg}`);
  }

  return result?.FECompUltimoAutorizadoResult?.CbteNro ?? 0;
}

// ─── Solicitar CAE ────────────────────────────────────────────────────────────

/**
 * Solicita a AFIP la autorización (CAE) de un comprobante.
 * Para Remito R el importe es 0 y no se aplica IVA.
 */
export async function requestCAE(
  voucher: VoucherData,
  nextNumber: number,
  token: TokenAuth,
  production: boolean
): Promise<CAEResponse> {
  const client = await getClient(production);

  const params = {
    Auth: buildAuth(voucher.cuitEmisor, token),
    FeCAEReq: {
      FeCabReq: {
        CantReg: 1,
        PtoVta: voucher.puntoVenta,
        CbteTipo: voucher.cbteTipo,
      },
      FeDetReq: {
        FECAEDetRequest: {
          Concepto: 1,               // 1 = Productos
          DocTipo: voucher.docTipo,  // 80 = CUIT
          DocNro: voucher.docNro,
          CbteDesde: nextNumber,
          CbteHasta: nextNumber,
          CbteFch: voucher.cbteFch,
          ImpTotal: 0,
          ImpTotConc: 0,
          ImpNeto: 0,
          ImpOpEx: 0,
          ImpIVA: 0,
          ImpTrib: 0,
          MonId: "PES",
          MonCotiz: 1,
          CondicionIVAReceptorId: voucher.condicionIvaReceptorId,
        },
      },
    },
  };

  const [result] = await client.FECAESolicitarAsync(params);
  const res = result?.FECAESolicitarResult;

  // Verificar errores a nivel cabecera
  if (res?.Errors) {
    const err = res.Errors.Err;
    const msgs = Array.isArray(err)
      ? err.map((e: any) => `[${e.ErrCode}] ${e.Msg}`).join(" | ")
      : `[${err?.ErrCode}] ${err?.Msg}`;
    throw new Error(`WSFEv1 FECAESolicitar error: ${msgs}`);
  }

  const detRaw = res?.FeDetResp?.FECAEDetResponse;
  if (!detRaw) {
    throw new Error("WSFEv1: respuesta de detalle vacía");
  }

  // AFIP puede devolver objeto o array según la cantidad de registros
  const det = Array.isArray(detRaw) ? detRaw[0] : detRaw;

  // Verificar resultado del ítem
  if (det?.Resultado !== "A") {
    const obs = det?.Observaciones?.Obs;
    const obsMsg = obs
      ? (Array.isArray(obs)
          ? obs.map((o: any) => `[${o.Code ?? o.ErrCode}] ${o.Msg}`).join(", ")
          : `[${obs.Code ?? obs.ErrCode}] ${obs.Msg}`)
      : "sin observaciones";
    throw new Error(
      `WSFEv1: comprobante rechazado (${det?.Resultado}): ${obsMsg}`
    );
  }

  // Formatear fecha de vencimiento CAE: YYYYMMDD → YYYY-MM-DD
  const rawDate: string = String(det?.CAEFchVto);
  const caeFchVto = rawDate.length === 8
    ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
    : rawDate;

  return {
    cae: String(det?.CAE),
    caeFchVto,
    cbteDesde: det?.CbteDesde,
  };
}

// ─── Diagnóstico: tipos de comprobante habilitados ────────────────────────────

/**
 * Llama a FEParamGetTiposCbte para ver qué CbteTipos están disponibles
 * en el ambiente. Útil para diagnosticar errores de "CbteTipo no válido".
 */
export async function getTiposCbte(
  cuitEmisor: number,
  token: TokenAuth,
  production: boolean
): Promise<{ id: number; desc: string }[]> {
  const client = await getClient(production);
  const [result] = await client.FEParamGetTiposCbteAsync({
    Auth: buildAuth(cuitEmisor, token),
  });
  const items =
    result?.FEParamGetTiposCbteResult?.ResultGet?.CbteTipo ?? [];
  const arr = Array.isArray(items) ? items : [items];
  return arr.map((t: any) => ({ id: Number(t.Id), desc: String(t.Desc) }));
}

/**
 * Llama a FEParamGetPtosVenta para ver qué puntos de venta tiene habilitados
 * el CUIT en este ambiente.
 */
export async function getPuntosVenta(
  cuitEmisor: number,
  token: TokenAuth,
  production: boolean
): Promise<{ nro: number; tipo: string; bloqueado: string }[]> {
  const client = await getClient(production);
  const [result] = await client.FEParamGetPtosVentaAsync({
    Auth: buildAuth(cuitEmisor, token),
  });
  const items =
    result?.FEParamGetPtosVentaResult?.ResultGet?.PtoVenta ?? [];
  const arr = Array.isArray(items) ? items : [items];
  return arr.map((p: any) => ({
    nro: Number(p.Nro),
    tipo: String(p.EmisionTipo),
    bloqueado: String(p.Bloqueado),
  }));
}
