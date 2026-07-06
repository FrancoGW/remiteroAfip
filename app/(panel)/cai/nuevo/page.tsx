"use client";

import { useState } from "react";
import { Upload, FileEdit } from "lucide-react";
import CaiForm, { datosVacios } from "@/components/CaiForm";
import CaiPdfUpload from "@/components/CaiPdfUpload";

export default function NuevoCaiPage() {
  const [modo, setModo] = useState<"pdf" | "manual">("pdf");

  return (
    <>
      <div className="mb-6">
        <div className="border-b border-gray-200 bg-white rounded-t-xl shadow-sm">
          <nav className="flex -mb-px">
            <button
              onClick={() => setModo("pdf")}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all ${
                modo === "pdf"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Upload size={18} />
                <span>Subir PDF de AFIP</span>
              </div>
            </button>
            <button
              onClick={() => setModo("manual")}
              className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all ${
                modo === "manual"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileEdit size={18} />
                <span>Cargar Manualmente</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 p-8">
        {modo === "pdf" ? <CaiPdfUpload /> : <CaiForm initialData={datosVacios()} />}
      </div>
    </>
  );
}
