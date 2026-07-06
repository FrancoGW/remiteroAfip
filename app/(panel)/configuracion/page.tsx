"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Save, Loader2 } from "lucide-react";

interface ConfigData {
  isProduction: boolean;
  whatsappTestNumber: string | null;
  emailTestAddress: string | null;
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
  const [testEmailInput, setTestEmailInput] = useState("");
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
        setTestEmailInput(data.emailTestAddress || "");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async () => {
    setSaving(true);
    setMensaje(null);
    try {
      const body: Record<string, string> = {};
      if (testNumeroInput.trim()) body.whatsappTestNumber = testNumeroInput.trim();
      if (testEmailInput.trim()) body.emailTestAddress = testEmailInput.trim();

      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMensaje("Contactos de prueba actualizados.");
        cargar();
      } else {
        setMensaje(data.error || "No se pudo guardar");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
            <h3 className="font-semibold text-gray-900 mb-1">Contactos de prueba</h3>
            <p className="text-sm text-gray-600 mb-4">
              Destinos por defecto de los botones de prueba (detalle de un remito y &quot;Remito de
              Prueba&quot;). Nunca se usa el número/email real del cliente salvo que lo tipees a
              mano en ese momento.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Número de WhatsApp de pruebas
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testNumeroInput}
                    onChange={(e) => setTestNumeroInput(e.target.value)}
                    placeholder="5491112345678"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  También puede fijarse por WHATSAPP_TEST_NUMBER; lo guardado acá tiene prioridad.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Email de pruebas
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmailInput}
                    onChange={(e) => setTestEmailInput(e.target.value)}
                    placeholder="pruebas@ejemplo.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  También puede fijarse por EMAIL_TEST_ADDRESS; lo guardado acá tiene prioridad.
                </p>
              </div>

              <button
                onClick={guardar}
                disabled={saving || (!testNumeroInput.trim() && !testEmailInput.trim())}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 text-sm"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar
              </button>
              {mensaje && <p className="text-sm text-gray-600 mt-1">{mensaje}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
