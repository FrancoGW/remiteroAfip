import { Remito } from '../types/remito';

/**
 * Servicio para generar PDFs llamando al servicio Python separado
 * Este servicio funciona mejor en entornos serverless como Vercel
 */
export class PDFService {
  private static PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || 'http://localhost:8000';
  
  /**
   * Genera un PDF del remito llamando al servicio Python
   */
  static async generarRemitoPDF(remito: Remito): Promise<Buffer> {
    try {
      // Llamar al servicio Python para generar el PDF
      const response = await fetch(`${this.PDF_SERVICE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(remito),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del servicio PDF: ${response.status} - ${errorText}`);
      }

      // Obtener el PDF como buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      return buffer;
    } catch (error: any) {
      throw new Error(`Error generando PDF: ${error.message}`);
    }
  }
}
