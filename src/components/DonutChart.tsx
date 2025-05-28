"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DonutChartProps {
  debitAmount: number;
  creditAmount: number;
}

const COLORS = ["#4F46E5", "#10B981"]; // Indigo for Debit, Emerald for Credit

const DonutChart: React.FC<DonutChartProps> = ({ debitAmount, creditAmount }) => {
  const data = [
    { name: "Debit", value: debitAmount },
    { name: "Credit", value: creditAmount },
  ];

  return (
    <div className="w-full h-64 bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4 text-center">Debit vs Credit</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
            nameKey="name"
            label
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChart;
