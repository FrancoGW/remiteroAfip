#!/bin/bash

echo "🚀 Configurando Remitero AFIP..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Por favor instala Node.js desde https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) encontrado${NC}"

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm --version) encontrado${NC}"

# Instalar dependencias
echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error instalando dependencias${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencias instaladas${NC}"

# Crear directorio para certificados
echo -e "${YELLOW}📁 Creando directorio para certificados...${NC}"
mkdir -p certs

echo -e "${GREEN}✅ Directorio certs/ creado${NC}"

# Crear archivo .env.local si no existe
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}📝 Creando archivo .env.local...${NC}"
    cat > .env.local << 'EOF'
# AFIP Configuration
AFIP_CUIT=20123456789
AFIP_CERT_PATH=./certs/cert.crt
AFIP_KEY_PATH=./certs/private.key
AFIP_PRODUCTION=false

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=cambiar_este_secreto_por_uno_seguro
EOF
    echo -e "${GREEN}✅ Archivo .env.local creado${NC}"
    echo -e "${YELLOW}⚠️  No olvides configurar tus credenciales de AFIP en .env.local${NC}"
else
    echo -e "${GREEN}✅ Archivo .env.local ya existe${NC}"
fi

# Verificar OpenSSL para certificados
if command -v openssl &> /dev/null; then
    echo -e "${GREEN}✅ OpenSSL $(openssl version | cut -d' ' -f2) encontrado${NC}"
    echo -e "${YELLOW}💡 Puedes generar certificados con: npm run generate-certs${NC}"
else
    echo -e "${YELLOW}⚠️  OpenSSL no encontrado. Necesitarás OpenSSL para generar certificados${NC}"
fi

echo ""
echo -e "${GREEN}🎉 ¡Configuración completada!${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Configura tu CUIT en .env.local"
echo "2. Obtén tus certificados de AFIP (ver GUIA_CERTIFICADOS_AFIP.md)"
echo "3. Coloca los certificados en la carpeta certs/"
echo "4. Ejecuta: npm run dev"
echo ""
echo "Para más información, lee el README.md"

