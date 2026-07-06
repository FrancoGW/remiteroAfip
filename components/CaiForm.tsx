"use client";

import { useState } from "react";
import { Plus, Minus, Save, Loader2 } from "lucide-react";
import { CBTE_TIPO_REMITO_R } from "@/lib/types/cai";

export interface CaiFormPunto {
  puntoVenta: string;
  domicilio: string;
  tipoComprobante: string;
  numeroDesde: string;
  numeroHasta: string;
}

export interface CaiFormData {
  cai: string;
  cuit: string;
  contribuyente: string;
  fechaAutorizacion: string;
  fechaVencimiento: string;
  puntos: CaiFormPunto[];
}

const puntoVacio = (): CaiFormPunto => ({
  puntoVenta: "",
  domicilio: "",
  tipoComprobante: String(CBTE_TIPO_REMITO_R),
  numeroDesde: "",
  numeroHasta: "",
});

export const datosVacios = (): CaiFormData => ({
  cai: "",
  cuit: "",
  contribuyente: "",
  fechaAutorizacion: new Date().toISOString().split("T")[0],
  fechaVencimiento: "",
  puntos: [puntoVacio()],
});

interface CaiFormProps {
  initialData: CaiFormData;
  camposNoInterpretados?: string[];
  onSaved?: () => void;
}

export default function CaiForm({ initialData, camposNoInterpretados = [], onSaved }: CaiFormProps) {
  const [formData, setFormData] = useState<CaiFormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [errores, setErrores] = useState<string[]>([]);

  const campoConAviso = (nombre: string) => camposNoInterpretados.includes(nombre);

  const handleChange = (field: keyof CaiFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePuntoChange = (index: number, field: keyof CaiFormPunto, value: string) => {
    const puntos = [...formData.puntos];
    puntos[index] = { ...puntos[index], [field]: value };
    setFormData((prev) => ({ ...prev, puntos }));
  };

  const addPunto = () => {
    setFormData((prev) => ({ ...prev, puntos: [...prev.puntos, puntoVacio()] }));
  };

  const removePunto = (index: number) => {
    if (formData.puntos.length > 1) {
      setFormData((prev) => ({ ...prev, puntos: prev.puntos.filter((_, i) => i !== index) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrores([]);

    try {
      const body = {
        cai: formData.cai.trim(),
        cuit: formData.cuit.trim(),
        contribuyente: formData.contribuyente.trim() || undefined,
        fechaAutorizacion: formData.fechaAutorizacion,
        fechaVencimiento: formData.fechaVencimiento,
        puntos: formData.puntos.map((p) => ({
          puntoVenta: parseInt(p.puntoVenta, 10),
          domicilio: p.domicilio.trim(),
          tipoComprobante: parseInt(p.tipoComprobante, 10),
          numeroDesde: parseInt(p.numeroDesde, 10),
          numeroHasta: parseInt(p.numeroHasta, 10),
        })),
      };

      const response = await fetch("/api/cai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: `CAI ${data.cai.cai} cargado correctamente.` });
        setFormData(datosVacios());
        onSaved?.();
      } else {
        setErrores(data.errores || [data.error || "Error al guardar el CAI"]);
      }
    } catch (error: any) {
      setErrores([error.message || "Error al guardar el CAI"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className="p-4 rounded-lg bg-green-50 text-green-800 border border-green-200">
          {message.text}
        </div>
      )}

      {errores.length > 0 && (
        <div className="p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
          <p className="font-medium mb-1">No se pudo guardar el CAI:</p>
          <ul className="list-disc list-inside text-sm">
            {errores.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {camposNoInterpretados.length > 0 && (
        <div className="p-4 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-sm">
          No pudimos interpretar todos los campos del PDF automáticamente. Revisá y completá los
          campos resaltados antes de guardar.
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Datos del CAI</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CAI</label>
            <input
              type="text"
              value={formData.cai}
              onChange={(e) => handleChange("cai", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                campoConAviso("cai") ? "border-amber-400 bg-amber-50" : "border-gray-300"
              }`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CUIT Contribuyente</label>
            <input
              type="text"
              value={formData.cuit}
              onChange={(e) => handleChange("cuit", e.target.value)}
              maxLength={11}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                campoConAviso("cuit") ? "border-amber-400 bg-amber-50" : "border-gray-300"
              }`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contribuyente</label>
            <input
              type="text"
              value={formData.contribuyente}
              onChange={(e) => handleChange("contribuyente", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                campoConAviso("contribuyente") ? "border-amber-400 bg-amber-50" : "border-gray-300"
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Autorización</label>
            <input
              type="date"
              value={formData.fechaAutorizacion}
              onChange={(e) => handleChange("fechaAutorizacion", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                campoConAviso("fechaAutorizacion") ? "border-amber-400 bg-amber-50" : "border-gray-300"
              }`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
            <input
              type="date"
              value={formData.fechaVencimiento}
              onChange={(e) => handleChange("fechaVencimiento", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                campoConAviso("fechaVencimiento") ? "border-amber-400 bg-amber-50" : "border-gray-300"
              }`}
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Puntos de Venta</h3>
          <button
            type="button"
            onClick={addPunto}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Agregar punto
          </button>
        </div>
        <div className="space-y-4">
          {formData.puntos.map((punto, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700">Punto {index + 1}</span>
                {formData.puntos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePunto(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Minus size={20} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Punto de Venta</label>
                  <input
                    type="number"
                    value={punto.puntoVenta}
                    onChange={(e) => handlePuntoChange(index, "puntoVenta", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      campoConAviso(`puntos[${index}].puntoVenta`) ? "border-amber-400 bg-amber-50" : "border-gray-300"
                    }`}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domicilio</label>
                  <input
                    type="text"
                    value={punto.domicilio}
                    onChange={(e) => handlePuntoChange(index, "domicilio", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      campoConAviso(`puntos[${index}].domicilio`) ? "border-amber-400 bg-amber-50" : "border-gray-300"
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Comprobante (AFIP)</label>
                  <input
                    type="number"
                    value={punto.tipoComprobante}
                    onChange={(e) => handlePuntoChange(index, "tipoComprobante", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      campoConAviso(`puntos[${index}].tipoComprobante`) ? "border-amber-400 bg-amber-50" : "border-gray-300"
                    }`}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">91 = Remito R</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número Desde</label>
                  <input
                    type="number"
                    value={punto.numeroDesde}
                    onChange={(e) => handlePuntoChange(index, "numeroDesde", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      campoConAviso(`puntos[${index}].numeroDesde`) ? "border-amber-400 bg-amber-50" : "border-gray-300"
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número Hasta</label>
                  <input
                    type="number"
                    value={punto.numeroHasta}
                    onChange={(e) => handlePuntoChange(index, "numeroHasta", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      campoConAviso(`puntos[${index}].numeroHasta`) ? "border-amber-400 bg-amber-50" : "border-gray-300"
                    }`}
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Guardando...
          </>
        ) : (
          <>
            <Save size={20} />
            Guardar CAI
          </>
        )}
      </button>
    </form>
  );
}
