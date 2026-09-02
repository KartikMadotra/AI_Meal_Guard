import { useEffect, useState } from 'react';
import { getStudents } from '../api';
import type { Student } from '../types';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudents().then(setStudents).finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Students</h1>
          <p className="sub">Demo records only — no real student data</p>
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
                  <th>Student ID</th>
                  <th>Name</th>
                  <th className="num">Class</th>
                  <th className="num">Age</th>
                  <th>Age group</th>
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
