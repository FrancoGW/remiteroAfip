"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Plus, ArrowLeft } from "lucide-react";
import CaiList from "@/components/CaiList";

export default function CaiPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Volver"
                >
                  <ArrowLeft size={20} />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <ShieldCheck className="text-blue-600" size={28} />
                    Gestión de CAI
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Códigos de Autorización de Impresión y numeración de remitos
                  </p>
                </div>
              </div>
              <Link
                href="/cai/nuevo"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Nuevo CAI
              </Link>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <CaiList />
        </div>
      </div>
    </main>
  );
}
