# Variables de Entorno para Vercel

## Configuración de MongoDB

Para que la aplicación funcione con MongoDB, necesitas configurar la siguiente variable de entorno en Vercel:

### Variable Requerida

**Nombre:** `MONGODB_URI`

**Valor:** `mongodb+srv://admin:admin@cluster0.5deof2h.mongodb.net/remitero?retryWrites=true&w=majority`

**Descripción:** URI de conexión a MongoDB Atlas. Incluye la base de datos `remitero` en la URL.

---

## Cómo Configurar en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com
2. Selecciona tu proyecto `remiteroAfip`
3. Ve a **Settings** → **Environment Variables**
4. Haz click en "Add New"
5. Agrega:
   - **Name**: `MONGODB_URI`
   - **Value**: `mongodb+srv://admin:admin@cluster0.5deof2h.mongodb.net/remitero?retryWrites=true&w=majority`
   - **Environment**: Marca todas (Production, Preview, Development)
6. Click en "Save"

---

## Variables Opcionales (si las necesitas)

Si también usas AFIP en producción, configura estas variables:

- `AFIP_CUIT`: Tu CUIT de AFIP
- `AFIP_PRODUCTION`: `true` para producción, `false` para desarrollo
- `AFIP_CERT_PATH`: Ruta al certificado (si usas certificados)
- `AFIP_KEY_PATH`: Ruta a la clave privada (si usas certificados)

---

## Importante

Después de agregar las variables de entorno:

1. Ve a la pestaña **Deployments**
2. Haz click en los 3 puntos del último deployment
3. Selecciona **Redeploy** (o crea un nuevo deployment)

Esto es necesario para que las nuevas variables de entorno se apliquen.

---

## Estructura de la Base de Datos

- **Base de datos:** `remitero`
- **Colección:** `remitos`
- **Índices creados automáticamente:**
  - `id` (único)
  - `numeroRemito`
  - `cuitReceptor`
  - `fechaEmision`
  - `createdAt` (para ordenar por más recientes)
