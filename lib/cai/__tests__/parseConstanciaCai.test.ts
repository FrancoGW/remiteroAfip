import { describe, it, expect } from "vitest";
import { parseTextoConstanciaCai, parseTablaComprobantes } from "../parseConstanciaCai";

// Fixture: texto tal como lo devuelve pdf-parse (getText) para una constancia
// real de CAI de AFIP (RG_100_constancia-cai). No se usa el PDF real ni se
// inserta nada en la base; es sólo texto de referencia para el test.
const TEXTO_CONSTANCIA_FIXTURE = `Contribuyente: FORESTAL ARGENTINA S. A.
C.U.I.T.: 30693787285
Fecha: 01/07/2026
Dependencia: 351
Aprobación: Total
CONSTANCIA DE CAI
2026 - AÑO DE LA GRANDEZA ARGENTINA
En el día de la fecha se ha autorizado el CAI N° : 52265219281893 con vencimiento 01/07/2027.
Tipo Comprobante Punto Cant. Nro. Nro.	Domicilio
Comprobantes solicitados
REMITO R 13 28001 31000
RUTA PROVINCIAL NRO. 22 - KM 81 0
3474 CHAVARRIA CORRIENTES 3000
CUIT/CUIL/DNI/LC/L Número Nombre y Apellido
Detalle de autorizados para gestionar la solicitud de impresión y retiro de los comprobantes
CUIT 30693787285 FORESTAL ARGENTINA S. A.`;

// Fixture: tabla tal como la devuelve pdf-parse (getTable) para la misma constancia.
const TABLA_COMPROBANTES_FIXTURE: string[][][] = [
  [
    ["Tipo Comprobante", "Punto", "Domicilio", "Cant.", "Nro.", "Nro."],
    [
      "REMITO R",
      "13",
      "RUTA PROVINCIAL NRO. 22 - KM 81 0\n3474 CHAVARRIA CORRIENTES",
      "3000",
      "28001",
      "31000",
    ],
    [
      "REMITO R",
      "12",
      "RUTA PROVINCIAL NRO. 22 - KM 4 0\n3423 CONCEPCION CORRIENTES",
      "3000",
      "43001",
      "46000",
    ],
    [
      "REMITO R",
      "1046",
      "1RA SECCION RURAL 0 3230 PASO\nDE LOS LIBRES CORRIENTES",
      "1000",
      "1451",
      "2450",
    ],
  ],
  [
    ["CUIT/CUIL/DNI/LC/L", "Número", "Nombre y Apellido"],
    ["CUIT", "30693787285", "FORESTAL ARGENTINA S. A."],
  ],
];

describe("parseTextoConstanciaCai", () => {
  it("extrae contribuyente, cuit, fechas y CAI de una constancia real", () => {
    const resultado = parseTextoConstanciaCai(TEXTO_CONSTANCIA_FIXTURE);

    expect(resultado.contribuyente).toBe("FORESTAL ARGENTINA S. A.");
    expect(resultado.cuit).toBe("30693787285");
    expect(resultado.fechaAutorizacion).toBe("2026-07-01");
    expect(resultado.cai).toBe("52265219281893");
    expect(resultado.fechaVencimiento).toBe("2027-07-01");
    expect(resultado.camposNoInterpretados).toEqual([]);
  });

  it("deja los campos vacíos (sin lanzar excepción) si el texto no matchea", () => {
    const resultado = parseTextoConstanciaCai("PDF escaneado sin texto reconocible");

    expect(resultado.contribuyente).toBeUndefined();
    expect(resultado.cuit).toBeUndefined();
    expect(resultado.cai).toBeUndefined();
    expect(resultado.fechaVencimiento).toBeUndefined();
    expect(resultado.camposNoInterpretados).toEqual(
      expect.arrayContaining(["contribuyente", "cuit", "fechaAutorizacion", "cai", "fechaVencimiento"])
    );
  });
});

describe("parseTablaComprobantes", () => {
  it("interpreta los 3 puntos de venta de la constancia de ejemplo", () => {
    const { puntos, camposNoInterpretados } = parseTablaComprobantes(TABLA_COMPROBANTES_FIXTURE);

    expect(camposNoInterpretados).toEqual([]);
    expect(puntos).toHaveLength(3);

    expect(puntos[0]).toEqual({
      tipoComprobante: 91,
      puntoVenta: 13,
      domicilio: "RUTA PROVINCIAL NRO. 22 - KM 81 0 3474 CHAVARRIA CORRIENTES",
      numeroDesde: 28001,
      numeroHasta: 31000,
    });
    expect(puntos[1]).toMatchObject({ puntoVenta: 12, numeroDesde: 43001, numeroHasta: 46000 });
    expect(puntos[2]).toMatchObject({ puntoVenta: 1046, numeroDesde: 1451, numeroHasta: 2450 });
  });

  it("marca 'puntos' como no interpretado si no encuentra la tabla de comprobantes", () => {
    const { puntos, camposNoInterpretados } = parseTablaComprobantes([
      [["CUIT/CUIL/DNI/LC/L", "Número", "Nombre y Apellido"]],
    ]);

    expect(puntos).toEqual([]);
    expect(camposNoInterpretados).toContain("puntos");
  });

  it("deja tipoComprobante sin definir si la fila no dice REMITO R", () => {
    const tabla: string[][][] = [
      [
        ["Tipo Comprobante", "Punto", "Domicilio", "Cant.", "Nro.", "Nro."],
        ["FACTURA A", "5", "Calle Falsa 123", "100", "1", "100"],
      ],
    ];

    const { puntos, camposNoInterpretados } = parseTablaComprobantes(tabla);

    expect(puntos[0].tipoComprobante).toBeUndefined();
    expect(puntos[0].puntoVenta).toBe(5);
    expect(camposNoInterpretados).toContain("puntos[0].tipoComprobante");
  });
});
