# Envío de remitos por WhatsApp y Email

## Flujo

1. **Crear remito por API:** `POST /api/remitos` → obtenés `remito.id`.
2. **Enviar PDF por WhatsApp y/o email:** `POST /api/remitos/{id}/enviar` con los destinos en el body.

## Endpoint: Enviar remito

**URL:** `POST https://remitero-afip.vercel.app/api/remitos/{id}/enviar`

**Headers:** `Content-Type: application/json`

**Body (JSON):**

```json
{
  "whatsapp": ["5491112345678", "5491198765432"],
  "email": ["cliente@ejemplo.com", "otro@ejemplo.com"]
}
```

- `whatsapp`: array de números con código de país, sin `+` (ej. Argentina: `54911...`).
- `email`: array de direcciones de email.
- Podés enviar solo WhatsApp, solo email, o ambos. Al menos uno es obligatorio.

**Respuesta exitosa:**

```json
{
  "success": true,
  "enviados": {
    "whatsapp": [
      { "numero": "5491112345678", "success": true },
      { "numero": "5491198765432", "success": true }
    ],
    "email": [
      { "email": "cliente@ejemplo.com", "success": true }
    ]
  }
}
```

**Ejemplo con errores:**

```json
{
  "success": false,
  "enviados": {
    "whatsapp": [{ "numero": "54911...", "success": false, "error": "..." }],
    "email": []
  },
  "errores": ["WhatsApp 54911...: ..."]
}
```

### Ejemplo cURL

```bash
# Enviar remito ID 123 por WhatsApp y email
curl -X POST "https://remitero-afip.vercel.app/api/remitos/123/enviar" \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp": ["5491112345678"],
    "email": ["cliente@ejemplo.com"]
  }'
```

---

## Variables de entorno

### WhatsApp (Twilio)

Configurar en Vercel (o `.env.local` en local):

| Variable | Descripción |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Account SID de Twilio |
| `TWILIO_AUTH_TOKEN` | Auth Token de Twilio |
| `TWILIO_WHATSAPP_FROM` | Número de WhatsApp de envío (ej. `whatsapp:+14155238886` en sandbox) |

Para usar WhatsApp con Twilio necesitás una cuenta en [Twilio](https://www.twilio.com) y activar WhatsApp (sandbox o número aprobado).

### Email (SMTP)

| Variable | Descripción |
|----------|-------------|
| `SMTP_HOST` | Servidor SMTP (ej. `smtp.gmail.com`) |
| `SMTP_PORT` | Puerto (587 o 465) |
| `SMTP_USER` | Usuario |
| `SMTP_PASS` | Contraseña o app password |
| `SMTP_FROM` | (Opcional) Dirección que aparece como remitente |

Para Gmail: usar [Contraseña de aplicación](https://support.google.com/accounts/answer/185833) en `SMTP_PASS`.

---

## Resumen del flujo completo vía API

1. `POST /api/remitos` con los datos del remito → respuesta con `remito.id`.
2. `POST /api/remitos/{remito.id}/enviar` con `whatsapp` y/o `email` → se envía el PDF a esos destinos.
