import connectDB from "@/lib/db/mongodb";
import AppConfigModel from "@/lib/db/models/AppConfig";

const CONFIG_ID = "app_config";

/**
 * Número de WhatsApp de pruebas: puede cargarse desde el panel (se guarda en
 * Mongo y tiene prioridad) o quedar fijo por variable de entorno
 * WHATSAPP_TEST_NUMBER. Nunca es el número real del cliente de un remito.
 */
export async function getWhatsappTestNumber(): Promise<string | null> {
  await connectDB();
  const doc = await AppConfigModel.findById(CONFIG_ID).lean();
  const guardado = (doc as any)?.whatsappTestNumber?.trim();
  if (guardado) return guardado;
  return process.env.WHATSAPP_TEST_NUMBER?.trim() || null;
}

export async function setWhatsappTestNumber(numero: string): Promise<string> {
  await connectDB();
  const limpio = numero.trim();
  await AppConfigModel.findByIdAndUpdate(
    CONFIG_ID,
    { whatsappTestNumber: limpio },
    { upsert: true }
  );
  return limpio;
}

/**
 * Dirección de email de pruebas: simétrico a getWhatsappTestNumber. Puede
 * cargarse desde el panel (Mongo, prioridad) o quedar fijo por variable de
 * entorno EMAIL_TEST_ADDRESS.
 */
export async function getEmailTestAddress(): Promise<string | null> {
  await connectDB();
  const doc = await AppConfigModel.findById(CONFIG_ID).lean();
  const guardado = (doc as any)?.emailTestAddress?.trim();
  if (guardado) return guardado;
  return process.env.EMAIL_TEST_ADDRESS?.trim() || null;
}

export async function setEmailTestAddress(email: string): Promise<string> {
  await connectDB();
  const limpio = email.trim();
  await AppConfigModel.findByIdAndUpdate(CONFIG_ID, { emailTestAddress: limpio }, { upsert: true });
  return limpio;
}

export interface EstadoIntegraciones {
  whatsapp: { configurado: boolean };
  email: { configurado: boolean };
  blob: { configurado: boolean };
}

/** Estado (configurado/no) de las integraciones que dependen de variables de entorno. */
export function getEstadoIntegraciones(): EstadoIntegraciones {
  return {
    whatsapp: {
      configurado: !!(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_WHATSAPP_FROM
      ),
    },
    email: {
      configurado: !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ),
    },
    blob: {
      configurado: !!process.env.BLOB_READ_WRITE_TOKEN,
    },
  };
}
