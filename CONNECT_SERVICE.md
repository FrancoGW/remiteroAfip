# Conectar Servicio PDF con Frontend

## Paso 1: Obtener la URL de Railway

1. Ve a tu proyecto en Railway
2. Ve a la pestaña "Settings" o "Deployments"
3. Busca la sección "Domains" o "Network"
4. Copia la URL (algo como: `https://remitero-pdf-service-production.up.railway.app`)

## Paso 2: Verificar que el servicio funciona

Abre en tu navegador:
```
https://tu-url-de-railway.app/health
```

Deberías ver:
```json
{"status":"ok","service":"pdf-generator"}
```

## Paso 3: Configurar en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com
2. Selecciona tu proyecto `remiteroAfip`
3. Ve a **Settings** → **Environment Variables**
4. Haz click en "Add New"
5. Agrega:
   - **Name**: `PDF_SERVICE_URL`
   - **Value**: La URL completa de Railway (ej: `https://remitero-pdf-service-production.up.railway.app`)
   - **Environment**: Marca todas (Production, Preview, Development)
6. Click en "Save"
7. **Importante**: Ve a la pestaña "Deployments" y haz click en los 3 puntos del último deployment → "Redeploy" (o crea un nuevo deployment para que tome las variables)

## Paso 4: Verificar en producción

Una vez desplegado en Vercel:
1. Intenta generar un remito
2. Debería usar el servicio Python sin problemas
3. Revisa los logs en Vercel para confirmar

¡Listo! 🎉

