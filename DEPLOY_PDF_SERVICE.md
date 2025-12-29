# Cómo Desplegar el Servicio PDF

## Opción 1: Render (RECOMENDADO - Más fácil)

1. Ve a https://render.com y crea una cuenta (gratis)
2. Click en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `pdf-service` (o el nombre que quieras)
   - **Region**: Elige el más cercano
   - **Branch**: `main`
   - **Root Directory**: `pdf-service` ⚠️ IMPORTANTE
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Click en "Create Web Service"
6. Render desplegará automáticamente
7. Obtendrás una URL como: `https://pdf-service.onrender.com`
8. Copia esa URL y configúrala en Vercel como variable de entorno:
   ```
   PDF_SERVICE_URL=https://pdf-service.onrender.com
   ```

## Opción 2: Railway (Necesitas crear proyecto nuevo)

El problema con Railway es que detecta el `package.json` del proyecto principal. Para solucionarlo:

1. En Railway, **elimina el proyecto actual** (o créalo de nuevo)
2. Click en "New Project" → "Empty Project"
3. Click en "Deploy from GitHub repo"
4. Selecciona tu repositorio
5. **IMPORTANTE**: Antes de que Railway intente desplegar:
   - Ve a "Settings" → "Source"
   - En "Root Directory", escribe: `pdf-service`
   - Guarda
6. Railway debería detectar Python automáticamente
7. Si sigue detectando Next.js, Railway tiene un bug. Usa Render en su lugar.

## Opción 3: Fly.io

1. Ve a https://fly.io
2. Instala flyctl: `curl -L https://fly.io/install.sh | sh`
3. En la terminal:
   ```bash
   cd pdf-service
   fly launch
   ```
4. Sigue las instrucciones
5. Obtendrás una URL como: `https://tu-app.fly.dev`

## Verificar que funciona

Una vez desplegado, prueba con:

```bash
curl https://tu-servicio-url.com/health
```

Deberías recibir: `{"status":"ok","service":"pdf-generator"}`

## Configurar en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - **Name**: `PDF_SERVICE_URL`
   - **Value**: La URL de tu servicio (ej: `https://pdf-service.onrender.com`)
4. Guarda y vuelve a desplegar tu app Next.js

