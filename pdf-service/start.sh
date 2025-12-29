#!/bin/bash

# Script para iniciar el servicio PDF localmente

echo "🚀 Iniciando servicio de generación de PDFs..."
echo "📦 Instalando dependencias..."

pip install -r requirements.txt

echo "✅ Dependencias instaladas"
echo "🌐 Iniciando servidor en http://localhost:8000"
echo "📚 Documentación disponible en http://localhost:8000/docs"

uvicorn main:app --reload --host 0.0.0.0 --port 8000

