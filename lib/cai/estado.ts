import { CaiAutorizacion, CaiEstadoCalculado, DIAS_ALERTA_VENCIMIENTO, PORCENTAJE_ALERTA_AGOTAMIENTO } from "@/lib/types/cai";

/**
 * Calcula el estado "efectivo" de un CAI para mostrar en el panel.
 * El campo `estado` en la base sólo distingue activo/cancelado (control manual);
 * vencido/agotado/por_vencer/por_agotarse se derivan de la fecha y los rangos
 * en el momento de la consulta, para que nunca queden desactualizados.
 */
export function calcularEstadoCai(cai: CaiAutorizacion, ahora: Date = new Date()): CaiEstadoCalculado {
  if (cai.estado === "cancelado") return "cancelado";

  const vencimiento = new Date(cai.fechaVencimiento);
  if (vencimiento < ahora) return "vencido";

  const todosAgotados = cai.puntos.every((p) => p.proximoNumero > p.numeroHasta);
  if (todosAgotados) return "agotado";

  const diasParaVencer = (vencimiento.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24);
  if (diasParaVencer <= DIAS_ALERTA_VENCIMIENTO) return "por_vencer";

  const algunoPorAgotarse = cai.puntos.some((p) => {
    if (p.proximoNumero > p.numeroHasta) return false; // ya agotado, no "por agotarse"
    const total = p.numeroHasta - p.numeroDesde + 1;
    const restantes = p.numeroHasta - p.proximoNumero + 1;
    return total > 0 && restantes / total <= PORCENTAJE_ALERTA_AGOTAMIENTO;
  });
  if (algunoPorAgotarse) return "por_agotarse";

  return "activo";
}

export function calcularEstadoPunto(
  punto: { numeroDesde: number; numeroHasta: number; proximoNumero: number },
  caiVencido: boolean
): "activo" | "por_agotarse" | "agotado" | "vencido" {
  if (caiVencido) return "vencido";
  if (punto.proximoNumero > punto.numeroHasta) return "agotado";
  const total = punto.numeroHasta - punto.numeroDesde + 1;
  const restantes = punto.numeroHasta - punto.proximoNumero + 1;
  if (total > 0 && restantes / total <= PORCENTAJE_ALERTA_AGOTAMIENTO) return "por_agotarse";
  return "activo";
}
