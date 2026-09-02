import { useEffect, useState } from 'react';
import { getStudents } from '../api';
import type { Student } from '../types';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudents().then(setStudents).finally(() => setLoading(false));
  }, []);

  const grouped = students.reduce<Record<string, Student[]>>((acc, s) => {
    (acc[s.age_group] = acc[s.age_group] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6 fade-in">
      <div className="panel">
        <div className="section border-b border-[var(--color-line)]">
          <h2 className="section-title m-0">{students.length} registered students</h2>
        </div>

        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="px-7 py-4 border-b border-[var(--color-line)] bg-[var(--color-bg)] animate-pulse h-12" />
          ))
        ) : (
          Object.entries(grouped).sort().map(([group, studs]) => (
            <div key={group}>
              <div className="px-7 py-2.5 bg-[var(--color-bg)] border-b border-[var(--color-line)]">
                <span className="text-[11.5px] font-semibold text-[var(--color-ink-soft)] uppercase tracking-wider">
                  Age group {group}
                </span>
              </div>
              <table className="w-full text-[14px]">
                <tbody>
                  {studs.map(s => (
                    <tr key={s.id} className="border-b border-[var(--color-line)] hover:bg-[var(--color-bg)] transition-colors">
                      <td className="px-7 py-3 w-28">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-veg-soft)] text-[var(--color-veg)] text-[13px] font-semibold">
                          {s.name.charAt(0)}
                        </span>
                      </td>
                      <td className="py-3 font-medium">{s.name}</td>
                      <td className="py-3 num text-[var(--color-ink-soft)]">{s.id}</td>
                      <td className="py-3 num text-[var(--color-ink-soft)]">Class {s.class_number}</td>
                      <td className="py-3 num text-[var(--color-ink-soft)]">Age {s.age}</td>
                      <td className="py-3 pr-7 text-right">
                        <span className="pill pill-pass text-[11px]">{s.age_group}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
