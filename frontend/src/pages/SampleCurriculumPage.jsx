import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout as apiLogout } from '../api';
import bgImg from '../assets/background.png';
import logoImg from '../assets/logo.png';
import CurriculumCalendar from '../components/curriculumTimeline/CurriculumCalendar';
import CurriculumGantt from '../components/curriculumTimeline/CurriculumGantt';
import TutorialOverlay from '../components/tutorial/TutorialOverlay';
import InfoTooltip from '../components/tutorial/InfoTooltip';
import TUTORIAL_STEPS from '../components/tutorial/tutorialSteps';
import useTutorial from '../hooks/useTutorial';
import {
  sampleCurriculum,
  sampleVersion,
  sampleItems,
  sampleSchedules,
  sampleRelations,
  sampleTimelineBlocks,
  sampleStructure,
} from '../data/sampleCurriculumData';
import { computeSchoolWeeks, findSchoolWeeksInRange, formatSchoolWeekLabel } from '../utils/schoolWeeks';

const HEADER_PT_CLASS = 'pt-[4.5rem]';
const SIDEBAR_STICKY_TOP = 'top-[4.5rem]';
const SIDEBAR_MAX_H = 'max-h-[calc(100vh-4.5rem)]';

function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

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
        <span key={w.weekNumber} className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700" title={formatSchoolWeekLabel(w)}>
          {'\u00D5'}{w.weekNumber}
        </span>
      ))}
    </span>
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

const CHILD_TYPE_LABELS = {
  TASK: '\u00DClesanne',
  TEST: 'Test',
  LEARNING_MATERIAL: '\u00D5ppematerjal',
  KNOBIT: 'Knobit',
  LEARNING_OUTCOME: '\u00D5piv\u00E4ljund',
  TOPIC: 'Teema',
  MODULE: 'Moodul',
};

const CHILD_TYPE_COLORS = {
  TASK: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200/80' },
  TEST: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200/80' },
  LEARNING_MATERIAL: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200/80' },
  KNOBIT: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200/80' },
};
const DEFAULT_CHILD_COLOR = { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200/80' };

function typeToColor(type) {
  switch (type) {
    case 'MODULE': return '#6366f1';
    case 'TOPIC': return '#0ea5e9';
    case 'LEARNING_OUTCOME': return '#10b981';
    case 'TEST': return '#f43f5e';
    case 'TASK': return '#f59e0b';
    default: return '#94a3b8';
  }
}

export default function SampleCurriculumPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const tutorial = useTutorial();
  const [view, setView] = useState('structure');
  const [openModules, setOpenModules] = useState(() => new Set([0]));

  const schoolWeeks = useMemo(() => {
    if (!sampleStructure?.schoolYearStartDate) return [];
    let breaks = [];
    if (sampleStructure.schoolBreaksJson) {
      try { breaks = JSON.parse(sampleStructure.schoolBreaksJson); } catch { breaks = []; }
    }
    return computeSchoolWeeks(sampleStructure.schoolYearStartDate, breaks);
  }, []);

  const calendarStaticData = useMemo(() => ({
    blocks: sampleTimelineBlocks,
    items: sampleItems,
    relations: sampleRelations,
  }), []);

  const anchorDate = sampleVersion.schoolYearStartDate || '2025-09-01';

  const modules = sampleStructure.modules || [];

  function toggleModule(idx) {
    setOpenModules((prev) => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  }

  function logout() {
    apiLogout();
  }

  return (
    <div className="min-h-full">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImg})` }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 -z-10 bg-white/55" aria-hidden="true" />

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/35 bg-white/35 shadow-[0_12px_36px_rgba(15,23,42,0.12)] backdrop-blur-xl">
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
              <div className="text-sm font-semibold text-slate-900">{user?.label || '\u00D5petaja'}</div>
              <div className="text-xs text-slate-600">{user?.email || '\u2014'}</div>
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

      {/* Grid: sidebar + main */}
      <div className={cn(HEADER_PT_CLASS, 'mx-auto grid min-w-0 max-w-[1400px] gap-6 px-2 py-6 grid-cols-[auto_minmax(0,1fr)]')}>
        {/* Sidebar */}
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
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M7 4h10a2 2 0 0 1 2 2v14l-5-3-5 3-5-3V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              }
            />
            <SidebarItem
              to="/sample"
              label="Näidisõppekava"
              active
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

        {/* Main content */}
        <main className="min-w-0 max-w-full overflow-x-hidden rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md">

          {/* Metadata section */}
          <section data-tutorial="metadata">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                  Näidisõppekava
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {sampleCurriculum.title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {sampleCurriculum.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex rounded-full border border-sky-200/80 bg-sky-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                    {sampleCurriculum.subjectLabel}
                  </span>
                  <span className="inline-flex rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                    {sampleCurriculum.grade}. klass
                  </span>
                  <span className="inline-flex rounded-full border border-amber-200/80 bg-amber-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                    {sampleCurriculum.volumeHours} tundi
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200/80 bg-slate-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                    {sampleCurriculum.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <InfoTooltip title={TUTORIAL_STEPS[1].title} content={TUTORIAL_STEPS[1].content} />
                <button
                  type="button"
                  onClick={() => tutorial.startTour()}
                  className="shrink-0 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg"
                >
                  Alusta tutvustust
                </button>
              </div>
            </div>
          </section>

          {/* View switcher */}
          <div className="mt-6 flex gap-2">
            {[
              { key: 'structure', label: 'Struktuur' },
              { key: 'calendar', label: 'Kalender' },
              { key: 'gantt', label: 'Gantt' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setView(tab.key)}
                className={cn(
                  'rounded-2xl px-4 py-2 text-sm font-semibold transition',
                  view === tab.key
                    ? 'bg-sky-600/90 text-white shadow-sm'
                    : 'border border-white/55 bg-white/55 text-slate-700 hover:bg-white/70'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Structure view */}
          {view === 'structure' && (
            <section className="mt-6 min-w-0 space-y-6">
              <header data-tutorial="structure" className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Struktuur</h2>
                <InfoTooltip title={TUTORIAL_STEPS[2].title} content={TUTORIAL_STEPS[2].content} />
              </header>

              <div className="space-y-3">
                {modules.map((mod, idx) => {
                  const expanded = openModules.has(idx);
                  const loList = mod.learningOutcomes || [];
                  const loCount = loList.length;

                  return (
                    <div
                      key={mod.id || idx}
                      id={`structure-mod-${idx}`}
                      className="scroll-mt-24 overflow-hidden rounded-3xl border border-indigo-200/50 bg-white/90 shadow-md backdrop-blur-sm sm:scroll-mt-28"
                    >
                      {/* Module gradient header */}
                      <div {...(idx === 0 ? { 'data-tutorial': 'topics' } : {})} className="flex min-h-[4.5rem] items-stretch bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600">
                        <button
                          type="button"
                          onClick={() => toggleModule(idx)}
                          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-white sm:gap-4 sm:px-5 sm:py-4"
                        >
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/25 sm:h-12 sm:w-12">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden>
                              <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h5A2.5 2.5 0 0 1 14 6.5V10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 9.5v-3Z" stroke="currentColor" strokeWidth="1.6" />
                              <path d="M10 14h7.5A2.5 2.5 0 0 1 20 16.5V18a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-4Z" stroke="currentColor" strokeWidth="1.6" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-white/85">Moodul {idx + 1}</div>
                            <div className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">{mod.title}</div>
                            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold text-white/90 sm:text-[11px]">
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
                                    {'\u00D5'}{w.weekNumber}
                                  </span>
                                ));
                              })()}
                            </div>
                          </div>
                          <ChevronDownIcon open={expanded} className="text-white/90" />
                        </button>
                      </div>

                      {/* Module body */}
                      {expanded && (
                        <div className="border-t border-indigo-100/60 bg-gradient-to-b from-slate-50/50 to-white/90 px-4 py-4 sm:px-6 sm:py-5">
                          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" />
                            <span>Teemad ja {'\u00F5'}piv{'\u00E4'}ljundid</span>
                            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" />
                          </div>

                          {(() => {
                            // Group items by school week (same pattern as CurriculumDetailPage)
                            const sorted = [...loList].sort((a, b) => {
                              const da = parseItemDate(a.plannedStartAt);
                              const db = parseItemDate(b.plannedStartAt);
                              if (!da && !db) return 0;
                              if (!da) return 1;
                              if (!db) return -1;
                              return da - db;
                            });

                            const entries = [];
                            const emittedWeeks = new Set();
                            for (const lo of sorted) {
                              const start = parseItemDate(lo.plannedStartAt);
                              if (start && schoolWeeks?.length) {
                                const end = parseItemDate(lo.plannedEndAt) || start;
                                const weeks = findSchoolWeeksInRange(start, end, schoolWeeks);
                                for (const sw of weeks) {
                                  if (!emittedWeeks.has(sw.weekNumber)) {
                                    emittedWeeks.add(sw.weekNumber);
                                    entries.push({ type: 'week-header', week: sw, label: formatSchoolWeekLabel(sw) });
                                  }
                                }
                              }
                              entries.push({ type: 'item', lo });
                            }

                            let itemIndex = 0;
                            const totalItems = entries.filter((e) => e.type === 'item').length;

                            return (
                              <div className="space-y-0">
                                {entries.map((entry, entryIdx) => {
                                  if (entry.type === 'week-header') {
                                    return (
                                      <div key={`wh-${entry.week.weekNumber}`} className="flex items-center gap-2 pb-1 pt-3">
                                        <span className="text-[11px] font-semibold text-indigo-600">{entry.label}</span>
                                        <span className="h-px flex-1 bg-gradient-to-r from-indigo-200 to-transparent" />
                                      </div>
                                    );
                                  }

                                  const lo = entry.lo;
                                  const currentIdx = itemIndex++;
                                  const isTest = lo.type === 'TEST';
                                  const typeLabel = CHILD_TYPE_LABELS[lo.type] || lo.type;
                                  const eeldab = Array.isArray(lo.eeldab) ? lo.eeldab : [];
                                  const children = lo.children || [];
                                  const isFirstTest = isTest && idx === 0 && loList.findIndex((x) => x.type === 'TEST') === loList.indexOf(lo);

                                  return (
                                    <div key={lo.id || entryIdx} className="flex gap-3 sm:gap-4">
                                      {/* Tree connector */}
                                      <div className="flex w-8 shrink-0 flex-col items-center sm:w-9">
                                        {currentIdx > 0 ? <div className="h-3 w-px border-l-2 border-dashed border-slate-300" aria-hidden /> : <div className="h-3" />}
                                        <div
                                          className={cn(
                                            'z-10 h-3.5 w-3.5 shrink-0 rounded-full ring-[5px] ring-white shadow-md sm:h-4 sm:w-4',
                                            isTest ? 'bg-rose-500 shadow-rose-200/50' : 'bg-emerald-500 shadow-emerald-200/50'
                                          )}
                                          aria-hidden
                                        />
                                        {currentIdx < totalItems - 1 ? (
                                          <div className="min-h-[4.5rem] w-px flex-1 border-l-2 border-dashed border-slate-300 sm:min-h-[5rem]" aria-hidden />
                                        ) : (
                                          <div className="h-2" aria-hidden />
                                        )}
                                      </div>

                                      {/* Card */}
                                      <div className="min-w-0 flex-1 pb-5 sm:pb-6" {...(isFirstTest ? { 'data-tutorial': 'tests' } : {})}>
                                        <div
                                          className={cn(
                                            'rounded-2xl border bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-5 sm:py-4',
                                            isTest ? 'border-rose-100/90' : 'border-emerald-100/90'
                                          )}
                                        >
                                          <div className={cn('text-[10px] font-bold uppercase tracking-wider', isTest ? 'text-rose-700' : 'text-emerald-700')}>
                                            {typeLabel}
                                            <WeekBadges startAt={lo.plannedStartAt} endAt={lo.plannedEndAt} schoolWeeks={schoolWeeks} />
                                          </div>
                                          <p className="mt-1.5 text-sm font-semibold leading-snug text-slate-900 sm:text-[15px]">{lo.title}</p>
                                          {lo.description && (
                                            <p className="mt-1 text-[11px] leading-relaxed text-slate-500 line-clamp-3">{lo.description}</p>
                                          )}

                                          {/* EELDAB relations */}
                                          {eeldab.length > 0 && (
                                            <div className="mt-3 rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50/95 to-orange-50/40 px-3 py-2 shadow-sm">
                                              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                                                <span className="grid h-5 w-5 place-items-center rounded-md bg-amber-200/80 text-amber-950" aria-hidden>
                                                  {'\u2192'}
                                                </span>
                                                Eeldab <span className="font-normal normal-case text-amber-800/80">(enne seda peaks valmis olema)</span>
                                              </div>
                                              <div className="mt-2 flex flex-wrap gap-1.5">
                                                {eeldab.map((r) => (
                                                  <span
                                                    key={r.id || r.title}
                                                    className="inline-flex max-w-full rounded-lg border border-amber-200/80 bg-amber-100/50 px-2 py-0.5 text-[11px] font-medium text-amber-900"
                                                    title={r.title}
                                                  >
                                                    <span className="truncate">{r.title}</span>
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Children (learning outcomes under topic) */}
                                          {children.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200" />
                                                <span>Õpiväljundid ({children.length})</span>
                                                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200" />
                                              </div>
                                              {children.map((child) => (
                                                <div
                                                  key={child.id}
                                                  className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-sm"
                                                >
                                                  <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                                                    Õpiväljund
                                                    <WeekBadges startAt={child.plannedStartAt} endAt={child.plannedEndAt} schoolWeeks={schoolWeeks} />
                                                  </div>
                                                  <p className="text-sm font-medium leading-snug text-slate-900">{child.title}</p>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Calendar view */}
          {view === 'calendar' && (
            <section className="mt-6">
              <header data-tutorial="calendar" className="mb-4 flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Kalender</h2>
                <InfoTooltip title={TUTORIAL_STEPS[5].title} content={TUTORIAL_STEPS[5].content} />
              </header>
              <CurriculumCalendar
                curriculumVersionId={null}
                schoolWeeks={schoolWeeks}
                staticData={calendarStaticData}
              />
            </section>
          )}

          {/* Gantt view */}
          {view === 'gantt' && (
            <section className="mt-6">
              <header data-tutorial="gantt" className="mb-4 flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Gantt</h2>
                <InfoTooltip title={TUTORIAL_STEPS[6].title} content={TUTORIAL_STEPS[6].content} />
              </header>
              <CurriculumGantt
                blocks={sampleTimelineBlocks}
                items={sampleItems}
                relations={sampleRelations}
                anchorDate={anchorDate}
                onBlockClick={() => {}}
                typeToColor={typeToColor}
                schoolWeeks={schoolWeeks}
              />
            </section>
          )}

          {/* CTA section */}
          <section data-tutorial="cta" className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-white/60 bg-gradient-to-br from-white/80 via-sky-50/30 to-white/70 p-8 text-center shadow-sm backdrop-blur-sm">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Valmis oma {'\u00F5'}ppekava looma?
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-slate-600">
              N{'\u00FC\u00FC'}d tead, kuidas s{'\u00FC'}steem t{'\u00F6\u00F6'}tab. Loo oma esimene {'\u00F5'}ppekava ja planeeri kogu {'\u00F5'}ppeaasta!
            </p>
            <button
              type="button"
              onClick={() => navigate('/create')}
              className="rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition"
            >
              Loo oma {'\u00F5'}ppekava!
            </button>
          </section>
        </main>
      </div>

      {/* Tutorial overlay */}
      <TutorialOverlay
        isActive={tutorial.isActive}
        currentStep={tutorial.currentStep}
        totalSteps={tutorial.totalSteps}
        stepConfig={tutorial.stepConfig}
        onNext={tutorial.nextStep}
        onPrev={tutorial.prevStep}
        onEnd={tutorial.endTour}
        onViewChange={setView}
      />
    </div>
  );
}
