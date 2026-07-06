"use client";

import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { CaiAutorizacion, CaiEstadoCalculado } from "@/lib/types/cai";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface CaiConEstado extends CaiAutorizacion {
  estadoCalculado: CaiEstadoCalculado;
  puntos: (CaiAutorizacion["puntos"][number] & { estadoCalculado: string })[];
}

const BADGE_ESTILOS: Record<string, string> = {
  activo: "bg-green-100 text-green-800",
  por_vencer: "bg-yellow-100 text-yellow-800",
  por_agotarse: "bg-yellow-100 text-yellow-800",
  vencido: "bg-red-100 text-red-800",
  agotado: "bg-red-100 text-red-800",
  cancelado: "bg-gray-200 text-gray-700",
};

const BADGE_TEXTO: Record<string, string> = {
  activo: "Activo",
  por_vencer: "Por vencer",
  por_agotarse: "Por agotarse",
  vencido: "Vencido",
  agotado: "Agotado",
  cancelado: "Cancelado",
};

export default function CaiDisponibilidad() {
  const [cais, setCais] = useState<CaiConEstado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cai")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCais(data.cais);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-72 flex items-center justify-center text-gray-400 text-sm">Cargando…</div>;
  }

  const puntos = cais
    .filter((c) => c.estado !== "cancelado")
    .flatMap((c) =>
      c.puntos.map((p) => {
        const total = p.numeroHasta - p.numeroDesde + 1;
        const usados = Math.max(0, Math.min(p.proximoNumero - p.numeroDesde, total));
        const disponibles = Math.max(0, p.numeroHasta - p.proximoNumero + 1);
        return {
          label: `PV ${p.puntoVenta}`,
          usados,
          disponibles,
          estado: p.estadoCalculado,
        };
      })
    );

  if (puntos.length === 0) {
    return <p className="text-sm text-gray-400 py-16 text-center">No hay CAI cargados todavía.</p>;
  }

  const labels = puntos.map((p) => p.label);
  const datasets = [
    { label: "Usados", data: puntos.map((p) => p.usados), backgroundColor: "#94a3b8" },
    { label: "Disponibles", data: puntos.map((p) => p.disponibles), backgroundColor: "#22c55e" },
  ];

  return (
    <div>
      <div className="h-56 mb-4">
        <Bar
          data={{ labels, datasets }}
          options={{
            indexAxis: "y" as const,
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }, y: { stacked: true } },
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {puntos.map((p, i) => (
          <span
            key={i}
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${BADGE_ESTILOS[p.estado] || "bg-gray-100 text-gray-800"}`}
          >
            {p.label}: {BADGE_TEXTO[p.estado] || p.estado}
          </span>
        ))}
      </div>
    </div>
  );
}
