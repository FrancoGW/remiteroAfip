/**
 * AfipService - Servicio principal de integración con AFIP/ARCA
 *
 * Implementación propia directa (sin SDK de terceros de pago).
 * Usa WSAA para autenticación y WSFEv1 para remitos electrónicos.
 *
 * Tipo de comprobante: 91 (Remito R - Responsable Inscripto)
 * Normativa aplicable: RG 5678/2025
 */

import fs from "fs";
import path from "path";
import { Remito, AfipResponse } from "../types/remito";
import { getServiceToken } from "./wsaa";
import {
  CBTE_TIPO_REMITO_R,
  COND_IVA,
  getLastVoucher,
  requestCAE,
  VoucherData,
} from "./wsfev1";

// ─── Servicio de AFIP para facturación electrónica ───────────────────────────
const AFIP_SERVICE = "wsfe";

// ─── Mapeo condición IVA texto → id AFIP ─────────────────────────────────────

function condicionIvaId(condicion?: string): number {
  if (!condicion) return COND_IVA.RESPONSABLE_INSCRIPTO;
  const c = condicion.toUpperCase();
  if (c.includes("MONOTRIB")) return COND_IVA.MONOTRIBUTISTA;
  if (c.includes("EXENTO")) return COND_IVA.EXENTO;
  if (c.includes("CONSUMIDOR")) return COND_IVA.CONSUMIDOR_FINAL;
  return COND_IVA.RESPONSABLE_INSCRIPTO;
}

// ─── Clase principal ──────────────────────────────────────────────────────────

export class AfipService {
  private cuit: number;
  private production: boolean;
  private cert: string | null = null;
  private key: string | null = null;
  private puntoVenta: number;

  constructor() {
    const cuitStr = process.env.AFIP_CUIT || "20409378472";
    this.cuit = parseInt(cuitStr.replace(/-/g, ""), 10);
    this.production = process.env.AFIP_PRODUCTION === "true";
    this.puntoVenta = parseInt(process.env.AFIP_PUNTO_VENTA || "1", 10);

    // Cargar certificados solo en producción o si están disponibles
    if (this.production) {
      this.loadCerts();
      if (!this.cert || !this.key) {
        console.warn(
          "⚠️  Certificados no encontrados. Activando modo simulación."
        );
        this.production = false;
      }
    } else {
      // Intentar cargar igualmente (puede estar configurado para homo)
      this.loadCerts();
      if (this.cert && this.key) {
        console.log(
          "🔐 Certificados cargados. Apuntando al ambiente de homologación AFIP."
        );
      } else {
        console.log(
          "🧪 Sin certificados. Usando modo simulación local (no conecta a AFIP)."
        );
      }
    }
  }

  private loadCerts(): void {
    try {
      const certPath = path.resolve(
        process.env.AFIP_CERT_PATH || "./certs/cert.crt"
      );
      const keyPath = path.resolve(
        process.env.AFIP_KEY_PATH || "./certs/private.key"
      );

      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        this.cert = fs.readFileSync(certPath, { encoding: "utf8" });
        this.key = fs.readFileSync(keyPath, { encoding: "utf8" });
      }
    } catch (err) {
      console.error("❌ Error cargando certificados:", err);
    }
  }

  private get hasCerts(): boolean {
    return !!(this.cert && this.key);
  }

  // ─── Validación de datos del remito ────────────────────────────────────────

  private validarRemito(remito: Remito): void {
    const cuitEmisor = remito.cuitEmisor.replace(/-/g, "");
    const cuitReceptor = remito.cuitReceptor.replace(/-/g, "");

    if (!cuitEmisor || cuitEmisor.length !== 11) {
      throw new Error("CUIT del emisor inválido (debe tener 11 dígitos)");
    }
    if (!cuitReceptor || cuitReceptor.length !== 11) {
      throw new Error("CUIT del receptor inválido (debe tener 11 dígitos)");
    }
    if (!remito.items || remito.items.length === 0) {
      throw new Error("El remito debe tener al menos un ítem");
    }
    if (remito.tipoTransporte === 2 && !remito.cuitTransportista) {
      throw new Error(
        "Se requiere CUIT del transportista para transporte de terceros"
      );
    }
    if (!remito.nombreReceptor?.trim()) {
      throw new Error("El nombre del receptor es obligatorio");
    }
    if (!remito.origenLocalidad || !remito.destinoLocalidad) {
      throw new Error(
        "Las localidades de origen y destino son obligatorias"
      );
    }
  }

  // ─── Modo simulación (sin certificados disponibles) ────────────────────────

  private simularRespuesta(remito: Remito): AfipResponse {
    const numeroRemito = Math.floor(Math.random() * 100000) + 1;
    const cae = String(
      Math.floor(Math.random() * 89999999999999) + 10000000000000
    );
    const vencimientoCae = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    return {
      success: true,
      cae,
      vencimientoCae,
      numeroRemito,
      observaciones: [
        "MODO SIMULACIÓN - Este CAE no es real",
        "Configure AFIP_CERT_PATH y AFIP_KEY_PATH para conectar con AFIP",
        `Punto de venta: ${remito.puntoVenta}`,
      ],
    };
  }

  // ─── Generar remito real en AFIP ───────────────────────────────────────────

  /**
   * Genera un remito electrónico en AFIP (CbteTipo 91 = Remito R).
   * En modo simulación (sin certs) devuelve una respuesta de prueba.
   */
  async generarRemito(remito: Remito): Promise<AfipResponse> {
    try {
      this.validarRemito(remito);

      // Sin certificados → simulación
      if (!this.hasCerts) {
        console.log("🧪 Generando remito en modo simulación (sin certs)");
        return this.simularRespuesta(remito);
      }

      console.log(
        `📡 Conectando a AFIP ${this.production ? "PRODUCCIÓN" : "homologación"}...`
      );

      // 1. Obtener token de autenticación (WSAA)
      const token = await getServiceToken(
        AFIP_SERVICE,
        this.cert!,
        this.key!,
        this.production
      );

      // 2. Obtener último número de comprobante autorizado
      const puntoVenta = remito.puntoVenta || this.puntoVenta;
      const lastNumber = await getLastVoucher(
        this.cuit,
        puntoVenta,
        CBTE_TIPO_REMITO_R,
        token,
        this.production
      );
      const nextNumber = lastNumber + 1;

      // 3. Preparar datos del comprobante
      const fechaStr = remito.fechaEmision.replace(/-/g, "");
      const cbteFch = parseInt(fechaStr, 10);

      const docNro = parseInt(
        remito.cuitReceptor.replace(/-/g, ""),
        10
      );

      const voucherData: VoucherData = {
        cuitEmisor: this.cuit,
        puntoVenta,
        cbteTipo: CBTE_TIPO_REMITO_R,
        cbteFch,
        docTipo: 80, // 80 = CUIT
        docNro,
        condicionIvaReceptorId: condicionIvaId(remito.condicionIva),
      };

      // 4. Solicitar CAE a AFIP
      const caeResponse = await requestCAE(
        voucherData,
        nextNumber,
        token,
        this.production
      );

      console.log(
        `✅ Remito ${nextNumber} autorizado por AFIP. CAE: ${caeResponse.cae}`
      );

      return {
        success: true,
        cae: caeResponse.cae,
        vencimientoCae: caeResponse.caeFchVto,
        numeroRemito: caeResponse.cbteDesde,
        observaciones: ["Remito autorizado por AFIP/ARCA"],
      };
    } catch (error: any) {
      console.error("❌ Error generando remito en AFIP:", error.message);

      // En modo simulación nunca fallar con error real
      if (!this.hasCerts) {
        return this.simularRespuesta(remito);
      }

      return {
        success: false,
        errores: [
          error.message || "Error al comunicarse con AFIP",
          "Verificá los certificados, el punto de venta y la conectividad.",
        ],
      };
    }
  }

  // ─── Consultar remito existente ────────────────────────────────────────────

  async consultarRemito(
    puntoVenta: number,
    numeroRemito: number
  ): Promise<AfipResponse> {
    if (!this.hasCerts) {
      return {
        success: true,
        cae: "SIMULADO",
        vencimientoCae: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        numeroRemito,
        observaciones: ["Consulta simulada (sin certificados)"],
      };
    }

    try {
      const token = await getServiceToken(
        AFIP_SERVICE,
        this.cert!,
        this.key!,
        this.production
      );

      const client = await import("soap").then((soap) => {
        const wsdl = this.production
          ? "https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL"
          : "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL";
        return soap.createClientAsync(wsdl);
      });

      const [result] = await client.FECompConsultarAsync({
        Auth: { Token: token.token, Sign: token.sign, Cuit: this.cuit },
        FeCompConsReq: {
          CbteTipo: CBTE_TIPO_REMITO_R,
          CbteNro: numeroRemito,
          PtoVta: puntoVenta,
        },
      });

      const det = result?.FECompConsultarResult?.ResultGet;
      if (!det) throw new Error("Respuesta vacía del WS");

      const rawDate: string = String(det.CAEFchVto);
      const vto =
        rawDate.length === 8
          ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
          : rawDate;

      return {
        success: true,
        cae: String(det.CodAutorizacion),
        vencimientoCae: vto,
        numeroRemito: det.CbteDesde,
        observaciones: [],
      };
    } catch (error: any) {
      return {
        success: false,
        errores: [error.message || "Error al consultar remito en AFIP"],
      };
    }
  }

  // ─── Utilidades públicas ───────────────────────────────────────────────────

  public isProduction(): boolean {
    return this.production;
  }

  public hasCertificates(): boolean {
    return this.hasCerts;
  }

  public getCuit(): number {
    return this.cuit;
  }
}

// Singleton compartido por toda la aplicación
export const afipService = new AfipService();
