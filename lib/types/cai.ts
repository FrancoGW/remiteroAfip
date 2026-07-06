// CAI (Código de Autorización de Impresión) — numeración de remitos por RG AFIP
//
// A diferencia del CAE (WSFEv1), el CAI autoriza un RANGO completo de
// numeración por punto de venta, con un único vencimiento para todo el lote.
// No hay validación en tiempo real contra un webservice: la numeración se
// controla íntegramente en esta aplicación.

export interface CaiPunto {
  puntoVenta: number;
  domicilio: string;
  tipoComprobante: number; // 91 = Remito R
  numeroDesde: number;
  numeroHasta: number;
  proximoNumero: number; // próximo número a asignar dentro del rango
}

// Estado que el usuario controla manualmente desde el panel.
// Los estados "vencido" y "agotado" NO se persisten: se calculan al vuelo
// (ver lib/cai/estado.ts) a partir de fechaVencimiento/proximoNumero, para
// evitar que queden desactualizados si nadie corre un job periódico.
export type CaiEstado = "activo" | "cancelado";

export interface CaiAutorizacion {
  id?: string;
  cai: string;
  cuit: string;
  contribuyente?: string;
  fechaAutorizacion: string; // YYYY-MM-DD
  fechaVencimiento: string; // YYYY-MM-DD
  estado: CaiEstado;
  puntos: CaiPunto[];
  createdAt?: string;
  updatedAt?: string;
}

// Estado calculado por punto/CAI para mostrar en el panel (badges, alertas)
export type CaiEstadoCalculado =
  | "activo"
  | "por_vencer"
  | "por_agotarse"
  | "vencido"
  | "agotado"
  | "cancelado";

export const CBTE_TIPO_REMITO_R = 91;

export const DIAS_ALERTA_VENCIMIENTO = 30;
export const PORCENTAJE_ALERTA_AGOTAMIENTO = 0.1; // <10% de números restantes
