import { useState, useEffect } from 'react';
import { analyzeMeal, getDemoPlates, getStudents } from '../api';
import type { AnalysisResult, Student } from '../types';
import ScoreGauge from '../components/ScoreGauge';
import StatusBadge from '../components/StatusBadge';

type Mode = 'student_id' | 'age_only';

const STATUS_BAR = {
  PASS: '#4C7A4A', REVIEW: '#C9922E', FAIL: '#A03B2A',
};

export default function ScanMeal() {
  const [mode, setMode] = useState<Mode>('student_id');
  const [students, setStudents] = useState<Student[]>([]);
  const [plates, setPlates] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [age, setAge] = useState(12);
  const [selectedPlate, setSelectedPlate] = useState('plate_good');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    getStudents().then(setStudents);
    getDemoPlates().then(setPlates);
  }, []);

  const runAnalysis = async () => {
    setLoading(true); setResult(null);
    try {
      const params: Record<string, unknown> = { plate_profile: selectedPlate, meal_type: 'lunch' };
      if (mode === 'student_id') params.student_id = selectedStudent;
      else params.age = age;
      const r = await analyzeMeal(params as Parameters<typeof analyzeMeal>[0]);
      setResult(r);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-0 panel">
        {/* ── Left: scan tray ──────────── */}
        <div className="p-6 border-b lg:border-b-0 lg:border-r border-[var(--color-line)] bg-[var(--color-bg)]">
          {/* Mode toggle */}
          <div className="flex gap-0 border border-[var(--color-line)] rounded-[3px] mb-5 overflow-hidden">
            <button
              onClick={() => setMode('student_id')}
              className={`flex-1 py-2 text-[13px] font-medium transition-colors ${
                mode === 'student_id' ? 'bg-[var(--color-ink)] text-white' : 'bg-transparent text-[var(--color-ink-soft)]'
              }`}
            >Student ID</button>
            <button
              onClick={() => setMode('age_only')}
              className={`flex-1 py-2 text-[13px] font-medium transition-colors ${
                mode === 'age_only' ? 'bg-[var(--color-ink)] text-white' : 'bg-transparent text-[var(--color-ink-soft)]'
              }`}
            >Age only</button>
          </div>

          {/* Student / Age */}
          {mode === 'student_id' ? (
            <div className="mb-4">
              <label className="text-[12px] text-[var(--color-ink-soft)] uppercase tracking-wider block mb-1.5">Student</label>
              <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="input">
                <option value="">Choose a student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.id} — {s.name} (Age {s.age})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-4">
              <label className="text-[12px] text-[var(--color-ink-soft)] uppercase tracking-wider block mb-1.5">Age</label>
              <input type="number" min={5} max={18} value={age} onChange={e => setAge(Number(e.target.value))} className="input" />
            </div>
          )}

          {/* Plate profile */}
          <div className="mb-5">
            <label className="text-[12px] text-[var(--color-ink-soft)] uppercase tracking-wider block mb-1.5">Plate profile</label>
            <select value={selectedPlate} onChange={e => setSelectedPlate(e.target.value)} className="input">
              {plates.map(p => (
                <option key={p} value={p}>{p.replace('plate_', '').replace(/_/g, ' ')}</option>
              ))}
            </select>
            <p className="text-[11px] text-[var(--color-ink-soft)] mt-1.5">
              Simulated plate. In production: live camera capture.
            </p>
          </div>

          <button
            onClick={runAnalysis}
            disabled={loading || (mode === 'student_id' && !selectedStudent)}
            className="btn w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze meal'}
          </button>
        </div>

        {/* ── Right: readout ──────────── */}
        <div>
          {!result && !loading && (
            <div className="p-16 text-center text-[var(--color-ink-soft)] text-[14px]">
              Select a student, choose a plate profile, and click Analyze.
            </div>
          )}
          {loading && (
            <div className="p-16 text-center text-[var(--color-ink-soft)] text-[14px]">
              Analyzing meal...
            </div>
          )}
          {result && <ResultReadout result={result} />}
        </div>
      </div>
    </div>
  );
}

function ResultReadout({ result }: { result: AnalysisResult }) {
  return (
    <div className="fade-in">
      {/* Student */}
      <div className="section">
        <h2 className="section-title">Student</h2>
        <div className="data-row"><span className="label">Name</span><span className="value">{result.student.name || '—'}</span></div>
        <div className="data-row"><span className="label">Age</span><span className="value">{result.student.age}</span></div>
        <div className="data-row"><span className="label">Age group</span><span className="value">{result.student.age_group}</span></div>
        {result.student.id && <div className="data-row"><span className="label">ID</span><span className="value">{result.student.id}</span></div>}
      </div>

      {/* Detected on plate */}
      <div className="section">
        <h2 className="section-title">Detected on plate</h2>
        <table className="w-full text-[14.5px]">
          <tbody>
            {result.detection.detections.map((d, i) => (
              <tr key={i}>
                <td className="py-1.5 pr-3">
                  <span className="swatch mr-2" style={{ background: foodColor(d.food) }} />
                  <span className="capitalize">{d.food}</span>
                </td>
                <td className="py-1.5 text-right num text-[var(--color-ink-soft)]">
                  ~{result.quantities[d.food]} g
                </td>
                <td className="py-1.5 text-right num text-[var(--color-ink-soft)] pl-3 text-[12px]">
                  {(d.confidence * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Score */}
      <div className="section">
        <h2 className="section-title">MealGuard score</h2>
        <div className="flex items-center gap-4 mb-4">
          <ScoreGauge score={result.score} status={result.status} />
          <StatusBadge status={result.status} className="ml-auto" />
        </div>

        {/* Component meters */}
        <div className="space-y-3">
          {Object.entries(result.component_scores).map(([name, cs]) => (
            <div key={name}>
              <div className="flex justify-between text-[12.5px] mb-1">
                <span className="text-[var(--color-ink-soft)] capitalize">{name.replace(/_/g, ' ')}</span>
                <span className="num font-medium">{cs.score.toFixed(0)} <span className="text-[var(--color-ink-soft)]">× {(cs.weight * 100).toFixed(0)}%</span></span>
              </div>
              <div className="meter-track">
                <div className="meter-fill" style={{
                  width: `${Math.min(cs.score, 100)}%`,
                  background: cs.score >= 75 ? '#4C7A4A' : cs.score >= 50 ? '#C9922E' : '#A03B2A',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrient coverage */}
      <div className="section">
        <h2 className="section-title">Nutrient coverage</h2>
        <div className="space-y-2">
          {Object.entries(result.coverage).map(([key, cov]) => {
            const color = cov.adequate ? '#4C7A4A' : cov.coverage_pct >= 50 ? '#C9922E' : '#A03B2A';
            return (
              <div key={key}>
                <div className="flex justify-between text-[12.5px] mb-1">
                  <span className="text-[var(--color-ink-soft)]">{formatNutrient(key)}</span>
                  <span className="num" style={{ color }}>{cov.coverage_pct.toFixed(0)}%</span>
                </div>
                <div className="meter-track">
                  <div className="meter-fill" style={{
                    width: `${Math.min(cov.coverage_pct, 100)}%`,
                    background: color,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Why */}
      <div className="section">
        <h2 className="section-title">Why</h2>
        <p className="text-[14.5px] leading-relaxed text-[var(--color-ink)]">
          {result.explanation.summary}
        </p>
        {result.explanation.critical_shortfalls.length > 0 && (
          <div className="mt-3 space-y-1">
            {result.explanation.critical_shortfalls.map((s, i) => (
              <p key={i} className="text-[13px] text-[var(--color-fail)]">
                {formatNutrient(s.nutrient)}: {s.actual.toFixed(1)} vs required {s.required} ({s.coverage_pct.toFixed(0)}%)
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="section">
          <h2 className="section-title">Recommendations</h2>
          <div className="space-y-3">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="pl-3 border-l-2 border-[var(--color-dal)]">
                <p className="text-[14px] font-medium text-[var(--color-ink)]">{rec.problem}</p>
                <p className="text-[13.5px] text-[var(--color-ink-soft)] mt-0.5">{rec.suggestion}</p>
                <p className="text-[12px] text-[var(--color-ink-soft)] mt-0.5 num">{rec.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="footnote px-7 py-4">
        Quantities are camera-based estimates, not exact measurements. Score reflects configured
        nutritional and meal criteria, not an official government standard.
      </p>
    </div>
  );
}

function foodColor(food: string): string {
  const map: Record<string, string> = {
    rice: '#EFE8CC', dal: '#C9922E', vegetable: '#4C7A4A', roti: '#D4B896',
    egg: '#F5DEB3', salad: '#7CB342', potato: '#C9A96E', milk: '#E3E8ED',
    curd: '#F0EDE6', paneer: '#FFF8E1', banana: '#F9E547', fish: '#B0BEC5',
  };
  return map[food] || '#D8DAD2';
}

function formatNutrient(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
