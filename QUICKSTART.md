# 🚀 Guía Rápida de Inicio

Esta guía te ayudará a tener el proyecto funcionando en menos de 5 minutos.

## Instalación Rápida

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Opción A: Copiar el ejemplo manualmente
cp .env.example .env.local

# Opción B: Usar el script de setup (macOS/Linux)
npm run setup
```

Edita `.env.local` y configura tu CUIT:

```env
AFIP_CUIT=20123456789  # 👈 Cambiar por tu CUIT
AFIP_PRODUCTION=false   # false = modo desarrollo
```

### 3. Ejecutar en Modo Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🎯 Modo Desarrollo (Sin Certificados)

En modo desarrollo (`AFIP_PRODUCTION=false`), el sistema:

✅ Funciona sin certificados de AFIP  
✅ Simula respuestas de AFIP  
✅ Genera CAE y números de remito de prueba  
✅ Perfecto para testing y desarrollo  

**No necesitas certificados para empezar a desarrollar.**

## 📝 Crear Tu Primer Remito

1. Abre la aplicación en http://localhost:3000
2. Completa el formulario con datos de prueba
3. Haz clic en "Generar Remito en AFIP"
4. ¡Listo! Verás el CAE y número de remito generado

## 🔐 Para Usar con AFIP Real (Producción)

Cuando estés listo para producción:

1. **Obtén certificados de AFIP** (ver `GUIA_CERTIFICADOS_AFIP.md`)
2. **Coloca los certificados** en la carpeta `certs/`:
   - `certs/cert.crt` - Certificado público
   - `certs/private.key` - Clave privada
3. **Actualiza .env.local**:
   ```env
   AFIP_PRODUCTION=true
   ```

## 📦 Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Compilar para producción
npm start                # Iniciar servidor de producción

# Utilidades
npm run setup            # Configurar proyecto (macOS/Linux)
npm run generate-certs   # Generar certificados de prueba
npm run lint             # Verificar código
npm run type-check       # Verificar tipos TypeScript
```

## 🌐 Desplegar en Vercel

### Opción Rápida

```bash
npm i -g vercel
vercel
```

### Desde GitHub

1. Sube tu código a GitHub
2. Conecta el repo con Vercel
3. Configura variables de entorno
4. ¡Deploy automático!

Ver `DEPLOYMENT.md` para instrucciones detalladas.

## 📚 Documentación

- **README.md** - Documentación completa del proyecto
- **GUIA_CERTIFICADOS_AFIP.md** - Cómo obtener certificados de AFIP
- **DEPLOYMENT.md** - Guía de deployment en Vercel
- **QUICKSTART.md** - Este archivo

## ⚠️ Problemas Comunes

### Error: "Cannot find module 'next'"
```bash
npm install
```

### Error: "CUIT inválido"
Verifica que tu CUIT tenga exactamente 11 dígitos en `.env.local`

### Puerto 3000 en uso
```bash
# Usar otro puerto
PORT=3001 npm run dev
```

## 💡 Tips

- **Modo oscuro**: La app detecta automáticamente las preferencias del sistema
- **Responsive**: Funciona en desktop, tablet y móvil
- **Datos de prueba**: En desarrollo, puedes usar cualquier CUIT para probar
- **Almacenamiento**: Los remitos se guardan en memoria (se pierden al reiniciar)
  - Para producción, considera agregar una base de datos

## 🎨 Personalización

### Cambiar colores

Edita `tailwind.config.ts` para cambiar el tema:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#0070f3',  // Azul de AFIP
      // Agrega tus colores
    }
  }
}
```

### Agregar logo

Coloca tu logo en `public/logo.png` y actualiza `app/page.tsx`

## 🚀 Próximos Pasos

Ahora que tienes el proyecto funcionando:

1. [ ] Explora la interfaz y crea remitos de prueba
2. [ ] Lee la documentación completa en README.md
3. [ ] Obtén tus certificados de AFIP para producción
4. [ ] Despliega en Vercel
5. [ ] (Opcional) Agrega una base de datos para persistir remitos

## 🆘 Ayuda

¿Necesitas ayuda? 

- Revisa la documentación en los archivos .md
- Verifica los logs en la consola
- Revisa la configuración en .env.local

## 🎉 ¡Listo!

Ya tienes todo configurado. ¡Comienza a generar remitos!

---

**¿Todo funcionando?** ⭐ Marca como favorito el repo

