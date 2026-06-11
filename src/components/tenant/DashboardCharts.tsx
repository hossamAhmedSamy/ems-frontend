import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney } from '../../lib/utils';
import type { BranchSpendEntry, MonthPoint, SpendEntry } from '../../hooks/useTenantDashboard';

export const CHART_COLORS = [
  '#4F46E5', // brand indigo
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#F43F5E',
  '#0EA5E9',
  '#64748B',
];

export function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en', {
    month: 'short',
    timeZone: 'UTC',
  });
}

export function TrendChart({ data, currency }: { data: MonthPoint[]; currency: string }) {
  const points = data.map((p) => ({ ...p, label: monthLabel(p.month) }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={points} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
        <YAxis hide />
        <Tooltip
          formatter={(v) => [formatMoney(Number(v), currency), 'Spent']}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#4F46E5"
          strokeWidth={2}
          fill="url(#trendFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({ data, currency }: { data: SpendEntry[]; currency: string }) {
  // Top 6 slices; the rest collapses into "Other" so the donut stays readable.
  const top = data.slice(0, 6);
  const rest = data.slice(6).reduce((s, e) => s + e.total, 0);
  const slices = rest > 0 ? [...top, { id: '__other', name: 'Other', total: rest }] : top;
  const grand = slices.reduce((s, e) => s + e.total, 0);

  if (grand === 0) {
    return <p className="text-sm text-slate-500 py-8 text-center">No spending this month yet.</p>;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <ResponsiveContainer width={170} height={170}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="total"
            nameKey="name"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            strokeWidth={0}
          >
            {slices.map((s, i) => (
              <Cell key={s.id} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => formatMoney(Number(v), currency)}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 w-full space-y-1.5">
        {slices.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-slate-700 truncate flex-1">{s.name}</span>
            <span className="text-slate-900 font-medium">{formatMoney(s.total, currency)}</span>
            <span className="text-xs text-slate-400 w-10 text-right">
              {Math.round((s.total / grand) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BranchBars({ data, currency }: { data: BranchSpendEntry[]; currency: string }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500 py-8 text-center">No branch spending yet.</p>;
  }
  const rows = data.slice(0, 8);
  return (
    <ResponsiveContainer width="100%" height={Math.max(140, rows.length * 44)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 11, fill: '#475569' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(v, name) => [
            formatMoney(Number(v), currency),
            name === 'total' ? 'This month' : 'Last month',
          ]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="previousTotal" fill="#CBD5E1" radius={[0, 4, 4, 0]} barSize={10} />
        <Bar dataKey="total" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={10} />
      </BarChart>
    </ResponsiveContainer>
  );
}
