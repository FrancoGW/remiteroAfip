import { NextRequest, NextResponse } from "next/server";
import { PDFGenerator } from "@/lib/pdf/pdfGenerator";
import { Remito } from "@/lib/types/remito";
import { remitosStorageService } from "@/lib/storage/remitosStorage";

/**
 * GET /api/remitos
 * Obtiene la lista de remitos
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      remitos: remitosStorageService.getAll(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/remitos
 * Genera un nuevo remito digital y su PDF usando PDFKit
 * 
 * @body JSON con los datos del remito (ver API_DOCUMENTATION.md para estructura completa)
 * 
 * Campos obligatorios:
 * - puntoVenta: number
 * - fechaEmision: string (YYYY-MM-DD)
 * - codigoTipoRemito: number (1: Remito R, 2: Remito Primario)
 * - cuitEmisor: string (11 dígitos)
 * - cuitReceptor: string (11 dígitos)
 * - nombreReceptor: string
 * - domicilioReceptor: string
 * - tipoTransporte: number (1: Propio, 2: Tercero)
 * - origenDomicilio: string
 * - origenLocalidad: string
 * - origenProvincia: string
 * - origenCodigoPostal: string
 * - destinoDomicilio: string
 * - destinoLocalidad: string
 * - destinoProvincia: string
 * - destinoCodigoPostal: string
 * - items: Array con al menos un item
 * 
 * @returns JSON con success, cae, vencimientoCae, numeroRemito, remito y pdfBase64
 */
export async function POST(request: NextRequest) {
  try {
    const remito: Remito = await request.json();

    // Validaciones
    const errores: string[] = [];

    // Validar CUITs
    if (!remito.cuitEmisor) {
      errores.push("cuitEmisor es requerido");
    } else if (remito.cuitEmisor.replace(/-/g, "").length !== 11) {
      errores.push("cuitEmisor debe tener 11 dígitos");
    }

    if (!remito.cuitReceptor) {
      errores.push("cuitReceptor es requerido");
    } else if (remito.cuitReceptor.replace(/-/g, "").length !== 11) {
      errores.push("cuitReceptor debe tener 11 dígitos");
    }

    // Validar campos obligatorios
    if (!remito.puntoVenta) {
      errores.push("puntoVenta es requerido");
    }

    if (!remito.fechaEmision) {
      errores.push("fechaEmision es requerido (formato: YYYY-MM-DD)");
    }

    if (!remito.codigoTipoRemito) {
      errores.push("codigoTipoRemito es requerido (1: Remito R, 2: Remito Primario)");
    }

    if (!remito.nombreReceptor) {
      errores.push("nombreReceptor es requerido");
    }

    if (!remito.domicilioReceptor) {
      errores.push("domicilioReceptor es requerido");
    }

    if (!remito.tipoTransporte) {
      errores.push("tipoTransporte es requerido (1: Propio, 2: Tercero)");
    }

    // Validar origen
    if (!remito.origenDomicilio) errores.push("origenDomicilio es requerido");
    if (!remito.origenLocalidad) errores.push("origenLocalidad es requerido");
    if (!remito.origenProvincia) errores.push("origenProvincia es requerido");
    if (!remito.origenCodigoPostal) errores.push("origenCodigoPostal es requerido");

    // Validar destino
    if (!remito.destinoDomicilio) errores.push("destinoDomicilio es requerido");
    if (!remito.destinoLocalidad) errores.push("destinoLocalidad es requerido");
    if (!remito.destinoProvincia) errores.push("destinoProvincia es requerido");
    if (!remito.destinoCodigoPostal) errores.push("destinoCodigoPostal es requerido");

    // Validar items
    if (!remito.items || remito.items.length === 0) {
      errores.push("El remito debe tener al menos un ítem");
    } else {
      remito.items.forEach((item, index) => {
        if (!item.codigo) {
          errores.push(`items[${index}].codigo es requerido`);
        }
        if (!item.descripcion) {
          errores.push(`items[${index}].descripcion es requerido`);
        }
        if (item.cantidad === undefined || item.cantidad === null) {
          errores.push(`items[${index}].cantidad es requerido`);
        }
        if (!item.unidadMedida) {
          errores.push(`items[${index}].unidadMedida es requerido`);
        }
      });
    }

    // Validar transporte de terceros
    if (remito.tipoTransporte === 2) {
      if (!remito.cuitTransportista) {
        errores.push("cuitTransportista es requerido cuando tipoTransporte es 2 (Tercero)");
      }
    }

    if (errores.length > 0) {
      return NextResponse.json(
        {
          success: false,
          errores: errores,
        },
        { status: 400 }
      );
    }

    // Generar número de remito (simulado - en producción usar secuencia de base de datos)
    const numeroRemito = remitosStorageService.getAll().length + 1;
    const fechaCreacion = new Date().toISOString();
    
    // Crear remito completo con datos generados
    const nuevoRemito: Remito = {
      ...remito,
      id: Date.now().toString(),
      numeroRemito: numeroRemito,
      // CAE simulado (en producción vendría de AFIP)
      cae: `CAE-${Date.now()}`,
      vencimientoCae: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 90 días desde hoy
      estado: "approved",
      fechaCreacion: fechaCreacion,
    };

    // Generar PDF del remito
    const pdfBuffer = await PDFGenerator.generarRemitoPDF(nuevoRemito);
    const pdfBase64 = pdfBuffer.toString("base64");

    // Guardar en el almacenamiento
    remitosStorageService.save(nuevoRemito);

    return NextResponse.json({
      success: true,
      cae: nuevoRemito.cae,
      vencimientoCae: nuevoRemito.vencimientoCae,
      numeroRemito: nuevoRemito.numeroRemito,
      remito: nuevoRemito,
      pdfBase64: pdfBase64,
    });
  } catch (error: any) {
    console.error("Error en POST /api/remitos:", error);
    return NextResponse.json(
      {
        success: false,
        errores: [error.message || "Error al procesar el remito"],
      },
      { status: 500 }
    );
  }
}

