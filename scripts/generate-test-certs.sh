#!/bin/bash

echo "🔐 Generando certificados de prueba para desarrollo local..."

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar OpenSSL
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ OpenSSL no está instalado${NC}"
    echo "Instala OpenSSL para continuar"
    exit 1
fi

# Crear directorio si no existe
mkdir -p certs
cd certs

# Leer CUIT del usuario
read -p "Ingresa tu CUIT (11 dígitos): " CUIT
read -p "Ingresa el nombre de tu empresa: " EMPRESA

# Generar clave privada
echo -e "${YELLOW}📝 Generando clave privada...${NC}"
openssl genrsa -out private.key 2048

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error generando clave privada${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Clave privada generada: private.key${NC}"

# Generar CSR
echo -e "${YELLOW}📝 Generando Certificate Signing Request (CSR)...${NC}"
openssl req -new -key private.key -out certificate.csr \
    -subj "/C=AR/O=${EMPRESA}/CN=${EMPRESA}/serialNumber=CUIT ${CUIT}"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error generando CSR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ CSR generado: certificate.csr${NC}"

# Generar certificado autofirmado para testing local
echo -e "${YELLOW}📝 Generando certificado autofirmado para testing...${NC}"
openssl x509 -req -days 365 -in certificate.csr -signkey private.key -out cert.crt

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error generando certificado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Certificado generado: cert.crt${NC}"

# Configurar permisos
chmod 600 private.key
chmod 644 cert.crt

echo ""
echo -e "${GREEN}🎉 Certificados de prueba generados exitosamente!${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "- Estos certificados son SOLO para desarrollo local"
echo "- NO funcionarán con los servicios reales de AFIP"
echo "- Para producción, debes obtener certificados oficiales de AFIP"
echo ""
echo "Archivos generados en la carpeta certs/:"
echo "- private.key (clave privada - NO compartir)"
echo "- certificate.csr (solicitud de certificado)"
echo "- cert.crt (certificado autofirmado)"
echo ""
echo "Para obtener certificados oficiales de AFIP:"
echo "1. Sube el archivo certificate.csr a AFIP"
echo "2. Descarga el certificado oficial de AFIP"
echo "3. Reemplaza cert.crt con el certificado oficial"
echo ""
echo "Lee GUIA_CERTIFICADOS_AFIP.md para más información"

