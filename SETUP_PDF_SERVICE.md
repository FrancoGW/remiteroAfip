# Setup del Servicio de Generación de PDFs

## ¿Qué es esto?

Hemos creado un servicio separado en Python que genera los PDFs usando ReportLab. Este servicio funciona perfectamente en entornos serverless y no tiene problemas con fuentes.

## Estructura

- **Next.js (tu app actual)**: Maneja toda la lógica de negocio, UI, y APIs
- **Servicio Python (`pdf-service/`)**: Solo genera PDFs cuando se le solicita

## Setup Local

### 1. Instalar dependencias del servicio Python

```bash
cd pdf-service
pip install -r requirements.txt
```

### 2. Iniciar el servicio Python

```bash
# Opción 1: Usar el script
./start.sh

# Opción 2: Manualmente
uvicorn main:app --reload --port 8000
```

El servicio estará disponible en `http://localhost:8000`

### 3. Configurar Next.js para usar el servicio local

El código ya está configurado para usar `http://localhost:8000` por defecto. Si necesitas cambiar la URL, agrega esta variable de entorno:

```bash
# En .env.local
PDF_SERVICE_URL=http://localhost:8000
```

### 4. Probar

1. Inicia el servicio Python (paso 2)
2. Inicia Next.js: `npm run dev`
3. Crea un remito y descarga el PDF

## Despliegue en Producción

### Opción 1: Desplegar el servicio Python en Vercel (Recomendado)

Vercel soporta funciones serverless de Python. Crea un archivo `vercel.json` en la carpeta `pdf-service`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "main.py"
    }
  ]
}
```

Luego despliega el servicio Python como un proyecto separado en Vercel.

### Opción 2: Desplegar en otro servicio

El servicio Python puede desplegarse en:
- **Railway**: Muy fácil, conecta tu repo y listo
- **Render**: Similar a Railway
- **AWS Lambda**: Usando serverless framework
- **Google Cloud Functions**: Similar a Lambda
- **Docker**: Cualquier plataforma que soporte Docker

### Configurar la URL en producción

Una vez desplegado, configura la variable de entorno en Vercel:

```
PDF_SERVICE_URL=https://tu-servicio-pdf.railway.app
```

## Ventajas de esta solución

✅ **No rompe tu código existente**: Todo sigue funcionando igual  
✅ **Funciona en serverless**: ReportLab no tiene problemas con fuentes  
✅ **Escalable**: El servicio Python puede escalar independientemente  
✅ **Mantenible**: Separación clara de responsabilidades  
✅ **Confiable**: ReportLab es una librería madura y estable  

## Troubleshooting

### El servicio no responde

1. Verifica que el servicio Python esté corriendo: `curl http://localhost:8000/health`
2. Verifica la variable de entorno `PDF_SERVICE_URL`
3. Revisa los logs del servicio Python

### Error de conexión

- Asegúrate de que el servicio Python esté accesible desde Next.js
- En producción, verifica que la URL sea correcta y accesible públicamente

