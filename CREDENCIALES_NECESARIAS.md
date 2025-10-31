# 🔐 Credenciales Necesarias para Generar Remitos

## 📋 Resumen Rápido

Para generar remitos electrónicos en AFIP necesitas configurar **2 cosas principales**:

1. **Tu CUIT** (identificación fiscal)
2. **Certificados digitales de AFIP** (solo para producción)

---

## 🎯 Modo Desarrollo (Actual)

### ✅ Lo que YA está configurado

En el archivo `.env.local` ya tienes:

```env
AFIP_CUIT=20123456789        # 👈 CAMBIAR por tu CUIT real
AFIP_PRODUCTION=false         # Modo desarrollo activado
```

### 🔧 Lo que DEBES hacer:

1. **Cambiar el CUIT por el tuyo:**
   - Abre el archivo `.env.local`
   - Reemplaza `20123456789` con tu CUIT de 11 dígitos
   - Ejemplo: `AFIP_CUIT=20345678901`

2. **¡Listo!** En modo desarrollo NO necesitas certificados.

---

## 🏭 Modo Producción (AFIP Real)

Para generar remitos **legalmente válidos** con AFIP, necesitas:

### 1️⃣ CUIT Registrado en AFIP

- **Qué es**: Tu número de CUIT (11 dígitos)
- **Formato**: `20XXXXXXXX9` (sin guiones)
- **Dónde configurar**: Archivo `.env.local`
  ```env
  AFIP_CUIT=20345678901
  ```

### 2️⃣ Certificado Digital de AFIP

Necesitas **2 archivos**:

#### 📄 Certificado Público (`cert.crt`)
- **Qué es**: Certificado X.509 emitido por AFIP
- **Dónde colocarlo**: `certs/cert.crt`
- **Cómo obtenerlo**: 
  1. Generas un CSR (Certificate Signing Request)
  2. Lo subes a AFIP
  3. AFIP te devuelve el certificado `.crt`

#### 🔑 Clave Privada (`private.key`)
- **Qué es**: Tu clave privada RSA de 2048 bits
- **Dónde colocarlo**: `certs/private.key`
- **Cómo obtenerla**: La generas tú con OpenSSL
- **⚠️ IMPORTANTE**: ¡NUNCA compartir ni subir a Git!

### 3️⃣ Servicio Habilitado en AFIP

- **Servicio**: "wsrem" (Web Service de Remito Electrónico)
- **Dónde habilitarlo**: Administrador de Relaciones de Clave Fiscal AFIP
- **URL**: https://auth.afip.gob.ar/

---

## 📝 Configuración Completa por Ambiente

### 🧪 Desarrollo (Testing)

**Archivo: `.env.local`**
```env
# CUIT de tu empresa
AFIP_CUIT=20345678901

# Modo desarrollo (NO requiere certificados)
AFIP_PRODUCTION=false

# Rutas (no se usan en desarrollo)
AFIP_CERT_PATH=./certs/cert.crt
AFIP_KEY_PATH=./certs/private.key
```

**Lo que pasa:**
- ✅ Sistema simula respuestas de AFIP
- ✅ Genera CAE y números de remito de prueba
- ✅ NO se comunica con AFIP real
- ✅ Perfecto para desarrollo y testing

### 🏭 Producción (AFIP Real)

**Archivo: `.env.local`**
```env
# CUIT de tu empresa
AFIP_CUIT=20345678901

# Modo producción (USA certificados reales)
AFIP_PRODUCTION=true

# Rutas a tus certificados
AFIP_CERT_PATH=./certs/cert.crt
AFIP_KEY_PATH=./certs/private.key
```

**Archivos necesarios:**
```
certs/
├── cert.crt         ← Certificado de AFIP
└── private.key      ← Tu clave privada
```

**Lo que pasa:**
- ✅ Se comunica con AFIP real
- ✅ Genera CAE y números válidos legalmente
- ✅ Requiere certificados oficiales
- ⚠️ Solo usar cuando tengas certificados de AFIP

---

## 🎓 Cómo Obtener los Certificados

### Paso 1: Generar Clave Privada y CSR

```bash
# En tu terminal (macOS/Linux)
cd certs/

# Generar clave privada
openssl genrsa -out private.key 2048

# Generar CSR (Certificate Signing Request)
openssl req -new -key private.key -out certificate.csr \
  -subj "/C=AR/O=TU_EMPRESA/CN=TU_NOMBRE/serialNumber=CUIT 20345678901"
```

### Paso 2: Subir CSR a AFIP

1. Ingresa a: https://auth.afip.gob.ar/
2. Ve a: **Administrador de Relaciones de Clave Fiscal**
3. Selecciona: **Nueva Relación**
4. Servicio: **wsrem** (Remito Electrónico)
5. Ambiente: **Homologación** (para testing) o **Producción**
6. Sube tu archivo `certificate.csr`
7. AFIP generará tu certificado

### Paso 3: Descargar Certificado de AFIP

1. Descarga el archivo `.crt` que te da AFIP
2. Guárdalo como `certs/cert.crt`
3. ✅ ¡Ya tienes tus certificados!

### Paso 4: Verificar

```bash
# Verificar que cert y key coinciden
openssl x509 -noout -modulus -in cert.crt | openssl md5
openssl rsa -noout -modulus -in private.key | openssl md5
# Los MD5 deben ser iguales
```

---

## 📊 Resumen Visual

```
┌─────────────────────────────────────────────┐
│          MODO DESARROLLO (Actual)           │
├─────────────────────────────────────────────┤
│ ✅ CUIT: Tu CUIT (en .env.local)            │
│ ✅ Certificados: NO necesarios              │
│ ✅ Remitos: Simulados (testing)             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         MODO PRODUCCIÓN (AFIP Real)         │
├─────────────────────────────────────────────┤
│ ✅ CUIT: Tu CUIT (en .env.local)            │
│ ✅ cert.crt: Certificado de AFIP            │
│ ✅ private.key: Tu clave privada            │
│ ✅ Servicio wsrem habilitado en AFIP        │
│ ✅ Remitos: Válidos legalmente              │
└─────────────────────────────────────────────┘
```

---

## ⚠️ Importante

### En Desarrollo (Ahora)
- ❌ NO necesitas certificados de AFIP
- ✅ Solo necesitas tu CUIT en `.env.local`
- ✅ Puedes empezar a usar el sistema YA

### En Producción (Después)
- ✅ Necesitas certificados oficiales de AFIP
- ✅ El servicio wsrem debe estar habilitado
- ✅ Los remitos serán legalmente válidos

---

## 🔍 Checklist de Configuración

### Para Empezar (Desarrollo)
- [ ] Abrir archivo `.env.local`
- [ ] Cambiar `AFIP_CUIT` por tu CUIT real
- [ ] Verificar que `AFIP_PRODUCTION=false`
- [ ] ✅ ¡Ya puedes generar remitos de prueba!

### Para Producción (Cuando estés listo)
- [ ] Generar clave privada con OpenSSL
- [ ] Generar CSR
- [ ] Subir CSR a AFIP
- [ ] Descargar certificado de AFIP
- [ ] Guardar archivos en `certs/`
- [ ] Cambiar `AFIP_PRODUCTION=true` en `.env.local`
- [ ] Verificar que el servicio wsrem esté habilitado
- [ ] ✅ ¡Listo para generar remitos oficiales!

---

## 📚 Más Información

Lee estos documentos para más detalles:

- **GUIA_CERTIFICADOS_AFIP.md** - Guía completa de certificados
- **QUICKSTART.md** - Inicio rápido
- **README.md** - Documentación completa

---

## 🆘 Preguntas Frecuentes

### ¿Puedo usar el sistema sin certificados?
✅ **Sí**, en modo desarrollo (`AFIP_PRODUCTION=false`) no necesitas certificados.

### ¿Los remitos en modo desarrollo son válidos?
❌ **No**, son simulados para testing. Para remitos válidos necesitas modo producción con certificados.

### ¿Cuánto cuestan los certificados de AFIP?
✅ **Son gratuitos**. AFIP los emite sin costo.

### ¿Cuánto duran los certificados?
⏱️ **1-2 años** generalmente. Después debes renovarlos.

### ¿Qué pasa si mi certificado vence?
⚠️ No podrás generar remitos. Debes renovarlo antes de que expire.

---

## 📞 Soporte AFIP

- **Teléfono**: 0810-999-2347
- **Web**: https://www.afip.gob.ar/
- **Documentación**: https://www.afip.gob.ar/ws/

---

**Última actualización**: Octubre 2025

