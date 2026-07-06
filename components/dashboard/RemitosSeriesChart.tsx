"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface PuntoSerie {
  fecha: string;
  real: number;
  prueba: number;
}

interface RemitosSeriesChartProps {
  dias: number;
  incluirPrueba: boolean;
}

export default function RemitosSeriesChart({ dias, incluirPrueba }: RemitosSeriesChartProps) {
  const [serie, setSerie] = useState<PuntoSerie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/series?dias=${dias}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSerie(data.serie);
      })
      .finally(() => setLoading(false));
  }, [dias]);

  if (loading) {
    return <div className="h-72 flex items-center justify-center text-gray-400 text-sm">Cargando…</div>;
  }

  const labels = serie.map((p) => p.fecha.slice(5));
  const totalReal = serie.reduce((s, p) => s + p.real, 0);
  const totalPrueba = serie.reduce((s, p) => s + p.prueba, 0);

  const datasets = [
    {
      label: "Remitos reales",
      data: serie.map((p) => p.real),
      borderColor: "#2563eb",
      backgroundColor: "rgba(37,99,235,0.12)",
      fill: true,
      tension: 0.3,
    },
    ...(incluirPrueba
      ? [
          {
            label: "Remitos de prueba",
            data: serie.map((p) => p.prueba),
            borderColor: "#d97706",
            backgroundColor: "rgba(217,119,6,0.12)",
            fill: true,
            tension: 0.3,
          },
        ]
      : []),
  ];

  return (
    <div>
      <div className="flex gap-6 mb-3 text-sm text-gray-600">
        <span>
          <strong className="text-gray-900">{totalReal}</strong> remitos reales
        </span>
        {incluirPrueba && (
          <span>
            <strong className="text-gray-900">{totalPrueba}</strong> de prueba
          </span>
        )}
      </div>
      <div className="h-72">
        <Line
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            plugins: { legend: { display: incluirPrueba } },
          }}
        />
      </div>
    </div>
  );
}
