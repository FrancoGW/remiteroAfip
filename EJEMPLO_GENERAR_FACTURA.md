# Generar Factura desde Formulario Forestal

Este documento explica cómo generar una factura electrónica usando tusfacturas.app con los datos del formulario forestal.

## Endpoint Disponible

**POST** `/api/tusfacturas/generar-factura-ejemplo`

## Datos del Formulario (Ejemplo)

Basado en el formulario mostrado, estos son los datos disponibles:

```json
{
  "puntoVenta": 13,
  "fechaEmision": "2025-12-16",
  "cliente": "FEPAL S.A.",
  "cuitCliente": "20987654321",
  "producto": "Aserrable",
  "especie": "Pino",
  "categoria": "Super Grueso",
  "subCategoria": "Super Grueso",
  "toneladas": 29.44,
  "m3": 44.44,
  "largos": 3.15,
  "precioPorTonelada": 50000,
  "cuitEmisor": "20123456789",
  "domicilioCliente": "Dirección del cliente",
  "observaciones": "Remito: 23944",
  "tipoComprobante": 1
}
```

## Campos Requeridos

- `cuitEmisor`: CUIT del emisor (tu empresa)
- `cuitCliente`: CUIT del cliente (FEPAL S.A.)
- `precioPorTonelada` O `precioPorM3`: Precio unitario para calcular el total

## Campos Opcionales

- `puntoVenta`: Por defecto 13
- `fechaEmision`: Por defecto fecha actual
- `tipoComprobante`: 1 (Factura A) por defecto, 6 para Factura B
- `domicilioCliente`: Dirección del cliente
- `observaciones`: Observaciones adicionales

## Ejemplo de Uso con cURL

```bash
curl -X POST http://localhost:3000/api/tusfacturas/generar-factura-ejemplo \
  -H "Content-Type: application/json" \
  -d '{
    "puntoVenta": 13,
    "fechaEmision": "2025-12-16",
    "cliente": "FEPAL S.A.",
    "cuitCliente": "30567890123",
    "producto": "Aserrable",
    "especie": "Pino",
    "categoria": "Super Grueso",
    "toneladas": 29.44,
    "m3": 44.44,
    "largos": 3.15,
    "precioPorTonelada": 50000,
    "cuitEmisor": "20123456789",
    "domicilioCliente": "Av. Principal 123",
    "observaciones": "Remito: 23944",
    "tipoComprobante": 1
  }'
```

## Ejemplo de Uso desde JavaScript/TypeScript

```typescript
async function generarFactura() {
  const datosFactura = {
    puntoVenta: 13,
    fechaEmision: "2025-12-16",
    cliente: "FEPAL S.A.",
    cuitCliente: "30567890123", // CUIT de FEPAL S.A.
    producto: "Aserrable",
    especie: "Pino",
    categoria: "Super Grueso",
    subCategoria: "Super Grueso",
    toneladas: 29.44,
    m3: 44.44,
    largos: 3.15,
    precioPorTonelada: 50000, // Precio por tonelada
    cuitEmisor: "20123456789", // Tu CUIT
    domicilioCliente: "Av. Principal 123",
    observaciones: "Remito: 23944",
    tipoComprobante: 1, // 1: Factura A
  };

  try {
    const response = await fetch("/api/tusfacturas/generar-factura-ejemplo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosFactura),
    });

    const resultado = await response.json();

    if (resultado.success) {
      console.log("✅ Factura generada exitosamente:");
      console.log("Número de comprobante:", resultado.datos.numeroComprobante);
      console.log("CAE:", resultado.datos.cae);
      console.log("PDF:", resultado.datos.pdf);
      console.log("Estado:", resultado.datos.estado);
    } else {
      console.error("❌ Error:", resultado.errores);
    }
  } catch (error) {
    console.error("❌ Error al generar factura:", error);
  }
}
```

## Respuesta Exitosa

```json
{
  "success": true,
  "factura": {
    "id": "12345",
    "numeroComprobante": 123456,
    "puntoVenta": 13,
    "cae": "12345678901234",
    "vencimientoCae": "2026-01-15",
    "fechaEmision": "2025-12-16",
    "estado": "aprobado",
    "pdf": "https://..."
  },
  "message": "Factura generada exitosamente",
  "datos": {
    "numeroComprobante": 123456,
    "cae": "12345678901234",
    "vencimientoCae": "2026-01-15",
    "pdf": "https://...",
    "estado": "aprobado"
  },
  "resumen": {
    "cliente": "FEPAL S.A.",
    "importeTotal": 1472000,
    "importeNeto": 1216528.93,
    "importeIva": 255471.07
  }
}
```

## Respuesta con Error

```json
{
  "success": false,
  "errores": [
    "El CUIT del emisor es requerido"
  ],
  "ejemplo": {
    "cuitEmisor": "20123456789",
    "cuitCliente": "20987654321",
    "precioPorTonelada": 50000
  }
}
```

## Notas Importantes

1. **CUIT del Cliente**: Necesitas el CUIT real de FEPAL S.A. para generar la factura
2. **Precio**: Debes proporcionar `precioPorTonelada` o `precioPorM3` para calcular el importe total
3. **Tipo de Comprobante**: 
   - `1` = Factura A (Responsable Inscripto)
   - `6` = Factura B (Consumidor Final)
4. **IVA**: Se calcula automáticamente al 21%
5. **Unidad de Medida**: Si usas `precioPorTonelada`, la unidad será "KG". Si usas `precioPorM3`, será "M3"

## Cálculo de Importes

- Si usas `precioPorTonelada`: `importeTotal = toneladas × precioPorTonelada`
- Si usas `precioPorM3`: `importeTotal = m3 × precioPorM3`
- `importeNeto = importeTotal / 1.21`
- `importeIva = importeTotal - importeNeto`


