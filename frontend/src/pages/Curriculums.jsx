import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { curriculum, graph } from '../api';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';

const ENUMS = {
  status: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
  visibility: ['PRIVATE', 'PUBLIC'],
  educationalFramework: ['ESTONIAN_NATIONAL_CURRICULUM'],
};

const TABS = [
  { id: 'mine', label: 'Minu õppekavad', description: 'Oma loodud õppekavad' },
  { id: 'system', label: 'Süsteemi õppekavad', description: 'Avalikud teiste õppekavad' },
  { id: 'external', label: 'Graafilt pärit', description: 'oppekava.edu.ee graafist imporditud' },
];

function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

export default function Curriculums() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [systemList, setSystemList] = useState([]);
  const [externalList, setExternalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('mine');

  const userCurriculums = list.filter((c) => !c.externalGraph);
  /** Graafilt pärit = DB-s olevad imporditud õppekavad (externalGraph=true) */
  const currentList =
    activeTab === 'mine' ? userCurriculums : activeTab === 'system' ? systemList : externalList;
  const showActions = activeTab === 'mine';
  const isGraphTab = activeTab === 'external';

  function load() {
    setLoading(true);
    setError('');
    Promise.all([
      curriculum.list().then(setList),
      curriculum.systemList().then(setSystemList),
      curriculum.listExternal({ size: 200 }).then(setExternalList).catch(() => setExternalList([])),
    ]).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function syncFromGraph() {
    setSyncing(true);
    setError('');
    try {
      await graph.sync();
      await curriculum.listExternal({ size: 200 }).then(setExternalList);
    } catch (e) {
      setError(e.message || 'Sünkroonimine ebaõnnestus');
    } finally {
      setSyncing(false);
    }
  }

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
    if (row?.externalGraph) {
      setError('Graafilt pärit õppekavat ei saa muuta');
      return;
    }
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
        const payload = { ...form };
        delete payload.externalGraph;
        await curriculum.update(form.id, payload);
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
    if (!confirm('Kustutan õppekava?')) return;
    setError('');
    try {
      await curriculum.delete(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell currentNav="curriculums">
      <PageContainer>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80">
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Õppekavad</h1>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Halda oma õppekavasid ja vaata süsteemi ning graafi õppekavasid.</div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* 3 kaardi vahetus */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded-2xl border px-5 py-4 text-left shadow-sm transition',
                  activeTab === tab.id
                    ? 'border-sky-300 bg-sky-50 ring-2 ring-sky-400/50 dark:border-sky-700 dark:bg-sky-900/30 dark:ring-sky-600/40'
                    : 'border-white/70 bg-white/70 hover:border-slate-200 hover:bg-white dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-600 dark:hover:bg-slate-700'
                )}
              >
                <div className={cn('font-semibold', activeTab === tab.id ? 'text-sky-800 dark:text-sky-400' : 'text-slate-800 dark:text-slate-200')}>
                  {tab.label}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tab.description}</div>
              </button>
            ))}
          </div>

          {activeTab === 'mine' && (
            <div className="mb-4">
              <button
                onClick={() => navigate('/curriculum/new')}
                className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
              >
                Loo uus õppekava
              </button>
            </div>
          )}

          {activeTab === 'external' && (
            <div className="mb-4">
              <button
                onClick={syncFromGraph}
                disabled={syncing}
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {syncing ? 'Sünkroonin…' : 'Impordi graafist'}
              </button>
              <span className="ml-3 text-sm text-slate-600 dark:text-slate-400">
                Impordib oppekava.edu.ee graafist puuduvad õppekavad andmebaasi (juba olemasolevaid ei dubleerita).
              </span>
            </div>
          )}

          <div className="rounded-2xl border border-white/70 bg-white/70 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
            {loading ? (
              <div className="px-5 py-12 text-center text-sm text-slate-600 dark:text-slate-400">Laen…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
        <thead>
                    <tr className="border-b border-white/70 bg-white/50 dark:border-slate-700 dark:bg-slate-800/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Pealkiri</th>
                      {!isGraphTab && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Tüüp</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Staatus</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Nähtavus</th>
                        </>
                      )}
                      {isGraphTab && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Identifikaator</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Provider</th>
                        </>
                      )}
                      {(showActions || isGraphTab) && (
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                          {isGraphTab ? 'Link' : 'Tegevused'}
                        </th>
                      )}
          </tr>
        </thead>
        <tbody>
                    {isGraphTab
                      ? currentList.map((row) => (
                          <tr key={row.id} className="border-b border-white/50 hover:bg-white/50 dark:border-slate-700 dark:hover:bg-slate-700/50">
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{row.title}</td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{row.identifier ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{row.provider ?? '—'}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <Link
                                  to={`/curriculum/${row.id}`}
                                  className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 shadow-sm hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
                                >
                                  Ava detailne vaade
                                </Link>
                                {row.externalPageIri && (
                                  <a
                                    href={row.externalPageIri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-xl border border-white/70 bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                  >
                                    Vaata graafis
                                  </a>
                                )}
                              </div>
              </td>
            </tr>
                        ))
                      : currentList.map((row) => (
                          <tr key={row.id} className="border-b border-white/50 hover:bg-white/50 dark:border-slate-700 dark:hover:bg-slate-700/50">
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{row.title}</td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{row.curriculumType}</td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{row.status}</td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{row.visibility}</td>
                            {showActions && (
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/curriculum/${row.id}`)}
                                  className="mr-2 rounded-xl border border-white/70 bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                                >
                                  Vaata
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(row.id)}
                                  className="rounded-xl border border-rose-200 bg-white/70 px-3 py-1.5 text-sm font-medium text-rose-700 shadow-sm hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-700 dark:text-rose-400 dark:hover:bg-rose-900/30"
                                >
                                  Kustuta
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                    {currentList.length === 0 && (
                      <tr>
                        <td
                          colSpan={isGraphTab ? 4 : showActions ? 5 : 4}
                          className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                        >
                          {activeTab === 'mine' && 'Sul pole veel õppekavasid. Loo uus ülaloleva nupuga.'}
                          {activeTab === 'system' && 'Süsteemi avalikke õppekavasid ei leitud.'}
                          {activeTab === 'external' && 'Graafist imporditud õppekavasid ei ole. Kasuta nuppu „Impordi graafist" ülal.'}
                        </td>
                      </tr>
                    )}
        </tbody>
      </table>
              </div>
            )}
          </div>

          {/* Create/Edit vorm */}
          {form && (
            <form
              onSubmit={handleSubmit}
              className="mt-8 rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/70"
            >
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{form.id ? 'Muuda õppekavat' : 'Uus õppekava'}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Pealkiri</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Kirjeldus</label>
                <input
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tüüp</label>
                <input
                  value={form.curriculumType || ''}
                  onChange={(e) => setForm({ ...form, curriculumType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Staatus</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  {ENUMS.status.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
            </select>
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nähtavus</label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  {ENUMS.visibility.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
            </select>
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Provider</label>
                <input
                  value={form.provider || ''}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Sihtgrupp</label>
                <input
                  value={form.audience || ''}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Ainevaldkond IRI</label>
                <input
                  value={form.subjectAreaIri || ''}
                  onChange={(e) => setForm({ ...form, subjectAreaIri: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Aine IRI</label>
                <input
                  value={form.subjectIri || ''}
                  onChange={(e) => setForm({ ...form, subjectIri: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Haridusaste IRI</label>
                <input
                  value={form.educationalLevelIri || ''}
                  onChange={(e) => setForm({ ...form, educationalLevelIri: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Kooliaste</label>
                <input
                  value={form.schoolLevel || ''}
                  onChange={(e) => setForm({ ...form, schoolLevel: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Klass</label>
                <input
                  value={form.grade || ''}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Õppekava raamistik</label>
                <select
                  value={form.educationalFramework ?? ''}
                  onChange={(e) => setForm({ ...form, educationalFramework: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  {ENUMS.educationalFramework.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
            </select>
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Keel</label>
                <input
                  value={form.language || ''}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tunnid</label>
                <input
                  type="number"
                  value={form.volumeHours ?? ''}
                  onChange={(e) => setForm({ ...form, volumeHours: parseInt(e.target.value, 10) || 0 })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Väline allikas</label>
                <input
                  value={form.externalSource || ''}
                  onChange={(e) => setForm({ ...form, externalSource: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Välise lehe IRI</label>
                <input
                  value={form.externalPageIri ?? ''}
                  onChange={(e) => setForm({ ...form, externalPageIri: e.target.value })}
                  placeholder="võib tühi"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
              >
                {saving ? 'Salvestan…' : 'Salvesta'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                Tühista
              </button>
          </div>
          </form>
          )}
        </section>

        {/* Right-panel content from the original grid's third column — preserved verbatim */}
        <aside className="rounded-3xl border border-white/60 bg-white/55 p-5 shadow-sm backdrop-blur-md xl:self-start dark:border-slate-700 dark:bg-slate-800/80">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            onClick={() => navigate('/curriculum/new')}
          >
            <span>Loo uus õppekava</span>
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </button>

          <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Vaated</div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Vali ülal üks kolmest kaardist: minu õppekavad, süsteemi avalikud või graafilt imporditud.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Juhised töökava loomiseks</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                Vali alusmall ja sisestage töökava põhiandmed
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                Lisage õpiväljundid, teemad, ülesanded, õppematerjalid
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                Kontrollige koosklõla ja jagage töökava
              </li>
            </ul>
            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-sky-400 dark:hover:bg-slate-600"
              onClick={() => navigate('/guide')}
            >
              Vaata juhendit
            </button>
          </div>
        </aside>
        </div>
      </PageContainer>
    </AppShell>
  );
}
