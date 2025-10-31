# Guía: Cómo Obtener y Configurar Certificados de AFIP

Esta guía te ayudará a obtener los certificados necesarios para utilizar los Web Services de AFIP.

## ⚠️ Importante

Los certificados de AFIP son diferentes según el ambiente:
- **Homologación/Testing**: Para desarrollo y pruebas
- **Producción**: Para uso real con validez legal

## Paso 1: Generar el Certificado (CSR)

### En Linux/macOS

```bash
# Crear directorio para certificados
mkdir -p certs
cd certs

# Generar clave privada (2048 bits mínimo)
openssl genrsa -out private.key 2048

# Generar Certificate Signing Request (CSR)
openssl req -new -key private.key -out certificate.csr \
  -subj "/C=AR/O=TU_EMPRESA/CN=TU_NOMBRE/serialNumber=CUIT TU_CUIT"
```

### En Windows

Descarga e instala OpenSSL para Windows:
- [Win64 OpenSSL](https://slproweb.com/products/Win32OpenSSL.html)

Luego ejecuta los mismos comandos en PowerShell o CMD.

### Parámetros del CSR

- **C**: Código de país (AR para Argentina)
- **O**: Nombre de tu organización/empresa
- **CN**: Tu nombre o razón social
- **serialNumber**: Tu CUIT con el formato "CUIT XXXXXXXXXXX"

## Paso 2: Obtener Certificado de AFIP

### Para Ambiente de Homologación (Testing)

1. **Accede al Administrador de Relaciones de Clave Fiscal**
   - URL: https://auth.afip.gob.ar/contribuyente_/login.xhtml
   - Ingresa con tu CUIT y Clave Fiscal

2. **Administrador de Relaciones de Clave Fiscal**
   - Nueva Relación
   - Servicio: "wsrem" (Web Service Remito Electrónico)
   - Ambiente: Homologación

3. **Subir el CSR**
   - Selecciona el archivo `certificate.csr` generado
   - AFIP generará el certificado

4. **Descargar el Certificado**
   - Descarga el archivo `.crt` generado
   - Guárdalo como `cert.crt` en la carpeta `certs/`

### Para Ambiente de Producción

1. **Accede al Administrador de Relaciones**
   - Mismos pasos que homologación
   - Pero selecciona ambiente: **Producción**

2. **⚠️ Certificado de Producción**
   - Requiere autorización adicional
   - Puede requerir trámite presencial en AFIP
   - Tiene fecha de vencimiento (renovar periódicamente)

## Paso 3: Verificar los Certificados

```bash
# Verificar la clave privada
openssl rsa -in private.key -check

# Ver información del certificado
openssl x509 -in cert.crt -text -noout

# Verificar que la clave y el certificado coinciden
openssl x509 -noout -modulus -in cert.crt | openssl md5
openssl rsa -noout -modulus -in private.key | openssl md5
# Los MD5 deben ser idénticos
```

## Paso 4: Configurar en la Aplicación

### Estructura de Carpetas

```
remiteroAfip/
├── certs/
│   ├── private.key         # Clave privada (NUNCA compartir)
│   ├── cert.crt            # Certificado público
│   └── certificate.csr     # CSR (puede eliminarse después)
└── .env.local
```

### Archivo .env.local

```env
AFIP_CUIT=20123456789
AFIP_CERT_PATH=./certs/cert.crt
AFIP_KEY_PATH=./certs/private.key
AFIP_PRODUCTION=false
```

## Paso 5: Para Deploy en Vercel

Los certificados no pueden subirse directamente a Vercel. Usa base64:

```bash
# Convertir a base64
cat cert.crt | base64 | tr -d '\n' > cert.crt.base64
cat private.key | base64 | tr -d '\n' > private.key.base64
```

En Vercel, configura las variables:
- `AFIP_CERT_BASE64`: Contenido de cert.crt.base64
- `AFIP_KEY_BASE64`: Contenido de private.key.base64

## Servicios Web de AFIP que Necesitan Certificados

### WSAA (Autenticación)
- Servicio: LoginCms
- URL Testing: https://wsaahomo.afip.gov.ar/ws/services/LoginCms
- URL Producción: https://wsaa.afip.gov.ar/ws/services/LoginCms

### WSCG (Remito Electrónico)
- Servicio: wsrem
- URL Testing: https://fwshomo.afip.gob.ar/wscg/services/RemitoService
- URL Producción: https://serviciosjava.afip.gob.ar/wscg/services/RemitoService

## Errores Comunes

### "Certificate verification failed"
**Causa**: El certificado no es válido o no coincide con la clave privada  
**Solución**: Verifica que cert.crt y private.key correspondan entre sí

### "Service not authorized"
**Causa**: El servicio no está habilitado en AFIP para tu CUIT  
**Solución**: Registra el servicio en el Administrador de Relaciones de AFIP

### "Certificate expired"
**Causa**: El certificado venció  
**Solución**: Genera un nuevo CSR y obtén un nuevo certificado de AFIP

### "Invalid CUIT"
**Causa**: El CUIT en el certificado no coincide con el configurado  
**Solución**: Verifica que el CUIT en .env.local sea correcto

## Renovación de Certificados

Los certificados de AFIP tienen una validez limitada (generalmente 1-2 años):

1. Antes de que expire, genera un nuevo CSR
2. Solicita un nuevo certificado en AFIP
3. Reemplaza el certificado viejo con el nuevo
4. No es necesario cambiar la clave privada si no está comprometida

## Seguridad

### ✅ Hacer
- Mantén la clave privada segura y encriptada
- Usa permisos restrictivos: `chmod 600 private.key`
- No subas certificados al repositorio Git
- Usa variables de entorno para producción
- Renueva certificados antes de que expiren
- Usa certificados diferentes para testing y producción

### ❌ NO Hacer
- NUNCA subas private.key a Git
- NUNCA compartas tu clave privada
- NUNCA uses el mismo certificado en múltiples ambientes
- NUNCA dejes certificados en código público

## Checklist Final

- [ ] Clave privada generada (private.key)
- [ ] CSR generado (certificate.csr)
- [ ] Certificado obtenido de AFIP (cert.crt)
- [ ] Certificado verificado con openssl
- [ ] Variables de entorno configuradas
- [ ] Certificados en .gitignore
- [ ] Permisos de archivo configurados (600 para private.key)
- [ ] Testing en ambiente de homologación exitoso
- [ ] (Producción) Certificado de producción obtenido y configurado

## Referencias

- [AFIP - Web Services](https://www.afip.gob.ar/ws/)
- [AFIP - Certificados Digitales](https://www.afip.gob.ar/ws/documentacion/certificados.asp)
- [AFIP - WSAA](https://www.afip.gob.ar/ws/WSAA/Especificacion_Tecnica_WSAA_1.2.0.pdf)
- [AFIP - REM](https://www.afip.gob.ar/rem/)

## Soporte

Si tienes problemas:
1. Verifica los logs de la aplicación
2. Revisa que el servicio esté habilitado en AFIP
3. Consulta la documentación oficial de AFIP
4. Contacta al soporte técnico de AFIP: (011) 4347-4450

---

**Última actualización**: Octubre 2025

