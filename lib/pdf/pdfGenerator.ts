import PDFDocument from "pdfkit";
import { Remito } from "../types/remito";
import { TIPOS_REMITO } from "../types/remito";
import { EMPRESA_CONFIG } from "../config/empresa";
import path from "path";
import fs from "fs";

/**
 * Encuentra y copia las fuentes de PDFKit a /tmp para que estén disponibles en Vercel
 * Esta función se ejecuta una sola vez y cachea el resultado
 */
let fuentesInicializadas = false;
const TMP_FONT_DIR = "/tmp/pdfkit-fonts";

function inicializarFuentesPDFKit(): string | null {
  // Verificar si /tmp ya tiene archivos de fuentes (ya inicializados)
  if (fs.existsSync(TMP_FONT_DIR)) {
    try {
      const archivos = fs.readdirSync(TMP_FONT_DIR);
      const tieneFuentes = archivos.some((f) => f.endsWith(".afm"));
      if (tieneFuentes && archivos.filter((f) => f.endsWith(".afm")).length > 5) {
        fuentesInicializadas = true;
        console.log(`✅ Fuentes ya inicializadas en ${TMP_FONT_DIR}`);
        return TMP_FONT_DIR;
      }
    } catch (error) {
      // Si hay error leyendo /tmp, continuar para intentar inicializar
    }
  }

  // Lista exhaustiva de rutas posibles donde pueden estar las fuentes
  const posiblesRutas: string[] = [];
  
  // Estrategia 1: Buscar en .next/server/pdfkit-fonts (donde el script postbuild las copia)
  // En Vercel, process.cwd() es /var/task
  posiblesRutas.push(path.join(process.cwd(), ".next", "server", "pdfkit-fonts"));
  posiblesRutas.push("/var/task/.next/server/pdfkit-fonts");
  // También buscar en la raíz del proyecto en caso de que .next esté en otro lugar
  posiblesRutas.push(path.join(process.cwd(), "..", ".next", "server", "pdfkit-fonts"));
  
  // Estrategia 2: Usar __dirname para navegar a node_modules (funciona en Vercel)
  // En Vercel, __dirname es algo como "/var/task/.next/server/chunks"
  // Desde ahí navegamos hacia arriba hasta node_modules
  if (typeof __dirname !== 'undefined') {
    try {
      // Navegar desde .next/server/chunks hasta node_modules/pdfkit/js/data
      const basePath = path.resolve(__dirname, '..', '..', '..');
      const pdfkitDataPath = path.join(basePath, 'node_modules', 'pdfkit', 'js', 'data');
      posiblesRutas.unshift(pdfkitDataPath);
      console.log(`🔍 __dirname: ${__dirname}`);
      console.log(`🔍 Base path: ${basePath}`);
      console.log(`🔍 PDFKit data path desde __dirname: ${pdfkitDataPath}`);
    } catch (error: any) {
      console.log(`⚠️ Error construyendo ruta desde __dirname: ${error.message}`);
    }
  }
  
  // Estrategia 3: Intentar usar require.resolve del módulo pdfkit (puede fallar en Vercel)
  try {
    const pdfkitPath = require.resolve("pdfkit");
    // Verificar que sea un string (en Vercel a veces devuelve números)
    if (typeof pdfkitPath === 'string') {
      const pdfkitDir = path.dirname(pdfkitPath);
      const dataPath = path.join(pdfkitDir, "data");
      posiblesRutas.unshift(dataPath);
      console.log(`🔍 require.resolve("pdfkit"): ${pdfkitPath}`);
      console.log(`🔍 Datos esperados en: ${dataPath}`);
    } else {
      console.log(`⚠️ require.resolve("pdfkit") devolvió un número, omitiendo`);
    }
  } catch (error: any) {
    console.log(`⚠️ require.resolve("pdfkit") falló: ${error.message}`);
  }
  
  // Estrategia 4: Intentar obtener la ruta del módulo pdfkit usando require.cache
  try {
    require("pdfkit"); // Asegurar que el módulo esté cargado
    const pdfkitModule = require.cache[require.resolve("pdfkit")];
    if (pdfkitModule && pdfkitModule.filename) {
      const pdfkitDir = path.dirname(pdfkitModule.filename);
      posiblesRutas.push(path.join(pdfkitDir, "js", "data"));
      posiblesRutas.push(path.join(pdfkitDir, "lib", "js", "data"));
      posiblesRutas.push(path.join(pdfkitDir, "data"));
      // Buscar recursivamente
      for (let i = 0; i < 3; i++) {
        const parentDir = path.join(pdfkitDir, ...Array(i).fill(".."), "js", "data");
        posiblesRutas.push(parentDir);
      }
    }
  } catch (error) {
    // Continuar
  }
  
  // Estrategia 5: Rutas estándar en Vercel/Serverless
  posiblesRutas.push("/var/task/node_modules/pdfkit/js/data");
  posiblesRutas.push("/var/task/node_modules/pdfkit/lib/js/data");
  posiblesRutas.push("/var/task/node_modules/pdfkit/data");
  
  // Estrategia 6: Rutas relativas desde process.cwd()
  const cwd = process.cwd();
  posiblesRutas.push(path.join(cwd, "node_modules", "pdfkit", "js", "data"));
  posiblesRutas.push(path.join(cwd, "node_modules", "pdfkit", "lib", "js", "data"));
  posiblesRutas.push(path.join(cwd, "node_modules", "pdfkit", "data"));
  
  // Estrategia 7: Intentar require.resolve del módulo principal (último recurso)
  try {
    const pdfkitPath = require.resolve("pdfkit");
    const pdfkitDir = path.dirname(pdfkitPath);
    posiblesRutas.push(path.join(pdfkitDir, "js", "data"));
    posiblesRutas.push(path.join(pdfkitDir, "lib", "js", "data"));
    posiblesRutas.push(path.join(pdfkitDir, "data"));
  } catch (error) {
    // require.resolve puede fallar en Next.js
  }

  // Buscar la primera ruta que exista y tenga archivos .afm
  let fuenteRuta: string | null = null;
  console.log(`🔍 Buscando fuentes de PDFKit en ${posiblesRutas.length} ubicaciones posibles...`);
  
  for (const ruta of posiblesRutas) {
    try {
      if (fs.existsSync(ruta)) {
        const archivos = fs.readdirSync(ruta);
        const tieneAFM = archivos.some((f) => f.endsWith(".afm"));
        const archivosAFM = archivos.filter((f) => f.endsWith(".afm"));
        console.log(`  📂 ${ruta}: ${archivos.length} archivos, tiene .afm: ${tieneAFM} (${archivosAFM.length} archivos .afm)`);
        if (tieneAFM) {
          fuenteRuta = ruta;
          console.log(`✅ Fuentes encontradas en: ${fuenteRuta}`);
          break;
        }
      } else {
        console.log(`  ❌ No existe: ${ruta}`);
      }
    } catch (error: any) {
      // Continuar con la siguiente ruta
      console.log(`  ❌ Error accediendo ${ruta}: ${error.message}`);
    }
  }

  // Si no encontramos, intentar búsqueda recursiva en node_modules
  if (!fuenteRuta) {
    console.log("🔍 Intentando búsqueda recursiva en node_modules...");
    const nodeModulesPaths = [
      path.join(process.cwd(), "node_modules"),
      "/var/task/node_modules",
    ];
    
    for (const nodeModulesPath of nodeModulesPaths) {
      if (fs.existsSync(nodeModulesPath)) {
        try {
          const pdfkitPath = path.join(nodeModulesPath, "pdfkit");
          if (fs.existsSync(pdfkitPath)) {
            // Buscar recursivamente en pdfkit
            const buscarRecursivo = (dir: string, depth: number = 0): string | null => {
              if (depth > 5) return null; // Limitar profundidad
              try {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                  const itemPath = path.join(dir, item);
                  const stat = fs.statSync(itemPath);
                  if (stat.isDirectory() && item === "data") {
                    // Verificar si tiene archivos .afm
                    const archivos = fs.readdirSync(itemPath);
                    if (archivos.some((f) => f.endsWith(".afm"))) {
                      return itemPath;
                    }
                  } else if (stat.isDirectory() && !item.startsWith(".")) {
                    const resultado = buscarRecursivo(itemPath, depth + 1);
                    if (resultado) return resultado;
                  }
                }
              } catch (error) {
                // Continuar
              }
              return null;
            };
            
            const encontrado = buscarRecursivo(pdfkitPath);
            if (encontrado) {
              fuenteRuta = encontrado;
              console.log(`✅ Fuentes encontradas (búsqueda recursiva) en: ${fuenteRuta}`);
              break;
            }
          }
        } catch (error) {
          // Continuar
        }
      }
    }
  }

  if (!fuenteRuta) {
    console.warn("⚠️ No se encontraron las fuentes de PDFKit en ninguna ubicación estándar.");
    console.warn(`   process.cwd(): ${process.cwd()}`);
    console.warn(`   __dirname: ${typeof __dirname !== 'undefined' ? __dirname : 'no disponible'}`);
    return null;
  }

  try {
    // Crear directorio temporal si no existe
    if (!fs.existsSync(TMP_FONT_DIR)) {
      fs.mkdirSync(TMP_FONT_DIR, { recursive: true });
    }

    // Copiar todos los archivos .afm y .icc a /tmp
    const archivos = fs.readdirSync(fuenteRuta);
    let copiados = 0;
    let yaExistentes = 0;
    
    for (const archivo of archivos) {
      if (archivo.endsWith(".afm") || archivo.endsWith(".icc")) {
        const destino = path.join(TMP_FONT_DIR, archivo);
        // Solo copiar si no existe
        if (!fs.existsSync(destino)) {
          try {
            const origen = path.join(fuenteRuta, archivo);
            fs.copyFileSync(origen, destino);
            copiados++;
          } catch (error) {
            console.warn(`⚠️ No se pudo copiar ${archivo}:`, error);
          }
        } else {
          yaExistentes++;
        }
      }
    }

    if (copiados > 0 || yaExistentes > 0) {
      if (copiados > 0) {
        console.log(`✅ ${copiados} archivos de fuentes copiados a ${TMP_FONT_DIR}`);
      }
      fuentesInicializadas = true;
      return TMP_FONT_DIR;
    }
  } catch (error) {
    console.error("❌ Error copiando fuentes a /tmp:", error);
  }

  return null;
}

/**
 * Encuentra la ruta de las fuentes de PDFKit (compatibilidad hacia atrás)
 * NOTA: NO inicializar aquí porque las fuentes se copian después del build
 */
function encontrarRutaFuentesPDFKit(): string | null {
  return inicializarFuentesPDFKit();
}

// NO inicializar las fuentes al cargar el módulo
// Se inicializarán la primera vez que se genere un PDF (runtime)

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
        // Inicializar fuentes (se copian a /tmp si es necesario)
        const rutaFuentes = inicializarFuentesPDFKit();
        
        if (!rutaFuentes) {
          return reject(new Error("No se pudieron inicializar las fuentes de PDFKit"));
        }

        // Guardar las funciones originales de fs
        const originalReadFileSync = fs.readFileSync;
        const originalReadFile = fs.readFile;
        const originalOpenSync = fs.openSync;
        const originalAccessSync = (fs as any).accessSync;
        const originalStatSync = (fs as any).statSync;
        
        // Patch de fs.readFileSync - interceptar todas las lecturas de archivos .afm e .icc
        (fs as any).readFileSync = function(filePath: string | Buffer | number, ...args: any[]): any {
          if (typeof filePath === 'string' && (filePath.endsWith('.afm') || filePath.endsWith('.icc'))) {
            const archivo = path.basename(filePath);
            const rutaDestino = path.join(rutaFuentes, archivo);
            
            // Siempre redirigir a /tmp donde copiamos las fuentes
            if (fs.existsSync(rutaDestino)) {
              return originalReadFileSync.call(fs, rutaDestino, ...args);
            }
            
            // Si no existe en /tmp, intentar la ruta original como fallback
            return originalReadFileSync.call(fs, filePath, ...args);
          }
          return originalReadFileSync.call(fs, filePath as any, ...args);
        };
        
        // Patch de fs.readFile (asíncrono)
        (fs as any).readFile = function(...args: any[]): any {
          const filePath = args[0];
          if (typeof filePath === 'string' && (filePath.endsWith('.afm') || filePath.endsWith('.icc'))) {
            const archivo = path.basename(filePath);
            const rutaDestino = path.join(rutaFuentes, archivo);
            
            if (fs.existsSync(rutaDestino)) {
              args[0] = rutaDestino;
            }
          }
          return (originalReadFile as any).apply(fs, args);
        };
        
        // Patch de fs.openSync
        (fs as any).openSync = function(...args: any[]): any {
          const filePath = args[0];
          if (typeof filePath === 'string' && (filePath.endsWith('.afm') || filePath.endsWith('.icc'))) {
            const archivo = path.basename(filePath);
            const rutaDestino = path.join(rutaFuentes, archivo);
            
            if (fs.existsSync(rutaDestino)) {
              args[0] = rutaDestino;
            }
          }
          return (originalOpenSync as any).apply(fs, args);
        };
        
        // Patch de fs.accessSync (usado para verificar existencia)
        if (originalAccessSync) {
          (fs as any).accessSync = function(...args: any[]): any {
            const filePath = args[0];
            if (typeof filePath === 'string' && (filePath.endsWith('.afm') || filePath.endsWith('.icc'))) {
              const archivo = path.basename(filePath);
              const rutaDestino = path.join(rutaFuentes, archivo);
              
              if (fs.existsSync(rutaDestino)) {
                args[0] = rutaDestino;
              }
            }
            return (originalAccessSync as any).apply(fs, args);
          };
        }
        
        // Patch de fs.statSync (usado para obtener información de archivos)
        if (originalStatSync) {
          (fs as any).statSync = function(...args: any[]): any {
            const filePath = args[0];
            if (typeof filePath === 'string' && (filePath.endsWith('.afm') || filePath.endsWith('.icc'))) {
              const archivo = path.basename(filePath);
              const rutaDestino = path.join(rutaFuentes, archivo);
              
              if (fs.existsSync(rutaDestino)) {
                args[0] = rutaDestino;
              }
            }
            return (originalStatSync as any).apply(fs, args);
          };
        }

        // Crear el documento PDF
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
        
        // Función para restaurar las funciones originales de fs
        const restaurarFs = () => {
          (fs as any).readFileSync = originalReadFileSync;
          (fs as any).readFile = originalReadFile;
          (fs as any).openSync = originalOpenSync;
          if (originalAccessSync) {
            (fs as any).accessSync = originalAccessSync;
          }
          if (originalStatSync) {
            (fs as any).statSync = originalStatSync;
          }
        };
        
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          restaurarFs();
          resolve(Buffer.concat(buffers));
        });
        doc.on("error", (error) => {
          restaurarFs();
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

        // ===== BANNER "DOCUMENTO DE PRUEBA" =====
        // Bien visible (no un detalle chico): nunca debe confundirse con un
        // remito fiscal real. Se refuerza además con una marca de agua
        // diagonal al final del documento.
        if (remito.esPrueba) {
          const bannerHeight = 24;
          doc
            .rect(50, currentY, pageWidth, bannerHeight)
            .fillAndStroke("#fee2e2", "#dc2626");

          doc
            .font("Helvetica-Bold")
            .fontSize(12)
            .fillColor("#991b1b")
            .text("DOCUMENTO DE PRUEBA — NO VÁLIDO COMO REMITO FISCAL", 50, currentY + 6, {
              width: pageWidth,
              align: "center",
            })
            .font("Helvetica")
            .fillColor(colorNegro);

          currentY = currentY + bannerHeight + 8;
        }

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

        // ===== CAI =====
        // Los remitos R (91) se autorizan con CAI (rango de numeración con
        // vencimiento único para todo el lote), nunca con CAE. Se muestra en
        // un recuadro propio, con el mismo peso visual que el resto de las
        // secciones del comprobante (no como un dato secundario).
        if (remito.cai) {
          const caiY = obsY + obsHeight + 5;
          const caiHeight = 30;

          doc
            .strokeColor(colorNegro)
            .lineWidth(0.5)
            .rect(50, caiY, pageWidth, caiHeight)
            .stroke();

          doc
            .font("Helvetica-Bold")
            .fontSize(11)
            .fillColor(colorNegro)
            .text(`CAI N°: ${remito.cai}`, 55, caiY + 9, { width: pageWidth / 2 })
            .text(
              `VENCIMIENTO CAI: ${remito.vencimientoCai ? this.formatearFecha(remito.vencimientoCai) : "-"}`,
              50 + pageWidth / 2,
              caiY + 9,
              { width: pageWidth / 2 - 5, align: "right" }
            )
            .font("Helvetica");
        }

        // ===== MARCA DE AGUA "DOCUMENTO DE PRUEBA" =====
        // Se dibuja encima de todo el contenido, con opacidad baja para no
        // tapar la lectura pero dejar clarísimo que no es un remito real.
        // IMPORTANTE: debe ir ANTES del pie de página — dibujar texto en la
        // franja del margen inferior (como hace el pie) puede disparar en
        // PDFKit un salto de página automático; si la marca de agua se
        // dibujara después, terminaría sola en una página en blanco en vez
        // de superpuesta al comprobante.
        if (remito.esPrueba) {
          doc.save();
          doc.opacity(0.15);
          doc.font("Helvetica-Bold").fontSize(60).fillColor("#dc2626");

          const centerX = doc.page.width / 2;
          const centerY = doc.page.height / 2;
          doc.rotate(-45, { origin: [centerX, centerY] });

          const watermarkText = "DOCUMENTO DE PRUEBA";
          const watermarkWidth = doc.widthOfString(watermarkText);
          doc.text(watermarkText, centerX - watermarkWidth / 2, centerY - 30, { lineBreak: false });

          doc.restore();
          doc.opacity(1);
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
