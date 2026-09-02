import { useEffect, useState } from 'react';
import { getDashboardStats, getMealHistory } from '../api';
import type { DashboardStats, MealRecord } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getMealHistory({ limit: 5, offset: 0 }),
    ]).then(([s, h]) => {
      setStats(s);
      setRecent(h.meals);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!stats) return <p className="text-[var(--color-ink-soft)] py-8">Failed to load.</p>;

  const pass = stats.status_percentages.PASS;
  const review = stats.status_percentages.REVIEW;
  const fail = stats.status_percentages.FAIL;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>School meal dashboard</h1>
          <p className="sub">Aggregate results across all scanned meals</p>
        </div>
      </div>

      <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* ── KPIs ─────────── */}
        <div className="section">
          <div className="flex gap-8 flex-wrap">
            <KPI value={stats.total_meals.toLocaleString()} label="Meals analyzed" />
            <KPI value={String(Math.round(stats.average_score))} label="Average score" />
            <KPI value={`${pass}%`} label="Pass rate" />
          </div>
        </div>

        {/* ── Outcomes bar ─── */}
        <div className="section fade-in-1">
          <h2 className="section-h">Outcomes</h2>
          <div className="stacked-bar">
            <div style={{ width: `${pass}%`, background: 'var(--color-veg)' }} />
            <div style={{ width: `${review}%`, background: 'var(--color-dal)' }} />
            <div style={{ width: `${fail}%`, background: 'var(--color-fail)' }} />
          </div>
          <div className="flex gap-[18px] mt-2.5 flex-wrap text-[12.5px] text-[var(--color-ink-soft)]">
            <span><span className="legend-dot" style={{ background: 'var(--color-veg)' }} />Pass — {pass}%</span>
            <span><span className="legend-dot" style={{ background: 'var(--color-dal)' }} />Review — {review}%</span>
            <span><span className="legend-dot" style={{ background: 'var(--color-fail)' }} />Fail — {fail}%</span>
          </div>
        </div>

        {/* ── Common issues ── */}
        <div className="section fade-in-2 meter-animate">
          <h2 className="section-h">Common issues</h2>
          {stats.common_issues.map((issue, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="flex justify-between text-[13.5px] mb-[5px]">
                <span>{issue.issue}</span>
                <span className="num">{issue.percentage}%</span>
              </div>
              <div className="meter-track">
                <div className="meter-fill" style={{
                  width: `${issue.percentage}%`,
                  background: issue.percentage > 60 ? 'var(--color-fail)' : 'var(--color-dal)',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Recent scans ─── */}
        <div className="section fade-in-3">
          <h2 className="section-h">Recent scans</h2>
          {recent.map((m) => {
            const d = new Date(m.analysis_date);
            const status = m.status.toLowerCase() as 'pass' | 'review' | 'fail';
            const scoreColor = status === 'pass' ? '#2E5233' : status === 'review' ? '#7A5A17' : '#7A2A1C';
            return (
              <div key={m.id} className="hist-item">
                <span className="w-[70px] shrink-0 text-[var(--color-ink-soft)] num text-[13px]">
                  {d.getDate().toString().padStart(2, '0')} {d.toLocaleString('en', { month: 'short' })}
                </span>
                <span className="flex-1">
                  <span className="font-medium">{m.student_id || '—'}</span>
                  <span className="text-[12.5px] text-[var(--color-ink-soft)]"> · age {m.student_age}</span>
                </span>
                <span className="num font-semibold w-10 text-right" style={{ color: scoreColor }}>{Math.round(m.score)}</span>
                <span className={`pill pill-${status} ml-3`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KPI({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="kpi-num">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div>
      <div className="page-head">
        <div><h1>School meal dashboard</h1><p className="sub">Loading...</p></div>
      </div>
      <div className="panel">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="section h-20 animate-pulse bg-[var(--color-bg)]" />
        ))}
      </div>
    </div>
  );
}
