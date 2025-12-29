/**
 * Script de ejemplo para generar una factura usando los datos del formulario forestal
 * 
 * Uso:
 * node scripts/generar-factura-ejemplo.js
 * 
 * O desde el navegador/Postman:
 * POST http://localhost:3000/api/tusfacturas/generar-factura-ejemplo
 * Body (JSON):
 * {
 *   "cuitEmisor": "20123456789",
 *   "cuitCliente": "20987654321",
 *   "precioPorTonelada": 50000
 * }
 */

// Ejemplo de datos del formulario forestal (basado en la imagen)
const datosFormularioEjemplo = {
  puntoVenta: 13,
  fechaEmision: "2025-12-16",
  cliente: "FEPAL S.A.",
  cuitCliente: "20987654321", // Reemplazar con el CUIT real de FEPAL S.A.
  producto: "Aserrable",
  especie: "Pino",
  categoria: "Super Grueso",
  subCategoria: "Super Grueso",
  toneladas: 29.44,
  m3: 44.44,
  largos: 3.15,
  precioPorTonelada: 50000, // Precio por tonelada (ajustar según corresponda)
  precioPorM3: 35000, // Precio por M3 (alternativa)
  cuitEmisor: "20123456789", // Reemplazar con tu CUIT
  domicilioCliente: "Dirección del cliente",
  observaciones: "Remito: 23944",
  tipoComprobante: 1, // 1: Factura A, 6: Factura B
};

console.log("📄 Datos del formulario para generar factura:");
console.log(JSON.stringify(datosFormularioEjemplo, null, 2));

console.log("\n📡 Para generar la factura, hacer POST a:");
console.log("http://localhost:3000/api/tusfacturas/generar-factura-ejemplo");
console.log("\nCon el siguiente body:");
console.log(JSON.stringify(datosFormularioEjemplo, null, 2));


