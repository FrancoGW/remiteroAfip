"use client";

import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ClienteRanking {
  cliente: string;
  real: number;
  prueba: number;
}

interface ClientesRecurrentesProps {
  dias: number;
  incluirPrueba: boolean;
}

export default function ClientesRecurrentes({ dias, incluirPrueba }: ClientesRecurrentesProps) {
  const [clientes, setClientes] = useState<ClienteRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/clientes?dias=${dias}&limite=8`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setClientes(data.clientes);
      })
      .finally(() => setLoading(false));
  }, [dias]);

  if (loading) {
    return <div className="h-72 flex items-center justify-center text-gray-400 text-sm">Cargando…</div>;
  }

  if (clientes.length === 0) {
    return <p className="text-sm text-gray-400 py-16 text-center">Sin remitos en este rango.</p>;
  }

  const labels = clientes.map((c) => c.cliente);
  const datasets = [
    { label: "Reales", data: clientes.map((c) => c.real), backgroundColor: "#2563eb" },
    ...(incluirPrueba
      ? [{ label: "Prueba", data: clientes.map((c) => c.prueba), backgroundColor: "#d97706" }]
      : []),
  ];

  return (
    <div className="h-72">
      <Bar
        data={{ labels, datasets }}
        options={{
          indexAxis: "y" as const,
          responsive: true,
          maintainAspectRatio: false,
          scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
          plugins: { legend: { display: incluirPrueba } },
        }}
      />
    </div>
  );
}
