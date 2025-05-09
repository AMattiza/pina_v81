import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#34C759', '#FF3B30'];

export default function ReorderRatioChart({ totalCustomers, reorderers }) {
  const data = [
    { name: 'Mit Nachbestellung', value: reorderers },
    { name: 'Ohne Nachbestellung', value: totalCustomers - reorderers }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={100}
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
        >
          {data.map((entry, idx) => (
            <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => new Intl.NumberFormat('de-DE').format(value)} />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
}
