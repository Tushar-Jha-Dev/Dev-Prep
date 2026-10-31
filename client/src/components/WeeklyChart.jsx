import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

/**
 * DevPrep - Custom Flat Recharts Tooltip
 * Follows Design.md: Warm Paper and Ink flat styling (no shadows, no glows)
 */
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip-box">
        <span className="tooltip-day">{data.day} ({data.date})</span>
        <span className="tooltip-value">
          <strong>{data.solved}</strong> problem{data.solved === 1 ? '' : 's'} solved
        </span>
      </div>
    );
  }
  return null;
}

/**
 * DevPrep - Weekly Solve Activity Chart (`WeeklyChart.jsx`)
 * Conforms strictly to Design.md Section 6 & 7.2:
 * - Recharts ResponsiveContainer + BarChart
 * - Flat terracotta bars (--accent), strictly avoiding prohibited gradients or glows
 * - Clean minimal axes and theme-aware styling
 */
export default function WeeklyChart({ data = [] }) {
  const maxSolved = Math.max(3, ...data.map((d) => d.solved || 0));

  return (
    <div className="weekly-chart-wrapper" style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-body)' }}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, maxSolved]}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          />
          <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'var(--surface-2)', opacity: 0.6 }} />
          <Bar
            dataKey="solved"
            fill="var(--chart-1, var(--accent))"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
