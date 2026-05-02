import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { curriculum, curriculumItem, curriculumVersion, getCurrentUser, relation, timeline } from '../api';
import AppShell from '../components/layout/AppShell';
import MobilePanelDrawer from '../components/layout/MobilePanelDrawer';
import CurriculumCalendar from '../components/curriculumTimeline/CurriculumCalendar';
import CurriculumGantt from '../components/curriculumTimeline/CurriculumGantt';
import GraphExplorerView from '../components/graph/GraphExplorerView';
import { computeSchoolWeeks, findSchoolWeek, findSchoolWeeksInRange, formatSchoolWeekLabel } from '../utils/schoolWeeks';

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
      type: 'MODULE',
      wikiTitle: m.title,
      fullUrl: m.fullUrl,
      eapLabel: m.numberOfCredits != null ? `${m.numberOfCredits} EAP` : null,
      learningOutcomes: (m.learningOutcomes || []).map((lo, j) => ({
        id: lo.fullUrl || lo.title || `lo-${i}-${j}`,
        title: lo.title,
        type: 'LEARNING_OUTCOME',
        fullUrl: lo.fullUrl,
        eeldab: [],
        koosneb: [],
        children: [],
      })),
    })),
    curriculumLevelLearningOutcomes: (graph.curriculumLevelLearningOutcomes || []).map((lo, j) => ({
      id: lo.fullUrl || lo.title || `clo-${j}`,
      title: lo.title,
      type: 'LEARNING_OUTCOME',
      fullUrl: lo.fullUrl,
      eeldab: [],
      koosneb: [],
      children: [],
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
      'inline-flex shrink-0 items-center gap-1 rounded-lg border border-sky-200/80 bg-sky-50/90 px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-700/60 dark:bg-sky-900/40 dark:text-sky-400 dark:hover:bg-sky-900/60',
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
          className="inline-flex max-w-full items-center rounded-lg border border-white/80 bg-white/90 px-2 py-0.5 text-[11px] font-medium text-amber-900 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-amber-400 dark:hover:bg-slate-600"
          title={label}
        >
          <span className="truncate">{label}</span>
        </a>
      );
    }
    return (
      <span
        className="inline-flex max-w-full rounded-lg border border-amber-200/80 bg-amber-100/50 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-400"
        title={label}
      >
        <span className="truncate">{label}</span>
      </span>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {eeldab.length > 0 && (
        <div className="rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50/95 to-orange-50/40 px-3 py-2 shadow-sm dark:border-amber-700/60 dark:from-amber-900/30 dark:to-orange-900/20">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-amber-900 dark:text-amber-400">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-amber-200/80 text-amber-950 dark:bg-amber-800/60 dark:text-amber-200" aria-hidden>
              →
            </span>
            Eeldab <span className="font-normal normal-case text-amber-800/80 dark:text-amber-400/80">(enne seda peaks valmis olema)</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {eeldab.map((r) => (
              <RefChip key={r.id || r.title} r={r} />
            ))}
          </div>
        </div>
      )}
      {koosneb.length > 0 && (
        <div className="rounded-xl border border-violet-200/90 bg-gradient-to-r from-violet-50/95 to-indigo-50/40 px-3 py-2 shadow-sm dark:border-violet-700/60 dark:from-violet-900/30 dark:to-indigo-900/20">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-violet-900 dark:text-violet-300">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-violet-200/80 text-violet-950 dark:bg-violet-800/60 dark:text-violet-200" aria-hidden>
              ⧉
            </span>
            Koosneb <span className="font-normal normal-case text-violet-800/80 dark:text-violet-400/80">(osaüksused)</span>
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
                  className="inline-flex max-w-full items-center rounded-lg border border-white/80 bg-white/90 px-2 py-0.5 text-[11px] font-medium text-violet-900 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-violet-300 dark:hover:bg-slate-600"
                  title={label}
                >
                  <span className="truncate">{label}</span>
                </a>
              ) : (
                <span
                  key={r.id || r.title}
                  className="inline-flex max-w-full rounded-lg border border-violet-200/80 bg-violet-100/40 px-2 py-0.5 text-[11px] font-medium text-violet-900 dark:border-violet-700/60 dark:bg-violet-900/30 dark:text-violet-300"
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

const CHILD_TYPE_LABELS = {
  TASK: 'Ülesanne',
  TEST: 'Test',
  LEARNING_MATERIAL: 'Õppematerjal',
  KNOBIT: 'Knobit',
  LEARNING_OUTCOME: 'Õpiväljund',
  TOPIC: 'Teema',
  MODULE: 'Moodul',
};

const CHILD_TYPE_COLORS = {
  TASK: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-400', border: 'border-amber-200/80 dark:border-amber-700/60' },
  TEST: { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-800 dark:text-rose-400', border: 'border-rose-200/80 dark:border-rose-700/60' },
  LEARNING_MATERIAL: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200/80 dark:border-blue-700/60' },
  KNOBIT: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-200/80 dark:border-purple-700/60' },
};
const DEFAULT_CHILD_COLOR = { bg: 'bg-slate-100 dark:bg-slate-700/50', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200/80 dark:border-slate-700' };

function ChildItemCard({ item, depth = 0, schoolWeeks }) {
  const [open, setOpen] = useState(false);
  const children = item.children || [];
  const hasChildren = children.length > 0;
  const colors = CHILD_TYPE_COLORS[item.type] || DEFAULT_CHILD_COLOR;
  const typeLabel = CHILD_TYPE_LABELS[item.type] || item.type;

  return (
    <div className={cn('rounded-xl border bg-white/95 shadow-sm dark:bg-slate-800/90', colors.border, depth > 0 && 'ml-4')}>
      <div
        className={cn(
          'flex items-start gap-2.5 px-3 py-2.5',
          hasChildren && 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-700/50'
        )}
        onClick={hasChildren ? () => setOpen(!open) : undefined}
      >
        <span className={cn('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[10px] font-bold', colors.bg, colors.text)}>
          {item.type === 'TASK' && '✎'}
          {item.type === 'TEST' && '✓'}
          {item.type === 'LEARNING_MATERIAL' && '📄'}
          {item.type === 'KNOBIT' && '⚡'}
          {!['TASK', 'TEST', 'LEARNING_MATERIAL', 'KNOBIT'].includes(item.type) && '•'}
        </span>
        <div className={"min-w-0 flex-1"}>
          <div className={cn('text-[9px] font-bold uppercase tracking-wider', colors.text)}>
            {typeLabel}
            <WeekBadges startAt={item.plannedStartAt} endAt={item.plannedEndAt} schoolWeeks={schoolWeeks} />
          </div>
          <p className={"text-sm font-medium leading-snug text-slate-900 dark:text-slate-100"}>{item.title}</p>
          {item.description && (
            <p className={"mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2"}>{item.description}</p>
          )}
        </div>
        {hasChildren && (
          <ChevronDownIcon open={open} className="mt-1 h-4 w-4 text-slate-400 dark:text-slate-500" />
        )}
      </div>
      {open && hasChildren && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-3 py-2 space-y-2">
          {children.map((child) => (
            <ChildItemCard key={child.id} item={child} depth={depth + 1} schoolWeeks={schoolWeeks} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Parse a date that may be ISO string or Jackson array [y,m,d,h,min,s]. */
function parseItemDate(raw) {
  if (!raw) return null;
  let str = raw;
  if (Array.isArray(raw)) {
    const [y, mo, da, h = 0, mi = 0, s = 0] = raw;
    str = `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Small inline badges showing which school weeks an item spans. */
function WeekBadges({ startAt, endAt, schoolWeeks }) {
  if (!schoolWeeks?.length || !startAt) return null;
  const start = parseItemDate(startAt);
  if (!start) return null;
  const end = parseItemDate(endAt) || start;
  const weeks = findSchoolWeeksInRange(start, end, schoolWeeks);
  if (weeks.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap gap-1 ml-1">
      {weeks.map((w) => (
        <span key={w.weekNumber} className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400" title={formatSchoolWeekLabel(w)}>
          Õ{w.weekNumber}
        </span>
      ))}
    </span>
  );
}

function ChildrenList({ children, schoolWeeks }) {
  if (!children || children.length === 0) return null;
  const sorted = [...children].sort((a, b) => {
    const aT = a.type === 'TEST' ? 1 : 0;
    const bT = b.type === 'TEST' ? 1 : 0;
    return aT - bT;
  });
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-700" />
        <span>Alamelemendid ({children.length})</span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-700" />
      </div>
      {sorted.map((child) => (
        <ChildItemCard key={child.id} item={child} schoolWeeks={schoolWeeks} />
      ))}
    </div>
  );
}

/** Õpiväljundite vertikaalne „puu" (katkendlik joon + sõlmed). */
function LearningOutcomeTree({ items, accent = 'emerald', schoolWeeks }) {
  const list = Array.isArray(items) ? items : [];
  const n = list.length;
  if (n === 0) {
    return <p className="py-2 text-sm text-slate-500 dark:text-slate-400">Siia ei ole graafist veel õpiväljundeid seotud.</p>;
  }
  const dot =
    accent === 'sky'
      ? 'bg-sky-500 shadow-sky-200/50'
      : 'bg-emerald-500 shadow-emerald-200/50';
  const labelColor = accent === 'sky' ? 'text-sky-700 dark:text-sky-400' : 'text-emerald-700 dark:text-emerald-400';
  const cardBorder = accent === 'sky' ? 'border-sky-100/90 dark:border-sky-800/40' : 'border-emerald-100/90 dark:border-emerald-800/40';

  return (
    <div className="space-y-0">
      {list.map((lo, i) => {
        const isTest = lo.type === 'TEST';
        const itemDot = isTest ? 'bg-rose-500 shadow-rose-200/50' : dot;
        const itemLabelColor = isTest ? 'text-rose-700 dark:text-rose-400' : labelColor;
        const itemCardBorder = isTest ? 'border-rose-100/90 dark:border-rose-800/40' : cardBorder;
        return (
        <div key={lo.id || i} className="flex gap-3 sm:gap-4">
          <div className="flex w-8 shrink-0 flex-col items-center sm:w-9">
            {i > 0 ? <div className="h-3 w-px border-l-2 border-dashed border-slate-300 dark:border-slate-600" aria-hidden /> : <div className="h-3" />}
            <div
              className={cn(
                'z-10 h-3.5 w-3.5 shrink-0 rounded-full ring-[5px] ring-white dark:ring-slate-800 shadow-md sm:h-4 sm:w-4',
                itemDot
              )}
              aria-hidden
            />
            {i < n - 1 ? (
              <div className="min-h-[4.5rem] w-px flex-1 border-l-2 border-dashed border-slate-300 dark:border-slate-600 sm:min-h-[5rem]" aria-hidden />
            ) : (
              <div className="h-2" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1 pb-5 sm:pb-6">
            <div
              className={cn(
                'rounded-2xl border bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-5 sm:py-4 dark:bg-slate-800/90',
                itemCardBorder
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={cn('text-[10px] font-bold uppercase tracking-wider', itemLabelColor)}>
                    {lo.type === 'TEST' ? 'Test' : lo.type === 'TOPIC' ? 'Teema' : 'Õpiväljund'}
                    <WeekBadges startAt={lo.plannedStartAt} endAt={lo.plannedEndAt} schoolWeeks={schoolWeeks} />
                  </div>
                  <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100 sm:text-[15px]">{lo.title}</p>
                </div>
                <GraphExternalLink href={lo.fullUrl} />
              </div>
              <LoSemanticRelations lo={lo} />
              <ChildrenList children={lo.children} schoolWeeks={schoolWeeks} />
            </div>
          </div>
        </div>
        );
      })}
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

/** Moodul/Teema — päis on nupp; sisu avaneb klõpsuga (vähem kerimist). */
function ModuleAccordionItem({ mod, index, expanded, onToggle, schoolWeeks }) {
  const title = moduleTitleLine(mod);
  const wikiTitle = mod.wikiTitle;
  const eap = moduleEapLine(mod);
  const loList = mod.learningOutcomes || [];
  const loCount = loList.length;
  const isTopic = mod.type === 'TOPIC';
  const typeLabel = isTopic ? 'Teema' : 'Moodul';

  return (
    <div
      id={`structure-mod-${index}`}
      className="scroll-mt-24 overflow-hidden rounded-3xl border border-indigo-200/50 bg-white/90 shadow-md backdrop-blur-sm sm:scroll-mt-28 dark:border-indigo-800/40 dark:bg-slate-800/90"
    >
      <div className={cn(
        'flex min-h-[4.5rem] items-stretch',
        isTopic
          ? 'bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600'
          : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600'
      )}>
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-white sm:gap-4 sm:px-5 sm:py-4"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/25 sm:h-12 sm:w-12">
            {isTopic ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden>
                <path d="M4 6h16M4 10h16M4 14h10M4 18h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden>
                <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h5A2.5 2.5 0 0 1 14 6.5V10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 9.5v-3Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M10 14h7.5A2.5 2.5 0 0 1 20 16.5V18a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-4Z" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/85">{typeLabel} {index + 1}</div>
            <div className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">{title}</div>
            {wikiTitle && wikiTitle !== title && (
              <div className="mt-0.5 line-clamp-1 text-[10px] text-white/75 sm:text-[11px]">Wiki: {wikiTitle}</div>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold text-white/90 sm:text-[11px]">
              {eap && <span className="rounded-full bg-black/20 px-2 py-0.5">{eap}</span>}
              <span className="rounded-full bg-black/20 px-2 py-0.5">
                {loCount} {loCount === 1 ? 'element' : 'elementi'}
              </span>
              {(() => {
                const start = parseItemDate(mod.plannedStartAt);
                if (!start || !schoolWeeks?.length) return null;
                const end = parseItemDate(mod.plannedEndAt) || start;
                const weeks = findSchoolWeeksInRange(start, end, schoolWeeks);
                if (weeks.length === 0) return null;
                return weeks.map((w) => (
                  <span key={w.weekNumber} className="rounded-full bg-white/30 px-2 py-0.5" title={formatSchoolWeekLabel(w)}>
                    Õ{w.weekNumber}
                  </span>
                ));
              })()}
            </div>
          </div>
          <ChevronDownIcon open={expanded} className="text-white/90" />
        </button>
        <div className="flex items-center border-l border-white/15 px-2 sm:px-3">
          <GraphExternalLink href={mod.fullUrl} variant="glassOnGradient" />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-indigo-100/60 bg-gradient-to-b from-slate-50/50 to-white/90 px-4 py-4 sm:px-6 sm:py-5 dark:border-indigo-900/40 dark:from-slate-800/50 dark:to-slate-800/90">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-700" />
            <span>2. tase — elemendid</span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-700" />
          </div>
          {(() => {
            // TEST items always at the bottom
            const testLast = (a, b) => {
              const aT = a.type === 'TEST' ? 1 : 0;
              const bT = b.type === 'TEST' ? 1 : 0;
              if (aT !== bT) return aT - bT;
              const da = parseItemDate(a.plannedStartAt);
              const db = parseItemDate(b.plannedStartAt);
              if (!da && !db) return 0;
              if (!da) return 1;
              if (!db) return -1;
              return da - db;
            };
            if (!schoolWeeks?.length) {
              return <LearningOutcomeTree items={[...loList].sort(testLast)} accent="emerald" schoolWeeks={schoolWeeks} />;
            }
            // Sort LOs by start date, TEST last
            const sorted = [...loList].sort(testLast);
            // Build flat list of { type: 'week-header' | 'lo', ... } entries.
            // Each LO appears once; week headers are emitted for ALL weeks the LO spans.
            const entries = [];
            const emittedWeeks = new Set();
            const scheduledLos = [];
            const noWeekLos = [];
            for (const lo of sorted) {
              const start = parseItemDate(lo.plannedStartAt);
              if (start) {
                const end = parseItemDate(lo.plannedEndAt) || start;
                const weeks = findSchoolWeeksInRange(start, end, schoolWeeks);
                if (weeks.length > 0) {
                  // Emit week headers for all weeks this LO spans (if not already emitted)
                  for (const sw of weeks) {
                    if (!emittedWeeks.has(sw.weekNumber)) {
                      emittedWeeks.add(sw.weekNumber);
                      entries.push({ type: 'week-header', week: sw, label: formatSchoolWeekLabel(sw) });
                    }
                  }
                  // Emit the LO itself once
                  entries.push({ type: 'lo', lo });
                  scheduledLos.push(lo);
                  continue;
                }
              }
              noWeekLos.push(lo);
            }
            if (scheduledLos.length === 0) {
              return <LearningOutcomeTree items={loList} accent="emerald" schoolWeeks={schoolWeeks} />;
            }
            return (
              <div className="space-y-3">
                {entries.map((entry) => {
                  if (entry.type === 'week-header') {
                    return (
                      <div key={`wh-${entry.week.weekNumber}`} className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">{entry.label}</span>
                        <span className="h-px flex-1 bg-gradient-to-r from-indigo-200 dark:from-indigo-800 to-transparent" />
                      </div>
                    );
                  }
                  return <LearningOutcomeTree key={entry.lo.id || entry.lo.title} items={[entry.lo]} accent="emerald" schoolWeeks={schoolWeeks} />;
                })}
                {noWeekLos.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Ajastamata</span>
                      <span className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent" />
                    </div>
                    <LearningOutcomeTree items={noWeekLos} accent="emerald" schoolWeeks={schoolWeeks} />
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/** Õppekava taseme OÕ-d — akordion. */
function CurriculumLevelAccordion({ items, expanded, onToggle, schoolWeeks }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return null;

  return (
    <section
      id="structure-curriculum-los"
      className="scroll-mt-24 overflow-hidden rounded-3xl border border-sky-200/60 bg-white/90 shadow-sm backdrop-blur-sm sm:scroll-mt-28 dark:border-sky-800/40 dark:bg-slate-800/90"
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
        <div className="border-t border-sky-100/80 dark:border-sky-900/40 px-4 py-4 sm:px-6 sm:py-5">
          <p className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm">
            Graafis on need seotud <strong className="text-slate-800 dark:text-slate-200">õppekavaga</strong>, mitte konkreetse mooduliga.
          </p>
          <LearningOutcomeTree items={list} accent="sky" schoolWeeks={schoolWeeks} />
        </div>
      )}
    </section>
  );
}

function CurriculumStructureExplorer({ structure, dataSource, schoolWeeks }) {
  const [openModules, setOpenModules] = useState(() => new Set());
  const [curriculumOpen, setCurriculumOpen] = useState(false);

  if (!structure) return null;
  const modules = structure.modules || [];
  const curriculumLos = structure.curriculumLevelLearningOutcomes || [];
  const hasModules = modules.length > 0;
  const hasCurriculumLos = curriculumLos.length > 0;

  if (!hasModules && !hasCurriculumLos) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-400">
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
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Elemendid on vaikimisi kokku klapitud — ava üks korraga või vali{' '}
          <strong className="text-slate-800 dark:text-slate-200">hüppemenüüst</strong>.
        </p>
      </header>

      <div
        className={cn(
          'min-w-0 rounded-2xl border border-white/45 bg-white/25 p-2 backdrop-blur-lg sm:p-2.5 dark:border-slate-700 dark:bg-slate-800/50',
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
                'w-full min-w-0 cursor-pointer appearance-none rounded-2xl border border-white/55 dark:border-slate-600',
                'bg-white/20 py-2.5 pl-3.5 pr-10 text-sm font-medium text-slate-800 dark:bg-slate-700 dark:text-slate-100',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_4px_rgba(15,23,42,0.07)] backdrop-blur-md',
                'outline-none transition-[border-color,box-shadow]',
                'focus:border-sky-400/50 focus:ring-2 focus:ring-sky-300/30 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(14,165,233,0.12)]'
              )}
            >
              <option value="">Vali moodul või sektsioon…</option>
              {modules.map((mod, idx) => {
                const prefix = mod.type === 'TOPIC' ? 'T' : 'M';
                return (
                  <option key={mod.id || idx} value={String(idx)}>
                    {prefix}{idx + 1}: {moduleTitleLine(mod)}
                  </option>
                );
              })}
              {hasCurriculumLos && (
                <option value="co">Õppekava taseme õpiväljundid ({curriculumLos.length})</option>
              )}
            </select>
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600/80 dark:text-slate-400"
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
              'shrink-0 whitespace-nowrap rounded-2xl border border-white/55 bg-white/20 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200',
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
              'shrink-0 whitespace-nowrap rounded-2xl border border-white/55 bg-white/20 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300',
              'text-xs font-semibold text-slate-600 backdrop-blur-md',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_3px_rgba(15,23,42,0.06)]',
              'sm:px-4'
            )}
          >
            Sulge kõik
          </button>
        </div>
      </div>

      {hasModules && (() => {
        const MONTH_NAMES_ET = ['Jaanuar','Veebruar','Märts','Aprill','Mai','Juuni','Juuli','August','September','Oktoober','November','Detsember'];

        // Group modules by month (top level), modules inside months
        const scheduled = [];
        const unscheduled = [];
        for (const mod of modules) {
          const startDate = parseItemDate(mod.plannedStartAt);
          if (startDate) {
            const key = `${startDate.getFullYear()}-${String(startDate.getMonth()).padStart(2, '0')}`;
            scheduled.push({ mod, key, date: startDate });
          } else {
            unscheduled.push(mod);
          }
        }
        scheduled.sort((a, b) => a.date - b.date);
        const monthGroups = [];
        let lastKey = null;
        for (const entry of scheduled) {
          if (entry.key !== lastKey) {
            monthGroups.push({ key: entry.key, label: `${MONTH_NAMES_ET[entry.date.getMonth()]} ${entry.date.getFullYear()}`, items: [] });
            lastKey = entry.key;
          }
          monthGroups[monthGroups.length - 1].items.push(entry.mod);
        }

        return (
          <>
            {monthGroups.map((mg) => (
              <div key={mg.key} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">{mg.label}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-sky-200 dark:from-sky-800 to-transparent" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{mg.items.length} tk</span>
                </div>
                <div className="space-y-3">
                  {mg.items.map((mod) => {
                    const idx = modules.indexOf(mod);
                    return (
                      <ModuleAccordionItem
                        key={mod.id || idx}
                        mod={mod}
                        index={idx}
                        expanded={openModules.has(idx)}
                        onToggle={() => toggleModule(idx)}
                        schoolWeeks={schoolWeeks}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {unscheduled.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ajastamata</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{unscheduled.length} tk</span>
                </div>
                <div className="space-y-3">
                  {unscheduled.map((mod) => {
                    const idx = modules.indexOf(mod);
                    return (
                      <ModuleAccordionItem
                        key={mod.id || idx}
                        mod={mod}
                        index={idx}
                        expanded={openModules.has(idx)}
                        onToggle={() => toggleModule(idx)}
                        schoolWeeks={schoolWeeks}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {hasCurriculumLos && (
        <div className={cn(hasModules && 'pt-2')}>
          <CurriculumLevelAccordion
            items={curriculumLos}
            expanded={curriculumOpen}
            onToggle={() => setCurriculumOpen((v) => !v)}
            schoolWeeks={schoolWeeks}
          />
        </div>
      )}
    </div>
  );
}

function PanelStatPill({ children, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200/80 bg-slate-100/80 text-slate-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300',
    sky: 'border-sky-200/80 bg-sky-50/90 text-sky-800 dark:border-sky-700/60 dark:bg-sky-900/40 dark:text-sky-400',
    emerald: 'border-emerald-200/80 bg-emerald-50/90 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-900/40 dark:text-emerald-400',
    amber: 'border-amber-200/80 bg-amber-50/90 text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/40 dark:text-amber-400',
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
    <div className="border-b border-white/50 dark:border-slate-700/50 py-2.5 last:border-0 last:pb-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
      <div className={cn('mt-0.5 break-words text-sm font-medium text-slate-900 dark:text-slate-100', mono && 'font-mono text-xs')}>
        {href && display ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-700 dark:text-sky-400 hover:underline" title={display}>
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
    <div className="border-b border-white/50 dark:border-slate-700/50 py-2.5 last:border-0 last:pb-0">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-0.5">
        {isUrl ? (
          <a
            href={iri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-sky-700 dark:text-sky-400 hover:underline"
            title={iri}
          >
            {short || iri}
          </a>
        ) : (
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100" title={iri}>
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
        <div className="h-24 rounded-2xl bg-white/40 dark:bg-slate-700/40" />
        <div className="h-40 rounded-2xl bg-white/40 dark:bg-slate-700/40" />
        <div className="h-32 rounded-2xl bg-white/40 dark:bg-slate-700/40" />
      </div>
    );
  }
  if (!data) {
    return <p className="text-center text-sm text-slate-500 dark:text-slate-400">Andmed puuduvad.</p>;
  }

  const fw = data.educationalFramework != null ? String(data.educationalFramework).replace(/_/g, ' ') : null;

  return (
    <div className="space-y-4">
      {/* Pealkiri + kiirülevaade */}
      <div className="overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white/90 via-sky-50/40 to-white/80 shadow-sm dark:border-slate-700 dark:from-slate-800/90 dark:via-sky-900/20 dark:to-slate-800/80">
        <div className="h-1 bg-gradient-to-r from-sky-500 via-sky-400 to-emerald-400" />
        <div className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700/90 dark:text-sky-400">Õppekava</div>
          <h2 className="mt-1 line-clamp-3 text-base font-bold leading-snug text-slate-900 dark:text-slate-100">{data.title || '—'}</h2>
          {data.description ? (
            <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{data.description}</p>
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
      <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
        <div className="mb-1 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-100/80 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 6h16M4 12h10M4 18h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Üldandmed</span>
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
      <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
        <div className="mb-1 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Ontoloogia / IRI</span>
        </div>
        <div className="mt-2">
          <PanelIriField label="Ainevaldkond" iri={data.subjectAreaIri} />
          <PanelIriField label="Õppeaine" iri={data.subjectIri} />
          <PanelIriField label="Haridusaste" iri={data.educationalLevelIri} />
        </div>
      </div>

      {/* Väline allikas */}
      <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
        <div className="mb-1 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M10 13a5 5 0 0 1 7 0M14 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4 19v-1a4 4 0 0 1 4-4h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Allikas</span>
        </div>
        <div className="mt-2">
          <PanelField label="Välise süsteemi nimi" value={data.externalSource} />
          {data.externalPageIri ? (
            <div className="border-b border-white/50 dark:border-slate-700/50 py-2.5 last:border-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Väline leht (IRI)</div>
              <a
                href={data.externalPageIri}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Ava välislingil
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-70">
                  <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </a>
              <div className="mt-1 break-all font-mono text-[10px] leading-snug text-slate-500 dark:text-slate-400">{data.externalPageIri}</div>
            </div>
          ) : (
            <PanelField label="Väline leht (IRI)" value={null} />
          )}
        </div>
      </div>

      {/* Ajatemplid */}
      <div className="rounded-2xl border border-dashed border-white/80 bg-white/50 p-4 dark:border-slate-600 dark:bg-slate-800/50">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ajatemplid</div>
        <div className="mt-2 grid gap-2 text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400">Loodud</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{formatDateTime(data.createdAt)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400">Muudetud</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{formatDateTime(data.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function CurriculumDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const versionParam = searchParams.get('version');
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [data, setData] = useState(null);
  /** Ühtustatud struktuur (DB eelistatud, graaf varuvariant). */
  const [structure, setStructure] = useState(null);
  const [structureSource, setStructureSource] = useState(null); // 'database' | 'graph'
  const [structureLoading, setStructureLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('structure');
  const [ganttData, setGanttData] = useState({ blocks: [], items: [], relations: [] });
  const [ganttLoading, setGanttLoading] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [infoOpenMobile, setInfoOpenMobile] = useState(false);

  const schoolWeeks = useMemo(() => {
    if (!structure?.schoolYearStartDate) return [];
    let breaks = [];
    if (structure.schoolBreaksJson) {
      try { breaks = JSON.parse(structure.schoolBreaksJson); } catch { breaks = []; }
    }
    return computeSchoolWeeks(structure.schoolYearStartDate, breaks);
  }, [structure?.schoolYearStartDate, structure?.schoolBreaksJson]);

  useEffect(() => {
    setActiveView('structure');
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
    if (!id || !data) {
      setStructure(null);
      setStructureSource(null);
      return;
    }
    let ignore = false;
    setStructureLoading(true);
    (async () => {
      try {
        const s = await curriculum.getImportedStructure(id, versionParam || undefined);
        if (!ignore) {
          setStructure(s);
          setStructureSource('database');
        }
      } catch {
        if (data.externalGraph) {
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
        } else {
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
  }, [id, data, versionParam]);

  const showTimeline = activeView === 'calendar' || activeView === 'gantt';
  const hideInfoPanel = showTimeline || activeView === 'graph';
  const isExternalCurriculum = Boolean(data?.externalGraph);
  const selectedTimelineVersionId = useMemo(() => {
    const versions = Array.isArray(data?.curriculumVersions) ? data.curriculumVersions : [];
    if (versions.length === 0) return null;

    const published = versions
      .filter((v) => v?.status === 'PUBLISHED')
      .sort((a, b) => (b?.versionNumber ?? 0) - (a?.versionNumber ?? 0))[0];
    if (published?.id) return published.id;

    const newest = [...versions].sort((a, b) => (b?.versionNumber ?? 0) - (a?.versionNumber ?? 0))[0];
    return newest?.id || null;
  }, [data?.curriculumVersions]);

  // Fetch gantt data when switching to gantt view
  useEffect(() => {
    if (activeView !== 'gantt' || !selectedTimelineVersionId) return;
    let ignore = false;
    setGanttLoading(true);
    Promise.all([
      timeline.blocks(selectedTimelineVersionId).then((rows) => (Array.isArray(rows) ? rows : [])),
      curriculumItem.list(selectedTimelineVersionId, { page: 0, size: 3000 }),
      relation.list(selectedTimelineVersionId, { page: 0, size: 5000 }),
    ])
      .then(([blocks, items, rels]) => {
        if (ignore) return;
        setGanttData({ blocks, items: Array.isArray(items) ? items : [], relations: Array.isArray(rels) ? rels : [] });
      })
      .catch(() => {})
      .finally(() => { if (!ignore) setGanttLoading(false); });
    return () => { ignore = true; };
  }, [activeView, selectedTimelineVersionId]);

  const infoPanelContent = (
    <>
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

      <div className="mt-4 space-y-3 border-t border-white/60 dark:border-slate-700 pt-4">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/"
            className="rounded-xl border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-sky-400 dark:hover:bg-slate-600"
          >
            Töökavad
          </Link>
          {!data?.externalGraph && (
            <button
              type="button"
              onClick={() => {
                if (versions.length === 0) {
                  curriculumVersion.list(id).then(setVersions).catch(() => {});
                }
                setVersionsOpen(!versionsOpen);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="rounded-xl border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-sky-400 dark:hover:bg-slate-600"
            >
              Versioonid
            </button>
          )}
          <button
            type="button"
            className="rounded-xl border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            onClick={() => navigate('/guide')}
          >
            Juhend
          </button>
        </div>
        {data?.externalGraph ? (
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Graafist imporditud õppekava: täielik struktuur on vasakul põhivaates (moodulid, õpiväljundid) ning
            versioonide / elementide lehtedel.
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <AppShell currentNav="curriculums" fixedHeader stickySidebar>
      <div
        className={cn(
          'grid min-w-0 gap-6',
          hideInfoPanel ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]'
        )}
      >
        <main className="min-w-0 max-w-full overflow-x-hidden rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400">
                Detailvaade
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{data?.title || 'Õppekava'}</h1>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{data?.description || ''}</div>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Link
                to="/curriculums"
                className="rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Tagasi
              </Link>
              <Link
                to={`/curriculum/${id}/pdf-preview`}
                className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
              >
                PDF eelvaade
              </Link>
              {data?.externalPageIri && (
                <a
                  href={data.externalPageIri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-sky-200 bg-sky-50/90 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm hover:bg-sky-100 dark:border-sky-700/60 dark:bg-sky-900/40 dark:text-sky-400 dark:hover:bg-sky-900/60"
                >
                  Vaata graafis
                </a>
              )}
              {!data?.externalGraph && (
                <>
                  <Link
                    to={`/curriculum/new?edit=${id}`}
                    className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                  >
                    Muuda
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (versions.length === 0) {
                        curriculumVersion.list(id).then(setVersions).catch(() => {});
                      }
                      setVersionsOpen(!versionsOpen);
                    }}
                    className="rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    Versioonid
                  </button>
                  {data?.user?.id === user?.id && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm('Kas oled kindel, et soovid selle õppekava kustutada? Seda toimingut ei saa tagasi võtta.')) return;
                        curriculum.delete(id)
                          .then(() => navigate('/'))
                          .catch((e) => alert(e.message || 'Kustutamine ebaõnnestus'));
                      }}
                      className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                    >
                      Kustuta
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {versionParam && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-2 text-sm text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-400">
              Vaatad versiooni <strong>{versions.find((v) => v.id === versionParam)?.versionNumber ?? '...'}</strong>.{' '}
              <Link to={`/curriculum/${id}`} className="font-semibold text-amber-900 dark:text-amber-200 underline hover:no-underline">
                Tagasi viimase versiooni juurde
              </Link>
            </div>
          )}

          {versionsOpen && (
            <div className="mt-4 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80">
              <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">Versioonid</h3>
              {versions.length >= 2 && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 dark:border-slate-700 dark:bg-slate-900/40">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Võrdle:</span>
                  <select
                    value={compareA}
                    onChange={(e) => setCompareA(e.target.value)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">A</option>
                    {[...versions].sort((a, b) => (b.versionNumber ?? 0) - (a.versionNumber ?? 0)).map((v) => (
                      <option key={v.id} value={v.id}>#{v.versionNumber} · {v.state}</option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500">vs</span>
                  <select
                    value={compareB}
                    onChange={(e) => setCompareB(e.target.value)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">B</option>
                    {[...versions].sort((a, b) => (b.versionNumber ?? 0) - (a.versionNumber ?? 0)).map((v) => (
                      <option key={v.id} value={v.id}>#{v.versionNumber} · {v.state}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!compareA || !compareB || compareA === compareB}
                    onClick={() => navigate(`/curriculum/${id}/diff/${compareA}/${compareB}`)}
                    className="rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white shadow disabled:opacity-50"
                  >
                    Võrdle
                  </button>
                </div>
              )}
              {versions.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Laen…</p>
              ) : (
                <div className="space-y-2">
                  {[...versions]
                    .sort((a, b) => (b.versionNumber ?? 0) - (a.versionNumber ?? 0))
                    .map((v) => {
                      const isActive = versionParam ? v.id === versionParam : v.id === structure?.curriculumVersionId;
                      const ascending = [...versions].sort((a, b) => (a.versionNumber ?? 0) - (b.versionNumber ?? 0));
                      const idx = ascending.findIndex((x) => x.id === v.id);
                      const previous = idx > 0 ? ascending[idx - 1] : null;
                      return (
                        <div
                          key={v.id}
                          className={cn(
                            'flex items-center justify-between rounded-xl border px-3 py-2 text-sm',
                            isActive
                              ? 'border-sky-300 bg-sky-50/90 text-sky-900 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200'
                              : 'border-slate-200/80 bg-white/90 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          )}
                        >
                          <div>
                            <span className="font-semibold">Versioon {v.versionNumber}</span>
                            <span className={cn(
                              'ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                              v.state === 'FINAL' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400',
                              v.state === 'DRAFT' && 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
                              v.state === 'REVIEW' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                              v.state === 'ARCHIVED' && 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400',
                              v.state === 'CLOSED' && 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
                            )}>
                              {v.state}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isActive && (
                              <Link
                                to={`/curriculum/${id}?version=${v.id}`}
                                className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-700"
                                onClick={() => setVersionsOpen(false)}
                              >
                                Vaata
                              </Link>
                            )}
                            {isActive && (
                              <span className="text-xs font-semibold text-sky-600">Aktiivne</span>
                            )}
                            <button
                              type="button"
                              disabled={!previous}
                              onClick={() => previous && navigate(`/curriculum/${id}/diff/${previous.id}/${v.id}`)}
                              title={previous ? `Diff vs versioon ${previous.versionNumber}` : 'Esimesel versioonil pole eelmist'}
                              className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/50"
                            >
                              Diff vs eelmine
                            </button>
                            {v.state !== 'CLOSED' && versions.length > 1 && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm(`Kustuta versioon ${v.versionNumber}?`)) return;
                                  try {
                                    await curriculumVersion.delete(v.id);
                                    const updated = versions.filter((x) => x.id !== v.id);
                                    setVersions(updated);
                                    if (isActive && updated.length > 0) {
                                      const latest = [...updated].sort((a, b) => (b.versionNumber ?? 0) - (a.versionNumber ?? 0))[0];
                                      navigate(`/curriculum/${id}?version=${latest.id}`, { replace: true });
                                    }
                                  } catch (err) {
                                    alert(err.message || 'Kustutamine eba\u00f5nnestus');
                                  }
                                }}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                              >
                                Kustuta
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {!loading && data && (
            <div
              className="mt-5 inline-flex rounded-2xl border border-white/55 bg-white/35 p-1 shadow-[0_2px_10px_rgba(15,23,42,0.06)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80"
              role="tablist"
              aria-label="Õppekava vaade"
            >
              {[
                { key: 'structure', label: 'Struktuur' },
                { key: 'calendar', label: 'Kalender' },
                { key: 'gantt', label: 'Gantt' },
                { key: 'graph', label: 'Graafivaade' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeView === tab.key}
                  onClick={() => setActiveView(tab.key)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                    activeView === tab.key
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-10 text-center text-sm text-slate-600 dark:text-slate-400">Laen…</div>
          ) : data ? (
            <>
              {activeView === 'structure' && (
                <>
                  <p className="mt-6 rounded-2xl border border-sky-100/80 bg-sky-50/40 px-4 py-3 text-sm text-slate-600 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-slate-400">
                    <span className="font-semibold text-sky-800 dark:text-sky-400">Üldandmed</span> on koondatud paremale paneelile — keri seal alla,
                    et näha providerit, IRI-sid, allikat ja ajatemplid.
                  </p>

                  {structureLoading && (
                    <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">Laen struktuuri…</div>
                  )}

                  {!structureLoading && structure && (
                    <CurriculumStructureExplorer structure={structure} dataSource={structureSource} schoolWeeks={schoolWeeks} />
                  )}

                  {!structureLoading && !structure && !loading && (
                    <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      Struktuuri ei leitud. {!data.externalGraph && 'Kasuta "Edasi muutma" nuppu elementide lisamiseks.'}
                    </div>
                  )}
                </>
              )}

              {activeView === 'calendar' && (
                <div className="mt-8">
                  {selectedTimelineVersionId ? (
                    <>
                      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400 sm:hidden">← keri kõrvale, et näha tervet kalendrit →</p>
                      <div className="-mx-6 overflow-x-auto sm:mx-0">
                        <div className="min-w-[680px] px-6 sm:min-w-0 sm:px-0">
                          <CurriculumCalendar curriculumVersionId={selectedTimelineVersionId} schoolWeeks={schoolWeeks} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-[min(50vh,28rem)] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/40 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-700/50">
                      <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Kalendri andmed puuduvad</p>
                      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                        Selle õppekava jaoks ei leitud ühtegi versiooni, mille põhjal kalendrit kuvada.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeView === 'gantt' && (
                <div className="mt-8">
                  {ganttLoading ? (
                    <div className="text-center text-sm text-slate-600 dark:text-slate-400">Laen Gantt-vaadet…</div>
                  ) : selectedTimelineVersionId && ganttData.blocks.length > 0 ? (
                    <>
                      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400 sm:hidden">← keri kõrvale, et näha tervet Gantt'i →</p>
                      <div className="-mx-6 overflow-x-auto sm:mx-0">
                        <div className="min-w-[680px] px-6 sm:min-w-0 sm:px-0">
                          <CurriculumGantt
                            blocks={ganttData.blocks}
                            items={ganttData.items}
                            relations={ganttData.relations}
                            anchorDate={new Date().toISOString().slice(0, 10)}
                            onBlockClick={() => {}}
                            typeToColor={(type) => {
                              switch (type) {
                                case 'MODULE': return '#6366f1';
                                case 'TOPIC': return '#0ea5e9';
                                case 'LEARNING_OUTCOME': return '#10b981';
                                case 'TEST': return '#f43f5e';
                                case 'TASK': return '#f59e0b';
                                default: return '#94a3b8';
                              }
                            }}
                            schoolWeeks={schoolWeeks}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-[min(50vh,28rem)] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/40 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-700/50">
                      <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Gantt andmed puuduvad</p>
                      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                        Selle õppekava jaoks ei leitud ajakava andmeid, mille põhjal Gantt-diagrammi kuvada.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeView === 'graph' && (
                <div className="mt-6">
                  <GraphExplorerView
                    curriculumId={data.id}
                    versionId={versionParam || selectedTimelineVersionId}
                    onOpenInEditor={() => setActiveView('structure')}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="mt-10 text-center text-sm text-slate-600 dark:text-slate-400">Ei leitud.</div>
          )}
        </main>

        {!hideInfoPanel && (
        <aside
          className={cn(
            'hidden rounded-3xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-md sm:p-5 xl:block xl:sticky xl:z-30 xl:w-full xl:self-start xl:overflow-y-auto dark:border-slate-700 dark:bg-slate-900/80',
            SIDEBAR_STICKY_TOP,
            SIDEBAR_MAX_H
          )}
        >
          {infoPanelContent}
        </aside>
        )}
      </div>

      {/* Mobile floating Info button (< xl, only when info panel is relevant) */}
      {!hideInfoPanel && (
        <button
          type="button"
          onClick={() => setInfoOpenMobile(true)}
          aria-label="Ava info"
          className="fixed bottom-5 right-5 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-sky-600 pl-4 pr-5 text-sm font-semibold text-white shadow-lg transition duration-200 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 xl:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="8" r="0.5" fill="currentColor" />
          </svg>
          Info
        </button>
      )}

      {/* Mobile info drawer (< xl) */}
      <MobilePanelDrawer
        open={infoOpenMobile}
        onClose={() => setInfoOpenMobile(false)}
        side="right"
        title="Info"
        hideAt="xl"
      >
        {infoPanelContent}
      </MobilePanelDrawer>
    </AppShell>
  );
}
