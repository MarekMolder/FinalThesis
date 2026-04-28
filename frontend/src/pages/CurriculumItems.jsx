import { useState, useEffect } from 'react';
import { curriculumItem, curriculumVersion, curriculum } from '../api';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';

const TYPE = ['MODULE', 'TOPIC', 'LEARNING_OUTCOME', 'TASK', 'TEST', 'LEARNING_MATERIAL', 'KNOBIT'];
const SOURCE = ['TEACHER_CREATED', 'OPPEKAVAWEB'];
const FRAMEWORK = ['ESTONIAN_NATIONAL_CURRICULUM'];

export default function CurriculumItems() {
  const [curriculums, setCurriculums] = useState([]);
  const [versions, setVersions] = useState([]);
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

  function load() {
    if (!versionId) { setList([]); return; }
    setLoading(true);
    curriculumItem.list(versionId).then(setList).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, [versionId]);

  function openCreate() {
    if (!versionId) { setError('Vali versioon'); return; }
    if (versionClosed) { setError('CLOSED versioonis itemeid luua ei saa'); return; }
    setForm({
      curriculumVersionId: versionId,
      parentItemId: null,
      type: 'TOPIC',
      title: '',
      description: '',
      orderIndex: 0,
      sourceType: 'TEACHER_CREATED',
      educationLevelIri: '',
      schoolLevel: '',
      grade: '',
      educationalFramework: 'ESTONIAN_NATIONAL_CURRICULUM',
      notation: '',
      verbIri: '',
      isMandatory: false,
    });
  }
  async function openEdit(row) {
    setError('');
    try {
      const full = await curriculumItem.get(row.id);
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
    setSaving(true);
    setError('');
    try {
      if (form.id) {
        await curriculumItem.update(form.id, form);
      } else {
        await curriculumItem.create(form);
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
      await curriculumItem.delete(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell currentNav="curriculums">
      <PageContainer>
        <section className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80">
          <h1>Curriculum items</h1>
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
          <button onClick={openCreate} style={{ marginBottom: 16 }} disabled={!versionId || versionClosed}>Add item</button>
          {loading && <p>Loading...</p>}
          <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Type</th>
                <th>Title</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  <td>{row.orderIndex}</td>
                  <td>{row.type}</td>
                  <td>{row.title}</td>
                  <td>
                    <button
                      onClick={() => openEdit(row)}
                      disabled={versionClosed || row.sourceType === 'OPPEKAVAWEB'}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      disabled={versionClosed || row.sourceType === 'OPPEKAVAWEB'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {form && (
            <form onSubmit={handleSubmit} style={{ marginTop: 24, maxWidth: 500 }}>
              <h2>{form.id ? 'Edit' : 'Create'}</h2>
              <div style={{ marginBottom: 8 }}>
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ padding: 6 }}>
                  {TYPE.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Title</label>
                <input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required style={{ display: 'block', width: '100%', padding: 6 }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Description</label>
                <input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Order index</label>
                <input type="number" value={form.orderIndex ?? ''} onChange={(e) => setForm({ ...form, orderIndex: parseInt(e.target.value, 10) || 0 })} style={{ display: 'block', width: '100%', padding: 6 }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Source type</label>
                <select value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} style={{ padding: 6 }}>
                  {SOURCE.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Education level IRI</label>
                <input value={form.educationLevelIri || ''} onChange={(e) => setForm({ ...form, educationLevelIri: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
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
                <select value={form.educationalFramework} onChange={(e) => setForm({ ...form, educationalFramework: e.target.value })} style={{ padding: 6 }}>
                  {FRAMEWORK.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Notation</label>
                <input value={form.notation || ''} onChange={(e) => setForm({ ...form, notation: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Verb IRI</label>
                <input value={form.verbIri || ''} onChange={(e) => setForm({ ...form, verbIri: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Mandatory</label>
                <input type="checkbox" checked={!!form.isMandatory} onChange={(e) => setForm({ ...form, isMandatory: e.target.checked })} />
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
