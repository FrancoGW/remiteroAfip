"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import PanelShell from "@/components/layout/PanelShell";
import CaiList from "@/components/CaiList";

export default function CaiPage() {
  return (
    <PanelShell title="CAI" subtitle="Códigos de Autorización de Impresión y numeración de remitos">
      <div className="flex justify-end mb-4">
        <Link
          href="/cai/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nuevo CAI
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <CaiList />
      </div>
    </PanelShell>
  );
}
