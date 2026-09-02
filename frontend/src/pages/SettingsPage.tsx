import { useState } from 'react';

export default function SettingsPage() {
  const [idMode, setIdMode] = useState('student_id');
  const [analysis, setAnalysis] = useState({
    food_detection: true, quantity_estimation: true, nutrition_analysis: true,
    age_comparison: true, scoring: true, recommendations: true,
  });
  const [output, setOutput] = useState({
    student_details: true, meal_details: true, nutrition_breakdown: true,
    why_explanation: true, status: true,
  });
  const [saved, setSaved] = useState(false);

  const toggleAnalysis = (key: keyof typeof analysis) => {
    setAnalysis(a => ({ ...a, [key]: !a[key] })); setSaved(false);
  };
  const toggleOutput = (key: keyof typeof output) => {
    setOutput(o => ({ ...o, [key]: !o[key] })); setSaved(false);
  };

  const save = () => {
    localStorage.setItem('mealguard_settings', JSON.stringify({ idMode, analysis, output }));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="sub">Configure identification mode, analysis steps and report contents</p>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: 640 }}>
        {/* Identification */}
        <div className="section">
          <h2 className="section-h">Identification</h2>
          <fieldset className="border-none p-0 m-0">
            {[
              { key: 'student_id', label: 'Student ID' },
              { key: 'age_only', label: 'Age only' },
              { key: 'face_recognition', label: 'Face recognition — disabled by default', disabled: true },
            ].map(({ key, label, disabled }) => (
              <div key={key} className="flex items-center gap-2.5 text-[14.5px] py-[7px]">
                <input type="radio" name="idmode" id={`id-${key}`}
                  checked={idMode === key} disabled={disabled}
                  onChange={() => { setIdMode(key); setSaved(false); }}
                  className="accent-[var(--color-ink)]"
                />
                <label htmlFor={`id-${key}`} className={`cursor-pointer ${disabled ? 'text-[var(--color-ink-soft)]' : ''}`}>
                  {label}
                </label>
              </div>
            ))}
          </fieldset>
        </div>

        {/* Meal analysis */}
        <div className="section">
          <h2 className="section-h">Meal analysis</h2>
          {(Object.entries(analysis) as [keyof typeof analysis, boolean][]).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2.5 text-[14.5px] py-[7px]">
              <input type="checkbox" id={`a-${key}`} checked={val}
                onChange={() => toggleAnalysis(key)} className="accent-[var(--color-ink)]" />
              <label htmlFor={`a-${key}`} className="cursor-pointer capitalize">{key.replace(/_/g, ' ')}</label>
            </div>
          ))}
        </div>

        {/* Report contents */}
        <div className="section">
          <h2 className="section-h">Report contents</h2>
          {(Object.entries(output) as [keyof typeof output, boolean][]).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2.5 text-[14.5px] py-[7px]">
              <input type="checkbox" id={`o-${key}`} checked={val}
                onChange={() => toggleOutput(key)} className="accent-[var(--color-ink)]" />
              <label htmlFor={`o-${key}`} className="cursor-pointer capitalize">
                {key === 'why_explanation' ? 'Why explanation' : key === 'status' ? 'Pass / Review / Fail status' : key.replace(/_/g, ' ')}
              </label>
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} className={`mt-4 w-full max-w-[640px] py-2.5 rounded-[3px] text-[14px] font-medium transition-all ${
        saved ? 'bg-[var(--color-veg-soft)] text-[var(--color-veg)] border border-[var(--color-veg)]'
              : 'btn'
      }`}>
        {saved ? 'Settings saved' : 'Save settings'}
      </button>
    </div>
  );
}
