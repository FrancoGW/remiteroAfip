export interface Remito {
  id?: string;
  cae?: string;
  vencimientoCae?: string;
  numeroRemito?: number;
  puntoVenta: number;
  fechaEmision: string;
  codigoTipoRemito: number; // 1: Remito, 2: Remito Primario, etc.
  
  // Emisor
  cuitEmisor: string;
  nombreEmisor?: string;
  
  // Receptor
  cuitReceptor: string;
  nombreReceptor: string;
  domicilioReceptor: string;
  
  // Transporte
  tipoTransporte: number; // 1: Propio, 2: Tercero
  cuitTransportista?: string;
  nombreTransportista?: string;
  dominioVehiculo?: string;
  
  // Origen y destino
  origenDomicilio: string;
  origenLocalidad: string;
  origenProvincia: string;
  origenCodigoPostal: string;
  
  destinoDomicilio: string;
  destinoLocalidad: string;
  destinoProvincia: string;
  destinoCodigoPostal: string;
  
  // Items del remito
  items: RemitoItem[];
  
  // Observaciones
  observaciones?: string;
  
  // Estado
  estado?: "draft" | "pending" | "approved" | "rejected";
  fechaCreacion?: string;
}

export interface RemitoItem {
  id?: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: string; // KG, UN, LT, etc.
  pesoNeto?: number;
  pesoBruto?: number;
}

export interface AfipResponse {
  success: boolean;
  cae?: string;
  vencimientoCae?: string;
  numeroRemito?: number;
  observaciones?: string[];
  errores?: string[];
  message?: string;
}

// El SDK de AFIP maneja automáticamente la autenticación
// No necesitamos definir este tipo manualmente

export const TIPOS_REMITO = [
  { value: 1, label: "Remito R" },
  { value: 2, label: "Remito Primario" },
];

export const TIPOS_TRANSPORTE = [
  { value: 1, label: "Propio" },
  { value: 2, label: "Tercero" },
];

export const UNIDADES_MEDIDA = [
  { value: "KG", label: "Kilogramo" },
  { value: "UN", label: "Unidad" },
  { value: "LT", label: "Litro" },
  { value: "MT", label: "Metro" },
  { value: "M2", label: "Metro Cuadrado" },
  { value: "M3", label: "Metro Cúbico" },
];

export const PROVINCIAS_ARGENTINA = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

