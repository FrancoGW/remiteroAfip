import mongoose, { Schema, Document } from "mongoose";
import { Remito, RemitoItem } from "@/lib/types/remito";

// Extender la interfaz RemitoItem para MongoDB
interface RemitoItemDocument extends RemitoItem {
  _id?: string;
}

// Extender la interfaz Remito para MongoDB
export interface RemitoDocument extends Omit<Remito, "items">, Document {
  items: RemitoItemDocument[];
}

const RemitoItemSchema = new Schema<RemitoItemDocument>({
  codigo: { type: String, required: true },
  descripcion: { type: String, required: true },
  cantidad: { type: Number, required: true },
  unidadMedida: { type: String, required: true },
  pesoNeto: { type: Number },
  pesoBruto: { type: Number },
  especie: { type: String },
  largo: { type: Number },
  categoria: { type: String },
  m3Stereo: { type: Number },
  tara: { type: Number },
  balanza: { type: String },
}, { _id: false });

const RemitoSchema = new Schema<RemitoDocument>(
  {
    id: { type: String, unique: true, index: true },
    cae: { type: String },
    vencimientoCae: { type: String },
    numeroRemito: { type: Number, index: true },
    puntoVenta: { type: Number, required: true },
    fechaEmision: { type: String, required: true },
    codigoTipoRemito: { type: Number, required: true },
    
    // Emisor
    cuitEmisor: { type: String, required: true },
    nombreEmisor: { type: String },
    
    // Receptor
    cuitReceptor: { type: String, required: true },
    nombreReceptor: { type: String, required: true },
    domicilioReceptor: { type: String, required: true },
    predio: { type: String },
    rodal: { type: String },
    domicilioFiscal: { type: String },
    condicionIva: { type: String },
    
    // Transporte
    tipoTransporte: { type: Number, required: true },
    cuitTransportista: { type: String },
    nombreTransportista: { type: String },
    dominioVehiculo: { type: String },
    dominioAcoplado: { type: String },
    conductor: { type: String },
    dniConductor: { type: String },
    
    // Origen y destino
    origenDomicilio: { type: String, required: true },
    origenLocalidad: { type: String, required: true },
    origenProvincia: { type: String, required: true },
    origenCodigoPostal: { type: String, required: true },
    
    destinoDomicilio: { type: String, required: true },
    destinoLocalidad: { type: String, required: true },
    destinoProvincia: { type: String, required: true },
    destinoCodigoPostal: { type: String, required: true },
    
    // Items
    items: [RemitoItemSchema],
    
    // Observaciones
    observaciones: { type: String },
    
    // Estado
    estado: { 
      type: String, 
      enum: ["draft", "pending", "approved", "rejected"],
      default: "approved"
    },
    fechaCreacion: { type: String },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

// Crear índices para búsquedas rápidas
RemitoSchema.index({ numeroRemito: 1 });
RemitoSchema.index({ cuitReceptor: 1 });
RemitoSchema.index({ fechaEmision: 1 });
RemitoSchema.index({ createdAt: -1 }); // Para ordenar por más recientes

// Evitar que se cree el modelo múltiples veces en desarrollo
const RemitoModel = mongoose.models.Remito || mongoose.model<RemitoDocument>("Remito", RemitoSchema);

export default RemitoModel;
