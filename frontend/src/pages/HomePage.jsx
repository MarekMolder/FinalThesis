import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { curriculum } from '../api';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('et-EE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function iriToLabel(iri) {
  if (!iri) return '';
  const s = String(iri);
  const last = s.split('#').pop()?.split('/').pop() ?? s;
  try {
    return decodeURIComponent(last).replace(/[_-]+/g, ' ');
  } catch {
    return last.replace(/[_-]+/g, ' ');
  }
}

function StatusPill({ status }) {
  const map = {
    ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800',
    DRAFT: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800',
    ARCHIVED: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', map[status] || 'bg-slate-100 text-slate-700 border-slate-200')}>
      {status || '—'}
    </span>
  );
}

function VisibilityPill({ visibility }) {
  const map = {
    PUBLIC: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-400 dark:border-sky-800',
    PRIVATE: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', map[visibility] || 'bg-slate-100 text-slate-700 border-slate-200')}>
      {visibility || '—'}
    </span>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [visibility, setVisibility] = useState('');
  const [provider, setProvider] = useState('');
  const [subjectAreaIri, setSubjectAreaIri] = useState('');
  const [subjectIri, setSubjectIri] = useState('');
  const [educationalLevelIri, setEducationalLevelIri] = useState('');
  const [schoolLevel, setSchoolLevel] = useState('');
  const [grade, setGrade] = useState('');
  const [educationalFramework, setEducationalFramework] = useState('');
  const [language, setLanguage] = useState('');
  const [volumeHoursMin, setVolumeHoursMin] = useState('');
  const [volumeHoursMax, setVolumeHoursMax] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    curriculum
      .list({ size: 200, sort: 'updatedAt,desc' })
      .then((rows) => {
        if (!ignore) setList(Array.isArray(rows) ? rows : []);
      })
      .catch((e) => {
        if (!ignore) setError(e.message || 'Viga õppekavade laadimisel');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const filterOptions = useMemo(() => {
    const pick = (fn) =>
      Array.from(
        new Set(
          list
            .map(fn)
            .filter((v) => v !== null && v !== undefined)
            .map((v) => String(v).trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, 'et'));

    return {
      providers: pick((c) => c.provider),
      subjectAreaIris: pick((c) => c.subjectAreaIri),
      subjectIris: pick((c) => c.subjectIri),
      educationalLevelIris: pick((c) => c.educationalLevelIri),
      schoolLevels: pick((c) => c.schoolLevel),
      grades: pick((c) => c.grade),
      educationalFrameworks: pick((c) => c.educationalFramework),
      languages: pick((c) => c.language),
      volumeHours: pick((c) => c.volumeHours).sort((a, b) => Number(a) - Number(b)),
    };
  }, [list]);

  const filtered = useMemo(() => {
    const query = (q || '').trim().toLowerCase();
    return list.filter((c) => {
      if (status && c.status !== status) return false;
      if (visibility && c.visibility !== visibility) return false;
      if (provider && String(c.provider || '') !== provider) return false;
      if (subjectAreaIri && String(c.subjectAreaIri || '') !== subjectAreaIri) return false;
      if (subjectIri && String(c.subjectIri || '') !== subjectIri) return false;
      if (educationalLevelIri && String(c.educationalLevelIri || '') !== educationalLevelIri) return false;
      if (schoolLevel && String(c.schoolLevel || '') !== schoolLevel) return false;
      if (grade && String(c.grade || '') !== String(grade)) return false;
      if (educationalFramework && String(c.educationalFramework || '') !== educationalFramework) return false;
      if (language && String(c.language || '') !== language) return false;
      const vh = c.volumeHours ?? null;
      if (volumeHoursMin !== '' && vh !== null && Number(vh) < Number(volumeHoursMin)) return false;
      if (volumeHoursMax !== '' && vh !== null && Number(vh) > Number(volumeHoursMax)) return false;
      if (!query) return true;
      return (
        String(c.title || '').toLowerCase().includes(query) ||
        String(c.description || '').toLowerCase().includes(query) ||
        String(c.provider || '').toLowerCase().includes(query) ||
        String(c.audience || '').toLowerCase().includes(query) ||
        String(c.identifier || '').toLowerCase().includes(query)
      );
    });
  }, [
    list,
    q,
    status,
    visibility,
    provider,
    subjectAreaIri,
    subjectIri,
    educationalLevelIri,
    schoolLevel,
    grade,
    educationalFramework,
    language,
    volumeHoursMin,
    volumeHoursMax,
  ]);

  return (
    <AppShell currentNav="home">
      <PageContainer>
        <section className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80">
          {/* Title + search + new-curriculum button */}
          <div className="mb-4 flex flex-col items-start gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Minu töökavad</h1>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Halda ja ava oma õppekavasid</div>
            </div>
            <div className="flex w-full max-w-[520px] items-center gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Otsi pealkirja, kirjeldust, providerit…"
                className="h-11 w-full rounded-2xl border border-white/70 bg-white/70 px-4 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 transition duration-200 focus:border-sky-200 focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <button
                className="shrink-0 flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                onClick={() => navigate('/curriculum/new')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">Loo uus</span>
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="mb-4 rounded-2xl border border-white/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[120px] flex-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Staatus</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-sm text-slate-800 outline-none focus:border-sky-200 focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="">Kõik</option>
                  <option value="ACTIVE">Aktiivne</option>
                  <option value="DRAFT">Mustand</option>
                  <option value="ARCHIVED">Arhiveeritud</option>
                </select>
              </div>
              <div className="min-w-[120px] flex-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Nähtavus</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-sm text-slate-800 outline-none focus:border-sky-200 focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="">Kõik</option>
                  <option value="PRIVATE">Privaatne</option>
                  <option value="PUBLIC">Avalik</option>
                </select>
              </div>
              <div className="min-w-[120px] flex-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-sm text-slate-800 outline-none focus:border-sky-200 focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="">Kõik</option>
                  {filterOptions.providers.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[100px] flex-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Klass</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-sm text-slate-800 outline-none focus:border-sky-200 focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="">Kõik</option>
                  {filterOptions.grades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="flex shrink-0 items-end gap-2 self-end">
                <button
                  type="button"
                  className="h-10 rounded-xl border border-white/70 bg-white/70 px-3 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  onClick={() => setFiltersOpen((v) => !v)}
                >
                  {filtersOpen ? 'Vähem filtreid' : 'Rohkem filtreid'}
                </button>
                <button
                  type="button"
                  className="h-10 rounded-xl border border-white/70 bg-white/70 px-3 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  onClick={() => {
                    setStatus('');
                    setVisibility('');
                    setProvider('');
                    setSubjectAreaIri('');
                    setSubjectIri('');
                    setEducationalLevelIri('');
                    setSchoolLevel('');
                    setGrade('');
                    setEducationalFramework('');
                    setLanguage('');
                    setVolumeHoursMin('');
                    setVolumeHoursMax('');
                    setQ('');
                  }}
                >
                  Puhasta
                </button>
              </div>
            </div>

            {filtersOpen && (
              <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-white/60 bg-white/50 p-3 sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Subject area</label>
                  <select
                    value={subjectAreaIri}
                    onChange={(e) => setSubjectAreaIri(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-sm text-slate-800 outline-none focus:border-sky-200 focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">Kõik</option>
                    {filterOptions.subjectAreaIris.map((v) => (
                      <option key={v} value={v}>{iriToLabel(v)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Subject</label>
                  <select
                    value={subjectIri}
                    onChange={(e) => setSubjectIri(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-sm text-slate-800 outline-none focus:border-sky-200 focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">Kõik</option>
                    {filterOptions.subjectIris.map((v) => (
                      <option key={v} value={v}>{iriToLabel(v)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Educational level</label>
                  <select
                    value={educationalLevelIri}
                    onChange={(e) => setEducationalLevelIri(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-sm text-slate-800 outline-none focus:border-sky-200 focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">Kõik</option>
                    {filterOptions.educationalLevelIris.map((v) => (
                      <option key={v} value={v}>{iriToLabel(v)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">School level</label>
                  <select
                    value={schoolLevel}
                    onChange={(e) => setSchoolLevel(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-sm text-slate-800 outline-none focus:border-sky-200 focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">Kõik</option>
                    {filterOptions.schoolLevels.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Educational framework</label>
                  <select
                    value={educationalFramework}
                    onChange={(e) => setEducationalFramework(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-sm text-slate-800 outline-none focus:border-sky-200 focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">Kõik</option>
                    {filterOptions.educationalFrameworks.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Keel</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-sm text-slate-800 outline-none focus:border-sky-200 focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">Kõik</option>
                    {filterOptions.languages.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Maht (tundi)</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <input
                      value={volumeHoursMin}
                      onChange={(e) => setVolumeHoursMin(e.target.value)}
                      inputMode="numeric"
                      placeholder="Min"
                      className="h-10 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-200 focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    />
                    <input
                      value={volumeHoursMax}
                      onChange={(e) => setVolumeHoursMax(e.target.value)}
                      inputMode="numeric"
                      placeholder="Max"
                      className="h-10 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-200 focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                  {filterOptions.volumeHours.length > 0 && (
                    <div className="mt-1 text-[11px] text-slate-500">
                      Näited: {filterOptions.volumeHours.slice(0, 6).join(', ')}
                      {filterOptions.volumeHours.length > 6 ? '…' : ''}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 3xl:grid-cols-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-3xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              }
              title="Õppekavasid ei leitud"
              description="Proovi muuta otsisõna või loo uus õppekava."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 3xl:grid-cols-3">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-3 rounded-3xl border border-white/70 bg-white/70 px-5 py-4 shadow-sm transition duration-200 hover:bg-white/85 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{c.title}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusPill status={c.status} />
                        <VisibilityPill visibility={c.visibility} />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => navigate(`/curriculum/${c.id}`)}
                        className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition duration-200 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                      >
                        Ava
                      </button>
                      {!c.externalGraph && (
                        <button
                          className="rounded-xl border border-rose-200 bg-rose-50/90 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition duration-200 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
                          onClick={() => {
                            if (!window.confirm('Kas oled kindel, et soovid selle õppekava kustutada?')) return;
                            curriculum.delete(c.id)
                              .then(() => setList((prev) => prev.filter((x) => x.id !== c.id)))
                              .catch((e) => alert(e.message || 'Kustutamine ebaõnnestus'));
                          }}
                        >
                          Kustuta
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div><span className="text-slate-500">Loodud:</span> {formatDateTime(c.createdAt)}</div>
                    <div><span className="text-slate-500">Muudetud:</span> {formatDateTime(c.updatedAt)}</div>
                    {c.grade && (
                      <div><span className="text-slate-500">Klass:</span> {c.grade}</div>
                    )}
                    {c.provider && (
                      <div className="truncate"><span className="text-slate-500">Provider:</span> {c.provider}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </PageContainer>
    </AppShell>
  );
}
