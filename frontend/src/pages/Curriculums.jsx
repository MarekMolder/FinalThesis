import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { curriculum, getCurrentUser, graph, logout as apiLogout } from '../api';
import bgImg from '../assets/background.png';
import logoImg from '../assets/logo.png';

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

function SidebarItem({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={cn(
        'flex w-full items-center rounded-2xl text-sm font-medium transition',
        'justify-center px-2 py-2.5 group-hover:justify-start group-hover:gap-3 group-hover:px-3',
        active ? 'bg-sky-600/90 text-white shadow-sm' : 'text-slate-700 hover:bg-white/55'
      )}
    >
      <span
        className={cn(
          'grid h-12 w-12 place-items-center rounded-2xl text-slate-700',
          active && 'text-white'
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          'truncate transition-all duration-200',
          'w-0 opacity-0 group-hover:w-auto group-hover:opacity-100'
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export default function Curriculums() {
  const navigate = useNavigate();
  const user = getCurrentUser();
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

  function logout() {
    apiLogout();
  }

  return (
    <div className="min-h-full">
      {/* Taust – sama mis HomePage */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImg})` }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 -z-10 bg-white/55" aria-hidden="true" />

      {/* Header – sama mis HomePage */}
      <header className="sticky top-0 z-20 border-b border-white/35 bg-white/35 shadow-[0_12px_36px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-6 py-2">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex shrink-0 items-center rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-sky-400"
              title="Avaleht"
            >
              <img src={logoImg} alt="" className="h-16 w-22 object-contain" />
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/55 bg-white/55 text-slate-700 shadow-sm"
              type="button"
              title="Kasutaja"
              onClick={() => {}}
            >
              <span className="text-sm font-semibold">{(user?.email || 'U').slice(0, 1).toUpperCase()}</span>
            </button>
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-slate-900">{user?.label || 'Õpetaja'}</div>
              <div className="text-xs text-slate-600">{user?.email || '—'}</div>
            </div>
            <button
              onClick={logout}
              className="rounded-xl border border-white/55 bg-white/55 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white/70"
            >
              Logi välja
            </button>
          </div>
        </div>
      </header>

      {/* Sama grid: sidebar | main | parem paneel */}
      <div className="mx-auto grid max-w-[1400px] grid-cols-[auto_1fr_auto] gap-6 px-2 py-6">
        {/* Vasak külgriba – sama mis HomePage, siin aktiivne on Õppekavad */}
        <aside
          className={cn(
            'group relative -ml-8 h-[calc(100vh-120px)] w-[68px] rounded-3xl border border-white/60 bg-white/55 p-3 shadow-sm backdrop-blur-md transition-[width] duration-200 hover:w-[260px]'
          )}
        >
          <div className="flex flex-col gap-2">
            <SidebarItem
              to="/"
              label="Minu õppekavad"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              }
            />
            <SidebarItem
              to="/curriculums"
              label="Õppekavad"
              active
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M7 4h10a2 2 0 0 1 2 2v14l-5-3-5 3-5-3V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              }
            />
            <SidebarItem
              to="/sample"
              label="Näidisõppekava"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 10h8M8 13h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              }
            />
            <SidebarItem
              to="/settings"
              label="Seaded"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M19.4 15a8.7 8.7 0 0 0 .1-1 8.7 8.7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.9 7.9 0 0 0-1.7-1l-.3-2.6H11l-.3 2.6a7.9 7.9 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a8.7 8.7 0 0 0-.1 1 8.7 8.7 0 0 0 .1 1l-2 1.6 2 3.4 2.4-1a7.9 7.9 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.9 7.9 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />
          </div>
        </aside>

        {/* Põhisisu – väike erinevus: 3 kaarti + tabel */}
        <main className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md">
          <div className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Õppekavad</h1>
            <div className="mt-1 text-sm text-slate-600">Halda oma õppekavasid ja vaata süsteemi ning graafi õppekavasid.</div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
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
                    ? 'border-sky-300 bg-sky-50 ring-2 ring-sky-400/50'
                    : 'border-white/70 bg-white/70 hover:border-slate-200 hover:bg-white'
                )}
              >
                <div className={cn('font-semibold', activeTab === tab.id ? 'text-sky-800' : 'text-slate-800')}>
                  {tab.label}
                </div>
                <div className="mt-1 text-xs text-slate-500">{tab.description}</div>
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
              <span className="ml-3 text-sm text-slate-600">
                Impordib oppekava.edu.ee graafist puuduvad õppekavad andmebaasi (juba olemasolevaid ei dubleerita).
              </span>
            </div>
          )}

          <div className="rounded-2xl border border-white/70 bg-white/70 shadow-sm">
            {loading ? (
              <div className="px-5 py-12 text-center text-sm text-slate-600">Laen…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
        <thead>
                    <tr className="border-b border-white/70 bg-white/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Pealkiri</th>
                      {!isGraphTab && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Tüüp</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Staatus</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Nähtavus</th>
                        </>
                      )}
                      {isGraphTab && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Identifikaator</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Provider</th>
                        </>
                      )}
                      {(showActions || isGraphTab) && (
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600">
                          {isGraphTab ? 'Link' : 'Tegevused'}
                        </th>
                      )}
          </tr>
        </thead>
        <tbody>
                    {isGraphTab
                      ? currentList.map((row) => (
                          <tr key={row.id} className="border-b border-white/50 hover:bg-white/50">
                            <td className="px-4 py-3 font-medium text-slate-900">{row.title}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{row.identifier ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{row.provider ?? '—'}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <Link
                                  to={`/curriculum/${row.id}`}
                                  className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 shadow-sm hover:bg-sky-100"
                                >
                                  Ava detailne vaade
                                </Link>
                                {row.externalPageIri && (
                                  <a
                                    href={row.externalPageIri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-xl border border-white/70 bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-white"
                                  >
                                    Vaata graafis
                                  </a>
                                )}
                              </div>
              </td>
            </tr>
                        ))
                      : currentList.map((row) => (
                          <tr key={row.id} className="border-b border-white/50 hover:bg-white/50">
                            <td className="px-4 py-3 font-medium text-slate-900">{row.title}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{row.curriculumType}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{row.status}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{row.visibility}</td>
                            {showActions && (
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/curriculum/${row.id}`)}
                                  className="mr-2 rounded-xl border border-white/70 bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-white"
                                >
                                  Vaata
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(row.id)}
                                  className="rounded-xl border border-rose-200 bg-white/70 px-3 py-1.5 text-sm font-medium text-rose-700 shadow-sm hover:bg-rose-50"
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
                          className="px-4 py-8 text-center text-sm text-slate-500"
                        >
                          {activeTab === 'mine' && 'Sul pole veel õppekavasid. Loo uus ülaloleva nupuga.'}
                          {activeTab === 'system' && 'Süsteemi avalikke õppekavasid ei leitud.'}
                          {activeTab === 'external' && 'Graafist imporditud õppekavasid ei ole. Kasuta nuppu „Impordi graafist“ ülal.'}
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
              className="mt-8 rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm"
            >
            <h2 className="mb-4 text-lg font-semibold text-slate-900">{form.id ? 'Muuda õppekavat' : 'Uus õppekava'}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Pealkiri</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Kirjeldus</label>
                <input
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tüüp</label>
                <input
                  value={form.curriculumType || ''}
                  onChange={(e) => setForm({ ...form, curriculumType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Staatus</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                >
                  {ENUMS.status.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
            </select>
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nähtavus</label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                >
                  {ENUMS.visibility.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
            </select>
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Provider</label>
                <input
                  value={form.provider || ''}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Sihtgrupp</label>
                <input
                  value={form.audience || ''}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ainevaldkond IRI</label>
                <input
                  value={form.subjectAreaIri || ''}
                  onChange={(e) => setForm({ ...form, subjectAreaIri: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Aine IRI</label>
                <input
                  value={form.subjectIri || ''}
                  onChange={(e) => setForm({ ...form, subjectIri: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Haridusaste IRI</label>
                <input
                  value={form.educationalLevelIri || ''}
                  onChange={(e) => setForm({ ...form, educationalLevelIri: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Kooliaste</label>
                <input
                  value={form.schoolLevel || ''}
                  onChange={(e) => setForm({ ...form, schoolLevel: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Klass</label>
                <input
                  value={form.grade || ''}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Õppekava raamistik</label>
                <select
                  value={form.educationalFramework ?? ''}
                  onChange={(e) => setForm({ ...form, educationalFramework: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                >
                  {ENUMS.educationalFramework.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
            </select>
          </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Keel</label>
                <input
                  value={form.language || ''}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tunnid</label>
                <input
                  type="number"
                  value={form.volumeHours ?? ''}
                  onChange={(e) => setForm({ ...form, volumeHours: parseInt(e.target.value, 10) || 0 })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Väline allikas</label>
                <input
                  value={form.externalSource || ''}
                  onChange={(e) => setForm({ ...form, externalSource: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Välise lehe IRI</label>
                <input
                  value={form.externalPageIri ?? ''}
                  onChange={(e) => setForm({ ...form, externalPageIri: e.target.value })}
                  placeholder="võib tühi"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
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
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tühista
              </button>
          </div>
          </form>
          )}
        </main>

        {/* Parem paneel – sama mis HomePage */}
        <aside className="h-[calc(100vh-120px)] w-[320px] overflow-auto rounded-3xl border border-white/60 bg-white/55 p-5 shadow-sm backdrop-blur-md">
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

          <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-4">
            <div className="text-sm font-semibold text-slate-900">Vaated</div>
            <p className="mt-2 text-xs text-slate-600">
              Vali ülal üks kolmest kaardist: minu õppekavad, süsteemi avalikud või graafilt imporditud.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-4">
            <div className="text-sm font-semibold text-slate-900">Juhised töökava loomiseks</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
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
              className="mt-4 w-full rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-white"
              onClick={() => navigate('/guide')}
            >
              Vaata juhendit
            </button>
          </div>
        </aside>
          </div>
    </div>
  );
}
