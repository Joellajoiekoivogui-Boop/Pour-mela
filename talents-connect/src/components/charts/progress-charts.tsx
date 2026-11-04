"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = { primary: "#2563EB", violet: "#7C3AED", success: "#16A34A", muted: "#CBD5E1", warning: "#D97706" };

/** Barres horizontales ; `unit` = « % » pour une progression, « » pour un effectif. */
export function GoalsBarChart({ data, unit = "%" }: { data: { name: string; progress: number }[]; unit?: string }) {
  const isPercent = unit === "%";
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid horizontal={false} stroke="#E2E8F0" />
        <XAxis type="number" domain={isPercent ? [0, 100] : [0, "auto"]} allowDecimals={false} tickFormatter={(v) => (isPercent ? `${v} %` : String(v))} tick={{ fontSize: 12, fill: "#64748B" }} />
        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: "#334155" }} />
        <Tooltip formatter={(v) => (isPercent ? [`${v} %`, "Progression"] : [v, "Membres"])} />
        <Bar dataKey="progress" radius={[0, 6, 6, 0]} barSize={18}>
          {data.map((d) => <Cell key={d.name} fill={isPercent && d.progress === 100 ? COLORS.success : COLORS.primary} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MilestonesTimeline({ data }: { data: { week: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ left: -16, right: 8 }}>
        <defs>
          <linearGradient id="tl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.violet} stopOpacity={0.35} /><stop offset="100%" stopColor={COLORS.violet} stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#64748B" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748B" }} />
        <Tooltip formatter={(v) => [v, "Étapes accomplies (cumul)"]} />
        <Area type="monotone" dataKey="total" stroke={COLORS.violet} strokeWidth={2} fill="url(#tl)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatusDonut({ data }: { data: { name: string; value: number; tone: keyof typeof COLORS }[] }) {
  const shown = data.filter((d) => d.value > 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie data={shown} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
            {shown.map((d) => <Cell key={d.name} fill={COLORS[d.tone]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <ul className="space-y-1.5 text-sm">
        {data.map((d) => <li key={d.name} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: COLORS[d.tone] }} />{d.name} : <strong>{d.value}</strong></li>)}
      </ul>
    </div>
  );
}
