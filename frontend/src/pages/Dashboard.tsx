import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { getDashboardStats } from '../api';
import type { DashboardStats } from '../types';

const PIE_COLORS = ['#4C7A4A', '#C9922E', '#A03B2A'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!stats) return <p className="text-[var(--color-ink-soft)] py-8">Failed to load dashboard.</p>;

  const pieData = [
    { name: 'Pass',   value: stats.status_distribution.PASS },
    { name: 'Review', value: stats.status_distribution.REVIEW },
    { name: 'Fail',   value: stats.status_distribution.FAIL },
  ];

  const barData = Object.entries(stats.score_distribution).map(([range, count]) => ({
    range, count,
  }));

  return (
    <div className="space-y-6 fade-in">
      {/* ── Stat cards ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 panel">
        <StatCell label="Meals analyzed" value={String(stats.total_meals)} border />
        <StatCell label="Average score" value={String(stats.average_score)} suffix="/ 100" border />
        <StatCell label="Pass rate" value={`${stats.status_percentages.PASS}%`} color="#4C7A4A" border />
        <StatCell label="Fail rate" value={`${stats.status_percentages.FAIL}%`} color="#A03B2A" />
      </div>

      {/* ── Charts row ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 panel">
        {/* Status Pie */}
        <div className="p-6 border-b lg:border-b-0 lg:border-r border-[var(--color-line)]">
          <h2 className="section-title mb-4">Status distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={88}
                paddingAngle={3} dataKey="value" stroke="none">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #D8DAD2', borderRadius: 3, fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 mt-1">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-[13px] text-[var(--color-ink-soft)]">
                <span className="swatch" style={{ background: PIE_COLORS[i] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Score Bar */}
        <div className="p-6">
          <h2 className="section-title mb-4">Score distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis dataKey="range" tick={{ fill: '#5B6158', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#5B6158', fontSize: 12 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D8DAD2', borderRadius: 3, fontSize: 13 }} />
              <Bar dataKey="count" fill="var(--color-dal)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Common issues ─────────────────────── */}
      <div className="panel">
        <div className="section">
          <h2 className="section-title">Common nutritional issues</h2>
          <div className="space-y-4">
            {stats.common_issues.map((issue, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[14px] text-[var(--color-ink)]">{issue.issue}</span>
                  <span className="text-[13px] font-medium num text-[var(--color-dal)]">{issue.percentage}%</span>
                </div>
                <div className="meter-track">
                  <div className="meter-fill" style={{
                    width: `${Math.min(issue.percentage, 100)}%`,
                    background: issue.percentage > 80 ? 'var(--color-fail)' : 'var(--color-dal)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="footnote px-7 py-4">
          Issues are calculated from all analyzed meals. A 100% rate means every recorded meal exhibited this shortfall.
        </p>
      </div>
    </div>
  );
}

function StatCell({ label, value, suffix, color, border }: {
  label: string; value: string; suffix?: string; color?: string; border?: boolean;
}) {
  return (
    <div className={`p-5 ${border ? 'border-r border-[var(--color-line)]' : ''}`}>
      <p className="text-[12px] text-[var(--color-ink-soft)] uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="heading-serif text-[32px] leading-none" style={{ color: color || 'var(--color-ink)' }}>
          {value}
        </span>
        {suffix && <span className="text-[13px] text-[var(--color-ink-soft)]">{suffix}</span>}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="panel">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-5 border-b border-[var(--color-line)] h-20 bg-[var(--color-bg)] animate-pulse" />
      ))}
    </div>
  );
}
