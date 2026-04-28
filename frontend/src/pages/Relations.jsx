import { useState, useEffect } from 'react';
import { relation, curriculumItem, curriculumVersion, curriculum } from '../api';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';

const RELATION_TYPE = ['EELDAB', 'ON_EELDUSEKS', 'KOOSNEB', 'ON_OSAKS', 'SISALDAB'];

export default function Relations() {
  const [curriculums, setCurriculums] = useState([]);
  const [versions, setVersions] = useState([]);
  const [items, setItems] = useState([]);
  const [list, setList] = useState([]);
  const [curriculumId, setCurriculumId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const selectedVersion = versions.find((v) => v.id === versionId);
  const versionClosed = selectedVersion?.state === 'CLOSED';

  useEffect(() => {
    curriculum.list().then(setCurriculums).catch(() => {});
  }, []);
  useEffect(() => {
    if (!curriculumId) { setVersions([]); setVersionId(''); return; }
    curriculumVersion.list(curriculumId).then(setVersions).catch(() => {});
  }, [curriculumId]);
  useEffect(() => {
    if (!versionId) { setItems([]); setList([]); return; }
    curriculumItem.list(versionId).then(setItems).catch(() => {});
  }, [versionId]);

  function load() {
    if (!versionId) { setList([]); return; }
    setLoading(true);
    relation.list(versionId).then(setList).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, [versionId]);

  function openCreate() {
    if (!versionId) { setError('Vali versioon'); return; }
    if (versionClosed) { setError('CLOSED versioonis relationeid luua ei saa'); return; }
    if (items.length < 1) { setError('Loo enne vähemalt üks curriculum item'); return; }
    setForm({
      curriculumVersionId: versionId,
      sourceItemId: items[0]?.id ?? '',
      targetItemId: '', // tühi = kasuta Target external IRI
      targetExternalIri: '',
      type: 'EELDAB',
    });
  }
  async function openEdit(row) {
    setError('');
    try {
      const full = await relation.get(row.id);
      setForm({ ...full, curriculumVersionId: full.curriculumVersionId ?? versionId });
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
    const payload = { ...form };
    if (payload.targetItemId === '') payload.targetItemId = null;
    if (!payload.targetItemId && !(payload.targetExternalIri || '').trim()) {
      setError('Sisesta kas Target item või Target external IRI');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (form.id) {
        await relation.update(form.id, payload);
      } else {
        await relation.create(payload);
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
      await relation.delete(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const itemTitle = (id) => (id && items.find((i) => i.id === id)?.title) || id;
  const targetDisplay = (row) => row.targetItemId ? itemTitle(row.targetItemId) : (row.targetExternalIri || '—');

  return (
    <AppShell currentNav="curriculums">
      <PageContainer>
        <section className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80">
          <h1>Curriculum item relations</h1>
          <div style={{ marginBottom: 16 }}>
            <label>Curriculum </label>
            <select value={curriculumId} onChange={(e) => { setCurriculumId(e.target.value); setVersionId(''); }}>
              <option value="">-- vali --</option>
              {curriculums.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <label style={{ marginLeft: 16 }}>Version </label>
            <select value={versionId} onChange={(e) => setVersionId(e.target.value)}>
              <option value="">-- vali --</option>
              {versions.map((v) => <option key={v.id} value={v.id}>v{v.versionNumber}</option>)}
            </select>
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button
            onClick={openCreate}
            style={{ marginBottom: 16 }}
            disabled={!versionId || items.length < 1 || versionClosed}
          >
            Add relation
          </button>
          {loading && <p>Loading...</p>}
          <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>Source</th>
                <th>Target</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  <td>{itemTitle(row.sourceItemId)}</td>
                  <td>{targetDisplay(row)}</td>
                  <td>{row.type}</td>
                  <td>
                    <button onClick={() => openEdit(row)} disabled={versionClosed}>Edit</button>
                    <button onClick={() => handleDelete(row.id)} disabled={versionClosed}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {form && (
            <form onSubmit={handleSubmit} style={{ marginTop: 24, maxWidth: 400 }}>
              <h2>{form.id ? 'Edit' : 'Create'}</h2>
              <div style={{ marginBottom: 8 }}>
                <label>Source item</label>
                <select value={form.sourceItemId} onChange={(e) => setForm({ ...form, sourceItemId: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }}>
                  {items.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Target item (või jäta tühjaks ja sisesta Target external IRI)</label>
                <select value={form.targetItemId ?? ''} onChange={(e) => setForm({ ...form, targetItemId: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }}>
                  <option value="">-- none (kasuta Target external IRI) --</option>
                  {items.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ padding: 6 }}>
                  {RELATION_TYPE.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Target external IRI</label>
                <input value={form.targetExternalIri || ''} onChange={(e) => setForm({ ...form, targetExternalIri: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
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
