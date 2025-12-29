# Servicio de Generación de PDFs

Este servicio separado genera PDFs usando Python y ReportLab, que funciona perfectamente en entornos serverless.

## Instalación

```bash
cd pdf-service
pip install -r requirements.txt
```

## Ejecutar localmente

```bash
python main.py
```

O con uvicorn directamente:

```bash
uvicorn main:app --reload --port 8000
```

## Uso

El servicio expone un endpoint POST `/generate` que recibe los datos del remito en JSON y devuelve el PDF.

### Ejemplo de llamada:

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d @remito.json
```

## Despliegue

Este servicio puede desplegarse en:
- Vercel (usando serverless functions de Python)
- AWS Lambda
- Google Cloud Functions
- Railway
- Render
- Cualquier plataforma que soporte Python

## Variables de entorno

El servicio usa las mismas variables de entorno que el proyecto principal para la configuración de la empresa.

