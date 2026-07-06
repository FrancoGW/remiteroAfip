"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Upload, FileEdit } from "lucide-react";
import CaiForm, { datosVacios } from "@/components/CaiForm";
import CaiPdfUpload from "@/components/CaiPdfUpload";

export default function NuevoCaiPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [modo, setModo] = useState<"pdf" | "manual">("pdf");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/auth/check");
        const data = await response.json();
        if (data.authenticated) {
          setAuthenticated(true);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <Link
                href="/cai"
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Volver"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <ShieldCheck className="text-blue-600" size={28} />
                  Nuevo CAI
                </h1>
                <p className="text-gray-600 text-sm">
                  Cargá la constancia de AFIP en PDF o completá los datos manualmente
                </p>
              </div>
            </div>
          </div>
        </header>

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
      </div>
    </main>
  );
}
