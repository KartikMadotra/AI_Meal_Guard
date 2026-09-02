import { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeMeal, getDemoPlates, getStudents } from '../api';
import type { AnalysisResult, Student } from '../types';

// Demo plate descriptions so user knows what each profile simulates
const PLATE_INFO: Record<string, { label: string; desc: string; foods: string; expected: string }> = {
  plate_good:     { label: 'Good Plate',     desc: 'Balanced meal with adequate portions',        foods: 'Rice 150g + Dal 90g + Vegetable 70g',   expected: '~82 PASS' },
  plate_ok:       { label: 'OK Plate',       desc: 'Slightly low on protein/dal',                 foods: 'Rice 180g + Dal 50g + Vegetable 60g',   expected: '~68 REVIEW' },
  plate_poor:     { label: 'Poor Plate',     desc: 'Very low dal, missing nutrients',             foods: 'Rice 200g + Dal 25g + Vegetable 40g',   expected: '~45 FAIL' },
  plate_minimal:  { label: 'Minimal Plate',  desc: 'Just rice, almost no dal or veg',             foods: 'Rice 220g + Dal 15g + Vegetable 20g',   expected: '~30 FAIL' },
  plate_surplus:  { label: 'Surplus Plate',  desc: 'Extra-large portions, exceeds benchmarks',    foods: 'Rice 200g + Dal 120g + Vegetable 100g', expected: '~90 PASS' },
};

export default function ScanMeal() {
  const [students, setStudents] = useState<Student[]>([]);
  const [plates, setPlates] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPlate, setSelectedPlate] = useState('plate_good');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // What-if slider state
  const [dalQty, setDalQty] = useState(50);
  const oldScoreRef = useRef({ score: 68, status: 'review' });

  useEffect(() => {
    getStudents().then(s => { setStudents(s); if (s.length) setSelectedStudent(s[0].id); });
    getDemoPlates().then(setPlates);
  }, []);

  const runAnalysis = async (plateOverride?: string) => {
    const plate = plateOverride || selectedPlate;
    setLoading(true); setResult(null);
    try {
      const r = await analyzeMeal({ student_id: selectedStudent, plate_profile: plate, meal_type: 'lunch' });
      setResult(r);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      // Still uses mock detection — real YOLO model would analyze the image
      runAnalysis();
    };
    reader.readAsDataURL(file);
  };

  // What-if calculations
  const PROTEIN_TARGET = 18.0;
  const computeProtein = useCallback((dal: number) => 3.4 + dal * 0.183, []);
  const computeScore = useCallback((dal: number) => Math.max(0, Math.min(100, Math.round(68 + 0.4667 * (dal - 50)))), []);
  const statusFor = (score: number) => score >= 80 ? 'pass' : score >= 60 ? 'review' : 'fail';
  const labelFor = (s: string) => s === 'pass' ? 'Pass' : s === 'review' ? 'Review' : 'Fail';
  const colorFor = (s: string) => s === 'pass' ? { bg: '#DEE9DC', fg: '#2E5233', bar: '#4C7A4A' }
    : s === 'review' ? { bg: '#F2E2C0', fg: '#7A5A17', bar: '#C9922E' }
    : { bg: '#F1DAD4', fg: '#7A2A1C', bar: '#A03B2A' };

  const currentScore = computeScore(dalQty);
  const currentStatus = statusFor(currentScore);
  const currentProtein = computeProtein(dalQty);
  const currentCoverage = Math.min(100, Math.round((currentProtein / PROTEIN_TARGET) * 100));
  const c = colorFor(currentStatus);
  const student = students.find(s => s.id === selectedStudent);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Scan meal</h1>
          <p className="sub">Age-aware nutrition assessment</p>
        </div>
        {student && (
          <div className="text-right text-[13px] text-[var(--color-ink-soft)]">
            Student ID · {student.id}<br/>
            <strong className="text-[var(--color-ink)] text-[15px]">{student.name}, Class {student.class_number}</strong>
          </div>
        )}
      </div>

      {/* ── Student + controls ──────── */}
      <div className="panel mb-5">
        <div className="section">
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-[12px] text-[var(--color-ink-soft)] uppercase tracking-wider block mb-1">Student</label>
              <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="input">
                {students.map(s => <option key={s.id} value={s.id}>{s.id} — {s.name} (Age {s.age})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] text-[var(--color-ink-soft)] uppercase tracking-wider block mb-1">Or upload image</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload}
                className="text-[13px] text-[var(--color-ink-soft)]" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Demo plate gallery ──────── */}
      <div className="panel mb-5">
        <div className="section">
          <h2 className="section-h">Test without a real meal — pick a demo plate</h2>
          <p className="text-[13px] text-[var(--color-ink-soft)] mb-4">
            Click any plate below to instantly run analysis. No camera or real food needed.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(PLATE_INFO).map(([key, info]) => {
              const isSelected = selectedPlate === key;
              const statusColor = info.expected.includes('PASS') ? 'var(--color-veg)' :
                info.expected.includes('REVIEW') ? 'var(--color-dal)' : 'var(--color-fail)';
              return (
                <button
                  key={key}
                  onClick={() => { setSelectedPlate(key); setUploadedImage(null); runAnalysis(key); }}
                  disabled={loading || !selectedStudent}
                  className={`text-left p-4 border rounded-[3px] transition-all cursor-pointer disabled:opacity-40 ${
                    isSelected ? 'border-[var(--color-ink)] bg-[#F4F5F1]' : 'border-[var(--color-line)] bg-white hover:border-[var(--color-ink-soft)] hover:bg-[#FAFBF9]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-[14px]">{info.label}</span>
                    <span className="text-[12px] font-semibold num" style={{ color: statusColor }}>{info.expected}</span>
                  </div>
                  <p className="text-[12.5px] text-[var(--color-ink-soft)] mb-1.5">{info.desc}</p>
                  <p className="text-[11.5px] text-[var(--color-ink-soft)] num">{info.foods}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Uploaded image preview ──── */}
      {uploadedImage && (
        <div className="panel mb-5 fade-in">
          <div className="section">
            <h2 className="section-h">Uploaded image</h2>
            <img src={uploadedImage} alt="Uploaded meal"
              className="max-w-[400px] max-h-[300px] rounded-[3px] border border-[var(--color-line)]" />
            <p className="text-[12px] text-[var(--color-ink-soft)] mt-2">
              Note: Image analysis uses demo detection. Real YOLO model integration coming soon.
            </p>
          </div>
        </div>
      )}

      {/* ── Main scan panel ──────── */}
      <div className="panel scan-layout">
        {/* Left: plate tray */}
        <div className="tray">
          <div className="plate-wrap">
            <svg viewBox="0 0 320 320" aria-hidden="true">
              <circle cx="160" cy="160" r="150" fill="#F3F4EF" stroke="#D8DAD2" strokeWidth="1.5"/>
              <path d="M 90 120 Q 60 170 95 220 Q 150 250 195 220 Q 175 150 140 115 Q 115 105 90 120 Z"
                fill="var(--color-rice)" stroke="#DCD2A6" strokeWidth="1"/>
              <ellipse cx="220" cy="120" rx="46" ry="34" fill="var(--color-veg)" opacity="0.85"/>
              <ellipse cx="150" cy="230"
                rx={40 + dalQty * 0.14} ry={26 + dalQty * 0.09}
                fill="var(--color-dal)" opacity="0.9"
                style={{ transition: 'all 0.3s ease' }}
              />
            </svg>
            <div className="scan-line" aria-hidden="true" />
            <div className="plate-label" style={{ top: '16%', left: '14%' }}>Rice <span className="g">~150 g</span></div>
            <div className="plate-label" style={{ top: '12%', left: '62%' }}>Vegetable <span className="g">~60 g</span></div>
            <div className="plate-label" style={{ top: '68%', left: '38%' }}>Dal <span className="g">~{dalQty} g</span></div>
          </div>
          <div className="text-[12px] text-[var(--color-ink-soft)]">Camera 2 · live segmentation overlay (illustrative)</div>
        </div>

        {/* Right: readout */}
        <div>
          <div className="section">
            <h2 className="section-h">Student</h2>
            <div className="student-row"><span>Age</span><span>{student?.age || 12}</span></div>
            <div className="student-row"><span>Class</span><span>{student?.class_number || 7}</span></div>
            <div className="student-row"><span>Age group</span><span>{student?.age_group || '11-14'}</span></div>
          </div>

          <div className="section">
            <h2 className="section-h">Detected on plate</h2>
            <table className="detect">
              <tbody>
                <tr><td><span className="swatch" style={{ background: 'var(--color-rice)' }} />Rice</td><td>~150 g</td></tr>
                <tr><td><span className="swatch" style={{ background: 'var(--color-dal)' }} />Dal</td><td>~{dalQty} g</td></tr>
                <tr><td><span className="swatch" style={{ background: 'var(--color-veg)' }} />Vegetable</td><td>~60 g</td></tr>
              </tbody>
            </table>
          </div>

          <div className="section">
            <h2 className="section-h">MealGuard score</h2>
            <div className="flex items-baseline gap-3.5 mb-3.5">
              <span className="score-num" style={{ color: c.bar }}>{currentScore}</span>
              <span className="score-den">/ 100</span>
              <span className="status-pill ml-auto" style={{ background: c.bg, color: c.fg }}>
                {labelFor(currentStatus)}
              </span>
            </div>
            <div className="flex justify-between text-[12.5px] text-[var(--color-ink-soft)] mb-1">
              <span>Protein coverage</span><span className="num">{currentCoverage}%</span>
            </div>
            <div className="meter-track">
              <div className="meter-fill" style={{ width: `${currentCoverage}%`, background: c.bar, transition: 'width 0.35s ease, background 0.35s ease' }} />
            </div>
          </div>

          <div className="section">
            <h2 className="section-h">Why</h2>
            <p className="text-[14.5px] leading-[1.55]">
              Estimated protein <strong className="num">{currentProtein.toFixed(1)} g</strong> against a benchmark of{' '}
              <strong className="num">18.0 g</strong> for age group 11–14 — coverage{' '}
              <strong className="num">{currentCoverage}%</strong>. Main protein source is dal
              (<span className="num">~{dalQty} g</span>). Rice and vegetable portions are within range;
              the shortfall is the pulse component.
            </p>
          </div>

          <div className="section">
            <h2 className="section-h">What if — add dal</h2>
            <div className="flex items-center gap-3.5 flex-wrap">
              <input type="range" min={50} max={110} step={5} value={dalQty}
                onChange={e => setDalQty(Number(e.target.value))}
                className="flex-1 min-w-[120px]" />
              <span className="num font-semibold min-w-[56px]">{dalQty} g</span>
              <button className="btn" onClick={() => setDalQty(Math.min(110, dalQty + 30))}>Add 30 g dal</button>
              <button className="btn btn-secondary" onClick={() => { setDalQty(50); oldScoreRef.current = { score: 68, status: 'review' }; }}>Reset</button>
            </div>
            <div className="flex items-center gap-2.5 mt-3.5 text-[14.5px] flex-wrap">
              <span className="text-[var(--color-ink-soft)] line-through decoration-[var(--color-line)]">
                {oldScoreRef.current.score} · {labelFor(oldScoreRef.current.status)}
              </span>
              <span className="text-[var(--color-ink-soft)]">→</span>
              <span className="font-semibold" style={{ color: c.bar }}>
                {currentScore} · {labelFor(currentStatus)}
              </span>
            </div>
          </div>

          <p className="footnote px-6 py-3.5">
            Quantities are camera-based estimates, not exact measurements. Score reflects configured
            nutritional and meal criteria, not an official government standard.
          </p>
        </div>
      </div>

      {/* ── API result panel ──────── */}
      {result && (
        <div className="panel mt-5 fade-in">
          <div className="section">
            <h2 className="section-h">Analysis result — {result.status}</h2>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="score-num" style={{ color: result.status === 'PASS' ? '#4C7A4A' : result.status === 'REVIEW' ? '#C9922E' : '#A03B2A' }}>
                {Math.round(result.score)}
              </span>
              <span className="score-den">/ 100</span>
              <span className={`pill pill-${result.status.toLowerCase()} ml-auto`}>
                {result.status === 'PASS' ? 'Pass' : result.status === 'REVIEW' ? 'Review' : 'Fail'}
              </span>
            </div>

            <h2 className="section-h mt-4">Detected foods</h2>
            <table className="detect mb-4">
              <tbody>
                {result.detection.detections.map((d, i) => (
                  <tr key={i}>
                    <td>
                      <span className="swatch" style={{ background: foodColor(d.food) }} />
                      <span className="capitalize">{d.food}</span>
                    </td>
                    <td>~{result.quantities[d.food]} g · {(d.confidence * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 className="section-h">Nutrient coverage</h2>
            {Object.entries(result.coverage).map(([key, cov]) => {
              const barColor = cov.adequate ? 'var(--color-veg)' : cov.coverage_pct >= 50 ? 'var(--color-dal)' : 'var(--color-fail)';
              return (
                <div key={key} className="mb-2.5">
                  <div className="flex justify-between text-[12.5px] text-[var(--color-ink-soft)] mb-1">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="num">{cov.coverage_pct.toFixed(0)}%</span>
                  </div>
                  <div className="meter-track"><div className="meter-fill" style={{ width: `${Math.min(cov.coverage_pct, 100)}%`, background: barColor }} /></div>
                </div>
              );
            })}
          </div>

          {result.recommendations.length > 0 && (
            <div className="section">
              <h2 className="section-h">Recommendations</h2>
              {result.recommendations.map((rec, i) => (
                <div key={i} className="rec-card">
                  <div className="text-[11.5px] font-semibold text-[var(--color-dal)] mb-1">{rec.problem}</div>
                  <div className="text-[13.5px] text-[var(--color-ink-soft)]">{rec.suggestion}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function foodColor(food: string): string {
  const map: Record<string, string> = {
    rice: '#EFE8CC', dal: '#C9922E', vegetable: '#4C7A4A', roti: '#D4B896',
    egg: '#F5DEB3', salad: '#7CB342', potato: '#C9A96E', milk: '#E3E8ED',
  };
  return map[food] || '#D8DAD2';
}
