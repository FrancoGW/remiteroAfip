import mongoose, { Schema, Document } from "mongoose";

// Configuración de la app editable desde el panel (no secretos/credenciales,
// esos siguen viviendo sólo en variables de entorno). Documento único.
export interface AppConfigDocument extends Omit<Document, "_id"> {
  _id: string;
  whatsappTestNumber?: string;
  emailTestAddress?: string;
}

const AppConfigSchema = new Schema<AppConfigDocument>({
  _id: { type: String },
  whatsappTestNumber: { type: String },
  emailTestAddress: { type: String },
});

const AppConfigModel =
  mongoose.models.AppConfig ||
  mongoose.model<AppConfigDocument>("AppConfig", AppConfigSchema, "app_config");

export default AppConfigModel;
