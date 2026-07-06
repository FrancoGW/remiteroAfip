"use client";

import { useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";

/**
 * Título/subtítulo del header por ruta. Vive acá (y no en cada page) porque
 * este layout es compartido por todas las secciones del panel: Next.js lo
 * mantiene montado entre navegaciones (no se desmonta el Sidebar ni se
 * vuelve a pedir /api/auth/check en cada click), así la navegación entre
 * secciones no parpadea.
 */
const TITULOS: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Dashboard", subtitle: "Resumen de actividad del panel" },
  "/remitos": { title: "Remitos", subtitle: "Generación y listado de remitos electrónicos" },
  "/remitos/prueba": {
    title: "Remito de Prueba",
    subtitle: "Remitos ficticios para probar el circuito de envío sin gastar numeración de CAI",
  },
  "/cai": { title: "CAI", subtitle: "Códigos de Autorización de Impresión y numeración de remitos" },
  "/cai/nuevo": {
    title: "Nuevo CAI",
    subtitle: "Cargá la constancia de AFIP en PDF o completá los datos manualmente",
  },
  "/diagnostico": { title: "Diagnóstico AFIP", subtitle: "Endpoints técnicos de referencia — no son de uso diario" },
  "/configuracion": { title: "Configuración", subtitle: "Estado de integraciones y variables editables del panel" },
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await fetch("/api/auth/login", { method: "DELETE" });
      setAuthenticated(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
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

  const info = TITULOS[pathname] || { title: "Remitero AFIP" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-gray-100 shadow-sm px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden text-gray-500 hover:text-gray-700 flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{info.title}</h1>
              {info.subtitle && <p className="text-sm text-gray-600 truncate">{info.subtitle}</p>}
            </div>
          </div>

          {username && (
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="hidden md:inline text-sm text-gray-600">
                Bienvenido, <strong>{username}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
                <span className="hidden md:inline text-sm">Salir</span>
              </button>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
