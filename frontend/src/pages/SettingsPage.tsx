import { useState } from 'react';

type IdMode = 'student_id' | 'age_only' | 'face_recognition';

interface AppSettings {
  identification_mode: IdMode;
  food_detection: boolean;
  quantity_estimation: boolean;
  nutrition_analysis: boolean;
  age_comparison: boolean;
  scoring: boolean;
  recommendations: boolean;
  show_student_details: boolean;
  show_meal_details: boolean;
  show_nutrition: boolean;
  show_explanation: boolean;
  show_status: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  identification_mode: 'student_id',
  food_detection: true,
  quantity_estimation: true,
  nutrition_analysis: true,
  age_comparison: true,
  scoring: true,
  recommendations: true,
  show_student_details: true,
  show_meal_details: true,
  show_nutrition: true,
  show_explanation: true,
  show_status: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof AppSettings) => {
    setSettings(s => ({ ...s, [key]: !s[key] }));
    setSaved(false);
  };

  const save = () => {
    localStorage.setItem('mealguard_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-[640px] space-y-5 fade-in">
      <div className="panel">
        {/* Identification Mode */}
        <div className="section">
          <h2 className="section-title">Identification mode</h2>
          <div className="space-y-2">
            {([
              { key: 'student_id' as IdMode, label: 'Student ID', desc: 'QR code or manual entry', recommended: true },
              { key: 'age_only' as IdMode, label: 'Age only', desc: 'Anonymous — no student database required' },
              { key: 'face_recognition' as IdMode, label: 'Face recognition', desc: 'Experimental — disabled by default' },
            ]).map(({ key, label, desc, recommended }) => (
              <label
                key={key}
                className={`flex items-center gap-3 p-3 rounded-[3px] cursor-pointer transition-colors ${
                  settings.identification_mode === key
                    ? 'bg-[var(--color-bg)] border border-[var(--color-ink)]'
                    : 'border border-transparent hover:bg-[var(--color-bg)]'
                }`}
              >
                <input
                  type="radio" name="idmode"
                  checked={settings.identification_mode === key}
                  onChange={() => { setSettings(s => ({ ...s, identification_mode: key })); setSaved(false); }}
                  className="accent-[var(--color-ink)]"
                />
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-[var(--color-ink)]">{label}</p>
                  <p className="text-[12.5px] text-[var(--color-ink-soft)]">{desc}</p>
                </div>
                {recommended && (
                  <span className="pill pill-pass text-[10px]">Recommended</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Meal Analysis Toggles */}
        <div className="section">
          <h2 className="section-title">Meal analysis pipeline</h2>
          <div className="space-y-0.5">
            {([
              ['food_detection', 'Food detection'] as const,
              ['quantity_estimation', 'Quantity estimation'] as const,
              ['nutrition_analysis', 'Nutrition analysis'] as const,
              ['age_comparison', 'Age-based comparison'] as const,
              ['scoring', 'Scoring'] as const,
              ['recommendations', 'Recommendations'] as const,
            ]).map(([key, label]) => (
              <Toggle key={key} checked={settings[key] as boolean} onChange={() => toggle(key)} label={label} />
            ))}
          </div>
        </div>

        {/* Output Toggles */}
        <div className="section">
          <h2 className="section-title">Output display</h2>
          <div className="space-y-0.5">
            {([
              ['show_student_details', 'Student details'] as const,
              ['show_meal_details', 'Meal details'] as const,
              ['show_nutrition', 'Nutrition values'] as const,
              ['show_explanation', 'Explanation (why?)'] as const,
              ['show_status', 'Pass / Review / Fail'] as const,
            ]).map(([key, label]) => (
              <Toggle key={key} checked={settings[key] as boolean} onChange={() => toggle(key)} label={label} />
            ))}
          </div>
        </div>
      </div>

      <button onClick={save} className={`w-full py-2.5 rounded-[3px] text-[14px] font-medium transition-all ${
        saved
          ? 'bg-[var(--color-veg-soft)] text-[var(--color-veg)] border border-[var(--color-veg)]'
          : 'btn'
      }`}>
        {saved ? 'Settings saved' : 'Save settings'}
      </button>

      <p className="footnote">
        Settings are stored in your browser's local storage. They do not affect other users or the backend configuration.
      </p>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-2.5 px-1 cursor-pointer hover:bg-[var(--color-bg)] rounded-[3px] transition-colors">
      <span className="text-[14px] text-[var(--color-ink)]">{label}</span>
      <button
        type="button" role="switch" aria-checked={checked}
        onClick={e => { e.preventDefault(); onChange(); }}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          checked ? 'bg-[var(--color-ink)]' : 'bg-[var(--color-line)]'
        }`}
      >
        <span className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-[16px]' : 'translate-x-0'
        }`} />
      </button>
    </label>
  );
}
