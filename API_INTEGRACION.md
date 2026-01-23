# API de Integración - Remitero AFIP

## Base URL
https://remitero-afip.vercel.app

---

## 1. Generar Remito

**Endpoint:** POST /api/remitos

**Headers:**
- Content-Type: application/json

**Estructura del JSON:**

```json
{
  "puntoVenta": 13,
  "fechaEmision": "2024-12-20",
  "codigoTipoRemito": 1,
  "cuitEmisor": "30693787285",
  "cuitReceptor": "30567890123",
  "nombreReceptor": "FEPAL S.A.",
  "domicilioReceptor": "Av. Libertador 1234",
  "predio": "Toro Cuare",
  "rodal": "45",
  "domicilioFiscal": "Av. Libertador 1234, CABA",
  "condicionIva": "RESPONSABLE INSCRIPTO",
  "tipoTransporte": 2,
  "cuitTransportista": "20345678901",
  "nombreTransportista": "Seubert German",
  "dominioVehiculo": "SDR 830",
  "dominioAcoplado": "RDW 661",
  "conductor": "Fernandez Benjamin",
  "dniConductor": "34567890",
  "origenDomicilio": "Ruta Nacional 12, Km 234",
  "origenLocalidad": "La Cruz",
  "origenProvincia": "Corrientes",
  "origenCodigoPostal": "3346",
  "destinoDomicilio": "Zona Industrial Norte",
  "destinoLocalidad": "Buenos Aires",
  "destinoProvincia": "Buenos Aires",
  "destinoCodigoPostal": "1425",
  "items": [
    {
      "codigo": "ASR-001",
      "descripcion": "Aserrable",
      "cantidad": 1,
      "unidadMedida": "M3",
      "pesoNeto": 29.44,
      "pesoBruto": 44.44,
      "especie": "Pino",
      "largo": 3.15,
      "categoria": "Super Grueso",
      "m3Stereo": 44.44,
      "tara": 15.00,
      "balanza": "La Fuente"
    }
  ],
  "observaciones": "Mercadería certificada FSC 100%"
}
```

**Campos Obligatorios:**

Generales:
- puntoVenta (number)
- fechaEmision (string, formato: YYYY-MM-DD)
- codigoTipoRemito (number: 1 = Remito R, 2 = Remito Primario)

Receptor:
- cuitEmisor (string, 11 dígitos)
- cuitReceptor (string, 11 dígitos)
- nombreReceptor (string)
- domicilioReceptor (string)

Transporte:
- tipoTransporte (number: 1 = Propio, 2 = Tercero)
- Si tipoTransporte = 2: cuitTransportista es obligatorio

Origen:
- origenDomicilio (string)
- origenLocalidad (string)
- origenProvincia (string)
- origenCodigoPostal (string)

Destino:
- destinoDomicilio (string)
- destinoLocalidad (string)
- destinoProvincia (string)
- destinoCodigoPostal (string)

Items:
- items[] (array con al menos 1 item)
- Cada item debe tener: codigo, descripcion, cantidad, unidadMedida

**Campos Opcionales:**

Receptor: predio, rodal, domicilioFiscal, condicionIva

Transporte: nombreTransportista, dominioVehiculo, dominioAcoplado, conductor, dniConductor

Items: pesoNeto, pesoBruto, especie, largo, categoria, m3Stereo, tara, balanza

Generales: observaciones

**Unidades de Medida Válidas:**
- KG (Kilogramo)
- UN (Unidad)
- LT (Litro)
- MT (Metro)
- M2 (Metro Cuadrado)
- M3 (Metro Cúbico)

**Respuesta Exitosa:**

```json
{
  "success": true,
  "cae": "CAE-1234567890",
  "vencimientoCae": "2025-03-20",
  "numeroRemito": 123,
  "remito": {
    "id": "1734567890123",
    "numeroRemito": 123,
    "cae": "CAE-1234567890"
  },
  "pdfBase64": "JVBERi0xLjQKJeLjz9MK..."
}
```

IMPORTANTE: Guarda el remito.id de la respuesta para descargar el PDF después.

**Respuesta con Error:**

```json
{
  "success": false,
  "errores": [
    "cuitReceptor es requerido",
    "items[0].codigo es requerido"
  ]
}
```

**Ejemplo con cURL:**

curl -X POST https://remitero-afip.vercel.app/api/remitos -H "Content-Type: application/json" -d '{"puntoVenta": 13, "fechaEmision": "2024-12-20", "codigoTipoRemito": 1, "cuitEmisor": "30693787285", "cuitReceptor": "30567890123", "nombreReceptor": "FEPAL S.A.", "domicilioReceptor": "Av. Libertador 1234", "tipoTransporte": 1, "origenDomicilio": "Ruta Nacional 12", "origenLocalidad": "La Cruz", "origenProvincia": "Corrientes", "origenCodigoPostal": "3346", "destinoDomicilio": "Zona Industrial", "destinoLocalidad": "Buenos Aires", "destinoProvincia": "Buenos Aires", "destinoCodigoPostal": "1425", "items": [{"codigo": "ASR-001", "descripcion": "Aserrable", "cantidad": 1, "unidadMedida": "M3"}]}'

---

## 2. Descargar PDF del Remito

**Endpoint:** GET /api/remitos/{id}/pdf

**Parámetros:**
- id (string): ID del remito obtenido en la respuesta del POST

**Respuesta:**
- Content-Type: application/pdf
- Body: Archivo PDF binario

**Ejemplo con cURL:**

curl -X GET https://remitero-afip.vercel.app/api/remitos/1734567890123/pdf --output remito.pdf

**Ejemplo en JavaScript:**

// Opción 1: Abrir en nueva pestaña
window.open('https://remitero-afip.vercel.app/api/remitos/' + remitoId + '/pdf', '_blank');

// Opción 2: Descargar con fetch
fetch('https://remitero-afip.vercel.app/api/remitos/' + remitoId + '/pdf')
  .then(res => res.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'remito-' + remitoId + '.pdf';
    a.click();
    URL.revokeObjectURL(url);
  });

---

## 3. Obtener Detalles del Remito

**Endpoint:** GET /api/remitos/{id}

**Respuesta:**

```json
{
  "success": true,
  "remito": {
    "id": "1734567890123",
    "numeroRemito": 123,
    "cae": "CAE-1234567890",
    "vencimientoCae": "2025-03-20"
  }
}
```

---

## Flujo de Integración Recomendado

**Paso 1: Generar Remito**

const response = await fetch('https://remitero-afip.vercel.app/api/remitos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(datosRemito)
});

const data = await response.json();
const remitoId = data.remito.id; // Guardar este ID

**Paso 2: Mostrar Botón de Descarga**

Cuando el usuario haga clic en "Descargar PDF":

function descargarPDF(remitoId) {
  window.open('https://remitero-afip.vercel.app/api/remitos/' + remitoId + '/pdf', '_blank');
}

---

## CORS

Todos los endpoints tienen CORS habilitado para permitir requests desde cualquier origen.

Headers CORS:
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods: GET, POST, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Authorization

---

## Códigos de Estado HTTP

- 200: Éxito
- 400: Error de validación (datos faltantes o incorrectos)
- 404: Remito no encontrado
- 500: Error del servidor

---

## Notas Importantes

1. Modo Desarrollo: En desarrollo, los CAE son simulados. En producción se conecta con AFIP real.

2. Almacenamiento: Los remitos se guardan en memoria. En producción, considera usar una base de datos.

3. PDF Base64: El POST también devuelve el PDF en base64 en el campo pdfBase64 si necesitas procesarlo directamente.

4. ID del Remito: El id es único y se genera automáticamente. Úsalo para todas las operaciones posteriores.
