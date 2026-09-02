import { useState, useEffect } from 'react';
import { whatIf, getFoodDatabase, getAgeGroups } from '../api';
import type { WhatIfResult, FoodItem, AgeGroup } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function WhatIfPage() {
  const [foods, setFoods] = useState<Record<string, FoodItem>>({});
  const [ageGroups, setAgeGroups] = useState<Record<string, AgeGroup>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhatIfResult | null>(null);

  const [currentFoods, setCurrentFoods] = useState<Record<string, number>>({
    rice: 150, dal: 80, vegetable: 55,
  });
  const [additions, setAdditions] = useState<Record<string, number>>({ dal: 30 });
  const [ageGroup, setAgeGroup] = useState('11-14');

  useEffect(() => {
    getFoodDatabase().then(setFoods);
    getAgeGroups().then(setAgeGroups);
  }, []);

  const foodKeys = Object.keys(foods);

  const addCurrentFood = () => {
    const unused = foodKeys.find(k => !(k in currentFoods));
    if (unused) setCurrentFoods({ ...currentFoods, [unused]: 60 });
  };

  const addAddition = () => {
    const used = Object.keys(additions);
    const unused = foodKeys.find(k => !used.includes(k));
    if (unused) setAdditions({ ...additions, [unused]: 30 });
  };

  const simulate = async () => {
    setLoading(true);
    try {
      const r = await whatIf({ current_quantities: currentFoods, additions, age_group: ageGroup });
      setResult(r);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 panel">
        {/* ── Left: inputs ──────────── */}
        <div className="border-b lg:border-b-0 lg:border-r border-[var(--color-line)]">
          {/* Age group */}
          <div className="section">
            <h2 className="section-title">Age group</h2>
            <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="input">
              {Object.entries(ageGroups).map(([k, g]) => (
                <option key={k} value={k}>{g.label}</option>
              ))}
            </select>
          </div>

          {/* Current meal */}
          <div className="section">
            <h2 className="section-title">Current meal</h2>
            {Object.entries(currentFoods).map(([food, qty]) => (
              <div key={food} className="flex items-center gap-2 mb-2">
                <select value={food}
                  onChange={e => {
                    const { [food]: _, ...rest } = currentFoods;
                    setCurrentFoods({ ...rest, [e.target.value]: qty });
                  }}
                  className="input flex-1 capitalize"
                >
                  {foodKeys.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <input type="number" value={qty} min={0}
                  onChange={e => setCurrentFoods({ ...currentFoods, [food]: Number(e.target.value) })}
                  className="input w-20 text-center"
                />
                <span className="text-[12px] text-[var(--color-ink-soft)]">g</span>
                <button onClick={() => { const { [food]: _, ...rest } = currentFoods; setCurrentFoods(rest); }}
                  className="text-[var(--color-fail)] text-[14px] px-1 hover:opacity-70">×</button>
              </div>
            ))}
            <button onClick={addCurrentFood} className="text-[12.5px] text-[var(--color-focus)] hover:underline mt-1">
              + Add food
            </button>
          </div>

          {/* What-if additions */}
          <div className="section">
            <h2 className="section-title" style={{ color: 'var(--color-veg)' }}>+ What if we add...</h2>
            {Object.entries(additions).map(([food, qty]) => (
              <div key={food} className="flex items-center gap-2 mb-2">
                <select value={food}
                  onChange={e => {
                    const { [food]: _, ...rest } = additions;
                    setAdditions({ ...rest, [e.target.value]: qty });
                  }}
                  className="input flex-1 capitalize"
                  style={{ borderColor: 'var(--color-veg-soft)' }}
                >
                  {foodKeys.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <input type="number" value={qty} min={0}
                  onChange={e => setAdditions({ ...additions, [food]: Number(e.target.value) })}
                  className="input w-20 text-center"
                  style={{ borderColor: 'var(--color-veg-soft)' }}
                />
                <span className="text-[12px] text-[var(--color-ink-soft)]">g</span>
                <button onClick={() => { const { [food]: _, ...rest } = additions; setAdditions(rest); }}
                  className="text-[var(--color-fail)] text-[14px] px-1 hover:opacity-70">×</button>
              </div>
            ))}
            <button onClick={addAddition} className="text-[12.5px] text-[var(--color-veg)] hover:underline mt-1">
              + Add more
            </button>
          </div>

          <div className="px-7 py-4">
            <button onClick={simulate} disabled={loading} className="btn w-full disabled:opacity-40">
              {loading ? 'Simulating...' : 'Simulate'}
            </button>
          </div>
        </div>

        {/* ── Right: result ──────────── */}
        <div>
          {!result ? (
            <div className="p-16 text-center text-[var(--color-ink-soft)] text-[14px]">
              Configure the meal and additions, then click Simulate.
            </div>
          ) : (
            <SimResult result={result} />
          )}
        </div>
      </div>
    </div>
  );
}

function SimResult({ result }: { result: WhatIfResult }) {
  const origStatus = result.original.status as 'PASS' | 'REVIEW' | 'FAIL';
  const simStatus = result.simulated.status as 'PASS' | 'REVIEW' | 'FAIL';
  const scoreColor = (s: string) =>
    s === 'PASS' ? '#4C7A4A' : s === 'REVIEW' ? '#C9922E' : '#A03B2A';

  return (
    <div className="fade-in">
      {/* Score comparison */}
      <div className="section">
        <h2 className="section-title">Result</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider mb-1">Original</p>
            <span className="heading-serif text-[38px] leading-none" style={{ color: scoreColor(origStatus) }}>
              {result.original.score}
            </span>
            <span className="text-[14px] text-[var(--color-ink-soft)] ml-2">/ 100</span>
          </div>
          <span className="text-[var(--color-ink-soft)] text-[20px]">→</span>
          <div>
            <p className="text-[11px] text-[var(--color-veg)] uppercase tracking-wider mb-1">Simulated</p>
            <span className="heading-serif text-[38px] leading-none" style={{ color: scoreColor(simStatus) }}>
              {result.simulated.score}
            </span>
            <span className="text-[14px] text-[var(--color-ink-soft)] ml-2">/ 100</span>
          </div>
        </div>
      </div>

      {/* Improvement */}
      <div className="section">
        <h2 className="section-title">Improvement</h2>
        <div className="flex items-baseline gap-4">
          <span className="heading-serif text-[32px] leading-none" style={{
            color: result.improvement.score_change > 0 ? '#4C7A4A' : '#A03B2A'
          }}>
            {result.improvement.score_change > 0 ? '+' : ''}{result.improvement.score_change}
          </span>
          <span className="text-[14px] text-[var(--color-ink-soft)]">{result.improvement.status_change}</span>
        </div>
      </div>

      {/* Additions applied */}
      <div className="section">
        <h2 className="section-title">Changes applied</h2>
        <div className="space-y-1">
          {Object.entries(result.simulated.additions).map(([food, qty]) => (
            <div key={food} className="data-row">
              <span className="label capitalize">{food}</span>
              <span className="value text-[var(--color-veg)]">+{qty} g</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status comparison */}
      <div className="section">
        <h2 className="section-title">Status</h2>
        <div className="flex items-center gap-3">
          <StatusBadge status={origStatus} />
          <span className="text-[var(--color-ink-soft)]">→</span>
          <StatusBadge status={simStatus} />
        </div>
      </div>

      <p className="footnote px-7 py-4">
        Simulation assumes all other meal components remain unchanged. Actual results may vary.
      </p>
    </div>
  );
}
