import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

import type { Transaction } from "@/lib/mockData";

interface TimeSeriesChartProps {
  transactions: Transaction[];
}

function getDailySumsLast14Days(transactions: Transaction[]) {
  // Generate last 14 days (including today) as YYYY-MM-DD
  const today = new Date();
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d: Date = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  // Sum transactions per day
  const sums: { [date: string]: number } = {};
  transactions.forEach((tx) => {
    const date = new Date(tx.timestamp);
    const day = date.toISOString().split("T")[0];
    const amount = typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
    if (!isNaN(amount)) {
      sums[day] = (sums[day] || 0) + amount;
    }
  });
  // Fill missing days with 0
  return days.map((date: string) => ({ date, sum: sums[date] || 0 }));
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ transactions }) => {
  const dailySums = getDailySumsLast14Days(transactions);
  const data = {
    labels: dailySums.map((d) => d.date),
    datasets: [
      {
        label: "Daily Transaction Sum (THB)",
        data: dailySums.map((d) => d.sum),
        fill: false,
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Sum: ${context.parsed.y.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Date" },
        ticks: { maxTicksLimit: 10 },
      },
      y: {
        title: { display: true, text: "Sum (THB)" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 pt-12 flex flex-col items-center w-full max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Daily Transaction Volume (THB)</h3>
      <div className="flex-grow flex items-center justify-center w-full">
        <Line data={data} options={options} height={262} />
      </div>
    </div>
  );
};

export default TimeSeriesChart;
