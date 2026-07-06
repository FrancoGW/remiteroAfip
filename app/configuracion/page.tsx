"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Save, Loader2 } from "lucide-react";
import PanelShell from "@/components/layout/PanelShell";

interface ConfigData {
  isProduction: boolean;
  whatsappTestNumber: string | null;
  integraciones: {
    whatsapp: { configurado: boolean };
    email: { configurado: boolean };
    blob: { configurado: boolean };
  };
}

function EstadoBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
      <CheckCircle2 size={16} /> Configurado
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
      <XCircle size={16} /> No configurado
    </span>
  );
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testNumeroInput, setTestNumeroInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (data.success) {
        setConfig(data);
        setTestNumeroInput(data.whatsappTestNumber || "");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardarTestNumero = async () => {
    if (!testNumeroInput.trim()) return;
    setSaving(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappTestNumber: testNumeroInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMensaje("Número de pruebas actualizado.");
        cargar();
      } else {
        setMensaje(data.error || "No se pudo guardar");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PanelShell title="Configuración" subtitle="Estado de integraciones y variables editables del panel">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Ambiente</h3>
            <p className="text-sm text-gray-600">
              {config?.isProduction
                ? "Producción — el botón de prueba de WhatsApp pedirá confirmación antes de enviar."
                : "Desarrollo/staging — el botón de prueba de WhatsApp envía directo, sin confirmación."}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Estado de integraciones</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">WhatsApp (Twilio)</p>
                  <p className="text-xs text-gray-500">
                    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
                  </p>
                </div>
                <EstadoBadge ok={!!config?.integraciones.whatsapp.configurado} />
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">Email (SMTP)</p>
                  <p className="text-xs text-gray-500">SMTP_HOST, SMTP_USER, SMTP_PASS</p>
                </div>
                <EstadoBadge ok={!!config?.integraciones.email.configurado} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Vercel Blob (PDF público para WhatsApp)</p>
                  <p className="text-xs text-gray-500">BLOB_READ_WRITE_TOKEN</p>
                </div>
                <EstadoBadge ok={!!config?.integraciones.blob.configurado} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Estas son credenciales/infraestructura — se configuran en Vercel (o .env.local en
              local), no editables desde acá.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Número de WhatsApp de pruebas</h3>
            <p className="text-sm text-gray-600 mb-4">
              Destino por defecto del botón &quot;🧪 Enviar prueba&quot; en el detalle de un remito.
              Nunca se usa el número real del cliente salvo que lo tipees a mano en ese momento.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={testNumeroInput}
                onChange={(e) => setTestNumeroInput(e.target.value)}
                placeholder="5491112345678"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={guardarTestNumero}
                disabled={saving || !testNumeroInput.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 text-sm"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar
              </button>
            </div>
            {mensaje && <p className="text-sm text-gray-600 mt-2">{mensaje}</p>}
            <p className="text-xs text-gray-400 mt-3">
              También puede fijarse por variable de entorno WHATSAPP_TEST_NUMBER; lo guardado acá
              tiene prioridad.
            </p>
          </div>
        </div>
      )}
    </PanelShell>
  );
}
