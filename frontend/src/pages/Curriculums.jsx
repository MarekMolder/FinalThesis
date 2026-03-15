import { useState, useEffect } from 'react';
import { curriculum } from '../api';

const ENUMS = {
  status: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
  visibility: ['PRIVATE', 'PUBLIC'],
  educationalFramework: ['ESTONIAN_NATIONAL_CURRICULUM'],
};

export default function Curriculums() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    curriculum.list().then(setList).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openCreate() {
    setForm({
      title: '',
      description: '',
      curriculumType: 'COURSE',
      status: 'DRAFT',
      visibility: 'PRIVATE',
      provider: '',
      audience: '',
      subjectAreaIri: '',
      subjectIri: '',
      educationalLevelIri: '',
      schoolLevel: '',
      grade: '',
      educationalFramework: 'ESTONIAN_NATIONAL_CURRICULUM',
      language: 'et',
      volumeHours: 0,
      externalSource: '',
      externalPageIri: '',
    });
  }
  async function openEdit(row) {
    setError('');
    try {
      const full = await curriculum.get(row.id);
      setForm({ ...full });
    } catch (err) {
      setError(err.message);
    }
  }
  function closeForm() {
    setForm(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      if (form.id) {
        await curriculum.update(form.id, form);
      } else {
        await curriculum.create(form);
      }
      closeForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete(id) {
    if (!confirm('Delete?')) return;
    setError('');
    try {
      await curriculum.delete(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading...</p>;
  return (
    <div style={{ padding: 16 }}>
      <h1>Curriculums</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={openCreate} style={{ marginBottom: 16 }}>Add</button>
      <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Visibility</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((row) => (
            <tr key={row.id}>
              <td>{row.title}</td>
              <td>{row.curriculumType}</td>
              <td>{row.status}</td>
              <td>{row.visibility}</td>
              <td>
                <button onClick={() => openEdit(row)}>Edit</button>
                <button onClick={() => handleDelete(row.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {form && (
        <form onSubmit={handleSubmit} style={{ marginTop: 24, maxWidth: 400 }}>
          <h2>{form.id ? 'Edit' : 'Create'}</h2>
          <div style={{ marginBottom: 8 }}>
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Description</label>
            <input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Curriculum type</label>
            <input value={form.curriculumType || ''} onChange={(e) => setForm({ ...form, curriculumType: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ padding: 6 }}>
              {ENUMS.status.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Visibility</label>
            <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} style={{ padding: 6 }}>
              {ENUMS.visibility.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Provider</label>
            <input value={form.provider || ''} onChange={(e) => setForm({ ...form, provider: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Audience</label>
            <input value={form.audience || ''} onChange={(e) => setForm({ ...form, audience: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Subject area IRI</label>
            <input value={form.subjectAreaIri || ''} onChange={(e) => setForm({ ...form, subjectAreaIri: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Subject IRI</label>
            <input value={form.subjectIri || ''} onChange={(e) => setForm({ ...form, subjectIri: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Educational level IRI</label>
            <input value={form.educationalLevelIri || ''} onChange={(e) => setForm({ ...form, educationalLevelIri: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>School level</label>
            <input value={form.schoolLevel || ''} onChange={(e) => setForm({ ...form, schoolLevel: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Grade</label>
            <input value={form.grade || ''} onChange={(e) => setForm({ ...form, grade: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Educational framework</label>
            <select value={form.educationalFramework ?? ''} onChange={(e) => setForm({ ...form, educationalFramework: e.target.value })} style={{ padding: 6 }}>
              {ENUMS.educationalFramework.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Language</label>
            <input value={form.language || ''} onChange={(e) => setForm({ ...form, language: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Volume hours</label>
            <input type="number" value={form.volumeHours ?? ''} onChange={(e) => setForm({ ...form, volumeHours: parseInt(e.target.value, 10) || 0 })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>External source</label>
            <input value={form.externalSource || ''} onChange={(e) => setForm({ ...form, externalSource: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>External page IRI</label>
            <input value={form.externalPageIri ?? ''} onChange={(e) => setForm({ ...form, externalPageIri: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} placeholder="võib tühi" />
          </div>
          <button type="submit" disabled={saving}>{saving ? '...' : 'Save'}</button>
          <button type="button" onClick={closeForm}>Cancel</button>
        </form>
      )}
    </div>
  );
}
