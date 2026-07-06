"use client";

import { useState } from "react";
import RemitosSeriesChart from "@/components/dashboard/RemitosSeriesChart";
import ClientesRecurrentes from "@/components/dashboard/ClientesRecurrentes";
import CaiDisponibilidad from "@/components/dashboard/CaiDisponibilidad";

const RANGOS = [
  { label: "7 días", value: 7 },
  { label: "30 días", value: 30 },
  { label: "90 días", value: 90 },
];

export default function DashboardPage() {
  const [dias, setDias] = useState(30);
  const [incluirPrueba, setIncluirPrueba] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {RANGOS.map((r) => (
            <button
              key={r.value}
              onClick={() => setDias(r.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dias === r.value
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={incluirPrueba}
            onChange={(e) => setIncluirPrueba(e.target.checked)}
            className="rounded"
          />
          Incluir remitos de prueba
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Remitos emitidos en el tiempo</h3>
          <RemitosSeriesChart dias={dias} incluirPrueba={incluirPrueba} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">CAI disponibles</h3>
          <CaiDisponibilidad />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Clientes más recurrentes</h3>
          <ClientesRecurrentes dias={dias} incluirPrueba={incluirPrueba} />
        </div>
      </div>
    </>
  );
}
