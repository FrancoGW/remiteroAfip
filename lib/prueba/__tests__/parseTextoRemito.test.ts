import { describe, it, expect } from "vitest";
import { parseTextoRemitoPrueba, aplicarResultadoParseo } from "../parseTextoRemito";
import { Remito } from "@/lib/types/remito";

// Bloque de ejemplo literal provisto por el usuario para probar el parser.
const TEXTO_EJEMPLO = `--- DATOS DEL REMITO (fuente: Nº 01046-00001174) ---

Emisor
CUIT emisor: 30693787285
Predio: D'Oliveira
Rodal: 907
Domicilio origen: 1ra Sección Rural - Predio D'Oliveira, Paso de los Lib

Cliente / Receptor
Nombre receptor: Cliente de Prueba SA
Domicilio receptor: J.J. Urquiza 157
CUIT receptor: 30-71448132-7
Condición IVA: RESPONSABLE INSCRIPTO

Carga
Lugar de descarga: Concepción del Uruguay
Producto: Aserrable
Categoría: Premium
Especie: Pino
Largo: 4.90
M3 Stereo: 58.20
Peso bruto / Tara / Peso neto: (en blanco en el original)
Balanza: (en blanco en el original)

Transporte
Transporte: Don Nicolás
Conductor: Miguel Herrera
DNI conductor: 31417319
Camión patente: AF049GB
Acoplado patente: AF21KD

Fecha/hora emisión original: 07/07/2026 07:40`;

describe("parseTextoRemitoPrueba", () => {
  it("mapea correctamente todos los campos reconocidos del ejemplo real", () => {
    const resultado = parseTextoRemitoPrueba(TEXTO_EJEMPLO);

    expect(resultado.formData).toEqual({
      cuitEmisor: "30693787285",
      predio: "D'Oliveira",
      rodal: "907",
      origenDomicilio: "1ra Sección Rural - Predio D'Oliveira, Paso de los Lib",
      nombreReceptor: "Cliente de Prueba SA",
      domicilioReceptor: "J.J. Urquiza 157",
      cuitReceptor: "30714481327",
      condicionIva: "RESPONSABLE INSCRIPTO",
      destinoLocalidad: "Concepción del Uruguay",
      nombreTransportista: "Don Nicolás",
      conductor: "Miguel Herrera",
      dniConductor: "31417319",
      dominioVehiculo: "AF049GB",
      dominioAcoplado: "AF21KD",
    });

    expect(resultado.item).toEqual({
      descripcion: "Aserrable",
      categoria: "Premium",
      especie: "Pino",
      largo: "4.90",
      m3Stereo: "58.20",
      balanza: "", // reconocido, pero marcado "(en blanco en el original)" -> queda vacío, no escribe el placeholder
    });
  });

  it("dos líneas quedan sin reconocer: la línea de fuente/separador ya se ignora, pero el combo peso bruto/tara/peso neto y la fecha original no matchean ningún campo", () => {
    const resultado = parseTextoRemitoPrueba(TEXTO_EJEMPLO);

    expect(resultado.noReconocidas).toEqual([
      "Peso bruto / Tara / Peso neto",
      "Fecha/hora emisión original",
    ]);
  });

  it("deja vacío (no escribe el texto placeholder) un campo marcado como 'en blanco en el original'", () => {
    const texto = `Balanza: (en blanco en el original)`;
    const resultado = parseTextoRemitoPrueba(texto);
    expect(resultado.item.balanza).toBe("");
  });

  it("ignora encabezados de sección sin ':' y líneas separadoras sin romper el parseo", () => {
    const texto = `--- separador ---
Emisor
Cliente / Receptor
CUIT emisor: 30693787285`;
    const resultado = parseTextoRemitoPrueba(texto);
    expect(resultado.formData).toEqual({ cuitEmisor: "30693787285" });
    expect(resultado.noReconocidas).toEqual([]);
  });

  it("ignora silenciosamente una etiqueta desconocida sin romper el resto del parseo", () => {
    const texto = `Campo Inventado: algo
CUIT emisor: 30693787285`;
    const resultado = parseTextoRemitoPrueba(texto);
    expect(resultado.formData.cuitEmisor).toBe("30693787285");
    expect(resultado.noReconocidas).toEqual(["Campo Inventado"]);
  });
});

describe("aplicarResultadoParseo", () => {
  const formDataBase: Remito = {
    puntoVenta: 1,
    fechaEmision: "2026-07-07",
    codigoTipoRemito: 1,
    cuitEmisor: "20000000001",
    cuitReceptor: "",
    nombreReceptor: "",
    domicilioReceptor: "",
    predio: "",
    rodal: "",
    condicionIva: "RESPONSABLE INSCRIPTO",
    tipoTransporte: 1,
    origenDomicilio: "",
    origenLocalidad: "",
    origenProvincia: "Buenos Aires",
    origenCodigoPostal: "",
    destinoDomicilio: "",
    destinoLocalidad: "",
    destinoProvincia: "Buenos Aires",
    destinoCodigoPostal: "",
    items: [
      { codigo: "", descripcion: "", cantidad: 1, unidadMedida: "UN" },
    ],
    observaciones: "",
    esPrueba: true,
  };

  it("aplica el texto pegado de ejemplo sobre un formulario en blanco, sin tocar campos no mencionados", () => {
    const resultado = parseTextoRemitoPrueba(TEXTO_EJEMPLO);
    const nuevo = aplicarResultadoParseo(formDataBase, resultado);

    expect(nuevo.cuitEmisor).toBe("30693787285");
    expect(nuevo.predio).toBe("D'Oliveira");
    expect(nuevo.rodal).toBe("907");
    expect(nuevo.origenDomicilio).toBe("1ra Sección Rural - Predio D'Oliveira, Paso de los Lib");
    expect(nuevo.nombreReceptor).toBe("Cliente de Prueba SA");
    expect(nuevo.domicilioReceptor).toBe("J.J. Urquiza 157");
    expect(nuevo.cuitReceptor).toBe("30714481327");
    expect(nuevo.condicionIva).toBe("RESPONSABLE INSCRIPTO");
    expect(nuevo.destinoLocalidad).toBe("Concepción del Uruguay");
    expect(nuevo.nombreTransportista).toBe("Don Nicolás");
    expect(nuevo.conductor).toBe("Miguel Herrera");
    expect(nuevo.dniConductor).toBe("31417319");
    expect(nuevo.dominioVehiculo).toBe("AF049GB");
    expect(nuevo.dominioAcoplado).toBe("AF21KD");

    expect(nuevo.items[0]).toMatchObject({
      descripcion: "Aserrable",
      categoria: "Premium",
      especie: "Pino",
      largo: 4.9,
      m3Stereo: 58.2,
      balanza: "",
    });

    // Campos no mencionados en el texto quedan intactos (el usuario los completa a mano)
    expect(nuevo.items[0].codigo).toBe("");
    expect(nuevo.items[0].cantidad).toBe(1);
    expect(nuevo.puntoVenta).toBe(1);
    expect(nuevo.origenProvincia).toBe("Buenos Aires");

    // No muta el objeto original
    expect(formDataBase.cuitEmisor).toBe("20000000001");
  });
});
