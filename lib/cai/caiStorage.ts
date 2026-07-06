import connectDB from "@/lib/db/mongodb";
import CaiAutorizacionModel from "@/lib/db/models/CaiAutorizacion";
import { CaiAutorizacion, CaiPunto } from "@/lib/types/cai";

export interface NuevoCaiInput {
  cai: string;
  cuit: string;
  contribuyente?: string;
  fechaAutorizacion: string;
  fechaVencimiento: string;
  puntos: Array<Pick<CaiPunto, "puntoVenta" | "domicilio" | "tipoComprobante" | "numeroDesde" | "numeroHasta">>;
}

function toCaiAutorizacion(doc: any): CaiAutorizacion {
  return {
    id: doc._id.toString(),
    cai: doc.cai,
    cuit: doc.cuit,
    contribuyente: doc.contribuyente,
    fechaAutorizacion: new Date(doc.fechaAutorizacion).toISOString().split("T")[0],
    fechaVencimiento: new Date(doc.fechaVencimiento).toISOString().split("T")[0],
    estado: doc.estado,
    puntos: doc.puntos.map((p: any) => ({
      puntoVenta: p.puntoVenta,
      domicilio: p.domicilio,
      tipoComprobante: p.tipoComprobante,
      numeroDesde: p.numeroDesde,
      numeroHasta: p.numeroHasta,
      proximoNumero: p.proximoNumero,
    })),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

/**
 * Verifica que un rango [numeroDesde, numeroHasta] para un punto de venta +
 * tipo de comprobante no se solape con ningún rango ya cargado (de cualquier
 * CAI no cancelado). Evita emitir el mismo número dos veces.
 */
export async function validarSolapamiento(
  puntos: NuevoCaiInput["puntos"],
  excluirCaiId?: string
): Promise<string[]> {
  await connectDB();
  const errores: string[] = [];

  for (const punto of puntos) {
    if (punto.numeroDesde > punto.numeroHasta) {
      errores.push(
        `Punto ${punto.puntoVenta}: numeroDesde (${punto.numeroDesde}) no puede ser mayor que numeroHasta (${punto.numeroHasta})`
      );
      continue;
    }

    const query: any = {
      estado: { $ne: "cancelado" },
      puntos: {
        $elemMatch: {
          puntoVenta: punto.puntoVenta,
          tipoComprobante: punto.tipoComprobante,
          numeroDesde: { $lte: punto.numeroHasta },
          numeroHasta: { $gte: punto.numeroDesde },
        },
      },
    };
    if (excluirCaiId) query._id = { $ne: excluirCaiId };

    const solapado = await CaiAutorizacionModel.findOne(query).lean();
    if (solapado) {
      errores.push(
        `Punto ${punto.puntoVenta}: el rango ${punto.numeroDesde}-${punto.numeroHasta} se solapa con el CAI ${(solapado as any).cai} ya cargado`
      );
    }
  }

  return errores;
}

export const caiStorageService = {
  async getAll(): Promise<CaiAutorizacion[]> {
    await connectDB();
    const docs = await CaiAutorizacionModel.find({}).sort({ createdAt: -1 }).lean();
    return docs.map(toCaiAutorizacion);
  },

  async getById(id: string): Promise<CaiAutorizacion | undefined> {
    await connectDB();
    const doc = await CaiAutorizacionModel.findById(id).lean();
    return doc ? toCaiAutorizacion(doc) : undefined;
  },

  /** Devuelve la lista de errores de validación; array vacío si todo OK. */
  async validar(input: NuevoCaiInput, excluirCaiId?: string): Promise<string[]> {
    const errores: string[] = [];

    if (!input.cai?.trim()) errores.push("El CAI es requerido");
    if (!input.cuit?.trim()) errores.push("El CUIT es requerido");
    if (!input.fechaAutorizacion) errores.push("La fecha de autorización es requerida");
    if (!input.fechaVencimiento) errores.push("La fecha de vencimiento es requerida");
    if (
      input.fechaAutorizacion &&
      input.fechaVencimiento &&
      new Date(input.fechaVencimiento) < new Date(input.fechaAutorizacion)
    ) {
      errores.push("La fecha de vencimiento no puede ser anterior a la de autorización");
    }
    if (!input.puntos || input.puntos.length === 0) {
      errores.push("Debe cargar al menos un punto de venta");
    } else {
      input.puntos.forEach((p, i) => {
        if (!p.puntoVenta) errores.push(`Punto ${i + 1}: puntoVenta es requerido`);
        if (!p.domicilio?.trim()) errores.push(`Punto ${i + 1}: domicilio es requerido`);
        if (!p.tipoComprobante) errores.push(`Punto ${i + 1}: tipoComprobante es requerido`);
        if (p.numeroDesde === undefined || p.numeroDesde === null) errores.push(`Punto ${i + 1}: numeroDesde es requerido`);
        if (p.numeroHasta === undefined || p.numeroHasta === null) errores.push(`Punto ${i + 1}: numeroHasta es requerido`);
      });
    }

    if (errores.length === 0) {
      const solapamientos = await validarSolapamiento(input.puntos, excluirCaiId);
      errores.push(...solapamientos);
    }

    return errores;
  },

  /** Crea un nuevo CAI. Lanza error si la validación falla. */
  async create(input: NuevoCaiInput): Promise<CaiAutorizacion> {
    await connectDB();

    const errores = await this.validar(input);
    if (errores.length > 0) {
      throw new Error(errores.join("; "));
    }

    const doc = await CaiAutorizacionModel.create({
      cai: input.cai.trim(),
      cuit: input.cuit.replace(/-/g, "").trim(),
      contribuyente: input.contribuyente?.trim(),
      fechaAutorizacion: new Date(input.fechaAutorizacion),
      fechaVencimiento: new Date(input.fechaVencimiento),
      estado: "activo",
      puntos: input.puntos.map((p) => ({
        ...p,
        proximoNumero: p.numeroDesde,
      })),
    });

    return toCaiAutorizacion(doc);
  },

  /** Actualiza la fecha de vencimiento y/o el estado (p. ej. para cancelar un CAI cargado por error). */
  async update(
    id: string,
    cambios: Partial<Pick<CaiAutorizacion, "fechaVencimiento" | "estado">>
  ): Promise<CaiAutorizacion | undefined> {
    await connectDB();

    const update: any = {};
    if (cambios.fechaVencimiento) update.fechaVencimiento = new Date(cambios.fechaVencimiento);
    if (cambios.estado) update.estado = cambios.estado;

    const doc = await CaiAutorizacionModel.findByIdAndUpdate(id, update, { new: true }).lean();
    return doc ? toCaiAutorizacion(doc) : undefined;
  },
};
