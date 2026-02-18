import mongoose, { Schema, Document } from "mongoose";

export interface UsuarioDocument extends Document {
  username: string;
  password: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UsuarioSchema = new Schema<UsuarioDocument>(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      default: "admin",
      enum: ["admin", "user"]
    },
  },
  {
    timestamps: true,
  }
);

// Índice único para username
UsuarioSchema.index({ username: 1 }, { unique: true });

// Evitar que se cree el modelo múltiples veces en desarrollo
const UsuarioModel = mongoose.models.Usuario || mongoose.model<UsuarioDocument>("Usuario", UsuarioSchema);

export default UsuarioModel;
