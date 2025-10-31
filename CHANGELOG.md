# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [0.1.0] - 2025-10-22

### Agregado
- ✨ Sistema completo de generación de remitos electrónicos
- 🔐 Integración con Web Services de AFIP (WSAA y WSCG)
- 📝 Formulario completo para crear remitos
- 📋 Lista de remitos generados con vista de detalles
- 🎨 Interfaz moderna y responsive con Tailwind CSS
- 🔄 Modo desarrollo (sin certificados) y producción
- 📦 Gestión de múltiples items por remito
- 🚚 Soporte para transporte propio y de terceros
- 📍 Gestión de origen y destino con provincias argentinas
- ✅ Validaciones de datos de remito
- 🔒 Manejo seguro de certificados digitales
- 📖 Documentación completa en español
- 🛠️ Scripts de configuración automática
- 🔐 Generador de certificados de prueba
- 📚 Guías de:
  - Instalación y configuración
  - Obtención de certificados de AFIP
  - Deployment en Vercel
  - Inicio rápido
  - Contribución al proyecto

### Características Técnicas
- ⚡ Next.js 14 con App Router
- 🔷 TypeScript para type safety
- 🎨 Tailwind CSS para estilos
- 🧩 Componentes modulares y reutilizables
- 🌐 API Routes para backend
- 📱 Diseño responsive (mobile-first)
- 🌙 Soporte para modo oscuro
- ♿ Accesibilidad mejorada
- 🚀 Optimizado para Vercel

### Configuración
- Variables de entorno para desarrollo y producción
- Soporte para certificados en archivos o base64
- Configuración flexible de CUIT y puntos de venta

### Documentación
- README completo con instrucciones de uso
- QUICKSTART para inicio rápido
- DEPLOYMENT guide para Vercel
- GUIA_CERTIFICADOS_AFIP detallada
- CONTRIBUTING guide para colaboradores
- Scripts de setup automatizado

### Seguridad
- Certificados excluidos de git
- Variables de entorno para datos sensibles
- Validaciones de CUIT
- Manejo seguro de claves privadas

## [Unreleased]

### Por Agregar
- [ ] Generación de PDF de remitos
- [ ] Integración con base de datos (PostgreSQL/MongoDB)
- [ ] Sistema de autenticación de usuarios
- [ ] Panel de administración
- [ ] Búsqueda y filtrado de remitos
- [ ] Exportación a Excel/CSV
- [ ] Notificaciones por email
- [ ] Multi-empresa (múltiples CUITs)
- [ ] Histórico de cambios en remitos
- [ ] Dashboard con estadísticas
- [ ] API REST para integraciones
- [ ] Webhooks para eventos
- [ ] Tests unitarios y de integración
- [ ] CI/CD pipeline
- [ ] Monitoreo y logging
- [ ] Cache de respuestas de AFIP
- [ ] Retry logic para fallos de red
- [ ] Internacionalización (i18n)

### Mejoras Planeadas
- [ ] Optimización de performance
- [ ] Mejoras de accesibilidad
- [ ] Modo offline con sincronización
- [ ] PWA (Progressive Web App)
- [ ] Soporte para otros comprobantes de AFIP
- [ ] Integración con sistemas de gestión
- [ ] App móvil (React Native)

---

## Tipos de Cambios

- **Agregado** - Para nuevas características
- **Cambiado** - Para cambios en funcionalidades existentes
- **Deprecado** - Para características que serán eliminadas
- **Eliminado** - Para características eliminadas
- **Corregido** - Para correcciones de bugs
- **Seguridad** - En caso de vulnerabilidades

## Versionado

Este proyecto usa [Semantic Versioning](https://semver.org/):
- **MAJOR** - Cambios incompatibles en la API
- **MINOR** - Nuevas características compatibles con versiones anteriores
- **PATCH** - Correcciones de bugs compatibles con versiones anteriores

