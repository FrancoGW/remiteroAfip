# 👋 ¡Bienvenido a Remitero AFIP!

Este es tu sistema completo para generar remitos electrónicos integrado con AFIP.

## 🚀 Empezar en 3 Pasos

### 1️⃣ Instalar

```bash
npm install
```

### 2️⃣ Configurar

Crea un archivo `.env.local`:

```env
AFIP_CUIT=20123456789  # Tu CUIT aquí
AFIP_PRODUCTION=false   # false = modo desarrollo
```

### 3️⃣ Ejecutar

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## ✅ Modo Desarrollo

Por defecto, el sistema funciona en **modo desarrollo**:
- ✅ No necesitas certificados de AFIP
- ✅ Simula respuestas de AFIP
- ✅ Genera CAE y números de remito de prueba
- ✅ Perfecto para aprender y probar

## 📚 Documentación

Archivo | Descripción
---|---
**QUICKSTART.md** | ⚡ Guía rápida (5 minutos)
**README.md** | 📖 Documentación completa
**GUIA_CERTIFICADOS_AFIP.md** | 🔐 Cómo obtener certificados
**DEPLOYMENT.md** | 🌐 Deploy en Vercel
**CONTRIBUTING.md** | 🤝 Guía para contribuir

## 🎯 Qué Puedes Hacer

- ✅ Crear remitos electrónicos
- ✅ Ver lista de remitos generados
- ✅ Gestionar emisor, receptor y transporte
- ✅ Agregar múltiples items/productos
- ✅ Especificar origen y destino
- ✅ Obtener CAE de AFIP (simulado o real)

## 🔐 Para Producción

Cuando estés listo para usar AFIP real:

1. Lee `GUIA_CERTIFICADOS_AFIP.md`
2. Obtén tus certificados de AFIP
3. Colócalos en `certs/`
4. Cambia `AFIP_PRODUCTION=true` en `.env.local`

## 📁 Estructura del Proyecto

```
remiteroAfip/
├── app/              # Páginas y API routes (Next.js)
├── components/       # Componentes React
├── lib/              # Lógica de negocio y utilidades
│   ├── afip/        # Integración con AFIP
│   └── types/       # Tipos TypeScript
├── scripts/         # Scripts de configuración
└── docs/            # Documentación adicional
```

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev         # Iniciar servidor de desarrollo
npm run build       # Compilar para producción

# Utilidades
npm run setup       # Configurar proyecto automáticamente
npm run lint        # Verificar código
```

## ⚠️ Importante

Este sistema es para:
- ✅ Empresas que necesitan generar remitos electrónicos
- ✅ Desarrolladores que quieren integrar con AFIP
- ✅ Testing y desarrollo de aplicaciones

**Disclaimer**: El usuario es responsable de cumplir con todas las regulaciones de AFIP.

## 🌟 Características

- 🎨 Interfaz moderna y fácil de usar
- 📱 Responsive (funciona en mobile, tablet y desktop)
- 🌙 Modo oscuro automático
- ⚡ Rápido y eficiente
- 🔒 Seguro (certificados no se incluyen en git)
- 📦 Fácil de desplegar en Vercel

## 🆘 ¿Necesitas Ayuda?

1. **Primero**: Lee el `QUICKSTART.md`
2. **Problemas técnicos**: Revisa el `README.md`
3. **Certificados**: Lee `GUIA_CERTIFICADOS_AFIP.md`
4. **Deployment**: Lee `DEPLOYMENT.md`

## 🎓 Tutorial Rápido

### Crear Tu Primer Remito

1. Abre la app en http://localhost:3000
2. Completa el formulario:
   - **CUIT Emisor**: Tu CUIT (11 dígitos)
   - **CUIT Receptor**: CUIT del cliente
   - **Datos del receptor**: Nombre y domicilio
   - **Transporte**: Propio o tercero
   - **Origen y Destino**: Direcciones completas
   - **Items**: Productos/servicios a transportar
3. Clic en "Generar Remito en AFIP"
4. ¡Listo! Verás el CAE y número de remito

### Ver Remitos Generados

1. Clic en la pestaña "Mis Remitos"
2. Verás todos los remitos generados
3. Clic en el ícono 👁️ para ver detalles completos

## 🚀 Próximos Pasos Recomendados

1. [ ] Ejecuta el proyecto en desarrollo
2. [ ] Crea algunos remitos de prueba
3. [ ] Explora la documentación
4. [ ] Lee sobre certificados de AFIP
5. [ ] Despliega en Vercel (opcional)

## 💻 Requisitos del Sistema

- Node.js 18 o superior
- npm o yarn
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## 🌐 Deploy en Vercel

¿Listo para producción? Es fácil:

```bash
npm i -g vercel
vercel
```

Lee `DEPLOYMENT.md` para instrucciones completas.

## 📞 Soporte

- 📧 Abre un Issue en GitHub para bugs o preguntas
- 📖 Lee la documentación completa
- 🤝 Contribuye al proyecto (ver `CONTRIBUTING.md`)

## 🎉 ¡Empieza Ahora!

Todo está listo. Solo ejecuta:

```bash
npm install
npm run dev
```

¡Y comienza a generar remitos! 🚀

---

**¿Dudas?** Lee `QUICKSTART.md` para más detalles.

**¿Listo para producción?** Lee `GUIA_CERTIFICADOS_AFIP.md` y `DEPLOYMENT.md`.

