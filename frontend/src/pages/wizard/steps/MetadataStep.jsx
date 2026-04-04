import React, { useEffect, useMemo, useState } from 'react';
import { curriculum, curriculumVersion, graphCatalog } from '../../../api';
import { getDefaultBreaks } from '../../../utils/schoolWeeks';

const FRAMEWORKS = [{ value: 'ESTONIAN_NATIONAL_CURRICULUM', label: 'Estonian National Curriculum' }];
const LANGUAGES = [{ value: 'et', label: 'Eesti keel (ET)' }, { value: 'en', label: 'English (EN)' }];

const EMPTY_FORM = {
  title: '',
  description: '',
  subjectAreaIri: '',
  subjectIri: '',
  subjectLabel: '',
  educationalLevelIri: '',
  schoolLevel: '',
  grade: '',
  educationalFramework: 'ESTONIAN_NATIONAL_CURRICULUM',
  language: 'et',
  provider: '',
  volumeHours: '',
  audience: '',
  identifier: '',
  curriculumType: 'teacher_work_plan',
  schoolYearStartDate: '',
  schoolBreaks: [],
};

export default function MetadataStep({ onDone, initialMetadata, existingCurriculumId, existingVersionId }) {
  const [form, setForm] = useState(() => {
    if (initialMetadata && Object.keys(initialMetadata).length > 0) {
      const merged = { ...EMPTY_FORM, ...initialMetadata };
      if (typeof merged.schoolBreaks === 'string') {
        try { merged.schoolBreaks = JSON.parse(merged.schoolBreaks); } catch { merged.schoolBreaks = []; }
      }
      if (!Array.isArray(merged.schoolBreaks)) merged.schoolBreaks = [];
      return merged;
    }
    return { ...EMPTY_FORM };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [taxonomy, setTaxonomy] = useState(null);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    graphCatalog.taxonomy().then((data) => {
      if (!ignore) setTaxonomy(data);
    }).catch(() => {}).finally(() => {
      if (!ignore) setTaxonomyLoading(false);
    });
    return () => { ignore = true; };
  }, []);

  const options = useMemo(() => {
    if (!taxonomy) return { subjects: [], subjectAreas: [], educationLevels: [], schoolLevels: [], grades: [], providers: [], audiences: [], verbs: [] };
    return {
      subjects: taxonomy.subjects ?? [],
      subjectAreas: taxonomy.subjectAreas ?? [],
      educationLevels: taxonomy.educationLevels ?? [],
      schoolLevels: taxonomy.schoolLevels ?? [],
      grades: taxonomy.grades ?? [],
      providers: taxonomy.providers ?? [],
      audiences: taxonomy.audiences ?? [],
      verbs: taxonomy.verbs ?? [],
    };
  }, [taxonomy]);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let curId = existingCurriculumId;
      let verIdFinal = existingVersionId;

      if (!curId) {
        const created = await curriculum.create({
          title: form.title,
          description: form.description || '',
          curriculumType: form.curriculumType,
          status: 'DRAFT',
          visibility: 'PRIVATE',
          provider: form.provider || 'N/A',
          audience: form.audience || 'N/A',
          subjectAreaIri: form.subjectAreaIri,
          subjectIri: form.subjectIri,
          educationalLevelIri: form.educationalLevelIri,
          schoolLevel: form.schoolLevel,
          grade: form.grade,
          educationalFramework: form.educationalFramework,
          language: form.language,
          volumeHours: form.volumeHours ? Number(form.volumeHours) : 0,
          externalSource: 'oppekava.edu.ee',
          identifier: form.identifier || '',
        });
        curId = created.id;

        const version = await curriculumVersion.create({
          curriculumId: curId,
          versionNumber: 1,
          state: 'DRAFT',
          changeNote: '',
          contentJson: '{}',
          retrievalContextJson: JSON.stringify({ subject: form.subjectIri, grade: form.grade, schoolLevel: form.schoolLevel }),
          retrievedCatalogJson: '{}',
          complianceReportJson: '{}',
          status: 'NOT_PUBLISHED',
          publishedError: '',
          schoolYearStartDate: form.schoolYearStartDate || null,
          schoolBreaksJson: form.schoolBreaks.length > 0 ? JSON.stringify(form.schoolBreaks) : null,
        });
        verIdFinal = version.id;
      } else {
        await curriculum.update(curId, {
          title: form.title,
          description: form.description || '',
          curriculumType: form.curriculumType,
          provider: form.provider || 'N/A',
          audience: form.audience || 'N/A',
          subjectAreaIri: form.subjectAreaIri,
          subjectIri: form.subjectIri,
          educationalLevelIri: form.educationalLevelIri,
          schoolLevel: form.schoolLevel,
          grade: form.grade,
          educationalFramework: form.educationalFramework,
          language: form.language,
          volumeHours: form.volumeHours ? Number(form.volumeHours) : 0,
          identifier: form.identifier || '',
        });
      }

      let fetchedCatalog = null;
      if (form.subjectIri) {
        try {
          fetchedCatalog = await graphCatalog.itemsByMetadata(
            form.subjectIri,
            form.schoolLevel || undefined,
            form.subjectAreaIri || undefined,
            form.grade || undefined,
            form.educationalLevelIri || undefined,
          );
        } catch {
          // Graph unavailable
        }
      }

      if (verIdFinal) {
        const versionUpdate = { id: verIdFinal };
        if (fetchedCatalog) versionUpdate.retrievedCatalogJson = JSON.stringify(fetchedCatalog);
        versionUpdate.schoolYearStartDate = form.schoolYearStartDate || null;
        versionUpdate.schoolBreaksJson = form.schoolBreaks.length > 0 ? JSON.stringify(form.schoolBreaks) : null;
        await curriculumVersion.update(verIdFinal, versionUpdate);
      }

      onDone({
        curriculumId: curId,
        versionId: verIdFinal,
        metadata: form,
        catalogJson: fetchedCatalog,
      });
    } catch (err) {
      setError(err.message || 'Viga loomisel');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-3xl">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">Uus õppekava — Metaandmed</h2>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          Sisesta põhiandmed. Nende põhjal tehakse automaatne päring oppekava.edu.ee graafi.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 px-4 py-3 text-sm text-rose-800 dark:text-rose-300">{error}</div>
      )}

      {taxonomyLoading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 animate-pulse">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
          Laen oppekava.edu.ee taksonoomiat…
        </div>
      )}

      <FieldGroup label="Põhiandmed">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pealkiri *">
            <input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </Field>
          <Field label="Kirjeldus">
            <input value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
        </div>
      </FieldGroup>

      <Divider />

      <FieldGroup label="Õppeinfo">
        <div className="grid grid-cols-3 gap-3">
          <ComboField
            label="Õppeaine *"
            value={form.subjectIri}
            onChange={(v) => set('subjectIri', v)}
            options={options.subjects}
            placeholder="Keemia"
            required
            graphLinked
          />
          <Field label="Aine nimi (otsinguks)">
            <input value={form.subjectLabel} onChange={(e) => set('subjectLabel', e.target.value)} placeholder="Keemia" />
          </Field>
          <ComboField
            label="Ainevaldkond *"
            value={form.subjectAreaIri}
            onChange={(v) => set('subjectAreaIri', v)}
            options={options.subjectAreas}
            placeholder="Loodusained"
            required
            graphLinked
          />
          <ComboField
            label="Klass *"
            value={form.grade}
            onChange={(v) => set('grade', v)}
            options={options.grades}
            placeholder="9. klass"
            required
          />
          <ComboField
            label="Kooliaste *"
            value={form.schoolLevel}
            onChange={(v) => set('schoolLevel', v)}
            options={options.schoolLevels}
            placeholder="III kooliaste"
            required
          />
          <ComboField
            label="Haridusaste *"
            value={form.educationalLevelIri}
            onChange={(v) => set('educationalLevelIri', v)}
            options={options.educationLevels}
            placeholder="Põhiharidus"
            required
          />
        </div>
      </FieldGroup>

      <Divider />

      <FieldGroup label="Lisainfo">
        <div className="grid grid-cols-3 gap-3">
          <ComboField
            label="Õppeasutus"
            value={form.provider}
            onChange={(v) => set('provider', v)}
            options={options.providers}
            placeholder="Tallinna Polütehnikum"
          />
          <Field label="Maht (tunnid)">
            <input type="number" min="0" value={form.volumeHours} onChange={(e) => set('volumeHours', e.target.value)} />
          </Field>
          <Field label="Haridusraamistik">
            <select value={form.educationalFramework} onChange={(e) => set('educationalFramework', e.target.value)}>
              {FRAMEWORKS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </Field>
          <Field label="Keel">
            <select value={form.language} onChange={(e) => set('language', e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </Field>
          <ComboField
            label="Sihtrühm"
            value={form.audience}
            onChange={(v) => set('audience', v)}
            options={options.audiences}
            placeholder="Põhikooli õpilased"
          />
          <Field label="Identifikaator">
            <input value={form.identifier} onChange={(e) => set('identifier', e.target.value)} />
          </Field>
        </div>
      </FieldGroup>

      <Divider />

      <FieldGroup label="Õppeaasta ja vaheajad">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Õppeaasta algus">
            <input
              type="date"
              value={form.schoolYearStartDate}
              onChange={(e) => {
                const val = e.target.value;
                set('schoolYearStartDate', val);
                if (val && form.schoolBreaks.length === 0) {
                  const defaults = getDefaultBreaks(val);
                  if (defaults.length > 0) {
                    set('schoolBreaks', defaults);
                  }
                }
              }}
            />
          </Field>
        </div>

        {form.schoolYearStartDate && (
          <div className="mt-3 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Koolivaheajad</div>
            {form.schoolBreaks.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="date"
                  value={b.startDate}
                  onChange={(e) => {
                    const updated = [...form.schoolBreaks];
                    updated[i] = { ...updated[i], startDate: e.target.value };
                    set('schoolBreaks', updated);
                  }}
                  className="w-full rounded-xl border border-slate-200/90 dark:border-slate-600 bg-white/75 dark:bg-slate-700 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 outline-none shadow-[inset_0_1px_2px_rgba(15,23,42,.04)] focus:border-sky-400 focus:shadow-[0_0_0_3px_rgba(56,189,248,.15)]"
                />
                <span className="text-slate-400 dark:text-slate-500">{'\u2013'}</span>
                <input
                  type="date"
                  value={b.endDate}
                  onChange={(e) => {
                    const updated = [...form.schoolBreaks];
                    updated[i] = { ...updated[i], endDate: e.target.value };
                    set('schoolBreaks', updated);
                  }}
                  className="w-full rounded-xl border border-slate-200/90 dark:border-slate-600 bg-white/75 dark:bg-slate-700 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 outline-none shadow-[inset_0_1px_2px_rgba(15,23,42,.04)] focus:border-sky-400 focus:shadow-[0_0_0_3px_rgba(56,189,248,.15)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = form.schoolBreaks.filter((_, j) => j !== i);
                    set('schoolBreaks', updated);
                  }}
                  className="shrink-0 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 px-2 py-1.5 text-xs text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-red-900/40"
                >
                  Eemalda
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                set('schoolBreaks', [...form.schoolBreaks, { startDate: '', endDate: '' }]);
              }}
              className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-600"
            >
              + Lisa vaheaeg
            </button>
          </div>
        )}
      </FieldGroup>

      <div className="mt-6 flex justify-end gap-2.5">
        <button
          type="button"
          className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 px-4 py-[7px] text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-white/90 dark:hover:bg-slate-700/90"
        >
          Tühista
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-sky-600 px-5 py-[7px] text-xs font-semibold text-white shadow-[0_2px_6px_rgba(2,132,199,.25)] hover:brightness-105 disabled:opacity-60"
        >
          {loading ? 'Laen…' : 'Edasi — Struktuur →'}
        </button>
      </div>
    </form>
  );
}

function graphPageUrl(pageTitle) {
  return `https://oppekava.edu.ee/a/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;
}

function ComboField({ label, value, onChange, options, placeholder, required, graphLinked }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const inputRef = React.useRef(null);
  const wrapRef = React.useRef(null);

  const filtered = useMemo(() => {
    if (!filter) return options;
    const q = filter.toLowerCase();
    return options.filter((o) => String(o).toLowerCase().includes(q));
  }, [options, filter]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(e) {
    const v = e.target.value;
    setFilter(v);
    onChange(v);
    if (!open && v) setOpen(true);
  }

  function handleSelect(opt) {
    onChange(opt);
    setFilter('');
    setOpen(false);
  }

  const showGraphLink = graphLinked && value && options.includes(value);

  return (
    <div className="flex flex-col gap-1" ref={wrapRef}>
      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-[.03em]">{label}</span>
      <div className="relative">
        <input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          required={required}
          className={['w-full rounded-xl border border-slate-200/90 dark:border-slate-600 bg-white/75 dark:bg-slate-700 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 outline-none shadow-[inset_0_1px_2px_rgba(15,23,42,.04)] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-400 focus:shadow-[0_0_0_3px_rgba(56,189,248,.15)]', showGraphLink ? 'pr-14' : 'pr-8'].join(' ')}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {showGraphLink && (
            <a
              href={graphPageUrl(value)}
              target="_blank"
              rel="noopener noreferrer"
              title="Ava oppekava.edu.ee lehel"
              className="rounded p-0.5 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/40 hover:text-sky-700"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          )}
          {options.length > 0 && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => { setOpen(!open); inputRef.current?.focus(); }}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          )}
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
            {filtered.map((opt) => (
              <div
                key={opt}
                className={[
                  'flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-sky-50 dark:hover:bg-sky-900/40 transition-colors',
                  opt === value ? 'bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 font-medium' : 'text-slate-700 dark:text-slate-300',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className="truncate flex-1 text-left"
                >
                  {opt}
                </button>
                {graphLinked && (
                  <a
                    href={graphPageUrl(opt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Ava oppekava.edu.ee lehel"
                    className="flex-shrink-0 rounded p-0.5 text-sky-400 hover:text-sky-700"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div className="mb-4">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-[.07em] text-slate-400 dark:text-slate-500">{label}</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-[.03em]">{label}</span>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          className: 'w-full rounded-xl border border-slate-200/90 dark:border-slate-600 bg-white/75 dark:bg-slate-700 px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 outline-none shadow-[inset_0_1px_2px_rgba(15,23,42,.04)] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-400 focus:shadow-[0_0_0_3px_rgba(56,189,248,.15)]',
        })
      )}
    </label>
  );
}

function Divider() {
  return <div className="my-4 h-px bg-slate-200/50 dark:bg-slate-700/50" />;
}
