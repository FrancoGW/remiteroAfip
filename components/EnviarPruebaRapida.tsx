"use client";

import { useEffect, useState } from "react";
import { Mail, MessageCircle, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface EnviarPruebaRapidaProps {
  remitoId: string;
}

interface TestConfig {
  whatsappTestNumber: string | null;
  emailTestAddress: string | null;
}

type ResultadoEnvio = { ok: boolean; text: string } | null;

/**
 * Dos botones explícitos y separados (WhatsApp / mail) para el flujo de
 * "Remito de Prueba": cada uno dispara el envío por ese canal específico
 * usando el contacto de prueba configurado, sin pedirle al usuario que
 * tipee nada. Distinto del EnviarRemito genérico (detalle de un remito
 * real), que sí permite tipear un destino cualquiera.
 */
export default function EnviarPruebaRapida({ remitoId }: EnviarPruebaRapidaProps) {
  const [config, setConfig] = useState<TestConfig | null>(null);
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [resultadoWhatsapp, setResultadoWhatsapp] = useState<ResultadoEnvio>(null);
  const [resultadoEmail, setResultadoEmail] = useState<ResultadoEnvio>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setConfig({ whatsappTestNumber: data.whatsappTestNumber, emailTestAddress: data.emailTestAddress });
        }
      })
      .catch(() => {});
  }, []);

  const enviar = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/remitos/${remitoId}/enviar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const enviarWhatsapp = async () => {
    if (!config?.whatsappTestNumber) return;
    setLoadingWhatsapp(true);
    setResultadoWhatsapp(null);
    try {
      const data = await enviar({ whatsapp: [config.whatsappTestNumber] });
      setResultadoWhatsapp(
        data.success
          ? { ok: true, text: `Enviado a ${config.whatsappTestNumber}` }
          : { ok: false, text: data.errores?.join(" · ") || data.error || "No se pudo enviar" }
      );
    } catch (err: any) {
      setResultadoWhatsapp({ ok: false, text: err?.message || "Error al enviar" });
    } finally {
      setLoadingWhatsapp(false);
    }
  };

  const enviarEmail = async () => {
    if (!config?.emailTestAddress) return;
    setLoadingEmail(true);
    setResultadoEmail(null);
    try {
      const data = await enviar({ email: [config.emailTestAddress] });
      setResultadoEmail(
        data.success
          ? { ok: true, text: `Enviado a ${config.emailTestAddress}` }
          : { ok: false, text: data.errores?.join(" · ") || data.error || "No se pudo enviar" }
      );
    } catch (err: any) {
      setResultadoEmail({ ok: false, text: err?.message || "Error al enviar" });
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-3">
      <div className="flex-1">
        <button
          type="button"
          onClick={enviarWhatsapp}
          disabled={loadingWhatsapp || !config?.whatsappTestNumber}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
        >
          {loadingWhatsapp ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
          Enviar por WhatsApp
        </button>
        {!config?.whatsappTestNumber && (
          <p className="text-xs text-amber-600 mt-1">
            Configurá el número de WhatsApp de pruebas en Configuración.
          </p>
        )}
        {resultadoWhatsapp && (
          <p
            className={`text-xs mt-1 flex items-center gap-1 ${resultadoWhatsapp.ok ? "text-green-700" : "text-red-700"}`}
          >
            {resultadoWhatsapp.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {resultadoWhatsapp.text}
          </p>
        )}
      </div>

      <div className="flex-1">
        <button
          type="button"
          onClick={enviarEmail}
          disabled={loadingEmail || !config?.emailTestAddress}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
        >
          {loadingEmail ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
          Enviar por Mail
        </button>
        {!config?.emailTestAddress && (
          <p className="text-xs text-amber-600 mt-1">Configurá el email de pruebas en Configuración.</p>
        )}
        {resultadoEmail && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${resultadoEmail.ok ? "text-green-700" : "text-red-700"}`}>
            {resultadoEmail.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {resultadoEmail.text}
          </p>
        )}
      </div>
    </div>
  );
}
