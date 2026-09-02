export default function NutritionAnalysis() {
  const nutrients = [
    { name: 'Energy',        est: 520, target: 650, unit: 'kcal' },
    { name: 'Protein',       est: 12.5, target: 18.0, unit: 'g' },
    { name: 'Carbohydrate',  est: 78, target: 95, unit: 'g' },
    { name: 'Fat',           est: 14, target: 18, unit: 'g' },
    { name: 'Iron',          est: 3.1, target: 5.0, unit: 'mg' },
    { name: 'Calcium',       est: 210, target: 350, unit: 'mg' },
    { name: 'Fibre',         est: 4.2, target: 6.0, unit: 'g' },
  ];

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Nutrition analysis</h1>
          <p className="sub">Latest scan — STU-1024, age group 11–14</p>
        </div>
      </div>

      <div className="panel">
        <div className="section meter-animate">
          {nutrients.map((n, i) => {
            const pct = Math.min(100, Math.round((n.est / n.target) * 100));
            const barColor = pct >= 90 ? 'var(--color-veg)' : pct >= 60 ? 'var(--color-dal)' : 'var(--color-fail)';
            return (
              <div key={n.name} className="mb-3.5 last:mb-0" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex justify-between text-[13.5px] mb-[5px]">
                  <span>{n.name} — {n.est}{n.unit} of {n.target}{n.unit}</span>
                  <span className="num">{pct}%</span>
                </div>
                <div className="meter-track">
                  <div className="meter-fill" style={{ width: `${pct}%`, background: barColor }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="footnote px-6 py-4">
          Estimated from detected quantities × per-100 g nutrient density. Targets are per-meal benchmarks for this age group.
        </p>
      </div>
    </div>
  );
}
