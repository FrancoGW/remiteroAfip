"use client";

import { useState } from "react";
import { Loader2, PlayCircle, AlertTriangle } from "lucide-react";

interface EndpointCardProps {
  titulo: string;
  descripcion: string;
  path: string;
}

function EndpointCard({ titulo, descripcion, path }: EndpointCardProps) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  const consultar = async () => {
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch(path);
      const data = await res.json();
      setResultado(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResultado(JSON.stringify({ error: err?.message || "Error de red" }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{titulo}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{descripcion}</p>
          <code className="text-xs text-gray-400">GET {path}</code>
        </div>
        <button
          onClick={consultar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 text-sm whitespace-nowrap"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
          Consultar
        </button>
      </div>
      {resultado && (
        <pre className="mt-3 bg-gray-900 text-gray-100 text-xs p-4 rounded-lg overflow-x-auto max-h-96">
          {resultado}
        </pre>
      )}
    </div>
  );
}

export default function DiagnosticoPage() {
  return (
    <div className="space-y-4">
      <EndpointCard
        titulo="Check Auth (WSAA)"
        descripcion="Verifica qué servicios están autorizados con el certificado configurado."
        path="/api/afip/check-auth"
      />
      <EndpointCard
        titulo="Diagnóstico"
        descripcion="Estado de certificados, CUIT y modo (producción/homologación)."
        path="/api/afip/diagnostico"
      />

      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-gray-900">Test Producción (Remito R real)</h3>
            <p className="text-sm text-gray-600 mt-1">
              Este endpoint <strong>emite un remito R real en AFIP PRODUCCIÓN</strong> (Punto de
              Venta 17 por defecto). No tiene un botón de ejecución acá a propósito: no es una
              acción de prueba, consume numeración fiscal real. Ejecutarlo únicamente por curl,
              de forma consciente:
            </p>
            <pre className="mt-3 bg-gray-900 text-gray-100 text-xs p-4 rounded-lg overflow-x-auto">
{`curl -X POST https://<tu-dominio>/api/afip/test-produccion \\
  -H "Content-Type: application/json" \\
  -d '{"cuitReceptor": "30567890123", "puntoVenta": 17}'`}
            </pre>
            <p className="text-xs text-gray-400 mt-2">
              Requiere AFIP_PRODUCTION=true configurado en el entorno.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
