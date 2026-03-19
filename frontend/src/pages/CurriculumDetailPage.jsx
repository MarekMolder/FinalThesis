import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { curriculum, getCurrentUser, logout as apiLogout } from '../api';
import bgImg from '../assets/background.png';
import logoImg from '../assets/logo.png';

/** Fikseeritud päise kõrgus — sisu nihutamine ja sticky külgribad. */
const HEADER_PT_CLASS = 'pt-[4.5rem]';
const SIDEBAR_STICKY_TOP = 'top-[4.5rem]';
const SIDEBAR_MAX_H = 'max-h-[calc(100vh-4.5rem)]';

function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

/** Graafi vastus → ühtne struktuur (ilma EELDAB/KOOSNEB; need tulevad DB-st). */
function normalizeGraphToStructure(graph) {
  if (!graph) return null;
  return {
    curriculumVersionId: null,
    modules: (graph.modules || []).map((m, i) => ({
      id: m.fullUrl || m.title || `mod-${i}`,
      title: (m.schemaName && String(m.schemaName).trim()) || m.title || 'Moodul',
      wikiTitle: m.title,
      fullUrl: m.fullUrl,
      eapLabel: m.numberOfCredits != null ? `${m.numberOfCredits} EAP` : null,
      learningOutcomes: (m.learningOutcomes || []).map((lo, j) => ({
        id: lo.fullUrl || lo.title || `lo-${i}-${j}`,
        title: lo.title,
        fullUrl: lo.fullUrl,
        eeldab: [],
        koosneb: [],
      })),
    })),
    curriculumLevelLearningOutcomes: (graph.curriculumLevelLearningOutcomes || []).map((lo, j) => ({
      id: lo.fullUrl || lo.title || `clo-${j}`,
      title: lo.title,
      fullUrl: lo.fullUrl,
      eeldab: [],
      koosneb: [],
    })),
  };
}

function moduleTitleLine(mod) {
  return mod.title || 'Moodul';
}

function moduleEapLine(mod) {
  if (mod.eapLabel) return mod.eapLabel;
  if (mod.numberOfCredits != null) return `${mod.numberOfCredits} EAP`;
  return null;
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('et-EE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
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

function GraphExternalLink({ href, className, variant = 'default' }) {
  if (!href) return null;
  const variants = {
    default:
      'inline-flex shrink-0 items-center gap-1 rounded-lg border border-sky-200/80 bg-sky-50/90 px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100',
    /** Mooduli gradient-päisel: klaas, ilma hover-efektita. */
    glassOnGradient:
      'inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/30 bg-white/15 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-none backdrop-blur-md',
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Ava graafis"
      className={cn(variants[variant] || variants.default, className)}
    >
      Graafis
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden className="opacity-90">
        <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </a>
  );
}

/** RDF Haridus:eeldab / Haridus:koosneb → DB curriculum_item_relation (EELDAB / KOOSNEB). */
function LoSemanticRelations({ lo }) {
  const eeldab = Array.isArray(lo.eeldab) ? lo.eeldab : [];
  const koosneb = Array.isArray(lo.koosneb) ? lo.koosneb : [];
  if (eeldab.length === 0 && koosneb.length === 0) return null;

  function RefChip({ r }) {
    const href = r.fullUrl && /^https?:\/\//i.test(r.fullUrl) ? r.fullUrl : undefined;
    const label = r.title || 'Õpiväljund';
    if (href) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center rounded-lg border border-white/80 bg-white/90 px-2 py-0.5 text-[11px] font-medium text-amber-900 shadow-sm hover:bg-white"
          title={label}
        >
          <span className="truncate">{label}</span>
        </a>
      );
    }
    return (
      <span
        className="inline-flex max-w-full rounded-lg border border-amber-200/80 bg-amber-100/50 px-2 py-0.5 text-[11px] font-medium text-amber-900"
        title={label}
      >
        <span className="truncate">{label}</span>
      </span>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {eeldab.length > 0 && (
        <div className="rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50/95 to-orange-50/40 px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-amber-900">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-amber-200/80 text-amber-950" aria-hidden>
              →
            </span>
            Eeldab <span className="font-normal normal-case text-amber-800/80">(enne seda peaks valmis olema)</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {eeldab.map((r) => (
              <RefChip key={r.id || r.title} r={r} />
            ))}
          </div>
        </div>
      )}
      {koosneb.length > 0 && (
        <div className="rounded-xl border border-violet-200/90 bg-gradient-to-r from-violet-50/95 to-indigo-50/40 px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-violet-900">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-violet-200/80 text-violet-950" aria-hidden>
              ⧉
            </span>
            Koosneb <span className="font-normal normal-case text-violet-800/80">(osaüksused)</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {koosneb.map((r) => {
              const href = r.fullUrl && /^https?:\/\//i.test(r.fullUrl) ? r.fullUrl : null;
              const label = r.title || 'Õpiväljund';
              return href ? (
                <a
                  key={r.id || r.title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center rounded-lg border border-white/80 bg-white/90 px-2 py-0.5 text-[11px] font-medium text-violet-900 shadow-sm hover:bg-white"
                  title={label}
                >
                  <span className="truncate">{label}</span>
                </a>
              ) : (
                <span
                  key={r.id || r.title}
                  className="inline-flex max-w-full rounded-lg border border-violet-200/80 bg-violet-100/40 px-2 py-0.5 text-[11px] font-medium text-violet-900"
                  title={label}
                >
                  <span className="truncate">{label}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Visuaalne „3. tase“ — selgitab hierarhiat (andmed tulevad versioonist / elementidest). */
function HierarchyLeafPlaceholder() {
  return (
    <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-dashed border-amber-200/90 bg-gradient-to-br from-amber-50/60 via-white to-slate-50/40 px-3 py-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800 shadow-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 7h16M4 12h10M4 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wide text-amber-800/90">3. tase — alamelemendid</div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
          Ülesanded, testid, õppematerjalid ja knobitid on hierarhias selle õpiväljundi all. Täpsema puu näed{' '}
          <span className="font-semibold text-slate-700">õppekava versioonide</span> ja{' '}
          <span className="font-semibold text-slate-700">elementide</span> lehel pärast importi.
        </p>
      </div>
    </div>
  );
}

/** Õpiväljundite vertikaalne „puu“ (katkendlik joon + sõlmed). */
function LearningOutcomeTree({ items, accent = 'emerald' }) {
  const list = Array.isArray(items) ? items : [];
  const n = list.length;
  if (n === 0) {
    return <p className="py-2 text-sm text-slate-500">Siia ei ole graafist veel õpiväljundeid seotud.</p>;
  }
  const dot =
    accent === 'sky'
      ? 'bg-sky-500 shadow-sky-200/50'
      : 'bg-emerald-500 shadow-emerald-200/50';
  const labelColor = accent === 'sky' ? 'text-sky-700' : 'text-emerald-700';
  const cardBorder = accent === 'sky' ? 'border-sky-100/90' : 'border-emerald-100/90';

  return (
    <div className="space-y-0">
      {list.map((lo, i) => (
        <div key={lo.id || i} className="flex gap-3 sm:gap-4">
          <div className="flex w-8 shrink-0 flex-col items-center sm:w-9">
            {i > 0 ? <div className="h-3 w-px border-l-2 border-dashed border-slate-300" aria-hidden /> : <div className="h-3" />}
            <div
              className={cn(
                'z-10 h-3.5 w-3.5 shrink-0 rounded-full ring-[5px] ring-white shadow-md sm:h-4 sm:w-4',
                dot
              )}
              aria-hidden
            />
            {i < n - 1 ? (
              <div className="min-h-[4.5rem] w-px flex-1 border-l-2 border-dashed border-slate-300 sm:min-h-[5rem]" aria-hidden />
            ) : (
              <div className="h-2" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1 pb-5 sm:pb-6">
            <div
              className={cn(
                'rounded-2xl border bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-5 sm:py-4',
                cardBorder
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={cn('text-[10px] font-bold uppercase tracking-wider', labelColor)}>Õpiväljund</div>
                  <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-900 sm:text-[15px]">{lo.title}</p>
                </div>
                <GraphExternalLink href={lo.fullUrl} />
              </div>
              <LoSemanticRelations lo={lo} />
              <HierarchyLeafPlaceholder />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChevronDownIcon({ open, className }) {
  return (
    <svg
      className={cn('h-5 w-5 shrink-0 transition-transform duration-200', open && 'rotate-180', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Moodul — päis on nupp; sisu avaneb klõpsuga (vähem kerimist). */
function ModuleAccordionItem({ mod, index, expanded, onToggle }) {
  const title = moduleTitleLine(mod);
  const wikiTitle = mod.wikiTitle;
  const eap = moduleEapLine(mod);
  const loList = mod.learningOutcomes || [];
  const loCount = loList.length;

  return (
    <div
      id={`structure-mod-${index}`}
      className="scroll-mt-24 overflow-hidden rounded-3xl border border-indigo-200/50 bg-white/90 shadow-md backdrop-blur-sm sm:scroll-mt-28"
    >
      <div className="flex min-h-[4.5rem] items-stretch bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-white sm:gap-4 sm:px-5 sm:py-4"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/25 sm:h-12 sm:w-12">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden>
              <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h5A2.5 2.5 0 0 1 14 6.5V10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 9.5v-3Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M10 14h7.5A2.5 2.5 0 0 1 20 16.5V18a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-4Z" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/85">Moodul {index + 1}</div>
            <div className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">{title}</div>
            {wikiTitle && wikiTitle !== title && (
              <div className="mt-0.5 line-clamp-1 text-[10px] text-white/75 sm:text-[11px]">Wiki: {wikiTitle}</div>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold text-white/90 sm:text-[11px]">
              {eap && <span className="rounded-full bg-black/20 px-2 py-0.5">{eap}</span>}
              <span className="rounded-full bg-black/20 px-2 py-0.5">
                {loCount} {loCount === 1 ? 'OÕ' : 'OÕ-d'}
              </span>
            </div>
          </div>
          <ChevronDownIcon open={expanded} className="text-white/90" />
        </button>
        <div className="flex items-center border-l border-white/15 px-2 sm:px-3">
          <GraphExternalLink href={mod.fullUrl} variant="glassOnGradient" />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-indigo-100/60 bg-gradient-to-b from-slate-50/50 to-white/90 px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" />
            <span>2. tase — õpiväljundid</span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" />
          </div>
          <LearningOutcomeTree items={loList} accent="emerald" />
        </div>
      )}
    </div>
  );
}

/** Õppekava taseme OÕ-d — akordion. */
function CurriculumLevelAccordion({ items, expanded, onToggle }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return null;

  return (
    <section
      id="structure-curriculum-los"
      className="scroll-mt-24 overflow-hidden rounded-3xl border border-sky-200/60 bg-white/90 shadow-sm backdrop-blur-sm sm:scroll-mt-28"
    >
      <div className="flex items-stretch bg-gradient-to-r from-sky-500 to-cyan-600">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-white sm:px-6 sm:py-4"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-100">Õppekava tase</div>
            <h3 className="text-base font-bold sm:text-lg">Õpiväljundid (ilma moodulita)</h3>
            <div className="mt-1 text-[11px] text-sky-100/95">{list.length} tk — klõpsa avamiseks</div>
          </div>
          <ChevronDownIcon open={expanded} className="text-white/90" />
        </button>
      </div>
      {expanded && (
        <div className="border-t border-sky-100/80 px-4 py-4 sm:px-6 sm:py-5">
          <p className="mb-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
            Graafis on need seotud <strong className="text-slate-800">õppekavaga</strong>, mitte konkreetse mooduliga.
          </p>
          <LearningOutcomeTree items={list} accent="sky" />
        </div>
      )}
    </section>
  );
}

function CurriculumStructureExplorer({ structure, dataSource }) {
  const [openModules, setOpenModules] = useState(() => new Set());
  const [curriculumOpen, setCurriculumOpen] = useState(false);

  if (!structure) return null;
  const modules = structure.modules || [];
  const curriculumLos = structure.curriculumLevelLearningOutcomes || [];
  const hasModules = modules.length > 0;
  const hasCurriculumLos = curriculumLos.length > 0;

  if (!hasModules && !hasCurriculumLos) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-600">
        Struktuuri ei leitud (moodulid ja õppekava-taseme õpiväljundid puuduvad).
      </div>
    );
  }

  function toggleModule(idx) {
    setOpenModules((prev) => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  }

  function goModule(idx) {
    setOpenModules((prev) => {
      const n = new Set(prev);
      n.add(idx);
      return n;
    });
    requestAnimationFrame(() => {
      document.getElementById(`structure-mod-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function expandAllModules() {
    setOpenModules(new Set(modules.map((_, i) => i)));
  }

  function collapseAll() {
    setOpenModules(new Set());
    setCurriculumOpen(false);
  }

  const title =
    dataSource === 'database'
      ? 'Struktuur (andmebaasist)'
      : 'Struktuur (otse graafist — OÕ seosed võivad puududa)';

  function onStructureJumpSelect(v) {
    if (!v) return;
    if (v === 'co') {
      setCurriculumOpen(true);
      requestAnimationFrame(() =>
        document.getElementById('structure-curriculum-los')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      );
    } else {
      const idx = Number.parseInt(v, 10);
      if (!Number.isNaN(idx)) goModule(idx);
    }
  }

  return (
    <div className="mt-10 min-w-0 space-y-6">
      <header>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          <strong className="text-slate-800">Moodulid</strong> on vaikimisi kokku klapitud — ava üks korraga või vali{' '}
          <strong className="text-slate-800">hüppemenüüst</strong>.{' '}
          <strong className="text-slate-800">Eeldab / koosneb</strong> kuvatakse imporditud õpiväljunditel, kui need on DB-s
          seotud (RDF <code className="rounded bg-slate-100 px-1 text-xs">Haridus:eeldab</code>,{' '}
          <code className="rounded bg-slate-100 px-1 text-xs">Haridus:koosneb</code>).
        </p>
      </header>

      <div
        className={cn(
          'min-w-0 rounded-2xl border border-white/45 bg-white/25 p-2 backdrop-blur-lg sm:p-2.5',
          'shadow-[0_4px_14px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.06)]'
        )}
      >
        <div className="flex min-w-0 flex-nowrap items-center gap-2">
          <label htmlFor="structure-jump-select" className="sr-only">
            Hüppa struktuuris — vali moodul või sektsioon
          </label>
          <div className="relative min-w-0 flex-1">
            <select
              id="structure-jump-select"
              value=""
              onChange={(e) => onStructureJumpSelect(e.target.value)}
              className={cn(
                'w-full min-w-0 cursor-pointer appearance-none rounded-2xl border border-white/55',
                'bg-white/20 py-2.5 pl-3.5 pr-10 text-sm font-medium text-slate-800',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_4px_rgba(15,23,42,0.07)] backdrop-blur-md',
                'outline-none transition-[border-color,box-shadow]',
                'focus:border-sky-400/50 focus:ring-2 focus:ring-sky-300/30 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(14,165,233,0.12)]'
              )}
            >
              <option value="">Vali moodul või sektsioon…</option>
              {modules.map((mod, idx) => (
                <option key={mod.id || idx} value={String(idx)}>
                  M{idx + 1}: {moduleTitleLine(mod)}
                </option>
              ))}
              {hasCurriculumLos && (
                <option value="co">Õppekava taseme õpiväljundid ({curriculumLos.length})</option>
              )}
            </select>
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600/80"
              aria-hidden
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <button
            type="button"
            onClick={expandAllModules}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-2xl border border-white/55 bg-white/20 px-3 py-2.5',
              'text-xs font-semibold text-slate-700 backdrop-blur-md',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_3px_rgba(15,23,42,0.06)]',
              'sm:px-4'
            )}
          >
            Ava kõik
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-2xl border border-white/55 bg-white/20 px-3 py-2.5',
              'text-xs font-semibold text-slate-600 backdrop-blur-md',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_3px_rgba(15,23,42,0.06)]',
              'sm:px-4'
            )}
          >
            Sulge kõik
          </button>
        </div>
      </div>

      {hasModules && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Moodulid</span>
            <span className="h-px flex-1 bg-gradient-to-r from-indigo-200 to-transparent" />
            <span className="text-xs text-slate-500">{modules.length} tk</span>
          </div>
          <div className="space-y-3">
            {modules.map((mod, idx) => (
              <ModuleAccordionItem
                key={mod.id || idx}
                mod={mod}
                index={idx}
                expanded={openModules.has(idx)}
                onToggle={() => toggleModule(idx)}
              />
            ))}
          </div>
        </div>
      )}

      {hasCurriculumLos && (
        <div className={cn(hasModules && 'pt-2')}>
          <CurriculumLevelAccordion
            items={curriculumLos}
            expanded={curriculumOpen}
            onToggle={() => setCurriculumOpen((v) => !v)}
          />
        </div>
      )}
    </div>
  );
}

function PanelStatPill({ children, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200/80 bg-slate-100/80 text-slate-700',
    sky: 'border-sky-200/80 bg-sky-50/90 text-sky-800',
    emerald: 'border-emerald-200/80 bg-emerald-50/90 text-emerald-800',
    amber: 'border-amber-200/80 bg-amber-50/90 text-amber-900',
  };
  return (
    <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', tones[tone] || tones.slate)}>
      {children}
    </span>
  );
}

/** Üks rida paremas paneelis: silt + väärtus (pikk tekst murdub). */
function PanelField({ label, value, href, mono }) {
  const display = value != null && String(value).trim() !== '' ? String(value) : null;
  const empty = <span className="text-slate-400">—</span>;
  return (
    <div className="border-b border-white/50 py-2.5 last:border-0 last:pb-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={cn('mt-0.5 break-words text-sm font-medium text-slate-900', mono && 'font-mono text-xs')}>
        {href && display ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline" title={display}>
            {display}
          </a>
        ) : display ? (
          <span title={display}>{display}</span>
        ) : (
          empty
        )}
      </div>
    </div>
  );
}

function PanelIriField({ label, iri }) {
  if (!iri) {
    return <PanelField label={label} value={null} />;
  }
  const short = iriToLabel(iri);
  const isUrl = /^https?:\/\//i.test(iri);
  return (
    <div className="border-b border-white/50 py-2.5 last:border-0 last:pb-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-0.5">
        {isUrl ? (
          <a
            href={iri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-sky-700 hover:underline"
            title={iri}
          >
            {short || iri}
          </a>
        ) : (
          <span className="text-sm font-medium text-slate-900" title={iri}>
            {short || iri}
          </span>
        )}
        {short && short !== iri && (
          <div className="mt-1 line-clamp-2 break-all font-mono text-[10px] leading-snug text-slate-400">{iri}</div>
        )}
      </div>
    </div>
  );
}

function CurriculumMetaRightPanel({ data, loading }) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-2xl bg-white/40" />
        <div className="h-40 rounded-2xl bg-white/40" />
        <div className="h-32 rounded-2xl bg-white/40" />
      </div>
    );
  }
  if (!data) {
    return <p className="text-center text-sm text-slate-500">Andmed puuduvad.</p>;
  }

  const fw = data.educationalFramework != null ? String(data.educationalFramework).replace(/_/g, ' ') : null;

  return (
    <div className="space-y-4">
      {/* Pealkiri + kiirülevaade */}
      <div className="overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 via-sky-50/40 to-white/80 shadow-sm">
        <div className="h-1 bg-gradient-to-r from-sky-500 via-sky-400 to-emerald-400" />
        <div className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700/90">Õppekava</div>
          <h2 className="mt-1 line-clamp-3 text-base font-bold leading-snug text-slate-900">{data.title || '—'}</h2>
          {data.description ? (
            <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-slate-600">{data.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.status && <PanelStatPill tone="sky">{data.status}</PanelStatPill>}
            {data.visibility && <PanelStatPill>{data.visibility}</PanelStatPill>}
            {data.externalGraph ? <PanelStatPill tone="emerald">Graafist imporditud</PanelStatPill> : null}
            {data.curriculumType ? <PanelStatPill tone="amber">{data.curriculumType}</PanelStatPill> : null}
          </div>
        </div>
      </div>

      {/* Üldandmed — kompaktne blokk */}
      <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-100/80 text-sky-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 6h16M4 12h10M4 18h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-sm font-bold text-slate-900">Üldandmed</span>
        </div>
        <div className="mt-2 divide-y divide-white/0">
          <PanelField label="Provider" value={data.provider} />
          <PanelField label="Identifikaator" value={data.identifier} mono />
          <PanelField label="Sihtrühm" value={data.audience} href={data.audienceIri} />
          <PanelField label="Seotud kutse / amet" value={data.relevantOccupation} href={data.relevantOccupationIri} />
          <PanelField label="Maht (akadeemilised tunnid)" value={data.volumeHours != null ? String(data.volumeHours) : null} />
          <PanelField label="Keel" value={data.language} />
          <PanelField label="Õppekava raamistik" value={fw} />
          <PanelField label="Kooliaste" value={data.schoolLevel} />
          <PanelField label="Klass / tase" value={data.grade} />
        </div>
      </div>

      {/* Semantilised IRI-d */}
      <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-100/80 text-indigo-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-sm font-bold text-slate-900">Ontoloogia / IRI</span>
        </div>
        <div className="mt-2">
          <PanelIriField label="Ainevaldkond" iri={data.subjectAreaIri} />
          <PanelIriField label="Õppeaine" iri={data.subjectIri} />
          <PanelIriField label="Haridusaste" iri={data.educationalLevelIri} />
        </div>
      </div>

      {/* Väline allikas */}
      <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100/80 text-emerald-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M10 13a5 5 0 0 1 7 0M14 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4 19v-1a4 4 0 0 1 4-4h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-sm font-bold text-slate-900">Allikas</span>
        </div>
        <div className="mt-2">
          <PanelField label="Välise süsteemi nimi" value={data.externalSource} />
          {data.externalPageIri ? (
            <div className="border-b border-white/50 py-2.5 last:border-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Väline leht (IRI)</div>
              <a
                href={data.externalPageIri}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
              >
                Ava välislingil
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-70">
                  <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </a>
              <div className="mt-1 break-all font-mono text-[10px] leading-snug text-slate-500">{data.externalPageIri}</div>
            </div>
          ) : (
            <PanelField label="Väline leht (IRI)" value={null} />
          )}
        </div>
      </div>

      {/* Ajatemplid */}
      <div className="rounded-2xl border border-dashed border-white/80 bg-white/50 p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ajatemplid</div>
        <div className="mt-2 grid gap-2 text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Loodud</span>
            <span className="font-medium text-slate-800">{formatDateTime(data.createdAt)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Muudetud</span>
            <span className="font-medium text-slate-800">{formatDateTime(data.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
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

export default function CurriculumDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [data, setData] = useState(null);
  /** Ühtustatud struktuur (DB eelistatud, graaf varuvariant). */
  const [structure, setStructure] = useState(null);
  const [structureSource, setStructureSource] = useState(null); // 'database' | 'graph'
  const [structureLoading, setStructureLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  /** Väline õppekava: 'detail' = praegune ülevaade, 'timeline' = ajatelg (placeholder). */
  const [externalMainTab, setExternalMainTab] = useState('detail');

  useEffect(() => {
    setExternalMainTab('detail');
  }, [id, data?.externalGraph]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    curriculum
      .get(id)
      .then((d) => {
        if (!ignore) setData(d);
      })
      .catch((e) => {
        if (!ignore) setError(e.message || 'Viga detaili laadimisel');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !data?.externalGraph) {
      setStructure(null);
      setStructureSource(null);
      return;
    }
    let ignore = false;
    setStructureLoading(true);
    (async () => {
      try {
        const s = await curriculum.getImportedStructure(id);
        if (!ignore) {
          setStructure(s);
          setStructureSource('database');
        }
      } catch {
        try {
          const g = await curriculum.getGraphStructure(id);
          if (!ignore) {
            setStructure(normalizeGraphToStructure(g));
            setStructureSource('graph');
          }
        } catch {
          if (!ignore) {
            setStructure(null);
            setStructureSource(null);
          }
        }
      } finally {
        if (!ignore) setStructureLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id, data?.externalGraph]);

  function logout() {
    apiLogout();
    navigate('/login');
  }

  const showTimeline = Boolean(data?.externalGraph && externalMainTab === 'timeline');
  const isExternalCurriculum = Boolean(data?.externalGraph);

  return (
    <div className="min-h-full">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImg})` }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 -z-10 bg-white/55" aria-hidden="true" />

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/35 bg-white/35 shadow-[0_12px_36px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-6 py-2">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="" className="h-16 w-22 object-contain" />
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

      <div
        className={cn(
          HEADER_PT_CLASS,
          'mx-auto grid min-w-0 max-w-[1400px] gap-6 px-2 py-6',
          showTimeline ? 'grid-cols-[auto_minmax(0,1fr)]' : 'grid-cols-[auto_minmax(0,1fr)_auto]'
        )}
      >
        <aside
          className={cn(
            'group sticky z-30 -ml-8 w-[68px] self-start overflow-y-auto rounded-3xl border border-white/60 bg-white/55 p-3 shadow-sm backdrop-blur-md transition-[width] duration-200 hover:w-[260px]',
            SIDEBAR_STICKY_TOP,
            SIDEBAR_MAX_H
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

        <main className="min-w-0 max-w-full overflow-x-hidden rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                {showTimeline ? 'Ajatelg' : 'Detailvaade'}
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{data?.title || 'Õppekava'}</h1>
              <div className="mt-2 text-sm text-slate-600">{data?.description || ''}</div>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Link
                to="/curriculums"
                className="rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white"
              >
                Tagasi
              </Link>
              {data?.externalPageIri && (
                <a
                  href={data.externalPageIri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-sky-200 bg-sky-50/90 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm hover:bg-sky-100"
                >
                  Vaata graafis
                </a>
              )}
              {!data?.externalGraph && (
                <Link
                  to="/curriculum-versions"
                  className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                >
                  Ava versioonid
                </Link>
              )}
            </div>
          </div>

          {isExternalCurriculum && !loading && data && (
            <div
              className="mt-5 inline-flex rounded-2xl border border-white/55 bg-white/35 p-1 shadow-[0_2px_10px_rgba(15,23,42,0.06)] backdrop-blur-md"
              role="tablist"
              aria-label="Õppekava vaade"
            >
              <button
                type="button"
                role="tab"
                aria-selected={externalMainTab === 'detail'}
                onClick={() => setExternalMainTab('detail')}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                  externalMainTab === 'detail'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Ülevaade
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={externalMainTab === 'timeline'}
                onClick={() => setExternalMainTab('timeline')}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                  externalMainTab === 'timeline'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Ajatelg
              </button>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-10 text-center text-sm text-slate-600">Laen…</div>
          ) : data ? (
            showTimeline ? (
              <div className="mt-10 flex min-h-[min(50vh,28rem)] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/40 px-6 py-16 text-center">
                <p className="text-lg font-semibold text-slate-700">Siia tuleb ajatelg</p>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Ajatelje paigutus ja sündmused lisanduvad hiljem.
                </p>
              </div>
            ) : (
              <>
                <p className="mt-6 rounded-2xl border border-sky-100/80 bg-sky-50/40 px-4 py-3 text-sm text-slate-600">
                  <span className="font-semibold text-sky-800">Üldandmed</span> on koondatud paremale paneelile — keri seal alla,
                  et näha providerit, IRI-sid, allikat ja ajatemplid.
                </p>

                {data.externalGraph && structureLoading && (
                  <div className="mt-8 text-center text-sm text-slate-600">Laen struktuuri…</div>
                )}

                {data.externalGraph && !structureLoading && structure && (
                  <CurriculumStructureExplorer structure={structure} dataSource={structureSource} />
                )}

                {data.externalGraph && !structureLoading && !structure && !loading && (
                  <div className="mt-8 text-center text-sm text-slate-500">
                    Struktuuri ei õnnestunud laadida (ei DB-st ega graafist).
                  </div>
                )}
              </>
            )
          ) : (
            <div className="mt-10 text-center text-sm text-slate-600">Ei leitud.</div>
          )}
        </main>

        {!showTimeline && (
        <aside
          className={cn(
            'sticky z-30 w-[340px] shrink-0 self-start overflow-y-auto rounded-3xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-md sm:p-5',
            SIDEBAR_STICKY_TOP,
            SIDEBAR_MAX_H
          )}
        >
          <Link
            to="/curriculums"
            className="mb-4 flex w-full items-center justify-between rounded-2xl bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 sm:px-4"
          >
            <span>Õppekavade loend</span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/15">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>

          <CurriculumMetaRightPanel data={data} loading={loading} />

          <div className="mt-4 space-y-3 border-t border-white/60 pt-4">
            <div className="flex flex-wrap gap-2">
              <Link
                to="/"
                className="rounded-xl border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm hover:bg-white"
              >
                Töökavad
              </Link>
              {!data?.externalGraph && (
                <Link
                  to="/curriculum-versions"
                  className="rounded-xl border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm hover:bg-white"
                >
                  Versioonid
                </Link>
              )}
              <button
                type="button"
                className="rounded-xl border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white"
                onClick={() => navigate('/guide')}
              >
                Juhend
              </button>
            </div>
            {data?.externalGraph ? (
              <p className="text-[11px] leading-relaxed text-slate-500">
                Graafist imporditud õppekava: täielik struktuur on vasakul põhivaates (moodulid, õpiväljundid) ning
                versioonide / elementide lehtedel.
              </p>
            ) : null}
          </div>
        </aside>
        )}
      </div>
    </div>
  );
}
