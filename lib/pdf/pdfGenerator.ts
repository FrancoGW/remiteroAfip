import PDFDocument from "pdfkit";
import { Remito } from "../types/remito";
import { TIPOS_REMITO } from "../types/remito";
import { EMPRESA_CONFIG } from "../config/empresa";
import path from "path";
import fs from "fs";

/**
 * Encuentra la ruta de las fuentes de PDFKit en cualquier entorno
 */
function encontrarRutaFuentesPDFKit(): string | null {
  const posiblesRutas: string[] = [];

  // 1. Intentar con require.resolve desde el módulo principal (funciona en Vercel)
  try {
    const pdfkitPath = require.resolve("pdfkit");
    const pdfkitDir = path.dirname(pdfkitPath);
    posiblesRutas.push(path.join(pdfkitDir, "js", "data"));
    posiblesRutas.push(path.join(pdfkitDir, "..", "js", "data"));
    posiblesRutas.push(path.join(pdfkitDir, "..", "..", "js", "data"));
  } catch (error) {
    // Continuar con otras opciones
  }

  // 2. Intentar resolver desde package.json de pdfkit
  try {
    const pdfkitModulePath = require.resolve("pdfkit/package.json");
    const pdfkitDir = path.dirname(pdfkitModulePath);
    posiblesRutas.push(path.join(pdfkitDir, "js", "data"));
  } catch (error) {
    // Continuar
  }

  // 3. Ruta estándar desde process.cwd()
  posiblesRutas.push(path.join(process.cwd(), "node_modules", "pdfkit", "js", "data"));

  // 4. Buscar en /var/task (Vercel - ruta de ejecución)
  posiblesRutas.push("/var/task/node_modules/pdfkit/js/data");
  
  // 5. Buscar en /var/task/.next (Vercel - build output)
  posiblesRutas.push("/var/task/.next/server/node_modules/pdfkit/js/data");
  posiblesRutas.push("/var/task/.next/server/chunks/node_modules/pdfkit/js/data");

  // 6. Ruta usando __dirname (si está disponible)
  try {
    posiblesRutas.push(path.join(__dirname, "..", "..", "..", "node_modules", "pdfkit", "js", "data"));
  } catch (error) {
    // __dirname puede no estar disponible en ESM
  }

  // Buscar la primera ruta que exista y tenga archivos .afm
  for (const ruta of posiblesRutas) {
    try {
      if (fs.existsSync(ruta)) {
        const archivos = fs.readdirSync(ruta);
        if (archivos.some((f) => f.endsWith(".afm"))) {
          console.log(`✅ Fuentes de PDFKit encontradas en: ${ruta}`);
          return ruta;
        }
      }
    } catch (error) {
      // Continuar con la siguiente ruta
    }
  }

  console.warn("⚠️ No se encontraron las fuentes de PDFKit.");
  return null;
}

// Configurar la ruta de fuentes
const PDFKIT_FONT_PATH = encontrarRutaFuentesPDFKit();

// Configurar la variable de entorno para PDFKit si encontramos la ruta
if (PDFKIT_FONT_PATH && !process.env.PDFKIT_FONT_PATH) {
  process.env.PDFKIT_FONT_PATH = PDFKIT_FONT_PATH;
}

/**
 * Servicio para generar PDFs de remitos usando PDFKit
 */
export class PDFGenerator {
  /**
   * Genera un PDF del remito con todos los datos proporcionados
   */
  static generarRemitoPDF(remito: Remito): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Encontrar la ruta de fuentes en tiempo de ejecución
        const rutaEncontrada = encontrarRutaFuentesPDFKit();
        
        // Configurar la variable de entorno que PDFKit usa internamente
        if (rutaEncontrada) {
          process.env.PDFKIT_FONT_PATH = rutaEncontrada;
        }

        const doc = new PDFDocument({
          size: "A4",
          margins: {
            top: 30,
            bottom: 50,
            left: 50,
            right: 50,
          },
        });

        const buffers: Buffer[] = [];
        const originalReadFileSync = fs.readFileSync;
        let fontPathMap: Map<string, string> | null = null;
        
        // Configurar el patch de fs.readFileSync si encontramos fuentes
        if (rutaEncontrada) {
          fontPathMap = new Map<string, string>();
          try {
            const archivos = fs.readdirSync(rutaEncontrada);
            archivos.filter((f) => f.endsWith(".afm")).forEach((archivo) => {
              const rutaCompleta = path.join(rutaEncontrada!, archivo);
              // Mapear posibles rutas que PDFKit podría buscar
              fontPathMap!.set(`/var/task/.next/server/chunks/data/${archivo}`, rutaCompleta);
              fontPathMap!.set(path.join(process.cwd(), ".next", "server", "chunks", "data", archivo), rutaCompleta);
              fontPathMap!.set(path.join(process.cwd(), ".next", "server", "vendor-chunks", "data", archivo), rutaCompleta);
            });
            
            // Patch fs.readFileSync
            (fs as any).readFileSync = function(filePath: string, ...args: any[]) {
              if (typeof filePath === 'string' && filePath.endsWith('.afm') && fontPathMap!.has(filePath)) {
                const rutaReal = fontPathMap!.get(filePath)!;
                return originalReadFileSync.call(fs, rutaReal, ...args);
              }
              return originalReadFileSync.call(fs, filePath, ...args);
            };
          } catch (error) {
            console.warn("⚠️ Error configurando patch de fuentes:", error);
          }
        }
        
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          // Restaurar fs.readFileSync antes de resolver
          if (fontPathMap) {
            (fs as any).readFileSync = originalReadFileSync;
          }
          resolve(Buffer.concat(buffers));
        });
        doc.on("error", (error) => {
          // Restaurar fs.readFileSync antes de rechazar
          if (fontPathMap) {
            (fs as any).readFileSync = originalReadFileSync;
          }
          reject(error);
        });

        // Todo en negro
        const colorNegro = "#000000";
        const pageWidth = doc.page.width - 100;
        const pageHeight = doc.page.height;
        let currentY = 30;

        // ===== ENCABEZADO =====
        // Logo "R" y "CODIGO N°" en el centro superior
        const pageCenterX = doc.page.width / 2;
        const codigoText = `CODIGO N° ${EMPRESA_CONFIG.codigo}`;
        
        // "R" centrada arriba - usar width para centrar correctamente
        doc
          .fontSize(24)
          .fillColor(colorNegro);
        const rWidth = doc.widthOfString("R");
        doc.text("R", pageCenterX - rWidth / 2, currentY);
        
        // "CODIGO N°" centrado debajo de la R
        doc
          .fontSize(8)
          .fillColor(colorNegro);
        const codigoWidth = doc.widthOfString(codigoText);
        doc.text(codigoText, pageCenterX - codigoWidth / 2, currentY + 20);

        // Datos de la empresa (izquierda)
        doc
          .fontSize(12)
          .fillColor(colorNegro)
          .text(EMPRESA_CONFIG.nombre, 50, currentY);
        
        doc
          .fontSize(9)
          .fillColor(colorNegro)
          .text(EMPRESA_CONFIG.direccion, 50, currentY + 15)
          .text(EMPRESA_CONFIG.localidad, 50, currentY + 28)
          .text(EMPRESA_CONFIG.condicionIva, 50, currentY + 41);

        // "COMPROBANTE NO VALIDO COMO FACTURA" y "REMITO" (derecha)
        doc
          .fontSize(8)
          .fillColor(colorNegro)
          .text("COMPROBANTE NO VALIDO COMO FACTURA", 400, currentY, { width: 145, align: "right" });
        
        doc
          .fontSize(14)
          .fillColor(colorNegro)
          .text("REMITO", 400, currentY + 12, { width: 145, align: "right" });

        // Número de remito
        const numeroRemito = remito.numeroRemito?.toString().padStart(8, "0") || "00000000";
        const puntoVenta = remito.puntoVenta.toString().padStart(4, "0");
        doc
          .fontSize(10)
          .fillColor(colorNegro)
          .text(`Nº ${puntoVenta}-${numeroRemito}`, 400, currentY + 30, { width: 145, align: "right" });

        // Fecha y hora
        doc
          .fontSize(9)
          .fillColor(colorNegro)
          .text("FECHA:", 50, currentY + 55)
          .text(this.formatearFecha(remito.fechaEmision), 100, currentY + 55)
          .text("HORA:", 250, currentY + 55)
          .text(new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }), 300, currentY + 55);

        // Datos de la empresa (CUIT, Ingresos Brutos, Fecha de Inicio)
        doc
          .fontSize(8)
          .fillColor(colorNegro)
          .text(`C.U.I.T.: ${EMPRESA_CONFIG.cuit}`, 50, currentY + 70)
          .text(`INGRESOS BRUTOS: ${EMPRESA_CONFIG.ingresosBrutos}`, 250, currentY + 70)
          .text(`FECHA DE INICIO: ${EMPRESA_CONFIG.fechaInicio}`, 400, currentY + 70);

        currentY = currentY + 95;

        // ===== DATOS DEL CLIENTE =====
        const clienteY = currentY;
        const clienteHeight = 80;
        
        doc
          .strokeColor("#000000")
          .lineWidth(0.5)
          .rect(50, clienteY, pageWidth, clienteHeight)
          .stroke();

        doc
          .fontSize(9)
          .fillColor(colorNegro)
          .text("PREDIO:", 55, clienteY + 5)
          .text(remito.predio || "_________________", 55, clienteY + 18, { width: 150 })
          .text("RODAL:", 220, clienteY + 5)
          .text(remito.rodal || "_________________", 220, clienteY + 18, { width: 150 })
          .text("CLIENTE:", 55, clienteY + 35)
          .text(remito.nombreReceptor || "_________________", 55, clienteY + 48, { width: 200 })
          .text("DOMICILIO FISCAL:", 280, clienteY + 35)
          .text(remito.domicilioFiscal || remito.domicilioReceptor || "_________________", 280, clienteY + 48, { width: 265 })
          .text("IVA:", 55, clienteY + 65)
          .text("RESPONSABLE INSCRIPTO", 100, clienteY + 65)
          .text("RESPONSABLE NO INSCRIPTO", 250, clienteY + 65)
          .text("CUIT:", 400, clienteY + 65)
          .text(this.formatearCUIT(remito.cuitReceptor), 440, clienteY + 65);

        currentY = clienteY + clienteHeight + 5;

        // ===== DATOS DEL PRODUCTO =====
        const productoY = currentY;
        const productoHeight = 100;
        
        doc
          .strokeColor("#000000")
          .lineWidth(0.5)
          .rect(50, productoY, pageWidth, productoHeight)
          .stroke();

        // Si hay items, usar el primero para mostrar los datos del producto
        const primerItem = remito.items[0] || {};
        
        doc
          .fontSize(9)
          .fillColor(colorNegro)
          .text("PRODUCTO:", 55, productoY + 5)
          .text(primerItem.descripcion || "_________________", 55, productoY + 18, { width: 150 })
          .text("ESPECIE:", 220, productoY + 5)
          .text(primerItem.especie || "_________________", 220, productoY + 18, { width: 150 })
          .text("LARGO:", 380, productoY + 5)
          .text(primerItem.largo ? `${primerItem.largo}` : "_________________", 380, productoY + 18, { width: 100 })
          .text("CATEGORIA:", 55, productoY + 35)
          .text(primerItem.categoria || "_________________", 55, productoY + 48, { width: 150 })
          .text("PESO BRUTO:", 220, productoY + 35)
          .text(primerItem.pesoBruto ? `${primerItem.pesoBruto.toFixed(2)} kg` : "_________________", 220, productoY + 48, { width: 100 })
          .text("M3 STEREO:", 330, productoY + 35)
          .text(primerItem.m3Stereo ? `${primerItem.m3Stereo.toFixed(2)}` : "_________________", 330, productoY + 48, { width: 100 })
          .text("TARA:", 440, productoY + 35)
          .text(primerItem.tara ? `${primerItem.tara.toFixed(2)} kg` : "_________________", 440, productoY + 48, { width: 100 })
          .text("PESO NETO:", 55, productoY + 65)
          .text(primerItem.pesoNeto ? `${primerItem.pesoNeto.toFixed(2)} kg` : "_________________", 55, productoY + 78, { width: 100 })
          .text("BALANZA:", 170, productoY + 65)
          .text(primerItem.balanza || "_________________", 170, productoY + 78, { width: 150 });

        currentY = productoY + productoHeight + 5;

        // ===== DATOS DEL TRANSPORTE =====
        const transporteY = currentY;
        const transporteHeight = 70;
        
        doc
          .strokeColor("#000000")
          .lineWidth(0.5)
          .rect(50, transporteY, pageWidth, transporteHeight)
          .stroke();

        doc
          .fontSize(9)
          .fillColor(colorNegro)
          .text("TRANSPORTE:", 55, transporteY + 5)
          .text(remito.nombreTransportista || "_________________", 55, transporteY + 18, { width: 200 })
          .text("CAMION PATENTE N°:", 280, transporteY + 5)
          .text(remito.dominioVehiculo || "_________________", 280, transporteY + 18, { width: 150 })
          .text("CUIT:", 55, transporteY + 35)
          .text(remito.cuitTransportista ? this.formatearCUIT(remito.cuitTransportista) : "_________________", 55, transporteY + 48, { width: 150 })
          .text("ACOPLADO PATENTE N°:", 220, transporteY + 35)
          .text(remito.dominioAcoplado || "_________________", 220, transporteY + 48, { width: 150 })
          .text("CONDUCTOR:", 380, transporteY + 35)
          .text(remito.conductor || "_________________", 380, transporteY + 48, { width: 100 })
          .text("DNI:", 490, transporteY + 35)
          .text(remito.dniConductor || "_________________", 490, transporteY + 48, { width: 55 });

        // Texto sobre propiedad de la mercadería
        doc
          .fontSize(8)
          .fillColor(colorNegro)
          .text("MERCADERIA PROPIEDAD DEL CLIENTE, TRANSPORTADA POR CUENTA Y ORDEN DEL MISMO", 55, transporteY + 60, { width: pageWidth - 10 });

        currentY = transporteY + transporteHeight + 5;

        // ===== FIRMAS =====
        const firmasY = currentY;
        const firmasHeight = 60;
        
        doc
          .strokeColor("#000000")
          .lineWidth(0.5)
          .rect(50, firmasY, pageWidth, firmasHeight)
          .stroke();

        doc
          .fontSize(9)
          .fillColor(colorNegro)
          .text("Firma y aclaración", 55, firmasY + 5, { width: 150, align: "center" })
          .text("Despachante", 55, firmasY + 18, { width: 150, align: "center" })
          .lineWidth(0.5)
          .strokeColor(colorNegro)
          .rect(55, firmasY + 30, 150, 18)
          .stroke();

        doc
          .fillColor(colorNegro)
          .text("Firma y aclaración", 220, firmasY + 5, { width: 150, align: "center" })
          .text("Conductor", 220, firmasY + 18, { width: 150, align: "center" })
          .rect(220, firmasY + 30, 150, 18)
          .stroke();

        doc
          .fillColor(colorNegro)
          .text("Firma y aclaración", 385, firmasY + 5, { width: 160, align: "center" })
          .text("Recepción", 385, firmasY + 18, { width: 160, align: "center" })
          .text("FECHA:", 385, firmasY + 38)
          .text("HORA:", 450, firmasY + 38)
          .rect(385, firmasY + 35, 160, 20)
          .stroke();

        currentY = firmasY + firmasHeight + 5;

        // ===== OBSERVACIONES =====
        const obsY = currentY;
        const obsHeight = 40;
        
        doc
          .strokeColor(colorNegro)
          .lineWidth(0.5)
          .rect(50, obsY, pageWidth, obsHeight)
          .stroke();

        doc
          .fontSize(9)
          .fillColor(colorNegro)
          .text("OBSERVACIONES:", 55, obsY + 5)
          .text(remito.observaciones || "", 55, obsY + 18, { width: pageWidth - 10 });

        // ===== CAE Y DATOS ADICIONALES =====
        if (remito.cae) {
          const caeY = obsY + obsHeight + 10;
          doc
            .fontSize(8)
            .fillColor(colorNegro)
            .text(`CAE: ${remito.cae}`, 50, caeY);
          
          if (remito.vencimientoCae) {
            doc.text(`Vencimiento CAE: ${this.formatearFecha(remito.vencimientoCae)}`, 300, caeY);
          }
        }

        // Pie de página
        doc
          .fontSize(7)
          .fillColor(colorNegro)
          .text(
            `Generado el ${new Date().toLocaleDateString("es-AR")} a las ${new Date().toLocaleTimeString("es-AR")}`,
            50,
            pageHeight - 30,
            { align: "center", width: pageWidth }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Formatea una fecha ISO (YYYY-MM-DD) a formato DD/MM/YYYY
   */
  private static formatearFecha(fecha: string): string {
    try {
      const [anio, mes, dia] = fecha.split("T")[0].split("-");
      return `${dia}/${mes}/${anio}`;
    } catch (error) {
      return fecha;
    }
  }

  /**
   * Formatea un CUIT agregando guiones
   */
  private static formatearCUIT(cuit: string): string {
    const cuitLimpio = cuit.replace(/-/g, "");
    if (cuitLimpio.length === 11) {
      return `${cuitLimpio.slice(0, 2)}-${cuitLimpio.slice(2, 10)}-${cuitLimpio.slice(10)}`;
    }
    return cuit;
  }
}
