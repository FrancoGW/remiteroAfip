import mongoose, { Schema, Document } from "mongoose";

// Contador independiente para remitos de prueba (esPrueba: true). Nunca se
// cruza con la numeración real de CAI: un solo documento con id fijo que se
// incrementa atómicamente, arrancando en 1.
export interface ContadorPruebaDocument extends Omit<Document, "_id"> {
  _id: string;
  valor: number;
}

const ContadorPruebaSchema = new Schema<ContadorPruebaDocument>({
  _id: { type: String },
  valor: { type: Number, default: 0 },
});

const ContadorPruebaModel =
  mongoose.models.ContadorPrueba ||
  mongoose.model<ContadorPruebaDocument>(
    "ContadorPrueba",
    ContadorPruebaSchema,
    "contadores_prueba"
  );

export default ContadorPruebaModel;
