# Guía de Deployment en Vercel

Esta guía te ayudará a desplegar tu aplicación de Remitero AFIP en Vercel.

## Preparación Previa

### 1. Certificados de AFIP

Antes de desplegar, necesitas tener tus certificados de AFIP preparados:

- **Certificado público** (`.crt`)
- **Clave privada** (`.key`)

### 2. Convertir Certificados a Base64

Para usar los certificados en Vercel, necesitas convertirlos a base64:

```bash
# En macOS/Linux
cat cert.crt | base64 | tr -d '\n' > cert.crt.base64
cat private.key | base64 | tr -d '\n' > private.key.base64

# En Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("cert.crt")) | Out-File cert.crt.base64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("private.key")) | Out-File private.key.base64
```

## Deploy con Vercel CLI

### Instalación

```bash
npm i -g vercel
```

### Login

```bash
vercel login
```

### Deploy

```bash
# Deploy de prueba
vercel

# Deploy a producción
vercel --prod
```

## Deploy desde GitHub

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <tu-repo-url>
git push -u origin main
```

### 2. Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "Add New Project"
3. Importa tu repositorio de GitHub
4. Configura las variables de entorno (ver sección siguiente)
5. Haz clic en "Deploy"

## Configuración de Variables de Entorno en Vercel

Ve a tu proyecto en Vercel > Settings > Environment Variables

### Para Desarrollo/Testing

```env
AFIP_CUIT=20123456789
AFIP_PRODUCTION=false
AFIP_CERT_PATH=./certs/cert.crt
AFIP_KEY_PATH=./certs/private.key
```

### Para Producción

```env
AFIP_CUIT=tu_cuit_real
AFIP_PRODUCTION=true
AFIP_CERT_BASE64=<contenido del archivo cert.crt.base64>
AFIP_KEY_BASE64=<contenido del archivo private.key.base64>
```

**Nota:** Si usas base64, necesitarás modificar el código del servicio de AFIP para decodificar los certificados.

## Modificación para Certificados Base64

Si vas a usar certificados en base64 en Vercel, modifica `lib/afip/afipService.ts`:

```typescript
constructor() {
  this.cuit = process.env.AFIP_CUIT || "";
  this.production = process.env.AFIP_PRODUCTION === "true";
  
  // Decodificar certificados de base64 si están presentes
  if (process.env.AFIP_CERT_BASE64) {
    const certBuffer = Buffer.from(process.env.AFIP_CERT_BASE64, 'base64');
    // Guardar temporalmente o usar directamente en memoria
    this.cert = certBuffer.toString('utf-8');
  }
  
  if (process.env.AFIP_KEY_BASE64) {
    const keyBuffer = Buffer.from(process.env.AFIP_KEY_BASE64, 'base64');
    this.key = keyBuffer.toString('utf-8');
  }
  
  // URLs de servicios...
}
```

## Verificación del Deploy

### 1. Prueba la Aplicación

Una vez desplegada, verifica:

- ✅ La página principal carga correctamente
- ✅ El formulario se muestra sin errores
- ✅ Puedes generar un remito de prueba
- ✅ La lista de remitos funciona

### 2. Monitoreo de Logs

```bash
vercel logs <tu-deployment-url>
```

O desde el dashboard de Vercel: Project > Deployments > [tu deployment] > Logs

## Troubleshooting

### Error: "Cannot read environment variables"

**Solución:** Verifica que todas las variables de entorno estén configuradas correctamente en Vercel.

### Error: "Certificate not found"

**Solución:** 
1. Verifica que los certificados estén en base64 correctamente
2. Verifica que las variables `AFIP_CERT_BASE64` y `AFIP_KEY_BASE64` estén configuradas
3. Implementa el código para decodificar certificados base64

### Error de CORS

**Solución:** Next.js maneja CORS automáticamente para las API routes. Si tienes problemas, verifica que estés usando las rutas API correctamente.

### Timeout en Requests a AFIP

**Solución:** 
1. Vercel tiene un límite de 10 segundos para funciones serverless en el plan gratuito
2. Considera actualizar a un plan Pro si necesitas más tiempo
3. Optimiza las llamadas a AFIP para que sean más rápidas

## Configuración de Dominios Personalizados

### En Vercel Dashboard

1. Ve a tu proyecto > Settings > Domains
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones de Vercel
4. Espera la propagación DNS (puede tomar hasta 24 horas)

## Actualizaciones Automáticas

Con GitHub conectado a Vercel:

- **Push a `main`** → Deploy a producción automático
- **Push a otras ramas** → Preview deployment automático

## Rollback

Si necesitas volver a una versión anterior:

1. Ve a Project > Deployments
2. Encuentra el deployment anterior que funcionaba
3. Haz clic en los tres puntos > "Promote to Production"

## Seguridad

### Recomendaciones

1. **Nunca** commites certificados o claves privadas al repositorio
2. Usa variables de entorno para información sensible
3. Activa 2FA en tu cuenta de Vercel
4. Limita el acceso al proyecto solo a personas autorizadas
5. Revisa regularmente los logs de acceso

### Variables de Entorno Sensibles

En Vercel, marca las variables sensibles como "Sensitive" para que no se muestren en los logs.

## Monitoreo y Analytics

Vercel proporciona analytics automáticos:

1. Ve a tu proyecto > Analytics
2. Revisa:
   - Tráfico
   - Performance
   - Errores
   - Web Vitals

## Costos

### Plan Gratuito (Hobby)
- ✅ Deploy ilimitados
- ✅ Ancho de banda: 100GB/mes
- ✅ Funciones: 100GB-Hrs
- ❌ Sin colaboradores del equipo

### Plan Pro ($20/mes)
- ✅ Todo lo del plan gratuito
- ✅ Colaboradores ilimitados
- ✅ Mejor performance
- ✅ Soporte prioritario
- ✅ Password protection

## Próximos Pasos

Una vez desplegado exitosamente:

1. [ ] Configura un dominio personalizado
2. [ ] Configura notificaciones de deployment
3. [ ] Implementa monitoreo de errores (Sentry)
4. [ ] Agrega analytics (Google Analytics)
5. [ ] Configura backup de datos
6. [ ] Implementa tests automatizados
7. [ ] Documenta el flujo de deployment para tu equipo

## Soporte

- [Documentación de Vercel](https://vercel.com/docs)
- [Comunidad de Vercel](https://github.com/vercel/vercel/discussions)
- [Documentación de Next.js](https://nextjs.org/docs)

---

¡Listo! Tu aplicación de Remitero AFIP ahora está en producción 🚀

