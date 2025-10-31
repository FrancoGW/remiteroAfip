"use client";

import { useState } from "react";
import { Plus, Minus, Send, Loader2 } from "lucide-react";
import { Remito, RemitoItem, TIPOS_REMITO, TIPOS_TRANSPORTE, UNIDADES_MEDIDA, PROVINCIAS_ARGENTINA } from "@/lib/types/remito";

export default function RemitoForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState<Remito>({
    puntoVenta: 1,
    fechaEmision: new Date().toISOString().split("T")[0],
    codigoTipoRemito: 1,
    cuitEmisor: "",
    cuitReceptor: "",
    nombreReceptor: "",
    domicilioReceptor: "",
    tipoTransporte: 1,
    origenDomicilio: "",
    origenLocalidad: "",
    origenProvincia: "Buenos Aires",
    origenCodigoPostal: "",
    destinoDomicilio: "",
    destinoLocalidad: "",
    destinoProvincia: "Buenos Aires",
    destinoCodigoPostal: "",
    items: [
      {
        codigo: "",
        descripcion: "",
        cantidad: 1,
        unidadMedida: "UN",
      },
    ],
    observaciones: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: keyof RemitoItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          codigo: "",
          descripcion: "",
          cantidad: 1,
          unidadMedida: "UN",
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/remitos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: `¡Remito generado exitosamente! CAE: ${data.cae} - Nro: ${data.numeroRemito}`,
        });
        // Resetear formulario
        setFormData({
          ...formData,
          items: [
            {
              codigo: "",
              descripcion: "",
              cantidad: 1,
              unidadMedida: "UN",
            },
          ],
          observaciones: "",
        });
      } else {
        setMessage({
          type: "error",
          text: `Error: ${data.errores?.join(", ") || "Error desconocido"}`,
        });
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: `Error al generar remito: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensaje de respuesta */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Datos Generales */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Datos Generales</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Punto de Venta
            </label>
            <input
              type="number"
              name="puntoVenta"
              value={formData.puntoVenta}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Emisión
            </label>
            <input
              type="date"
              name="fechaEmision"
              value={formData.fechaEmision}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Remito
            </label>
            <select
              name="codigoTipoRemito"
              value={formData.codigoTipoRemito}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {TIPOS_REMITO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Emisor y Receptor */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Emisor y Receptor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CUIT Emisor
            </label>
            <input
              type="text"
              name="cuitEmisor"
              value={formData.cuitEmisor}
              onChange={handleInputChange}
              placeholder="20123456789"
              maxLength={11}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CUIT Receptor
            </label>
            <input
              type="text"
              name="cuitReceptor"
              value={formData.cuitReceptor}
              onChange={handleInputChange}
              placeholder="20987654321"
              maxLength={11}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Receptor
            </label>
            <input
              type="text"
              name="nombreReceptor"
              value={formData.nombreReceptor}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domicilio Receptor
            </label>
            <input
              type="text"
              name="domicilioReceptor"
              value={formData.domicilioReceptor}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      {/* Transporte */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Transporte</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Transporte
            </label>
            <select
              name="tipoTransporte"
              value={formData.tipoTransporte}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {TIPOS_TRANSPORTE.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
          {formData.tipoTransporte === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CUIT Transportista
                </label>
                <input
                  type="text"
                  name="cuitTransportista"
                  value={formData.cuitTransportista || ""}
                  onChange={handleInputChange}
                  maxLength={11}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Transportista
                </label>
                <input
                  type="text"
                  name="nombreTransportista"
                  value={formData.nombreTransportista || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dominio Vehículo
            </label>
            <input
              type="text"
              name="dominioVehiculo"
              value={formData.dominioVehiculo || ""}
              onChange={handleInputChange}
              placeholder="ABC123"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Origen */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Origen</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domicilio
            </label>
            <input
              type="text"
              name="origenDomicilio"
              value={formData.origenDomicilio}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localidad
            </label>
            <input
              type="text"
              name="origenLocalidad"
              value={formData.origenLocalidad}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provincia
            </label>
            <select
              name="origenProvincia"
              value={formData.origenProvincia}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {PROVINCIAS_ARGENTINA.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código Postal
            </label>
            <input
              type="text"
              name="origenCodigoPostal"
              value={formData.origenCodigoPostal}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      {/* Destino */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Destino</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domicilio
            </label>
            <input
              type="text"
              name="destinoDomicilio"
              value={formData.destinoDomicilio}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localidad
            </label>
            <input
              type="text"
              name="destinoLocalidad"
              value={formData.destinoLocalidad}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provincia
            </label>
            <select
              name="destinoProvincia"
              value={formData.destinoProvincia}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {PROVINCIAS_ARGENTINA.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código Postal
            </label>
            <input
              type="text"
              name="destinoCodigoPostal"
              value={formData.destinoCodigoPostal}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Items del Remito</h3>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Agregar Item
          </button>
        </div>
        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Item {index + 1}
                </span>
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Minus size={20} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={item.codigo}
                    onChange={(e) => handleItemChange(index, "codigo", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={item.descripcion}
                    onChange={(e) =>
                      handleItemChange(index, "descripcion", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={(e) =>
                      handleItemChange(index, "cantidad", parseFloat(e.target.value))
                    }
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad
                  </label>
                  <select
                    value={item.unidadMedida}
                    onChange={(e) =>
                      handleItemChange(index, "unidadMedida", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {UNIDADES_MEDIDA.map((unidad) => (
                      <option key={unidad.value} value={unidad.value}>
                        {unidad.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observaciones (opcional)
        </label>
        <textarea
          name="observaciones"
          value={formData.observaciones}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Generando Remito...
          </>
        ) : (
          <>
            <Send size={20} />
            Generar Remito en AFIP
          </>
        )}
      </button>
    </form>
  );
}

