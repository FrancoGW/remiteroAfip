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

## Despliegue en Railway

### Pasos importantes:

1. **En Railway, asegúrate de configurar el "Root Directory"**:
   - Ve a Settings → Source
   - Configura "Root Directory" como `pdf-service`
   - Esto es CRÍTICO para que Railway solo vea los archivos Python

2. Railway detectará automáticamente que es Python por el archivo `requirements.txt`

3. Railway usará el comando de inicio: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. Una vez desplegado, obtendrás una URL como: `https://tu-proyecto.railway.app`

5. Configura esta URL en Vercel como variable de entorno:
   ```
   PDF_SERVICE_URL=https://tu-proyecto.railway.app
   ```

## Variables de entorno

El servicio usa las mismas variables de entorno que el proyecto principal para la configuración de la empresa (opcional, tiene valores por defecto).

## Nota sobre Railway

Si Railway detecta vulnerabilidades del proyecto principal (Next.js), es porque está leyendo el `package.json` del directorio raíz. Asegúrate de configurar el "Root Directory" como `pdf-service` en la configuración de Railway.

