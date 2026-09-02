import { useEffect, useState } from 'react';
import { getAgeGroups } from '../api';
import type { AgeGroup } from '../types';

const NUTRIENT_COLS = [
  { key: 'energy_kcal', label: 'Energy', unit: 'kcal' },
  { key: 'protein_g', label: 'Protein', unit: 'g' },
  { key: 'carbohydrate_g', label: 'Carbs', unit: 'g' },
  { key: 'fat_g', label: 'Fat', unit: 'g' },
  { key: 'fibre_g', label: 'Fibre', unit: 'g' },
  { key: 'iron_mg', label: 'Iron', unit: 'mg' },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg' },
  { key: 'vitamin_c_mg', label: 'Vit C', unit: 'mg' },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg' },
];

export default function AgeRequirements() {
  const [groups, setGroups] = useState<Record<string, AgeGroup>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'per_meal' | 'daily'>('per_meal');

  useEffect(() => {
    getAgeGroups().then(setGroups).finally(() => setLoading(false));
  }, []);

  const entries = Object.entries(groups);

  return (
    <div className="space-y-5 fade-in">
      <div className="panel overflow-x-auto">
        {/* Header with toggle */}
        <div className="px-7 py-4 flex items-center justify-between border-b border-[var(--color-line)]">
          <h2 className="section-title m-0">ICMR-NIN RDA benchmarks</h2>
          <div className="flex gap-0 border border-[var(--color-line)] rounded-[3px] overflow-hidden">
            <button
              onClick={() => setView('per_meal')}
              className={`px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                view === 'per_meal' ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-ink-soft)]'
              }`}
            >Per meal</button>
            <button
              onClick={() => setView('daily')}
              className={`px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                view === 'daily' ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-ink-soft)]'
              }`}
            >Daily</button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[var(--color-ink-soft)]">Loading...</div>
        ) : (
          <table className="w-full text-[13.5px] min-w-[800px]">
            <thead>
              <tr className="text-left text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider border-b border-[var(--color-line)]">
                <th className="px-7 py-2.5 font-medium">Age group</th>
                <th className="py-2.5 font-medium">Ages</th>
                {NUTRIENT_COLS.map(c => (
                  <th key={c.key} className="py-2.5 font-medium text-right pr-3">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, group]) => {
                const data = view === 'per_meal' ? group.per_meal : group.daily;
                return (
                  <tr key={key} className="border-b border-[var(--color-line)] hover:bg-[var(--color-bg)] transition-colors">
                    <td className="px-7 py-3.5 font-semibold">{group.label}</td>
                    <td className="py-3.5 num text-[var(--color-ink-soft)]">{group.age_range[0]}–{group.age_range[1]}</td>
                    {NUTRIENT_COLS.map(c => (
                      <td key={c.key} className="py-3.5 text-right pr-3 num">
                        {data[c.key as keyof typeof data]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="footnote">
        Based on ICMR-NIN Recommended Dietary Allowances for Indians (2020). Per-meal values are 35% of daily requirements (school lunch contribution).
      </p>
    </div>
  );
}
