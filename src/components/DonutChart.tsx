import React, { useMemo, useState, useRef, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

import type { Transaction } from "@/lib/mockData";

const COLORS = ["#22c55e", "#f87171"];
const TIME_PERIODS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

interface DonutChartProps {
  transactions: Transaction[];
}

function filterTransactions(transactions: Transaction[], period: string) {
  const now = new Date();
  return transactions.filter((tx) => {
    const date = tx.timestamp instanceof Date ? tx.timestamp : new Date(tx.timestamp);
    if (period === "daily") {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    } else if (period === "weekly") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo && date <= now;
    } else if (period === "monthly") {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }
    return true;
  });
}

const DonutChart: React.FC<DonutChartProps> = ({ transactions }) => {
  const [period, setPeriod] = useState("monthly");
  const chartRef = useRef<any>(null);

  const filtered = useMemo(
    () => filterTransactions(transactions, period),
    [transactions, period]
  );

  const debit = filtered.filter((t) => t.type === "Debit").reduce((sum, t) => sum + Number(t.amount), 0);
  const credit = filtered.filter((t) => t.type === "Credit").reduce((sum, t) => sum + Number(t.amount), 0);
  const total = debit + credit;

  const data = {
    labels: ["Debit", "Credit"],
    datasets: [
      {
        data: [debit, credit],
        backgroundColor: COLORS,
        borderWidth: 4,
        borderColor: "#fff",
        hoverOffset: 10,
        cutout: "75%",
      },
    ],
  };

  // Plugin for center label
  const centerLabelPlugin = {
    id: 'centerLabel',
    afterDraw: (chart: any) => {
      if (chart.config.type !== 'doughnut') return;
      const { ctx, chartArea } = chart;
      ctx.save();
      ctx.font = 'bold 2.5rem Inter, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }), (chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2 - 10);
      ctx.font = 'normal 0.95rem Inter, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Total', (chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2 + 22);
      ctx.restore();
    }
  };

  useEffect(() => {
    // Redraw center label on update
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [total]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const percent = total > 0 ? ` (${((value / total) * 100).toFixed(0)}%)` : '';
            return `${label}: ${value.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}${percent}`;
          }
        }
      },
    },
    cutout: '75%',
    animation: {
      animateRotate: true,
      duration: 900,
    },
    layout: {
      padding: 0,
    },
  } as const;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 pt-12 flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between w-full mb-6">
        <h3 className="text-xl font-bold text-gray-800">Debit vs Credit Transactions</h3>
        <select
          className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition shadow-sm ml-4 mt-1"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {TIME_PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="relative flex items-center justify-center w-full" style={{ minHeight: 301, paddingTop: 10 }}>
        <Doughnut
          ref={chartRef}
          data={data}
          options={options}
          plugins={[centerLabelPlugin]}
          width={262}
          height={262}
          style={{ maxWidth: 262, maxHeight: 262, margin: '0 auto' }}
        />
      </div>
      {/* Custom Legend */}
      <div className="flex justify-center gap-12 mt-8">
        <div className="flex items-center gap-2">
          <span className="inline-block w-5 h-5 rounded-full shadow" style={{ background: COLORS[0] }} />
          <span className="text-base font-semibold text-gray-700">Debit</span>
          <span className="text-gray-500 ml-1">({debit.toLocaleString()})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-5 h-5 rounded-full shadow" style={{ background: COLORS[1] }} />
          <span className="text-base font-semibold text-gray-700">Credit</span>
          <span className="text-gray-500 ml-1">({credit.toLocaleString()})</span>
        </div>
      </div>
    </div>
  );
};

export default DonutChart;
