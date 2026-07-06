"use client";

import { useEffect, useState } from "react";
import { Send, Mail, FlaskConical, AlertTriangle, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface EnviarRemitoProps {
  remitoId: string;
}

interface ConfigEnvio {
  isProduction: boolean;
  whatsappTestNumber: string | null;
}

type Resultado = { type: "success" | "error"; text: string } | null;

export default function EnviarRemito({ remitoId }: EnviarRemitoProps) {
  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [emailDestino, setEmailDestino] = useState("");
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPrueba, setLoadingPrueba] = useState(false);
  const [resultado, setResultado] = useState<Resultado>(null);

  const [config, setConfig] = useState<ConfigEnvio | null>(null);
  const [testNumeroOverride, setTestNumeroOverride] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setConfig({ isProduction: data.isProduction, whatsappTestNumber: data.whatsappTestNumber });
        }
      })
      .catch(() => {});
  }, []);

  const enviar = async (body: Record<string, unknown>, successText: string, setLoading: (v: boolean) => void) => {
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch(`/api/remitos/${remitoId}/enviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setResultado({ type: "success", text: successText });
      } else {
        setResultado({
          type: "error",
          text: data.errores?.join(" · ") || data.error || "No se pudo enviar",
        });
      }
    } catch (err: any) {
      setResultado({ type: "error", text: err?.message || "Error al enviar" });
    } finally {
      setLoading(false);
    }
  };

  const enviarWhatsapp = () => {
    const numero = whatsappNumero.trim();
    if (!numero) return;
    enviar({ whatsapp: [numero] }, `WhatsApp enviado a ${numero}`, setLoadingWhatsapp);
  };

  const enviarEmail = () => {
    const destino = emailDestino.trim();
    if (!destino) return;
    enviar({ email: [destino] }, `Email enviado a ${destino}`, setLoadingEmail);
  };

  const numeroDestinoPrueba = testNumeroOverride.trim() || config?.whatsappTestNumber || "";
  const esOverride =
    !!testNumeroOverride.trim() && testNumeroOverride.trim() !== (config?.whatsappTestNumber || "");

  const ejecutarEnvioPrueba = () => {
    if (!numeroDestinoPrueba) return;
    setShowConfirmModal(false);
    enviar(
      { whatsapp: [numeroDestinoPrueba] },
      `Prueba de WhatsApp enviada a ${numeroDestinoPrueba}`,
      setLoadingPrueba
    );
  };

  const handleClickPrueba = () => {
    if (!numeroDestinoPrueba) return;
    if (config?.isProduction) {
      setShowConfirmModal(true);
    } else {
      ejecutarEnvioPrueba();
    }
  };

  return (
    <div className="space-y-4">
      {resultado && (
        <div
          className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
            resultado.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {resultado.type === "success" ? (
            <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle size={16} className="flex-shrink-0 mt-0.5" />
          )}
          <span>{resultado.text}</span>
        </div>
      )}

      {/* Envío real */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Whatsapp: 5491112345678"
            value={whatsappNumero}
            onChange={(e) => setWhatsappNumero(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={enviarWhatsapp}
            disabled={loadingWhatsapp || !whatsappNumero.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm whitespace-nowrap"
          >
            {loadingWhatsapp ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            WhatsApp
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Email: cliente@ejemplo.com"
            value={emailDestino}
            onChange={(e) => setEmailDestino(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={enviarEmail}
            disabled={loadingEmail || !emailDestino.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm whitespace-nowrap"
          >
            {loadingEmail ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
            Email
          </button>
        </div>
      </div>

      {/* Botón de prueba de WhatsApp — separado, para probar el canal sin arriesgar el número real del cliente */}
      <div className="p-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 space-y-2">
        <p className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
          <FlaskConical size={14} />
          Prueba de WhatsApp (no usa el número del cliente)
        </p>

        {config && !config.whatsappTestNumber && !testNumeroOverride && (
          <p className="text-xs text-amber-700">
            No hay número de pruebas configurado. Cargalo en Configuración o tipeá uno abajo.
          </p>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder={config?.whatsappTestNumber || "Número de destino"}
            value={testNumeroOverride}
            onChange={(e) => setTestNumeroOverride(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 border border-amber-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
          />
          <button
            onClick={handleClickPrueba}
            disabled={loadingPrueba || !numeroDestinoPrueba}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm whitespace-nowrap"
          >
            {loadingPrueba ? <Loader2 size={15} className="animate-spin" /> : <span>🧪</span>}
            Enviar prueba
          </button>
        </div>

        {esOverride && (
          <p className="text-xs text-red-700 flex items-center gap-1.5">
            <AlertTriangle size={13} className="flex-shrink-0" />
            Vas a enviar un mensaje real de WhatsApp a <strong>{testNumeroOverride.trim()}</strong> (no es el
            número de pruebas configurado).
          </p>
        )}
        {!esOverride && config?.whatsappTestNumber && (
          <p className="text-xs text-amber-700">
            Por defecto se envía al número de pruebas: <strong>{config.whatsappTestNumber}</strong>
          </p>
        )}
      </div>

      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-700 mb-3">
              <AlertTriangle size={20} />
              <h3 className="font-semibold">Confirmar envío real</h3>
            </div>
            <p className="text-sm text-gray-700 mb-5">
              Esto va a enviar un mensaje real de WhatsApp a <strong>{numeroDestinoPrueba}</strong>. Este
              entorno está marcado como <strong>producción</strong>. ¿Confirmás?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarEnvioPrueba}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Sí, enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
