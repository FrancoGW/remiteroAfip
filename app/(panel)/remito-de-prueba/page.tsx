"use client";

import { useState } from "react";
import { FlaskConical, ListChecks } from "lucide-react";
import RemitoForm from "@/components/RemitoForm";
import RemitoList from "@/components/RemitoList";

export default function RemitoPruebaPage() {
  const [activeTab, setActiveTab] = useState<"new" | "list">("new");

  return (
    <>
      <div className="mb-6">
        <div className="border-b border-gray-200 bg-white rounded-t-xl shadow-sm">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("new")}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all ${
                activeTab === "new"
                  ? "border-b-2 border-amber-600 text-amber-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FlaskConical size={18} />
                <span>Nuevo Remito de Prueba</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all ${
                activeTab === "list"
                  ? "border-b-2 border-amber-600 text-amber-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ListChecks size={18} />
                <span>Remitos de Prueba</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 p-8">
        {activeTab === "new" ? <RemitoForm modoPrueba /> : <RemitoList esPrueba={true} />}
      </div>
    </>
  );
}
