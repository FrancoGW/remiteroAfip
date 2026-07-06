"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Ban, Pencil, Save, X } from "lucide-react";
import { CaiAutorizacion, CaiEstadoCalculado } from "@/lib/types/cai";

interface CaiConEstado extends CaiAutorizacion {
  estadoCalculado: CaiEstadoCalculado;
  puntos: (CaiAutorizacion["puntos"][number] & { estadoCalculado: string })[];
}

const BADGE_ESTILOS: Record<string, string> = {
  activo: "bg-green-100 text-green-800",
  por_vencer: "bg-yellow-100 text-yellow-800",
  por_agotarse: "bg-yellow-100 text-yellow-800",
  vencido: "bg-red-100 text-red-800",
  agotado: "bg-red-100 text-red-800",
  cancelado: "bg-gray-200 text-gray-700",
};

const BADGE_TEXTO: Record<string, string> = {
  activo: "Activo",
  por_vencer: "Por vencer",
  por_agotarse: "Por agotarse",
  vencido: "Vencido",
  agotado: "Agotado",
  cancelado: "Cancelado",
};

function Badge({ estado }: { estado: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${BADGE_ESTILOS[estado] || "bg-gray-100 text-gray-800"}`}>
      {BADGE_TEXTO[estado] || estado}
    </span>
  );
}

export default function CaiList() {
  const [cais, setCais] = useState<CaiConEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [editandoVencimiento, setEditandoVencimiento] = useState<string | null>(null);
  const [nuevoVencimiento, setNuevoVencimiento] = useState("");

  const cargar = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cai");
      const data = await response.json();
      if (data.success) {
        setCais(data.cais);
      } else {
        setError(data.error || "Error al cargar los CAI");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar los CAI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const cancelarCai = async (id: string) => {
    if (!confirm("¿Dar de baja este CAI? Ya no se usará para asignar numeración a remitos.")) return;
    const response = await fetch(`/api/cai/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "cancelado" }),
    });
    const data = await response.json();
    if (data.success) cargar();
    else alert(data.error || "No se pudo dar de baja el CAI");
  };

  const guardarVencimiento = async (id: string) => {
    const response = await fetch(`/api/cai/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fechaVencimiento: nuevoVencimiento }),
    });
    const data = await response.json();
    if (data.success) {
      setEditandoVencimiento(null);
      cargar();
    } else {
      alert(data.error || "No se pudo actualizar la fecha de vencimiento");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">{error}</div>;
  }

  if (cais.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay CAI cargados todavía. Usá &quot;Nuevo CAI&quot; para dar de alta el primero.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cais.map((cai) => (
        <div key={cai.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <div
            className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-gray-50"
            onClick={() => setExpandido(expandido === cai.id ? null : cai.id!)}
          >
            <div className="flex items-center gap-3">
              {expandido === cai.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <div>
                <p className="font-medium text-gray-900">CAI {cai.cai}</p>
                <p className="text-sm text-gray-500">
                  {cai.contribuyente ? `${cai.contribuyente} · ` : ""}
                  CUIT {cai.cuit} · Vence {cai.fechaVencimiento}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge estado={cai.estadoCalculado} />
              {cai.estado !== "cancelado" && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditandoVencimiento(cai.id!);
                      setNuevoVencimiento(cai.fechaVencimiento);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar vencimiento"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelarCai(cai.id!);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Dar de baja"
                  >
                    <Ban size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {editandoVencimiento === cai.id && (
            <div className="p-4 bg-blue-50 border-t border-blue-100 flex items-center gap-3">
              <label className="text-sm text-blue-900">Nueva fecha de vencimiento:</label>
              <input
                type="date"
                value={nuevoVencimiento}
                onChange={(e) => setNuevoVencimiento(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={() => guardarVencimiento(cai.id!)}
                className="p-1.5 text-green-700 hover:bg-green-100 rounded-lg"
                title="Guardar"
              >
                <Save size={16} />
              </button>
              <button
                onClick={() => setEditandoVencimiento(null)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Cancelar"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {expandido === cai.id && (
            <div className="border-t border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-2">Punto</th>
                    <th className="text-left px-4 py-2">Domicilio</th>
                    <th className="text-left px-4 py-2">Tipo</th>
                    <th className="text-left px-4 py-2">Rango</th>
                    <th className="text-left px-4 py-2">Usados</th>
                    <th className="text-left px-4 py-2">Disponibles</th>
                    <th className="text-left px-4 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cai.puntos.map((p, i) => {
                    const total = p.numeroHasta - p.numeroDesde + 1;
                    const usados = Math.max(0, Math.min(p.proximoNumero - p.numeroDesde, total));
                    const disponibles = Math.max(0, p.numeroHasta - p.proximoNumero + 1);
                    return (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-4 py-2">{p.puntoVenta}</td>
                        <td className="px-4 py-2">{p.domicilio}</td>
                        <td className="px-4 py-2">{p.tipoComprobante === 91 ? "Remito R" : p.tipoComprobante}</td>
                        <td className="px-4 py-2">
                          {p.numeroDesde} - {p.numeroHasta}
                        </td>
                        <td className="px-4 py-2">{usados}</td>
                        <td className="px-4 py-2">{disponibles}</td>
                        <td className="px-4 py-2">
                          <Badge estado={p.estadoCalculado} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
