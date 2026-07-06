"use client";

import PanelShell from "@/components/layout/PanelShell";
import RemitoForm from "@/components/RemitoForm";

export default function RemitoPruebaPage() {
  return (
    <PanelShell
      title="Remito de Prueba"
      subtitle="Genera un remito ficticio para probar el circuito de envío sin gastar numeración de CAI"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <RemitoForm modoPrueba />
      </div>
    </PanelShell>
  );
}
