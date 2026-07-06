import { PDFParse } from "pdf-parse";
import { CBTE_TIPO_REMITO_R } from "@/lib/types/cai";

export interface CaiParseadoPunto {
  puntoVenta?: number;
  domicilio?: string;
  tipoComprobante?: number;
  numeroDesde?: number;
  numeroHasta?: number;
}

export interface CaiParseado {
  cai?: string;
  cuit?: string;
  contribuyente?: string;
  fechaAutorizacion?: string; // YYYY-MM-DD
  fechaVencimiento?: string; // YYYY-MM-DD
  puntos: CaiParseadoPunto[];
  /** Campos que no se pudieron interpretar automáticamente; el usuario debe completarlos/revisarlos a mano. */
  camposNoInterpretados: string[];
}

function fechaDDMMYYYYaISO(fecha: string): string | undefined {
  const match = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return undefined;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function normalizarEspacios(texto: string): string {
  return texto.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Ubica en el resultado de getTable() la tabla "Comprobantes solicitados"
 * (identificada por su fila de encabezado, que incluye "Tipo Comprobante"),
 * y devuelve los índices de columna correspondientes a cada dato.
 * Tolera variaciones de orden de columnas dentro de lo razonable.
 */
function ubicarColumnas(header: string[]) {
  const norm = header.map((h) => (h || "").trim().toLowerCase());
  const tipoIdx = norm.findIndex((h) => h.includes("tipo comprobante"));
  const puntoIdx = norm.findIndex((h) => h.includes("punto"));
  const domicilioIdx = norm.findIndex((h) => h.includes("domicilio"));
  const cantIdx = norm.findIndex((h) => h.includes("cant"));
  const nroIdxs = norm.reduce<number[]>((acc, h, i) => {
    if (h.includes("nro")) acc.push(i);
    return acc;
  }, []);
  return {
    tipoIdx,
    puntoIdx,
    domicilioIdx,
    cantIdx,
    desdeIdx: nroIdxs[0],
    hastaIdx: nroIdxs[1],
  };
}

/**
 * Parsea el texto plano de una constancia de CAI de AFIP.
 * No lanza excepción si falta algún campo: lo deja `undefined` y lo agrega
 * a `camposNoInterpretados` para que el usuario lo revise en el formulario
 * de previsualización antes de guardar.
 */
export function parseTextoConstanciaCai(texto: string): Pick<
  CaiParseado,
  "cai" | "cuit" | "contribuyente" | "fechaAutorizacion" | "fechaVencimiento"
> & { camposNoInterpretados: string[] } {
  const camposNoInterpretados: string[] = [];

  const contribuyenteMatch = texto.match(/Contribuyente:\s*(.+)/);
  const contribuyente = contribuyenteMatch?.[1]?.trim();
  if (!contribuyente) camposNoInterpretados.push("contribuyente");

  const cuitMatch = texto.match(/C\.?\s*U\.?\s*I\.?\s*T\.?\s*:\s*([\d.\-]{8,15})/i);
  const cuit = cuitMatch?.[1]?.replace(/[.\-]/g, "");
  if (!cuit) camposNoInterpretados.push("cuit");

  const fechaAutMatch = texto.match(/Fecha:\s*(\d{2}\/\d{2}\/\d{4})/);
  const fechaAutorizacion = fechaAutMatch ? fechaDDMMYYYYaISO(fechaAutMatch[1]) : undefined;
  if (!fechaAutorizacion) camposNoInterpretados.push("fechaAutorizacion");

  const caiVtoMatch = texto.match(
    /CAI\s*N°?\s*:?\s*(\d+)\s*con vencimiento\s*(\d{2}\/\d{2}\/\d{4})/i
  );
  const cai = caiVtoMatch?.[1];
  const fechaVencimiento = caiVtoMatch ? fechaDDMMYYYYaISO(caiVtoMatch[2]) : undefined;
  if (!cai) camposNoInterpretados.push("cai");
  if (!fechaVencimiento) camposNoInterpretados.push("fechaVencimiento");

  return { cai, cuit, contribuyente, fechaAutorizacion, fechaVencimiento, camposNoInterpretados };
}

export function parseTablaComprobantes(tablas: string[][][]): {
  puntos: CaiParseadoPunto[];
  camposNoInterpretados: string[];
} {
  const camposNoInterpretados: string[] = [];

  const tabla = tablas.find((t) => t[0]?.some((h) => /tipo comprobante/i.test(h || "")));
  if (!tabla || tabla.length < 2) {
    camposNoInterpretados.push("puntos");
    return { puntos: [], camposNoInterpretados };
  }

  const { tipoIdx, puntoIdx, domicilioIdx, desdeIdx, hastaIdx } = ubicarColumnas(tabla[0]);

  const puntos: CaiParseadoPunto[] = tabla.slice(1).map((row, i) => {
    const punto: CaiParseadoPunto = {};

    const tipoTexto = tipoIdx >= 0 ? row[tipoIdx] : undefined;
    if (tipoTexto && /REMITO\s*R\b/i.test(tipoTexto)) {
      punto.tipoComprobante = CBTE_TIPO_REMITO_R;
    } else {
      camposNoInterpretados.push(`puntos[${i}].tipoComprobante`);
    }

    const puntoVenta = puntoIdx >= 0 ? parseInt(row[puntoIdx], 10) : NaN;
    if (!isNaN(puntoVenta)) punto.puntoVenta = puntoVenta;
    else camposNoInterpretados.push(`puntos[${i}].puntoVenta`);

    const domicilio = domicilioIdx >= 0 ? row[domicilioIdx] : undefined;
    if (domicilio) punto.domicilio = normalizarEspacios(domicilio);
    else camposNoInterpretados.push(`puntos[${i}].domicilio`);

    const numeroDesde = desdeIdx !== undefined && desdeIdx >= 0 ? parseInt(row[desdeIdx], 10) : NaN;
    if (!isNaN(numeroDesde)) punto.numeroDesde = numeroDesde;
    else camposNoInterpretados.push(`puntos[${i}].numeroDesde`);

    const numeroHasta = hastaIdx !== undefined && hastaIdx >= 0 ? parseInt(row[hastaIdx], 10) : NaN;
    if (!isNaN(numeroHasta)) punto.numeroHasta = numeroHasta;
    else camposNoInterpretados.push(`puntos[${i}].numeroHasta`);

    return punto;
  });

  return { puntos, camposNoInterpretados };
}

export async function parseConstanciaCai(buffer: Buffer): Promise<CaiParseado> {
  const parser = new PDFParse({ data: buffer });

  try {
    const textResult = await parser.getText();
    const campos = parseTextoConstanciaCai(textResult.text);

    let puntos: CaiParseadoPunto[] = [];
    let camposTabla: string[] = [];
    try {
      const tableResult = await parser.getTable();
      const tablas = tableResult.pages.flatMap((p) => p.tables ?? []);
      const resultado = parseTablaComprobantes(tablas);
      puntos = resultado.puntos;
      camposTabla = resultado.camposNoInterpretados;
    } catch {
      camposTabla = ["puntos"];
    }

    return {
      ...campos,
      puntos,
      camposNoInterpretados: [...campos.camposNoInterpretados, ...camposTabla],
    };
  } finally {
    await parser.destroy();
  }
}
