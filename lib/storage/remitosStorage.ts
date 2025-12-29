import { Remito } from "../types/remito";

/**
 * Almacenamiento en memoria de remitos
 * En producción, reemplazar con base de datos
 */
let remitosStorage: Remito[] = [];

export const remitosStorageService = {
  /**
   * Obtiene todos los remitos
   */
  getAll(): Remito[] {
    return remitosStorage;
  },

  /**
   * Obtiene un remito por ID
   */
  getById(id: string): Remito | undefined {
    return remitosStorage.find((r) => r.id === id);
  },

  /**
   * Guarda un nuevo remito
   */
  save(remito: Remito): void {
    remitosStorage.push(remito);
  },

  /**
   * Actualiza un remito existente
   */
  update(id: string, remito: Remito): boolean {
    const index = remitosStorage.findIndex((r) => r.id === id);
    if (index !== -1) {
      remitosStorage[index] = remito;
      return true;
    }
    return false;
  },

  /**
   * Elimina un remito
   */
  delete(id: string): boolean {
    const index = remitosStorage.findIndex((r) => r.id === id);
    if (index !== -1) {
      remitosStorage.splice(index, 1);
      return true;
    }
    return false;
  },
};


