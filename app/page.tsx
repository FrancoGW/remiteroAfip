"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle, AlertCircle, Info, LogOut } from "lucide-react";
import RemitoForm from "@/components/RemitoForm";
import RemitoList from "@/components/RemitoList";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"new" | "list">("new");
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check");
      const data = await response.json();
      
      if (data.authenticated) {
        setAuthenticated(true);
        setUsername(data.username || "");
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      router.push("/login");
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/login", {
        method: "DELETE",
      });
      setAuthenticated(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Redirigir de todas formas
      router.push("/login");
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  Remitero AFIP
                </h1>
                <p className="text-gray-600 text-sm">
                  Sistema profesional de gestión de remitos electrónicos
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
                  <Info size={18} className="text-blue-600" />
                  <span className="text-sm text-blue-900 font-medium">Modo Desarrollo</span>
                </div>
                {username && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Bienvenido, <strong>{username}</strong></span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                      title="Cerrar sesión"
                    >
                      <LogOut size={16} />
                      <span className="hidden md:inline">Salir</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

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
                En modo desarrollo no necesitas certificados. Para producción, configura tu CUIT y certificados de AFIP en el archivo .env.local
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

