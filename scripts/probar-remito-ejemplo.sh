#!/bin/bash
# Ejemplo: crear remito vía API propia (POST /api/remitos).
# Requiere el servidor: pnpm dev (u otro) en http://localhost:3000
# Uso: bash scripts/probar-remito-ejemplo.sh

set -e
BASE="${BASE_URL:-http://localhost:3000}"

echo "📦 POST $BASE/api/remitos (ejemplo mínimo, transporte propio)..."
echo ""

curl -sS -X POST "$BASE/api/remitos" \
  -H "Content-Type: application/json" \
  -d '{
    "puntoVenta": 1,
    "fechaEmision": "2026-04-24",
    "codigoTipoRemito": 1,
    "cuitEmisor": "30693787285",
    "cuitReceptor": "30567890123",
    "nombreReceptor": "Cliente de prueba S.A.",
    "domicilioReceptor": "Av. Ejemplo 1234",
    "condicionIva": "RESPONSABLE INSCRIPTO",
    "tipoTransporte": 1,
    "origenDomicilio": "Ruta 12 Km 100",
    "origenLocalidad": "La Cruz",
    "origenProvincia": "Corrientes",
    "origenCodigoPostal": "3346",
    "destinoDomicilio": "Zona industrial",
    "destinoLocalidad": "Goya",
    "destinoProvincia": "Corrientes",
    "destinoCodigoPostal": "3450",
    "items": [
      {
        "codigo": "001",
        "descripcion": "Aserrable Pino",
        "cantidad": 10,
        "unidadMedida": "M3",
        "especie": "Pino",
        "categoria": "Super Grueso"
      }
    ]
  }' | jq '.'

echo ""
echo "✅ Listo (revisá success y errores en la respuesta JSON)"
