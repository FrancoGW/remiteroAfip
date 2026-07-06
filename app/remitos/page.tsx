"use client";

import { useState } from "react";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";
import PanelShell from "@/components/layout/PanelShell";
import RemitoForm from "@/components/RemitoForm";
import RemitoList from "@/components/RemitoList";

export default function RemitosPage() {
  const [activeTab, setActiveTab] = useState<"new" | "list">("new");

  return (
    <PanelShell title="Remitos" subtitle="Generación y listado de remitos electrónicos">
      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 bg-white rounded-t-xl shadow-sm">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("new")}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all ${
                activeTab === "new"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText size={18} />
                <span>Nuevo Remito</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all ${
                activeTab === "list"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                <span>Mis Remitos</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 p-8">
        {activeTab === "new" ? <RemitoForm /> : <RemitoList />}
      </div>

      {/* Footer Info */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Configuración requerida</p>
            <p className="text-amber-700">
              En modo desarrollo no necesitas certificados. Para producción, configura tu CUIT y
              certificados de AFIP en el archivo .env.local
            </p>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}
