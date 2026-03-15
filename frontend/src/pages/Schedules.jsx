import { useState, useEffect } from 'react';
import { schedule, curriculumItem, curriculumVersion, curriculum } from '../api';

const STATUS = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function toLocalDateTime(d) {
  if (!d) return '';
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  const h = String(x.getHours()).padStart(2, '0');
  const min = String(x.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default function Schedules() {
  const [curriculums, setCurriculums] = useState([]);
  const [versions, setVersions] = useState([]);
  const [items, setItems] = useState([]);
  const [list, setList] = useState([]);
  const [curriculumId, setCurriculumId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [itemId, setItemId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    curriculum.list().then(setCurriculums).catch(() => {});
  }, []);
  useEffect(() => {
    if (!curriculumId) { setVersions([]); setVersionId(''); setItems([]); setItemId(''); return; }
    curriculumVersion.list(curriculumId).then(setVersions).catch(() => {});
  }, [curriculumId]);
  useEffect(() => {
    if (!versionId) { setItems([]); setItemId(''); return; }
    curriculumItem.list(versionId).then(setItems).catch(() => {});
  }, [versionId]);

  function load() {
    if (!itemId) { setList([]); return; }
    setLoading(true);
    schedule.list(itemId).then(setList).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, [itemId]);

  function openCreate() {
    if (!itemId) { setError('Vali item'); return; }
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    setForm({
      curriculumItemId: itemId,
      plannedStartAt: toLocalDateTime(now),
      plannedEndAt: toLocalDateTime(end),
      plannedMinutes: 60,
      actualStartAt: null,
      actualEndAt: null,
      actualMinutes: null,
      status: 'PLANNED',
      scheduleNotes: '',
    });
  }
  function openEdit(row) {
    setForm({
      ...row,
      plannedStartAt: toLocalDateTime(row.plannedStartAt),
      plannedEndAt: toLocalDateTime(row.plannedEndAt),
      actualStartAt: toLocalDateTime(row.actualStartAt),
      actualEndAt: toLocalDateTime(row.actualEndAt),
    });
  }
  function closeForm() {
    setForm(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form) return;
    const payload = { ...form };
    ['plannedStartAt', 'plannedEndAt', 'actualStartAt', 'actualEndAt'].forEach((k) => {
      if (payload[k]) payload[k] = new Date(payload[k]).toISOString();
      else if (payload[k] === '') payload[k] = null;
    });
    setSaving(true);
    setError('');
    try {
      if (form.id) {
        await schedule.update(form.id, payload);
      } else {
        await schedule.create(payload);
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
      await schedule.delete(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Curriculum item schedules</h1>
      <div style={{ marginBottom: 16 }}>
        <label>Curriculum </label>
        <select value={curriculumId} onChange={(e) => { setCurriculumId(e.target.value); setVersionId(''); setItemId(''); }}>
          <option value="">-- vali --</option>
          {curriculums.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <label style={{ marginLeft: 8 }}>Version </label>
        <select value={versionId} onChange={(e) => { setVersionId(e.target.value); setItemId(''); }}>
          <option value="">-- vali --</option>
          {versions.map((v) => <option key={v.id} value={v.id}>v{v.versionNumber}</option>)}
        </select>
        <label style={{ marginLeft: 8 }}>Item </label>
        <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <option value="">-- vali --</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
        </select>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={openCreate} style={{ marginBottom: 16 }} disabled={!itemId}>Add schedule</button>
      {loading && <p>Loading...</p>}
      <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Planned start</th>
            <th>Planned end</th>
            <th>Minutes</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((row) => (
            <tr key={row.id}>
              <td>{row.plannedStartAt ? new Date(row.plannedStartAt).toLocaleString() : '-'}</td>
              <td>{row.plannedEndAt ? new Date(row.plannedEndAt).toLocaleString() : '-'}</td>
              <td>{row.plannedMinutes}</td>
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
            <label>Planned start</label>
            <input type="datetime-local" value={form.plannedStartAt || ''} onChange={(e) => setForm({ ...form, plannedStartAt: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Planned end</label>
            <input type="datetime-local" value={form.plannedEndAt || ''} onChange={(e) => setForm({ ...form, plannedEndAt: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Planned minutes</label>
            <input type="number" value={form.plannedMinutes ?? ''} onChange={(e) => setForm({ ...form, plannedMinutes: parseInt(e.target.value, 10) || 0 })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ padding: 6 }}>
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Notes</label>
            <input value={form.scheduleNotes || ''} onChange={(e) => setForm({ ...form, scheduleNotes: e.target.value })} style={{ display: 'block', width: '100%', padding: 6 }} />
          </div>
          <button type="submit" disabled={saving}>{saving ? '...' : 'Save'}</button>
          <button type="button" onClick={closeForm}>Cancel</button>
        </form>
      )}
    </div>
  );
}
