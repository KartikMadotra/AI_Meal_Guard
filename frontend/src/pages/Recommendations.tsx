export default function Recommendations() {
  const recs = [
    { tag: 'Protein', problem: 'Protein is below the selected benchmark.', fix: 'Increase the pulse or protein component — for example, +30 g dal.' },
    { tag: 'Vegetable', problem: 'Vegetable portion is smaller than the benchmark.', fix: 'Add a second vegetable serving or increase the existing portion by ~20 g.' },
    { tag: 'Component', problem: 'A required meal component is missing entirely.', fix: 'Add the missing food group before the meal is served, if possible.' },
    { tag: 'Iron', problem: 'Iron intake is likely low given the detected components.', fix: 'Add an iron-rich pulse, leafy vegetable, or fortified item where available.' },
  ];

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Recommendations</h1>
          <p className="sub">Rules the system applies when a criterion falls short</p>
        </div>
      </div>

      <div className="panel">
        <div className="section">
          {recs.map((r, i) => (
            <div key={i} className="rec-card">
              <div className="text-[11.5px] font-semibold text-[var(--color-dal)] mb-1">{r.tag}</div>
              <p className="text-[14.5px] mb-1">{r.problem}</p>
              <div className="text-[13.5px] text-[var(--color-ink-soft)]">{r.fix}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
