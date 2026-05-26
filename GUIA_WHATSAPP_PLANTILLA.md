# Guía exacta: plantilla WhatsApp + API Remitero

Tu backend ya soporta **plantilla aprobada** si definís `TWILIO_WHATSAPP_CONTENT_SID`. Las variables deben coincidir con esta convención:

| Variable | Uso |
|----------|-----|
| `{{1}}` | Nombre (saludo). Ej: `Hola {{1}}, ...` |
| `{{2}}` | Número de remito |
| `{{3}}` | URL pública del PDF (Vercel Blob) |

---

## Paso 1 — Crear plantilla en Twilio

1. **Twilio Console** → **Messaging** → **Content** → **Create Content** (o Content Template Builder).
2. **Template name:** solo minúsculas y guiones bajos, ej. `remito_pdf_envio_v2`.
3. **Language:** Spanish (ARG).
4. **Content type:** **Media**.
5. Pestaña **Configure content - Media**:

### Body (texto)

Usá **exactamente** este patrón (variables `{{1}}` y `{{2}}` no al inicio ni al final del mensaje; dejá texto después del último número):

```
Hola {{1}}, te enviamos el remito Nº {{2}}. Guardalo para tus registros.
```

### Media URL

1. Clic en **+ Add Variable** en el campo **Media URL**.
2. Dejá **solo la variable** para la URL completa del PDF, por ejemplo que quede:

   `{{3}}`

   (Si Twilio te obliga a poner texto fijo + variable, seguí el asistente; lo importante es que al enviar mandemos la **URL completa** en una variable.)

3. **Sample / fallback:** pegá una URL **https** real a un PDF de prueba (ej. un archivo en Vercel Blob), para que Meta pueda revisar el formato.

6. **Create** y luego **Submit for WhatsApp review** → categoría **Utility**.

7. Esperá aprobación (**WhatsApp business initiated** en verde).

8. Copiá el **Content SID** (empieza con `HX...`).

---

## Paso 2 — Variables de entorno en Vercel

| Variable | Valor |
|----------|--------|
| `TWILIO_ACCOUNT_SID` | Tu Account SID |
| `TWILIO_AUTH_TOKEN` | Tu Auth Token |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+18143669741` (tu número) |
| `TWILIO_WHATSAPP_CONTENT_SID` | El `HX...` de la plantilla **aprobada** |
| `BLOB_READ_WRITE_TOKEN` | Token del Blob (PDF público para Twilio) |
| `PDF_SERVICE_URL` | Tu servicio Python (generar PDF) |
| `NEXT_PUBLIC_APP_URL` | `https://remitero-afip.vercel.app` (opcional pero útil) |

**Redeploy** después de guardar variables.

---

## Paso 3 — Cómo envía el backend

- Si **`TWILIO_WHATSAPP_CONTENT_SID`** está definido → Twilio envía con **plantilla** y:

  - `{{1}}` = `nombre` del JSON del POST, o si no viene, **nombre del receptor del remito**, o `"Cliente"`.
  - `{{2}}` = número de remito.
  - `{{3}}` = URL del PDF subido a Blob (cada envío, un archivo distinto).

- Si **no** está definido → modo antiguo (mensaje libre + `mediaUrl`), solo sirve dentro de la ventana de 24 h / sandbox.

---

## Paso 4 — Llamada API (ejemplo)

```bash
curl -X POST "https://remitero-afip.vercel.app/api/remitos/TU_ID_REMITO/enviar" \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp": ["543794556599"],
    "nombre": "Franco"
  }'
```

- `nombre` es opcional; si no lo mandás, se usa `nombreReceptor` del remito.

---

## Si Meta rechaza otra vez

- Revisá el texto del rechazo (variables al inicio/final, categoría incorrecta, URL de muestra inválida).
- Asegurate de que el **sample** del Media sea un PDF accesible por HTTPS.
- Si tu plantilla usa **otro orden** de variables, avisá y se ajusta el código (`lib/send/whatsapp.ts`) para coincidir.
