import mongoose, { Schema, Document } from "mongoose";
import { CaiPunto } from "@/lib/types/cai";

interface CaiPuntoDocument extends CaiPunto {
  _id?: string;
}

export interface CaiAutorizacionDocument extends Document {
  cai: string;
  cuit: string;
  contribuyente?: string;
  fechaAutorizacion: Date;
  fechaVencimiento: Date;
  estado: "activo" | "cancelado";
  puntos: CaiPuntoDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const CaiPuntoSchema = new Schema<CaiPuntoDocument>(
  {
    puntoVenta: { type: Number, required: true },
    domicilio: { type: String, required: true },
    tipoComprobante: { type: Number, required: true },
    numeroDesde: { type: Number, required: true },
    numeroHasta: { type: Number, required: true },
    proximoNumero: { type: Number, required: true },
  },
  { _id: false }
);

const CaiAutorizacionSchema = new Schema<CaiAutorizacionDocument>(
  {
    cai: { type: String, required: true, index: true },
    cuit: { type: String, required: true },
    contribuyente: { type: String },
    fechaAutorizacion: { type: Date, required: true },
    fechaVencimiento: { type: Date, required: true, index: true },
    estado: {
      type: String,
      enum: ["activo", "cancelado"],
      default: "activo",
    },
    puntos: {
      type: [CaiPuntoSchema],
      validate: {
        validator: (puntos: CaiPuntoDocument[]) => puntos.length > 0,
        message: "El CAI debe tener al menos un punto de venta asociado",
      },
    },
  },
  {
    timestamps: true,
  }
);

CaiAutorizacionSchema.index({ "puntos.puntoVenta": 1, "puntos.tipoComprobante": 1 });

const CaiAutorizacionModel =
  mongoose.models.CaiAutorizacion ||
  mongoose.model<CaiAutorizacionDocument>(
    "CaiAutorizacion",
    CaiAutorizacionSchema,
    "cai_autorizaciones"
  );

export default CaiAutorizacionModel;
