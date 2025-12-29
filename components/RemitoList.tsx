"use client";

import { useState, useEffect } from "react";
import { FileText, Calendar, User, Truck, MapPin, Download, Eye } from "lucide-react";
import { Remito } from "@/lib/types/remito";

export default function RemitoList() {
  const [remitos, setRemitos] = useState<Remito[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRemito, setSelectedRemito] = useState<Remito | null>(null);

  useEffect(() => {
    loadRemitos();
  }, []);

  const loadRemitos = async () => {
    try {
      const response = await fetch("/api/remitos");
      const data = await response.json();
      setRemitos(data.remitos || []);
    } catch (error) {
      console.error("Error cargando remitos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado?: string) => {
    switch (estado) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEstadoText = (estado?: string) => {
    switch (estado) {
      case "approved":
        return "Aprobado";
      case "pending":
        return "Pendiente";
      case "rejected":
        return "Rechazado";
      default:
        return "Borrador";
    }
  };

  const descargarPDF = async (remitoId: string, numeroRemito?: number) => {
    try {
      const response = await fetch(`/api/remitos/${remitoId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `remito-${numeroRemito || remitoId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        console.error("Error al descargar el PDF");
      }
    } catch (error) {
      console.error("Error al descargar PDF:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (remitos.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay remitos generados
        </h3>
        <p className="text-gray-600">
          Comienza creando tu primer remito electrónico
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Remitos Generados ({remitos.length})
        </h2>
      </div>

      <div className="grid gap-4">
        {remitos.map((remito, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Remito #{remito.numeroRemito || "Sin número"}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                      remito.estado
                    )}`}
                  >
                    {getEstadoText(remito.estado)}
                  </span>
                </div>
                {remito.cae && (
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>CAE:</strong> {remito.cae}
                  </p>
                )}
                {remito.vencimientoCae && (
                  <p className="text-sm text-gray-600">
                    <strong>Vencimiento CAE:</strong> {remito.vencimientoCae}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedRemito(remito)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Ver detalles"
                >
                  <Eye size={20} />
                </button>
                <button
                  onClick={() => remito.id && descargarPDF(remito.id, remito.numeroRemito)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Descargar PDF"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} />
                <span>
                  <strong>Fecha:</strong> {remito.fechaEmision}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User size={16} />
                <span>
                  <strong>Receptor:</strong> {remito.nombreReceptor}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Truck size={16} />
                <span>
                  <strong>Transporte:</strong>{" "}
                  {remito.tipoTransporte === 1 ? "Propio" : "Tercero"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} />
                <span>
                  <strong>Destino:</strong> {remito.destinoLocalidad},{" "}
                  {remito.destinoProvincia}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Items:</strong> {remito.items.length} producto
                {remito.items.length !== 1 && "s"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalles */}
      {selectedRemito && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRemito(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Remito #{selectedRemito.numeroRemito}
                </h2>
                {selectedRemito.cae && (
                  <p className="text-gray-600 mt-1">CAE: {selectedRemito.cae}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedRemito(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Datos Generales */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Datos Generales</h3>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p>
                    <strong>Fecha de Emisión:</strong> {selectedRemito.fechaEmision}
                  </p>
                  <p>
                    <strong>Punto de Venta:</strong> {selectedRemito.puntoVenta}
                  </p>
                  {selectedRemito.vencimientoCae && (
                    <p>
                      <strong>Vencimiento CAE:</strong>{" "}
                      {selectedRemito.vencimientoCae}
                    </p>
                  )}
                </div>
              </div>

              {/* Emisor y Receptor */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Emisor y Receptor</h3>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p>
                    <strong>CUIT Emisor:</strong> {selectedRemito.cuitEmisor}
                  </p>
                  <p>
                    <strong>CUIT Receptor:</strong> {selectedRemito.cuitReceptor}
                  </p>
                  <p>
                    <strong>Nombre Receptor:</strong> {selectedRemito.nombreReceptor}
                  </p>
                  <p>
                    <strong>Domicilio Receptor:</strong>{" "}
                    {selectedRemito.domicilioReceptor}
                  </p>
                </div>
              </div>

              {/* Transporte */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Transporte</h3>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p>
                    <strong>Tipo:</strong>{" "}
                    {selectedRemito.tipoTransporte === 1 ? "Propio" : "Tercero"}
                  </p>
                  {selectedRemito.cuitTransportista && (
                    <p>
                      <strong>CUIT Transportista:</strong>{" "}
                      {selectedRemito.cuitTransportista}
                    </p>
                  )}
                  {selectedRemito.nombreTransportista && (
                    <p>
                      <strong>Nombre Transportista:</strong>{" "}
                      {selectedRemito.nombreTransportista}
                    </p>
                  )}
                  {selectedRemito.dominioVehiculo && (
                    <p>
                      <strong>Dominio:</strong> {selectedRemito.dominioVehiculo}
                    </p>
                  )}
                </div>
              </div>

              {/* Origen y Destino */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Origen</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                    <p>{selectedRemito.origenDomicilio}</p>
                    <p>
                      {selectedRemito.origenLocalidad}, {selectedRemito.origenProvincia}
                    </p>
                    <p>CP: {selectedRemito.origenCodigoPostal}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Destino</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                    <p>{selectedRemito.destinoDomicilio}</p>
                    <p>
                      {selectedRemito.destinoLocalidad},{" "}
                      {selectedRemito.destinoProvincia}
                    </p>
                    <p>CP: {selectedRemito.destinoCodigoPostal}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Items</h3>
                <div className="space-y-2">
                  {selectedRemito.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                      <p>
                        <strong>Código:</strong> {item.codigo}
                      </p>
                      <p>
                        <strong>Descripción:</strong> {item.descripcion}
                      </p>
                      <p>
                        <strong>Cantidad:</strong> {item.cantidad}{" "}
                        {item.unidadMedida}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              {selectedRemito.observaciones && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Observaciones</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p>{selectedRemito.observaciones}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedRemito(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => selectedRemito.id && descargarPDF(selectedRemito.id, selectedRemito.numeroRemito)}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

