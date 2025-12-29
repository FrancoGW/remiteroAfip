#!/bin/bash

# Script para generar un remito de ejemplo con 43 toneladas
# Uso: bash scripts/probar-remito-ejemplo.sh

echo "📦 Generando remito de ejemplo con 43 toneladas..."
echo ""

# Hacer la petición POST al endpoint
curl -X POST http://localhost:3000/api/tusfacturas/generar-remito-ejemplo \
  -H "Content-Type: application/json" \
  -d '{
    "toneladas": 43,
    "producto": "Aserrable",
    "especie": "Pino",
    "categoria": "Super Grueso"
  }' \
  | jq '.'

echo ""
echo "✅ Remito generado (si todo salió bien)"


