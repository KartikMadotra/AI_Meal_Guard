import { useEffect, useState } from 'react';
import { getFoodDatabase } from '../api';
import type { FoodItem } from '../types';

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

const CAT_COLORS: Record<string, string> = {
  cereal: '#C9922E', pulse: '#B8860B', vegetable: '#4C7A4A',
  protein: '#A03B2A', fruit: '#D4A574', dairy: '#5B8FB9',
};

export default function FoodDatabase() {
  const [foods, setFoods] = useState<Record<string, FoodItem>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFoodDatabase().then(setFoods).finally(() => setLoading(false));
  }, []);

  const entries = Object.entries(foods);

  return (
    <div className="space-y-5 fade-in">
      <div className="panel overflow-x-auto">
        <div className="section border-b border-[var(--color-line)]">
          <h2 className="section-title m-0">{entries.length} food items · per 100 g</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[var(--color-ink-soft)]">Loading...</div>
        ) : (
          <table className="w-full text-[13.5px] min-w-[800px]">
            <thead>
              <tr className="text-left text-[11px] text-[var(--color-ink-soft)] uppercase tracking-wider border-b border-[var(--color-line)]">
                <th className="px-7 py-2.5 font-medium">Food</th>
                <th className="py-2.5 font-medium">Category</th>
                {NUTRIENT_COLS.map(c => (
                  <th key={c.key} className="py-2.5 font-medium text-right pr-3">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, food]) => (
                <tr key={key} className="border-b border-[var(--color-line)] hover:bg-[var(--color-bg)] transition-colors">
                  <td className="px-7 py-3 font-medium">{food.name}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1.5 text-[12px]">
                      <span className="swatch" style={{ background: CAT_COLORS[food.category] || '#999' }} />
                      <span className="capitalize text-[var(--color-ink-soft)]">{food.category}</span>
                    </span>
                  </td>
                  {NUTRIENT_COLS.map(c => (
                    <td key={c.key} className="py-3 text-right pr-3 num text-[var(--color-ink-soft)]">
                      {food.per_100g[c.key as keyof typeof food.per_100g]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="footnote">
        Nutrient values sourced from Indian Food Composition Tables (IFCT 2017). Values are per 100 g of edible portion.
      </p>
    </div>
  );
}
