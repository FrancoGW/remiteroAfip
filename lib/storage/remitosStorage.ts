import { Remito } from "../types/remito";
import connectDB from "../db/mongodb";
import RemitoModel, { RemitoDocument } from "../db/models/Remito";

/**
 * Servicio de almacenamiento de remitos usando MongoDB
 */
export const remitosStorageService = {
  /**
   * Obtiene todos los remitos ordenados por más recientes
   */
  async getAll(): Promise<Remito[]> {
    try {
      await connectDB();
      const remitos = await RemitoModel.find({})
        .sort({ createdAt: -1 })
        .lean();
      
      // Convertir documentos de MongoDB a objetos Remito
      return remitos.map((doc) => {
        const remito = doc as any;
        // Convertir _id a id si existe
        if (remito._id && !remito.id) {
          remito.id = remito._id.toString();
        }
        delete remito._id;
        delete remito.__v;
        return remito as Remito;
      });
    } catch (error) {
      console.error("Error obteniendo remitos:", error);
      return [];
    }
  },

  /**
   * Obtiene un remito por ID
   */
  async getById(id: string): Promise<Remito | undefined> {
    try {
      await connectDB();
      const remito = await RemitoModel.findOne({ id }).lean();
      
      if (!remito) {
        return undefined;
      }

      const remitoObj = remito as any;
      if (remitoObj._id && !remitoObj.id) {
        remitoObj.id = remitoObj._id.toString();
      }
      delete remitoObj._id;
      delete remitoObj.__v;
      
      return remitoObj as Remito;
    } catch (error) {
      console.error("Error obteniendo remito por ID:", error);
      return undefined;
    }
  },

  /**
   * Guarda un nuevo remito
   */
  async save(remito: Remito): Promise<void> {
    try {
      await connectDB();
      
      // Asegurar que el remito tenga un id
      if (!remito.id) {
        remito.id = Date.now().toString();
      }

      // Crear o actualizar el remito
      await RemitoModel.findOneAndUpdate(
        { id: remito.id },
        { ...remito, fechaCreacion: remito.fechaCreacion || new Date().toISOString() },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error("Error guardando remito:", error);
      throw error;
    }
  },

  /**
   * Actualiza un remito existente
   */
  async update(id: string, remito: Remito): Promise<boolean> {
    try {
      await connectDB();
      const result = await RemitoModel.findOneAndUpdate(
        { id },
        remito,
        { new: true }
      );
      return !!result;
    } catch (error) {
      console.error("Error actualizando remito:", error);
      return false;
    }
  },

  /**
   * Elimina un remito
   */
  async delete(id: string): Promise<boolean> {
    try {
      await connectDB();
      const result = await RemitoModel.findOneAndDelete({ id });
      return !!result;
    } catch (error) {
      console.error("Error eliminando remito:", error);
      return false;
    }
  },
};
