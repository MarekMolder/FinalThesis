import { useState, useEffect } from 'react';
import { curriculumVersion, curriculum } from '../api';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';

const STATE = ['DRAFT', 'REVIEW', 'FINAL', 'ARCHIVED'];
const STATUS = ['NOT_PUBLISHED', 'PUBLISHING', 'PUBLISHED', 'FAILED'];

export default function CurriculumVersions() {
  const [curriculums, setCurriculums] = useState([]);
  const [list, setList] = useState([]);
  const [curriculumId, setCurriculumId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    curriculum.list().then(setCurriculums).catch(() => {});
  }, []);

  function load() {
    if (!curriculumId) { setList([]); return; }
    setLoading(true);
    curriculumVersion.list(curriculumId).then(setList).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, [curriculumId]);

  function openCreate() {
    if (!curriculumId) { setError('Vali õppekava'); return; }
    setForm({
      curriculumId,
      versionNumber: 1,
      state: 'DRAFT',
      changeNote: '',
      contentJson: '{}',
      retrievalContextJson: '{}',
      retrievedCatalogJson: '{}',
      complianceReportJson: '{}',
      status: 'NOT_PUBLISHED',
      publishedError: '',
    });
  }
  async function openEdit(row) {
    setError('');
    try {
      const full = await curriculumVersion.get(row.id);
      setForm({ ...full, curriculumId: full.curriculumId ?? curriculumId });
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
        await curriculumVersion.update(form.id, form);
      } else {
        await curriculumVersion.create(form);
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
      await curriculumVersion.delete(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell currentNav="curriculums">
      <PageContainer>
        <section className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80">
          <h1>Curriculum versions</h1>
          <div style={{ marginBottom: 16 }}>
            <label>Curriculum </label>
            <select value={curriculumId} onChange={(e) => setCurriculumId(e.target.value)}>
              <option value="">-- vali --</option>
              {curriculums.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button onClick={openCreate} style={{ marginBottom: 16 }} disabled={!curriculumId}>Add version</button>
          {loading && <p>Loading...</p>}
          <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>Version</th>
                <th>State</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  <td>{row.versionNumber}</td>
                  <td>{row.state}</td>
                  <td>{row.status}</td>
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
                <label>Version number</label>
                <input type="number" value={form.versionNumber ?? ''} onChange={(e) => setForm({ ...form, versionNumber: parseInt(e.target.value, 10) || 0 })} style={{ display: 'block', width: '100%', padding: 6 }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>State</label>
                <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} style={{ padding: 6 }}>
                  {STATE.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ padding: 6 }}>
                  {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Change note</label>
                <input value={form.changeNote || ''} onChange={(e) => setForm({ ...form, changeNote: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Content JSON</label>
                <textarea value={form.contentJson || '{}'} onChange={(e) => setForm({ ...form, contentJson: e.target.value })} rows={3} style={{ display: 'block', width: '100%', padding: 6 }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Retrieval context JSON</label>
                <textarea value={form.retrievalContextJson || '{}'} onChange={(e) => setForm({ ...form, retrievalContextJson: e.target.value })} rows={2} style={{ display: 'block', width: '100%', padding: 6 }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Retrieved catalog JSON</label>
                <textarea value={form.retrievedCatalogJson || '{}'} onChange={(e) => setForm({ ...form, retrievedCatalogJson: e.target.value })} rows={2} style={{ display: 'block', width: '100%', padding: 6 }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Compliance report JSON</label>
                <textarea value={form.complianceReportJson || '{}'} onChange={(e) => setForm({ ...form, complianceReportJson: e.target.value })} rows={2} style={{ display: 'block', width: '100%', padding: 6 }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Published error</label>
                <input value={form.publishedError || ''} onChange={(e) => setForm({ ...form, publishedError: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
              </div>
              <button type="submit" disabled={saving}>{saving ? '...' : 'Save'}</button>
              <button type="button" onClick={closeForm}>Cancel</button>
            </form>
          )}
        </section>
      </PageContainer>
    </AppShell>
  );
}
