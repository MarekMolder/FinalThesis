import React, { useEffect, useMemo, useState } from 'react';
import { curriculum, curriculumVersion, graphCatalog } from '../../../api';

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
};

export default function MetadataStep({ onDone, initialMetadata, existingCurriculumId, existingVersionId }) {
  const [form, setForm] = useState(() => {
    if (initialMetadata && Object.keys(initialMetadata).length > 0) {
      return { ...EMPTY_FORM, ...initialMetadata };
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
        });
        verIdFinal = version.id;
      } else {
        await curriculum.update(curId, {
          title: form.title,
          description: form.description || '',
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

      if (fetchedCatalog && verIdFinal) {
        await curriculumVersion.update(verIdFinal, {
          retrievedCatalogJson: JSON.stringify(fetchedCatalog),
        });
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
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Uus õppekava — Metaandmed</h2>
        <p className="mt-1 text-sm text-slate-500">
          Vali väljad oppekava.edu.ee andmete põhjal või sisesta käsitsi.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}

      {taxonomyLoading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 animate-pulse">
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

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
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
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="relative">
        <input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          required={required}
          className={['w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/30', showGraphLink ? 'pr-14' : 'pr-8'].join(' ')}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {showGraphLink && (
            <a
              href={graphPageUrl(value)}
              target="_blank"
              rel="noopener noreferrer"
              title="Ava oppekava.edu.ee lehel"
              className="rounded p-0.5 text-sky-500 hover:bg-sky-50 hover:text-sky-700"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          )}
          {options.length > 0 && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => { setOpen(!open); inputRef.current?.focus(); }}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          )}
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {filtered.map((opt) => (
              <div
                key={opt}
                className={[
                  'flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-sky-50 transition-colors',
                  opt === value ? 'bg-sky-50 text-sky-700 font-medium' : 'text-slate-700',
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
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          className: 'w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/30',
        })
      )}
    </label>
  );
}

function Divider() {
  return <div className="my-4 h-px bg-slate-100" />;
}
