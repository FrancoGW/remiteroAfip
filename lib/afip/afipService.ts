import Afip from "@afipsdk/afip.js";
import { Remito, AfipResponse } from "../types/remito";
import fs from "fs";

/**
 * Servicio de integración con AFIP usando el SDK oficial @afipsdk/afip.js
 * 
 * Este servicio maneja:
 * - Autenticación automática con AFIP
 * - Generación de remitos electrónicos
 * - Consulta de remitos
 * - Modo desarrollo (sin certificados) y producción (con certificados)
 * 
 * Documentación: https://docs.afipsdk.com
 */
export class AfipService {
  private afip: any;
  private cuit: number;
  private production: boolean;

  constructor() {
    const cuitString = process.env.AFIP_CUIT || "20409378472";
    this.cuit = parseInt(cuitString.replace(/-/g, ""));
    this.production = process.env.AFIP_PRODUCTION === "true";
    
    // Configuración del SDK de AFIP
    const config: any = {
      CUIT: this.production ? this.cuit : 20409378472, // En desarrollo usa CUIT de prueba
    };

    // Si estamos en producción y tenemos certificados, los cargamos
    if (this.production) {
      try {
        const certPath = process.env.AFIP_CERT_PATH || "./certs/cert.crt";
        const keyPath = process.env.AFIP_KEY_PATH || "./certs/private.key";
        
        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
          config.cert = fs.readFileSync(certPath, { encoding: "utf8" });
          config.key = fs.readFileSync(keyPath, { encoding: "utf8" });
          config.CUIT = this.cuit;
          console.log("✅ Certificados de AFIP cargados correctamente");
        } else {
          console.warn("⚠️ Certificados no encontrados. Usando modo desarrollo.");
          this.production = false;
          config.CUIT = 20409378472;
        }
      } catch (error) {
        console.error("❌ Error cargando certificados:", error);
        console.log("⚠️ Fallback a modo desarrollo");
        this.production = false;
        config.CUIT = 20409378472;
      }
    } else {
      console.log("🧪 Modo desarrollo activado - usando CUIT de prueba de AFIP");
    }

    // Inicializar SDK de AFIP
    // El SDK maneja automáticamente:
    // - Autenticación (WSAA)
    // - Renovación de tickets
    // - Firma digital
    // - Llamadas a web services
    this.afip = new Afip(config);
  }

  /**
   * Genera un remito electrónico en AFIP
   * 
   * En modo desarrollo: Simula la respuesta de AFIP
   * En modo producción: Llama al web service real de AFIP
   * 
   * @param remito - Datos del remito a generar
   * @returns Respuesta con CAE, número de remito y observaciones
   */
  async generarRemito(remito: Remito): Promise<AfipResponse> {
    try {
      // Validar datos del remito
      this.validarRemito(remito);

      // En modo desarrollo, simular respuesta
      if (!this.production) {
        console.log("🧪 Generando remito en modo desarrollo (simulado)");
        return this.simularRespuestaAfip(remito);
      }

      console.log("📡 Generando remito en AFIP...");

      // Preparar datos para el SDK de AFIP
      // Nota: El SDK maneja principalmente facturación electrónica
      // Para remitos específicos, se usa el mismo esquema con tipo de comprobante correspondiente
      const remitoData = {
        CbteTipo: remito.codigoTipoRemito, // Tipo de remito
        PtoVta: remito.puntoVenta,
        Concepto: 1, // 1=Productos, 2=Servicios, 3=Productos y Servicios
        DocTipo: 80, // 80=CUIT
        DocNro: parseInt(remito.cuitReceptor.replace(/-/g, "")),
        CbteFch: remito.fechaEmision.replace(/-/g, ""),
        ImpTotal: 0, // Los remitos generalmente no tienen importe
        ImpTotConc: 0,
        ImpNeto: 0,
        ImpOpEx: 0,
        ImpIVA: 0,
        ImpTrib: 0,
        MonId: "PES", // Pesos
        MonCotiz: 1,
      };

      // Llamar al web service usando el SDK de AFIP
      const response = await this.afip.ElectronicBilling.createVoucher(remitoData);

      console.log("✅ Remito generado exitosamente en AFIP");

      return {
        success: true,
        cae: response.CAE,
        vencimientoCae: response.CAEFchVto,
        numeroRemito: response.CbteDesde,
        observaciones: response.Observaciones || ["Remito autorizado por AFIP"],
      };
    } catch (error: any) {
      console.error("❌ Error generando remito:", error);
      
      // Si falla en desarrollo, usar simulación
      if (!this.production) {
        console.log("⚠️ Fallback a modo simulación");
        return this.simularRespuestaAfip(remito);
      }
      
      return {
        success: false,
        errores: [
          error.message || "Error al comunicarse con AFIP",
          "Verifica tu conexión y certificados"
        ],
      };
    }
  }

  /**
   * Consulta el estado de un remito en AFIP
   * 
   * @param puntoVenta - Punto de venta del remito
   * @param numeroRemito - Número del remito a consultar
   * @returns Información del remito desde AFIP
   */
  async consultarRemito(
    puntoVenta: number,
    numeroRemito: number
  ): Promise<AfipResponse> {
    try {
      if (!this.production) {
        // Simulación para desarrollo
        console.log(`🧪 Consultando remito ${numeroRemito} (modo desarrollo)`);
        return {
          success: true,
          cae: "12345678901234",
          vencimientoCae: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          numeroRemito: numeroRemito,
          observaciones: ["Remito aprobado (modo desarrollo)"],
        };
      }

      console.log(`📡 Consultando remito ${numeroRemito} en AFIP...`);

      // Consultar usando el SDK de AFIP
      const response = await this.afip.ElectronicBilling.getVoucherInfo(
        numeroRemito,
        puntoVenta,
        1 // Tipo de comprobante (remito)
      );

      console.log("✅ Información del remito obtenida");

      return {
        success: true,
        cae: response.CAE,
        vencimientoCae: response.CAEFchVto,
        numeroRemito: response.CbteDesde,
        observaciones: response.Observaciones || [],
      };
    } catch (error: any) {
      console.error("❌ Error consultando remito:", error);
      return {
        success: false,
        errores: [error.message || "Error al consultar remito en AFIP"],
      };
    }
  }

  /**
   * Obtiene el último número de remito emitido para un punto de venta
   * 
   * @param puntoVenta - Punto de venta a consultar
   * @returns Último número de remito emitido
   */
  async obtenerUltimoNumeroRemito(puntoVenta: number): Promise<number> {
    try {
      if (!this.production) {
        // En desarrollo, retornar un número simulado
        const numero = Math.floor(Math.random() * 1000) + 1;
        console.log(`🧪 Último número de remito (simulado): ${numero}`);
        return numero;
      }

      console.log(`📡 Obteniendo último número de remito del punto de venta ${puntoVenta}...`);

      // Obtener último número usando el SDK
      const ultimoNumero = await this.afip.ElectronicBilling.getLastVoucher(
        puntoVenta,
        1 // Tipo de comprobante (remito)
      );
      
      console.log(`✅ Último número: ${ultimoNumero}`);
      return ultimoNumero || 0;
    } catch (error: any) {
      console.error("❌ Error obteniendo último número de remito:", error);
      return 0;
    }
  }

  /**
   * Valida los datos del remito antes de enviarlo a AFIP
   * 
   * @param remito - Datos del remito a validar
   * @throws Error si los datos son inválidos
   */
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
      throw new Error("Se requiere CUIT del transportista para transporte de terceros");
    }
    if (!remito.nombreReceptor || remito.nombreReceptor.trim() === "") {
      throw new Error("El nombre del receptor es obligatorio");
    }
    if (!remito.origenLocalidad || !remito.destinoLocalidad) {
      throw new Error("Las localidades de origen y destino son obligatorias");
    }
  }

  /**
   * Simula una respuesta exitosa de AFIP para desarrollo
   * Esto permite probar el sistema sin tener certificados de AFIP
   * 
   * @param remito - Datos del remito
   * @returns Respuesta simulada con CAE y número de remito
   */
  private simularRespuestaAfip(remito: Remito): AfipResponse {
    // Generar datos simulados pero realistas
    const numeroRemito = Math.floor(Math.random() * 100000) + 1;
    const cae = String(Math.floor(Math.random() * 99999999999999) + 10000000000000);
    const vencimientoCae = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    return {
      success: true,
      cae: cae,
      vencimientoCae: vencimientoCae,
      numeroRemito: numeroRemito,
      observaciones: [
        "✅ Remito generado exitosamente (MODO DESARROLLO)",
        "⚠️ Este es un remito simulado para testing",
        "💡 En producción, este remito sería enviado a AFIP",
        `📄 Punto de venta: ${remito.puntoVenta}`,
        `🚚 Tipo de transporte: ${remito.tipoTransporte === 1 ? "Propio" : "Tercero"}`,
      ],
    };
  }

  /**
   * Verifica si el servicio está en modo producción
   * @returns true si está en modo producción, false si está en desarrollo
   */
  public isProduction(): boolean {
    return this.production;
  }

  /**
   * Obtiene el CUIT configurado
   * @returns CUIT del contribuyente
   */
  public getCuit(): number {
    return this.cuit;
  }
}

// Exportar una instancia singleton del servicio
// Esto asegura que todos usen la misma instancia y configuración
export const afipService = new AfipService();
