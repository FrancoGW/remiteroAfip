import { Remito } from '../types/remito';
import { PDFGenerator } from './pdfGenerator';

/**
 * Servicio para generar PDFs llamando al servicio Python separado
 * Este servicio funciona mejor en entornos serverless como Vercel
 * Si el servicio Python no está disponible, usa PDFKit como fallback
 */
export class PDFService {
  private static getPDFServiceURL(): string {
    const url = process.env.PDF_SERVICE_URL || 'http://localhost:8000';
    // Asegurar que la URL no termine en /
    return url.replace(/\/+$/, '');
  }
  
  private static USE_PYTHON_SERVICE = !!process.env.PDF_SERVICE_URL;
  
  /**
   * Genera un PDF del remito llamando al servicio Python
   * Si el servicio no está disponible, usa PDFKit como fallback
   */
  static async generarRemitoPDF(remito: Remito): Promise<Buffer> {
    // Si no hay URL configurada, usar PDFKit directamente
    if (!this.USE_PYTHON_SERVICE) {
      console.log('⚠️ Servicio Python no configurado, usando PDFKit como fallback');
      return PDFGenerator.generarRemitoPDF(remito);
    }

    try {
      const serviceURL = this.getPDFServiceURL();
      const generateURL = `${serviceURL}/generate`;
      
      console.log(`🔗 Llamando al servicio PDF: ${generateURL}`);
      
      // Intentar llamar al servicio Python
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      const response = await fetch(generateURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(remito),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Servicio PDF respondió con error: ${response.status} - ${errorText}`);
      }

      // Obtener el PDF como buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log('✅ PDF generado exitosamente con servicio Python');
      return buffer;
    } catch (error: any) {
      // Si falla, usar PDFKit como fallback
      console.warn('⚠️ Error conectando con servicio Python, usando PDFKit como fallback:', error.message);
      return PDFGenerator.generarRemitoPDF(remito);
    }
  }
}
