import { useEffect, useState } from 'react';
import { getFoodDatabase } from '../api';
import type { FoodItem } from '../types';

export default function FoodDatabase() {
  const [foods, setFoods] = useState<Record<string, FoodItem>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFoodDatabase().then(setFoods).finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Food database</h1>
          <p className="sub">Nutrient density per 100 g, used by the scoring engine</p>
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
                  <th>Food</th>
                  <th className="num">Energy (kcal)</th>
                  <th className="num">Protein (g)</th>
                  <th className="num">Carbs (g)</th>
                  <th className="num">Fat (g)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(foods).map(([key, f]) => (
                  <tr key={key}>
                    <td>{f.name}</td>
                    <td className="num">{f.per_100g.energy_kcal}</td>
                    <td className="num">{f.per_100g.protein_g}</td>
                    <td className="num">{f.per_100g.carbohydrate_g}</td>
                    <td className="num">{f.per_100g.fat_g}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
