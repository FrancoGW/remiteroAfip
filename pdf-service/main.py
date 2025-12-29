from fastapi import FastAPI
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime
import io
import os

app = FastAPI()

class RemitoItem(BaseModel):
    id: Optional[str] = None
    codigo: str
    descripcion: str
    cantidad: float
    unidadMedida: str
    pesoNeto: Optional[float] = None
    pesoBruto: Optional[float] = None
    especie: Optional[str] = None
    largo: Optional[float] = None
    categoria: Optional[str] = None
    m3Stereo: Optional[float] = None
    tara: Optional[float] = None
    balanza: Optional[str] = None

class Remito(BaseModel):
    id: Optional[str] = None
    cae: Optional[str] = None
    vencimientoCae: Optional[str] = None
    numeroRemito: Optional[int] = None
    puntoVenta: int
    fechaEmision: str
    codigoTipoRemito: int
    cuitEmisor: str
    nombreEmisor: Optional[str] = None
    cuitReceptor: str
    nombreReceptor: str
    domicilioReceptor: str
    predio: Optional[str] = None
    rodal: Optional[str] = None
    domicilioFiscal: Optional[str] = None
    condicionIva: Optional[str] = None
    tipoTransporte: int
    cuitTransportista: Optional[str] = None
    nombreTransportista: Optional[str] = None
    dominioVehiculo: Optional[str] = None
    dominioAcoplado: Optional[str] = None
    conductor: Optional[str] = None
    dniConductor: Optional[str] = None
    origenDomicilio: str
    origenLocalidad: str
    origenProvincia: str
    origenCodigoPostal: str
    destinoDomicilio: str
    destinoLocalidad: str
    destinoProvincia: str
    destinoCodigoPostal: str
    items: List[RemitoItem]
    observaciones: Optional[str] = None
    estado: Optional[str] = None
    fechaCreacion: Optional[str] = None

# Configuración de empresa (desde variables de entorno o valores por defecto)
EMPRESA_CONFIG = {
    "nombre": os.getenv("EMPRESA_NOMBRE", "Empresas Verdes Argentina S.A."),
    "direccion": os.getenv("EMPRESA_DIRECCION", "2DA. SECCION - PREDIO LA NUEVA"),
    "localidad": os.getenv("EMPRESA_LOCALIDAD", "3346 LA CRUZ - CORRIENTES"),
    "cuit": os.getenv("EMPRESA_CUIT", "30-69378728-5"),
    "ingresosBrutos": os.getenv("EMPRESA_INGRESOS_BRUTOS", "30-69378728-5"),
    "fechaInicio": os.getenv("EMPRESA_FECHA_INICIO", "NOVIEMBRE 1997"),
    "condicionIva": os.getenv("EMPRESA_CONDICION_IVA", "IVA RESPONSABLE INSCRIPTO"),
    "codigo": os.getenv("EMPRESA_CODIGO", "091")
}

def formatear_fecha(fecha: str) -> str:
    """Formatea fecha ISO (YYYY-MM-DD) a DD/MM/YYYY"""
    try:
        partes = fecha.split("T")[0].split("-")
        return f"{partes[2]}/{partes[1]}/{partes[0]}"
    except:
        return fecha

def formatear_cuit(cuit: str) -> str:
    """Formatea CUIT agregando guiones"""
    cuit_limpio = cuit.replace("-", "")
    if len(cuit_limpio) == 11:
        return f"{cuit_limpio[:2]}-{cuit_limpio[2:10]}-{cuit_limpio[10:]}"
    return cuit

@app.post("/generate")
async def generate_pdf(remito: Remito):
    """Genera un PDF del remito usando ReportLab - Replica exactamente el diseño de PDFKit"""
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Configuración (mismos valores que PDFKit)
    margin_left = 50
    margin_right = 50
    margin_top = 30
    margin_bottom = 50
    page_width = width - margin_left - margin_right
    page_height = height - margin_top - margin_bottom
    current_y = height - margin_top
    
    # Formatear datos
    numero_remito = str(remito.numeroRemito or 0).zfill(8)
    punto_venta = str(remito.puntoVenta).zfill(4)
    primer_item = remito.items[0] if remito.items else {}
    
    # ===== ENCABEZADO =====
    page_center_x = width / 2
    codigo_text = f"CODIGO N° {EMPRESA_CONFIG['codigo']}"
    
    # "R" centrada arriba
    c.setFont("Helvetica-Bold", 24)
    r_width = c.stringWidth("R", "Helvetica-Bold", 24)
    c.drawString(page_center_x - r_width / 2, current_y, "R")
    
    # "CODIGO N°" centrado debajo de la R
    c.setFont("Helvetica", 8)
    codigo_width = c.stringWidth(codigo_text, "Helvetica", 8)
    c.drawString(page_center_x - codigo_width / 2, current_y - 20, codigo_text)
    
    # Datos de la empresa (izquierda)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin_left, current_y, EMPRESA_CONFIG["nombre"])
    
    c.setFont("Helvetica", 9)
    c.drawString(margin_left, current_y - 15, EMPRESA_CONFIG["direccion"])
    c.drawString(margin_left, current_y - 28, EMPRESA_CONFIG["localidad"])
    c.drawString(margin_left, current_y - 41, EMPRESA_CONFIG["condicionIva"])
    
    # "COMPROBANTE NO VALIDO COMO FACTURA" y "REMITO" (derecha)
    c.setFont("Helvetica", 8)
    texto_no_valido = "COMPROBANTE NO VALIDO COMO FACTURA"
    texto_width = c.stringWidth(texto_no_valido, "Helvetica", 8)
    c.drawRightString(width - margin_right, current_y, texto_no_valido)
    
    c.setFont("Helvetica-Bold", 14)
    c.drawRightString(width - margin_right, current_y - 12, "REMITO")
    
    # Número de remito
    c.setFont("Helvetica", 10)
    numero_text = f"Nº {punto_venta}-{numero_remito}"
    c.drawRightString(width - margin_right, current_y - 30, numero_text)
    
    current_y = current_y - 55
    
    # Fecha y hora
    c.setFont("Helvetica", 9)
    c.drawString(margin_left, current_y, f"FECHA: {formatear_fecha(remito.fechaEmision)}")
    hora = datetime.now().strftime("%H:%M")
    c.drawString(250, current_y, f"HORA: {hora}")
    
    current_y = current_y - 15
    
    # CUIT, Ingresos Brutos, Fecha Inicio
    c.setFont("Helvetica", 8)
    c.drawString(margin_left, current_y, f"C.U.I.T.: {EMPRESA_CONFIG['cuit']}")
    c.drawString(250, current_y, f"INGRESOS BRUTOS: {EMPRESA_CONFIG['ingresosBrutos']}")
    c.drawString(400, current_y, f"FECHA DE INICIO: {EMPRESA_CONFIG['fechaInicio']}")
    
    current_y = current_y - 20
    
    # ===== DATOS DEL CLIENTE =====
    cliente_y = current_y
    cliente_height = 80
    
    # Rectángulo
    c.setStrokeColor(colors.black)
    c.setLineWidth(0.5)
    c.rect(margin_left, cliente_y - cliente_height, page_width, cliente_height)
    
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.black)
    c.drawString(margin_left + 5, cliente_y - 5, "PREDIO:")
    c.drawString(margin_left + 5, cliente_y - 18, remito.predio or "_________________")
    c.drawString(220, cliente_y - 5, "RODAL:")
    c.drawString(220, cliente_y - 18, remito.rodal or "_________________")
    c.drawString(margin_left + 5, cliente_y - 35, "CLIENTE:")
    c.drawString(margin_left + 5, cliente_y - 48, remito.nombreReceptor or "_________________")
    c.drawString(280, cliente_y - 35, "DOMICILIO FISCAL:")
    c.drawString(280, cliente_y - 48, remito.domicilioFiscal or remito.domicilioReceptor or "_________________")
    c.drawString(margin_left + 5, cliente_y - 65, "IVA:")
    c.drawString(100, cliente_y - 65, "RESPONSABLE INSCRIPTO")
    c.drawString(250, cliente_y - 65, "RESPONSABLE NO INSCRIPTO")
    c.drawString(400, cliente_y - 65, "CUIT:")
    c.drawString(440, cliente_y - 65, formatear_cuit(remito.cuitReceptor))
    
    current_y = cliente_y - cliente_height - 5
    
    # ===== DATOS DEL PRODUCTO =====
    producto_y = current_y
    producto_height = 100
    
    # Rectángulo
    c.rect(margin_left, producto_y - producto_height, page_width, producto_height)
    
    c.setFont("Helvetica", 9)
    c.drawString(margin_left + 5, producto_y - 5, "PRODUCTO:")
    c.drawString(margin_left + 5, producto_y - 18, primer_item.descripcion if primer_item and primer_item.descripcion else "_________________")
    c.drawString(220, producto_y - 5, "ESPECIE:")
    c.drawString(220, producto_y - 18, primer_item.especie if primer_item and primer_item.especie else "_________________")
    c.drawString(380, producto_y - 5, "LARGO:")
    c.drawString(380, producto_y - 18, str(primer_item.largo) if primer_item and primer_item.largo else "_________________")
    c.drawString(margin_left + 5, producto_y - 35, "CATEGORIA:")
    c.drawString(margin_left + 5, producto_y - 48, primer_item.categoria if primer_item and primer_item.categoria else "_________________")
    c.drawString(220, producto_y - 35, "PESO BRUTO:")
    if primer_item and primer_item.pesoBruto is not None:
        peso_bruto_text = f"{primer_item.pesoBruto:.2f} kg"
    else:
        peso_bruto_text = "_________________"
    c.drawString(220, producto_y - 48, peso_bruto_text)
    c.drawString(330, producto_y - 35, "M3 STEREO:")
    if primer_item and primer_item.m3Stereo is not None:
        m3_text = f"{primer_item.m3Stereo:.2f}"
    else:
        m3_text = "_________________"
    c.drawString(330, producto_y - 48, m3_text)
    c.drawString(440, producto_y - 35, "TARA:")
    if primer_item and primer_item.tara is not None:
        tara_text = f"{primer_item.tara:.2f} kg"
    else:
        tara_text = "_________________"
    c.drawString(440, producto_y - 48, tara_text)
    c.drawString(margin_left + 5, producto_y - 65, "PESO NETO:")
    if primer_item and primer_item.pesoNeto is not None:
        peso_neto_text = f"{primer_item.pesoNeto:.2f} kg"
    else:
        peso_neto_text = "_________________"
    c.drawString(margin_left + 5, producto_y - 78, peso_neto_text)
    c.drawString(170, producto_y - 65, "BALANZA:")
    c.drawString(170, producto_y - 78, primer_item.balanza if primer_item and primer_item.balanza else "_________________")
    
    current_y = producto_y - producto_height - 5
    
    # ===== DATOS DEL TRANSPORTE =====
    transporte_y = current_y
    transporte_height = 70
    
    # Rectángulo
    c.rect(margin_left, transporte_y - transporte_height, page_width, transporte_height)
    
    c.setFont("Helvetica", 9)
    c.drawString(margin_left + 5, transporte_y - 5, "TRANSPORTE:")
    c.drawString(margin_left + 5, transporte_y - 18, remito.nombreTransportista or "_________________")
    c.drawString(280, transporte_y - 5, "CAMION PATENTE N°:")
    c.drawString(280, transporte_y - 18, remito.dominioVehiculo or "_________________")
    c.drawString(margin_left + 5, transporte_y - 35, "CUIT:")
    cuit_transportista = formatear_cuit(remito.cuitTransportista) if remito.cuitTransportista else "_________________"
    c.drawString(margin_left + 5, transporte_y - 48, cuit_transportista)
    c.drawString(220, transporte_y - 35, "ACOPLADO PATENTE N°:")
    c.drawString(220, transporte_y - 48, remito.dominioAcoplado or "_________________")
    c.drawString(380, transporte_y - 35, "CONDUCTOR:")
    c.drawString(380, transporte_y - 48, remito.conductor or "_________________")
    c.drawString(490, transporte_y - 35, "DNI:")
    c.drawString(490, transporte_y - 48, remito.dniConductor or "_________________")
    
    # Texto sobre propiedad de la mercadería
    c.setFont("Helvetica", 8)
    texto_mercaderia = "MERCADERIA PROPIEDAD DEL CLIENTE, TRANSPORTADA POR CUENTA Y ORDEN DEL MISMO"
    # Ajustar texto a ancho disponible
    texto_width = c.stringWidth(texto_mercaderia, "Helvetica", 8)
    if texto_width > page_width - 10:
        # Si es muy largo, dividir en dos líneas
        palabras = texto_mercaderia.split()
        mitad = len(palabras) // 2
        linea1 = " ".join(palabras[:mitad])
        linea2 = " ".join(palabras[mitad:])
        c.drawString(margin_left + 5, transporte_y - 60, linea1)
        c.drawString(margin_left + 5, transporte_y - 68, linea2)
    else:
        c.drawString(margin_left + 5, transporte_y - 60, texto_mercaderia)
    
    current_y = transporte_y - transporte_height - 5
    
    # ===== FIRMAS =====
    firmas_y = current_y
    firmas_height = 60
    
    # Rectángulo
    c.rect(margin_left, firmas_y - firmas_height, page_width, firmas_height)
    
    c.setFont("Helvetica", 9)
    # Firma 1 - Despachante
    texto_firma1 = "Firma y aclaración"
    ancho_firma = 150
    x_firma1 = margin_left + 5
    texto_width = c.stringWidth(texto_firma1, "Helvetica", 9)
    c.drawString(x_firma1 + (ancho_firma - texto_width) / 2, firmas_y - 5, texto_firma1)
    c.drawString(x_firma1 + (ancho_firma - c.stringWidth("Despachante", "Helvetica", 9)) / 2, firmas_y - 18, "Despachante")
    c.rect(x_firma1, firmas_y - 30, ancho_firma, 18)
    
    # Firma 2 - Conductor
    x_firma2 = 220
    texto_width = c.stringWidth(texto_firma1, "Helvetica", 9)
    c.drawString(x_firma2 + (ancho_firma - texto_width) / 2, firmas_y - 5, texto_firma1)
    c.drawString(x_firma2 + (ancho_firma - c.stringWidth("Conductor", "Helvetica", 9)) / 2, firmas_y - 18, "Conductor")
    c.rect(x_firma2, firmas_y - 30, ancho_firma, 18)
    
    # Firma 3 - Recepción
    x_firma3 = 385
    ancho_firma3 = 160
    texto_width = c.stringWidth(texto_firma1, "Helvetica", 9)
    c.drawString(x_firma3 + (ancho_firma3 - texto_width) / 2, firmas_y - 5, texto_firma1)
    c.drawString(x_firma3 + (ancho_firma3 - c.stringWidth("Recepción", "Helvetica", 9)) / 2, firmas_y - 18, "Recepción")
    c.drawString(x_firma3, firmas_y - 38, "FECHA:")
    c.drawString(450, firmas_y - 38, "HORA:")
    c.rect(x_firma3, firmas_y - 35, ancho_firma3, 20)
    
    current_y = firmas_y - firmas_height - 5
    
    # ===== OBSERVACIONES =====
    obs_y = current_y
    obs_height = 40
    
    # Rectángulo
    c.rect(margin_left, obs_y - obs_height, page_width, obs_height)
    
    c.setFont("Helvetica", 9)
    c.drawString(margin_left + 5, obs_y - 5, "OBSERVACIONES:")
    observaciones = remito.observaciones or ""
    # Si las observaciones son muy largas, dividirlas en líneas
    if observaciones:
        palabras = observaciones.split()
        linea_actual = ""
        y_pos = obs_y - 18
        for palabra in palabras:
            texto_prueba = linea_actual + (" " if linea_actual else "") + palabra
            if c.stringWidth(texto_prueba, "Helvetica", 9) < page_width - 10:
                linea_actual = texto_prueba
            else:
                if linea_actual:
                    c.drawString(margin_left + 5, y_pos, linea_actual)
                    y_pos -= 12
                linea_actual = palabra
        if linea_actual:
            c.drawString(margin_left + 5, y_pos, linea_actual)
    
    # ===== CAE Y DATOS ADICIONALES =====
    if remito.cae:
        cae_y = obs_y - obs_height - 10
        c.setFont("Helvetica", 8)
        c.drawString(margin_left, cae_y, f"CAE: {remito.cae}")
        if remito.vencimientoCae:
            c.drawString(300, cae_y, f"Vencimiento CAE: {formatear_fecha(remito.vencimientoCae)}")
    
    # Pie de página
    c.setFont("Helvetica", 7)
    fecha_generacion = datetime.now().strftime("%d/%m/%Y")
    hora_generacion = datetime.now().strftime("%H:%M:%S")
    texto_pie = f"Generado el {fecha_generacion} a las {hora_generacion}"
    texto_width = c.stringWidth(texto_pie, "Helvetica", 7)
    c.drawString((width - texto_width) / 2, margin_bottom - 10, texto_pie)
    
    c.save()
    buffer.seek(0)
    
    return Response(content=buffer.getvalue(), media_type="application/pdf")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "pdf-generator"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
