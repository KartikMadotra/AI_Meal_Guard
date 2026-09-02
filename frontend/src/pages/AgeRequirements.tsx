import { useEffect, useState } from 'react';
import { getAgeGroups } from '../api';
import type { AgeGroup } from '../types';

export default function AgeRequirements() {
  const [groups, setGroups] = useState<Record<string, AgeGroup>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAgeGroups().then(setGroups).finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Age requirements</h1>
          <p className="sub">Per-meal nutritional benchmarks by age group</p>
        </div>
      </div>

      <div className="panel">
        <div className="section">
          {loading ? (
            <div className="py-8 text-center text-[var(--color-ink-soft)]">Loading...</div>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Age group</th>
                  <th className="num">Protein (g)</th>
                  <th className="num">Energy (kcal)</th>
                  <th className="num">Iron (mg)</th>
                  <th className="num">Calcium (mg)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groups).map(([key, g]) => (
                  <tr key={key}>
                    <td>{g.label}</td>
                    <td className="num">{g.per_meal.protein_g}</td>
                    <td className="num">{g.per_meal.energy_kcal}</td>
                    <td className="num">{g.per_meal.iron_mg}</td>
                    <td className="num">{g.per_meal.calcium_mg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="footnote px-6 py-4">
          Values are placeholders to be replaced with the official reference standard selected for the target school-meal program.
        </p>
      </div>
    </div>
  );
}
