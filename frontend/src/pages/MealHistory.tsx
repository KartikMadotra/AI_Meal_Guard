import { useEffect, useState } from 'react';
import { getMealHistory } from '../api';
import type { MealRecord } from '../types';

export default function MealHistory() {
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    getMealHistory({ limit, offset: page * limit })
      .then(d => { setMeals(d.meals); setTotal(d.total); })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  const statusClass = (s: string) => s === 'PASS' ? 'pass' : s === 'REVIEW' ? 'review' : 'fail';
  const statusLabel = (s: string) => s === 'PASS' ? 'Pass' : s === 'REVIEW' ? 'Review' : 'Fail';
  const scoreColor = (s: string) => s === 'PASS' ? '#2E5233' : s === 'REVIEW' ? '#7A5A17' : '#7A2A1C';

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Meal history</h1>
          <p className="sub">{total} records across all students</p>
        </div>
      </div>

      <div className="panel">
        <div className="section">
          {loading ? (
            <div className="py-8 text-center text-[var(--color-ink-soft)]">Loading...</div>
          ) : (
            meals.map(m => {
              const d = new Date(m.analysis_date);
              return (
                <div key={m.id} className="hist-item">
                  <span className="w-[70px] shrink-0 text-[var(--color-ink-soft)] num text-[13px]">
                    {d.getDate().toString().padStart(2, '0')} {d.toLocaleString('en', { month: 'short' })}
                  </span>
                  <span className="flex-1">
                    <span className="font-medium">{m.student_id || m.student_name || '—'}</span>
                    <span className="text-[12.5px] text-[var(--color-ink-soft)]"> · age {m.student_age}</span>
                  </span>
                  <span className="num font-semibold w-10 text-right" style={{ color: scoreColor(m.status) }}>
                    {Math.round(m.score)}
                  </span>
                  <span className={`pill pill-${statusClass(m.status)} ml-3`}>{statusLabel(m.status)}</span>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="section flex items-center justify-between">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
              className="btn btn-secondary text-[12.5px] py-1.5 px-3 disabled:opacity-30">Prev</button>
            <span className="text-[12.5px] text-[var(--color-ink-soft)]">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}
              className="btn btn-secondary text-[12.5px] py-1.5 px-3 disabled:opacity-30">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
