import { useEffect, useState } from 'react';
import { getMealHistory } from '../api';
import type { MealRecord } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function MealHistory() {
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MealRecord | null>(null);
  const [page, setPage] = useState(0);
  const limit = 15;

  useEffect(() => {
    setLoading(true);
    getMealHistory({ limit, offset: page * limit })
      .then(d => { setMeals(d.meals); setTotal(d.total); })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5 fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-0 panel">
        {/* ── Table ──────────── */}
        <div className="border-b lg:border-b-0 lg:border-r border-[var(--color-line)]">
          <div className="section border-b border-[var(--color-line)]">
            <h2 className="section-title m-0">{total} meal records</h2>
          </div>

          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="px-7 py-4 border-b border-[var(--color-line)] bg-[var(--color-bg)] animate-pulse h-14" />
            ))
          ) : (
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left text-[11.5px] text-[var(--color-ink-soft)] uppercase tracking-wider border-b border-[var(--color-line)]">
                  <th className="px-7 py-2.5 font-medium">Date</th>
                  <th className="py-2.5 font-medium">Student</th>
                  <th className="py-2.5 font-medium">Meal</th>
                  <th className="py-2.5 font-medium text-right">Score</th>
                  <th className="py-2.5 pr-7 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {meals.map(m => {
                  const d = new Date(m.analysis_date);
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelected(m)}
                      className={`border-b border-[var(--color-line)] cursor-pointer transition-colors hover:bg-[var(--color-bg)] ${
                        selected?.id === m.id ? 'bg-[var(--color-bg)]' : ''
                      }`}
                    >
                      <td className="px-7 py-3 num text-[var(--color-ink-soft)] text-[13px]">
                        {d.getDate()} {d.toLocaleString('en', { month: 'short' })}
                      </td>
                      <td className="py-3">
                        <span className="font-medium">{m.student_name || '—'}</span>
                        <span className="text-[12px] text-[var(--color-ink-soft)] ml-2">{m.student_id}</span>
                      </td>
                      <td className="py-3 text-[var(--color-ink-soft)] capitalize">{m.meal_type}</td>
                      <td className="py-3 text-right num font-medium">{m.score.toFixed(0)}</td>
                      <td className="py-3 pr-7 text-right"><StatusBadge status={m.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-7 py-3">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                className="btn-secondary btn text-[12.5px] py-1.5 px-3 disabled:opacity-30">Prev</button>
              <span className="text-[12.5px] text-[var(--color-ink-soft)]">
                Page {page + 1} of {totalPages}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}
                className="btn-secondary btn text-[12.5px] py-1.5 px-3 disabled:opacity-30">Next</button>
            </div>
          )}
        </div>

        {/* ── Detail panel ──────────── */}
        <div>
          {selected ? (
            <div className="fade-in">
              <div className="section">
                <h2 className="section-title">Analysis #{selected.id}</h2>
                <div className="data-row"><span className="label">Student</span><span className="value">{selected.student_name || '—'}</span></div>
                <div className="data-row"><span className="label">Age / Group</span><span className="value">{selected.student_age} · {selected.age_group}</span></div>
                <div className="data-row"><span className="label">Date</span><span className="value text-[13px]">{new Date(selected.analysis_date).toLocaleString()}</span></div>
              </div>

              <div className="section">
                <h2 className="section-title">Score</h2>
                <div className="flex items-center gap-3">
                  <span className="heading-serif text-[38px] leading-none" style={{
                    color: selected.status === 'PASS' ? '#4C7A4A' : selected.status === 'REVIEW' ? '#C9922E' : '#A03B2A'
                  }}>{selected.score.toFixed(0)}</span>
                  <span className="text-[14px] text-[var(--color-ink-soft)]">/ 100</span>
                  <StatusBadge status={selected.status} className="ml-auto" />
                </div>
              </div>

              <div className="section">
                <h2 className="section-title">Detected foods</h2>
                <div className="space-y-1">
                  {Object.entries(selected.estimated_quantities).map(([food, qty]) => (
                    <div key={food} className="data-row">
                      <span className="label capitalize">{food}</span>
                      <span className="value">~{qty} g</span>
                    </div>
                  ))}
                </div>
              </div>

              {selected.recommendations.length > 0 && (
                <div className="section">
                  <h2 className="section-title">Issues</h2>
                  {selected.recommendations.map((r, i) => (
                    <p key={i} className="text-[13px] text-[var(--color-fail)] mb-1">• {r.problem}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-[var(--color-ink-soft)] text-[14px]">
              Click a row to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
