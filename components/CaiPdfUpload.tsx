"use client";

import { useState } from "react";
import { Upload, Loader2, FileWarning } from "lucide-react";
import CaiForm, { CaiFormData, datosVacios } from "./CaiForm";
import { CBTE_TIPO_REMITO_R } from "@/lib/types/cai";

export default function CaiPdfUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ data: CaiFormData; camposNoInterpretados: string[] } | null>(
    null
  );

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cai/parse-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "No se pudo interpretar el PDF");
        return;
      }

      const base: CaiFormData = {
        ...datosVacios(),
        cai: data.cai || "",
        cuit: data.cuit || "",
        contribuyente: data.contribuyente || "",
        fechaAutorizacion: data.fechaAutorizacion || "",
        fechaVencimiento: data.fechaVencimiento || "",
        puntos:
          data.puntos && data.puntos.length > 0
            ? data.puntos.map((p: any) => ({
                puntoVenta: p.puntoVenta !== undefined ? String(p.puntoVenta) : "",
                domicilio: p.domicilio || "",
                tipoComprobante:
                  p.tipoComprobante !== undefined ? String(p.tipoComprobante) : String(CBTE_TIPO_REMITO_R),
                numeroDesde: p.numeroDesde !== undefined ? String(p.numeroDesde) : "",
                numeroHasta: p.numeroHasta !== undefined ? String(p.numeroHasta) : "",
              }))
            : datosVacios().puntos,
      };

      setPreview({ data: base, camposNoInterpretados: data.camposNoInterpretados || [] });
    } catch (err: any) {
      setError(err.message || "Error al subir el PDF");
    } finally {
      setLoading(false);
    }
  };

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-sm">
          Revisá los datos interpretados de la constancia antes de guardar. Ningún dato se guarda
          todavía.
        </div>
        <CaiForm
          initialData={preview.data}
          camposNoInterpretados={preview.camposNoInterpretados}
          onSaved={() => setPreview(null)}
        />
        <button
          type="button"
          onClick={() => setPreview(null)}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Cancelar y subir otro PDF
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-800 border border-red-200 flex items-start gap-2">
          <FileWarning size={18} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <label
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-10 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
      >
        {loading ? (
          <Loader2 className="animate-spin text-blue-600" size={32} />
        ) : (
          <Upload className="text-gray-400" size={32} />
        )}
        <span className="text-sm text-gray-600">
          {loading ? "Leyendo PDF..." : "Hacé clic para subir la constancia de CAI (PDF)"}
        </span>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
