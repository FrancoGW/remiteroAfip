# Remitero AFIP - Sistema de Gestión de Remitos Electrónicos

Sistema web desarrollado en Next.js 14 para la generación y gestión de remitos electrónicos integrado con AFIP (Administración Federal de Ingresos Públicos de Argentina).

## 🚀 Características

- ✅ Generación de remitos electrónicos integrados con AFIP
- ✅ Interfaz moderna y responsive con Tailwind CSS
- ✅ Formulario completo con validaciones
- ✅ Lista de remitos generados con detalles
- ✅ Modo desarrollo y producción
- ✅ Integración con Web Services de AFIP (WSAA y WSCG)
- ✅ Gestión de certificados digitales
- ✅ TypeScript para mayor seguridad de tipos

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Certificado digital de AFIP (para producción)
- CUIT registrado en AFIP

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repo>
cd remiteroAfip
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# AFIP Configuration
AFIP_CUIT=20123456789
AFIP_CERT_PATH=./certs/cert.crt
AFIP_KEY_PATH=./certs/private.key
AFIP_PRODUCTION=false
```

4. **Configurar certificados de AFIP (para producción)**

Coloca tus certificados en la carpeta `certs/`:
- `cert.crt` - Certificado público
- `private.key` - Clave privada

## 🏃 Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🏗️ Compilar para Producción

```bash
npm run build
npm start
```

## 🌐 Desplegar en Vercel

### Opción 1: Deploy desde la CLI

```bash
npm i -g vercel
vercel
```

### Opción 2: Deploy desde GitHub

1. Sube tu código a un repositorio de GitHub
2. Conecta tu repositorio con Vercel
3. Configura las variables de entorno en el dashboard de Vercel
4. Despliega automáticamente

### Variables de Entorno en Vercel

En el dashboard de Vercel, configura las siguientes variables:

- `AFIP_CUIT`: Tu CUIT registrado en AFIP
- `AFIP_PRODUCTION`: `true` para producción, `false` para desarrollo
- `AFIP_CERT_PATH`: Ruta al certificado (o base64 del certificado)
- `AFIP_KEY_PATH`: Ruta a la clave privada (o base64 de la clave)

## 📁 Estructura del Proyecto

```
remiteroAfip/
├── app/
│   ├── api/
│   │   └── remitos/          # API routes para remitos
│   ├── layout.tsx            # Layout principal
│   ├── page.tsx              # Página principal
│   └── globals.css           # Estilos globales
├── components/
│   ├── RemitoForm.tsx        # Formulario de remitos
│   └── RemitoList.tsx        # Lista de remitos
├── lib/
│   ├── afip/
│   │   └── afipService.ts    # Servicio de integración con AFIP
│   └── types/
│       └── remito.ts         # Tipos TypeScript
├── certs/                     # Certificados AFIP (no incluidos en git)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

## 🔐 Seguridad

⚠️ **Importante**: Los certificados de AFIP son sensibles y nunca deben incluirse en el repositorio.

- Los certificados están excluidos en `.gitignore`
- En Vercel, almacena los certificados como variables de entorno en formato base64
- Usa variables de entorno diferentes para desarrollo y producción

## 🧪 Modo Desarrollo vs Producción

### Modo Desarrollo (`AFIP_PRODUCTION=false`)
- No requiere certificados reales
- Simula respuestas de AFIP
- Útil para testing y desarrollo
- Genera CAE y números de remito simulados

### Modo Producción (`AFIP_PRODUCTION=true`)
- Requiere certificados válidos de AFIP
- Conecta con los servicios reales de AFIP
- Genera remitos legalmente válidos
- **Solo usar en ambiente productivo**

## 📝 Uso del Sistema

### Generar un Remito

1. Completa el formulario con los datos del remito
2. Agrega los items/productos
3. Haz clic en "Generar Remito en AFIP"
4. El sistema te mostrará el CAE y número de remito generado

### Ver Remitos Generados

1. Ve a la pestaña "Mis Remitos"
2. Visualiza la lista de remitos generados
3. Haz clic en el ícono de ojo para ver detalles completos
4. Descarga el PDF del remito (próximamente)

## 🛠️ Tecnologías Utilizadas

- **Next.js 14** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos
- **SOAP** - Cliente para Web Services de AFIP
- **Axios** - Cliente HTTP

## 📚 Documentación de AFIP

- [Web Services AFIP](https://www.afip.gob.ar/ws/)
- [Remito Electrónico Cárnico](https://www.afip.gob.ar/rem/)
- [WSAA - Autenticación](https://www.afip.gob.ar/ws/WSAA/)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## ⚠️ Disclaimer

Este sistema es una herramienta de ayuda para la gestión de remitos electrónicos. El usuario es responsable de cumplir con todas las regulaciones de AFIP y asegurarse de que los datos ingresados sean correctos y completos.

## 📞 Soporte

Para preguntas o problemas, por favor abre un issue en el repositorio.

---

Desarrollado con ❤️ para la comunidad Argentina

