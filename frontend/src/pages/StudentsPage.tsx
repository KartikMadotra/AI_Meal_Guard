import { useEffect, useState } from 'react';
import { getStudents, createStudent, deleteStudent } from '../api';
import type { Student } from '../types';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formClass, setFormClass] = useState(7);
  const [formAge, setFormAge] = useState(12);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getStudents().then(setStudents).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!formName.trim()) { setError('Name is required.'); return; }
    setSubmitting(true); setError('');
    try {
      await createStudent({ name: formName.trim(), class_number: formClass, age: formAge });
      setFormName(''); setFormClass(7); setFormAge(12); setShowForm(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add student.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete student ${id}?`)) return;
    try { await deleteStudent(id); load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to delete.'); }
  };

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Students</h1>
          <p className="sub">{students.length} registered students</p>
        </div>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add student'}
        </button>
      </div>

      {/* ── Add student form ──────── */}
      {showForm && (
        <div className="panel mb-5 fade-in">
          <div className="section">
            <h2 className="section-h">New student</h2>
            <div className="flex gap-3 flex-wrap items-end">
              <div className="flex-1 min-w-[160px]">
                <label className="text-[12px] text-[var(--color-ink-soft)] uppercase tracking-wider block mb-1">Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="Student name" className="input" />
              </div>
              <div className="w-24">
                <label className="text-[12px] text-[var(--color-ink-soft)] uppercase tracking-wider block mb-1">Class</label>
                <input type="number" min={1} max={12} value={formClass}
                  onChange={e => setFormClass(Number(e.target.value))} className="input text-center" />
              </div>
              <div className="w-24">
                <label className="text-[12px] text-[var(--color-ink-soft)] uppercase tracking-wider block mb-1">Age</label>
                <input type="number" min={5} max={18} value={formAge}
                  onChange={e => setFormAge(Number(e.target.value))} className="input text-center" />
              </div>
              <button onClick={handleCreate} disabled={submitting} className="btn h-[42px]">
                {submitting ? 'Adding...' : 'Add'}
              </button>
            </div>
            {error && <p className="text-[13px] text-[var(--color-fail)] mt-2">{error}</p>}
          </div>
        </div>
      )}

      {/* ── Students table ──────── */}
      <div className="panel">
        <div className="section">
          {loading ? (
            <div className="py-8 text-center text-[var(--color-ink-soft)]">Loading...</div>
          ) : students.length === 0 ? (
            <div className="py-8 text-center text-[var(--color-ink-soft)]">
              No students yet. Click "+ Add student" to register one.
            </div>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th className="num">Class</th>
                  <th className="num">Age</th>
                  <th>Age group</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td className="num">{s.id}</td>
                    <td>{s.name}</td>
                    <td className="num">{s.class_number}</td>
                    <td className="num">{s.age}</td>
                    <td>{s.age_group}</td>
                    <td className="text-right">
                      <button onClick={() => handleDelete(s.id)}
                        className="text-[var(--color-fail)] text-[13px] hover:underline cursor-pointer bg-transparent border-none">
                        Delete
                      </button>
                    </td>
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
