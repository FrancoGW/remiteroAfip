// Parser de "pegar datos" para Remito de Prueba. Formato esperado: texto
// libre con líneas "Etiqueta: valor" (encabezados de sección sin ":" y
// líneas separadoras "---..." se ignoran). Exclusivo del flujo de prueba —
// no se usa para remitos reales.

import { Remito, RemitoItem } from "@/lib/types/remito";

export type CampoFormData =
  | "cuitEmisor"
  | "predio"
  | "rodal"
  | "origenDomicilio"
  | "nombreReceptor"
  | "domicilioReceptor"
  | "cuitReceptor"
  | "condicionIva"
  | "destinoLocalidad"
  | "nombreTransportista"
  | "conductor"
  | "dniConductor"
  | "dominioVehiculo"
  | "dominioAcoplado";

export type CampoItem = "descripcion" | "categoria" | "especie" | "largo" | "m3Stereo" | "balanza";

export interface ResultadoParseoTexto {
  /** Campos del remito (nivel superior). Sólo incluye las etiquetas reconocidas presentes en el texto. */
  formData: Partial<Record<CampoFormData, string>>;
  /** Campos del primer (único) ítem del remito de prueba. */
  item: Partial<Record<CampoItem, string>>;
  /** Etiquetas del texto pegado que no matchean ningún campo conocido. */
  noReconocidas: string[];
}

const MAPEO_CAMPOS: Record<string, { destino: "formData" | "item"; campo: CampoFormData | CampoItem }> = {
  "cuit emisor": { destino: "formData", campo: "cuitEmisor" },
  predio: { destino: "formData", campo: "predio" },
  rodal: { destino: "formData", campo: "rodal" },
  "domicilio origen": { destino: "formData", campo: "origenDomicilio" },
  "nombre receptor": { destino: "formData", campo: "nombreReceptor" },
  "domicilio receptor": { destino: "formData", campo: "domicilioReceptor" },
  "cuit receptor": { destino: "formData", campo: "cuitReceptor" },
  "condicion iva": { destino: "formData", campo: "condicionIva" },
  "lugar de descarga": { destino: "formData", campo: "destinoLocalidad" },
  producto: { destino: "item", campo: "descripcion" },
  categoria: { destino: "item", campo: "categoria" },
  especie: { destino: "item", campo: "especie" },
  largo: { destino: "item", campo: "largo" },
  "m3 stereo": { destino: "item", campo: "m3Stereo" },
  balanza: { destino: "item", campo: "balanza" },
  transporte: { destino: "formData", campo: "nombreTransportista" },
  conductor: { destino: "formData", campo: "conductor" },
  "dni conductor": { destino: "formData", campo: "dniConductor" },
  "camion patente": { destino: "formData", campo: "dominioVehiculo" },
  "acoplado patente": { destino: "formData", campo: "dominioAcoplado" },
};

const CAMPOS_CUIT = new Set<string>(["cuitEmisor", "cuitReceptor"]);

function normalizarEtiqueta(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos (Condición -> Condicion)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function esValorEnBlanco(valor: string): boolean {
  return valor === "" || /en blanco en el original/i.test(valor);
}

export function parseTextoRemitoPrueba(texto: string): ResultadoParseoTexto {
  const formData: Partial<Record<CampoFormData, string>> = {};
  const item: Partial<Record<CampoItem, string>> = {};
  const noReconocidas: string[] = [];

  const lineas = texto.split(/\r?\n/);

  for (const lineaRaw of lineas) {
    const linea = lineaRaw.trim();
    if (!linea) continue;
    if (linea.startsWith("---")) continue;

    const idx = linea.indexOf(":");
    if (idx === -1) continue; // encabezado de sección (ej. "Emisor", "Carga"): se ignora en silencio

    const etiquetaRaw = linea.slice(0, idx).trim();
    const valorRaw = linea.slice(idx + 1).trim();

    const mapeo = MAPEO_CAMPOS[normalizarEtiqueta(etiquetaRaw)];
    if (!mapeo) {
      noReconocidas.push(etiquetaRaw);
      continue;
    }

    const enBlanco = esValorEnBlanco(valorRaw);
    let valorLimpio = enBlanco ? "" : valorRaw;

    if (!enBlanco && CAMPOS_CUIT.has(mapeo.campo)) {
      valorLimpio = valorLimpio.replace(/\D/g, "");
    }

    if (mapeo.destino === "item") {
      item[mapeo.campo as CampoItem] = valorLimpio;
    } else {
      formData[mapeo.campo as CampoFormData] = valorLimpio;
    }
  }

  return { formData, item, noReconocidas };
}

/**
 * Aplica un ResultadoParseoTexto sobre un Remito existente (el formData del
 * formulario), devolviendo un nuevo objeto sin mutar el original. Sólo toca
 * los campos presentes en el resultado del parseo; el resto del formulario
 * queda intacto para que el usuario lo revise/complete a mano.
 */
export function aplicarResultadoParseo(prev: Remito, resultado: ResultadoParseoTexto): Remito {
  const nuevosItems = [...prev.items];
  const itemActual: RemitoItem = { ...nuevosItems[0] };

  if (resultado.item.descripcion !== undefined) itemActual.descripcion = resultado.item.descripcion;
  if (resultado.item.categoria !== undefined) itemActual.categoria = resultado.item.categoria;
  if (resultado.item.especie !== undefined) itemActual.especie = resultado.item.especie;
  if (resultado.item.balanza !== undefined) itemActual.balanza = resultado.item.balanza;
  if (resultado.item.largo !== undefined) {
    itemActual.largo = resultado.item.largo === "" ? undefined : parseFloat(resultado.item.largo);
  }
  if (resultado.item.m3Stereo !== undefined) {
    itemActual.m3Stereo = resultado.item.m3Stereo === "" ? undefined : parseFloat(resultado.item.m3Stereo);
  }
  nuevosItems[0] = itemActual;

  return {
    ...prev,
    ...resultado.formData,
    items: nuevosItems,
  };
}
