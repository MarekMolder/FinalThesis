import { useState } from 'react';
import RowMenu from './RowMenu';
import {
  ChevronIcon, PlusIcon, MoreIcon, EditIcon, TrashIcon,
  ImportIcon, SearchIcon, LinkIcon, ExternalIcon, ClockIcon, CheckIcon,
  ModuleIcon, TopicIcon, OutcomeIcon, TestIcon, TaskIcon, MaterialIcon, KnobitIcon,
} from './treeIcons';

const CONTENT_TYPES = ['TASK', 'TEST', 'LEARNING_MATERIAL', 'KNOBIT'];

/* Tüübi → ikoon + silt. */
const TYPE_VISUALS = {
  MODULE:            { Icon: ModuleIcon,   label: 'Moodul' },
  TOPIC:             { Icon: TopicIcon,    label: 'Teema' },
  LEARNING_OUTCOME:  { Icon: OutcomeIcon,  label: 'Õpiväljund' },
  TASK:              { Icon: TaskIcon,     label: 'Ülesanne' },
  TEST:              { Icon: TestIcon,     label: 'Test' },
  LEARNING_MATERIAL: { Icon: MaterialIcon, label: 'Materjal' },
  KNOBIT:            { Icon: KnobitIcon,   label: 'Knobit' },
};

/* Tüübi visuaal: külgriba värv + medaljoni taust/tekst (staatilised klassid Tailwind purge'i jaoks). */
const TYPE_STYLE = {
  MODULE:            { rail: 'bg-indigo-400', medBg: 'bg-indigo-50 dark:bg-indigo-900/30',   medFg: 'text-indigo-600 dark:text-indigo-300' },
  TOPIC:             { rail: 'bg-violet-400', medBg: 'bg-violet-50 dark:bg-violet-900/30',   medFg: 'text-violet-600 dark:text-violet-300' },
  LEARNING_OUTCOME:  { rail: 'bg-teal-400',   medBg: 'bg-teal-50 dark:bg-teal-900/30',       medFg: 'text-teal-600 dark:text-teal-300' },
  TASK:              { rail: 'bg-amber-400',  medBg: 'bg-amber-50 dark:bg-amber-900/30',     medFg: 'text-amber-600 dark:text-amber-300' },
  TEST:              { rail: 'bg-rose-400',   medBg: 'bg-rose-50 dark:bg-rose-900/30',       medFg: 'text-rose-600 dark:text-rose-300' },
  LEARNING_MATERIAL: { rail: 'bg-purple-400', medBg: 'bg-purple-50 dark:bg-purple-900/30',   medFg: 'text-purple-600 dark:text-purple-300' },
  KNOBIT:            { rail: 'bg-sky-400',    medBg: 'bg-sky-50 dark:bg-sky-900/30',         medFg: 'text-sky-600 dark:text-sky-300' },
};

const CONTENT_ADD = [
  { type: 'TASK', label: 'Ülesanne', Icon: TaskIcon },
  { type: 'TEST', label: 'Test', Icon: TestIcon },
  { type: 'LEARNING_MATERIAL', label: 'Materjal', Icon: MaterialIcon },
  { type: 'KNOBIT', label: 'Knobit', Icon: KnobitIcon },
];

export default function TreeNode({
  item, children, allItems, mode, scheduleInfo,
  onEdit, onDelete, onAddChild, onImport,
  onSearchGraph, onRelatedGraph,
  selectMode, selected, onToggleSelect,
}) {
  const isExternal = item.sourceType === 'OPPEKAVAWEB' || item.sourceType === 'EXTERNAL';
  const isContentType = CONTENT_TYPES.includes(item.type);
  const [expanded, setExpanded] = useState(!isContentType);

  const style = TYPE_STYLE[item.type] ?? TYPE_STYLE.MODULE;
  const { Icon } = TYPE_VISUALS[item.type] ?? TYPE_VISUALS.MODULE;

  /* counts for module chips */
  let chips = null;
  if (item.type === 'MODULE') {
    const descendantIds = new Set();
    const collect = (pid) => {
      for (const i of (allItems ?? [])) {
        if (i.parentItemId === pid && !descendantIds.has(i.id)) { descendantIds.add(i.id); collect(i.id); }
      }
    };
    collect(item.id);
    const desc = (allItems ?? []).filter((i) => descendantIds.has(i.id));
    const topicCount = desc.filter((i) => i.type === 'TOPIC').length;
    const loCount = desc.filter((i) => i.type === 'LEARNING_OUTCOME').length;
    const contentCount = desc.filter((i) => CONTENT_TYPES.includes(i.type)).length;
    chips = (
      <div className="flex flex-wrap gap-1.5">
        {topicCount > 0 && <Chip>{topicCount} teemat</Chip>}
        {loCount > 0 && <Chip>{loCount} OÕ-d</Chip>}
        {contentCount > 0 && mode === 'content' && <Chip>{contentCount} sisu</Chip>}
      </div>
    );
  }

  const sizing = item.type === 'MODULE'
    ? { card: 'py-3', med: 'h-9 w-9', icon: 'h-[18px] w-[18px]', title: 'text-[14.5px]' }
    : isContentType
    ? { card: 'py-2', med: 'h-[25px] w-[25px]', icon: 'h-[14px] w-[14px]', title: 'text-[12px]' }
    : { card: 'py-2.5', med: 'h-7 w-7', icon: 'h-4 w-4', title: 'text-[12.5px]' };

  const indent = item.type === 'TOPIC' ? 'ml-2' : (item.type === 'LEARNING_OUTCOME' || isContentType) ? 'ml-3.5' : '';
  const hasChildren = !!children;
  const showCaret = item.type === 'MODULE' || item.type === 'TOPIC' || (item.type === 'LEARNING_OUTCOME' && mode === 'content') || (isContentType && hasChildren);
  const isSelected = selectMode && selected?.has(item.id);

  /* ---- + (lisa) menüü sisu ---- */
  const addMenu = buildAddMenu();
  /* ---- ⋯ (veel) menüü sisu ---- */
  const moreMenu = buildMoreMenu();

  function buildAddMenu() {
    if (mode === 'structure') {
      if (item.type === 'MODULE') {
        if (isExternal) return null;
        return (close) => (
          <>
            <RowMenu.Label>Lisa moodulisse</RowMenu.Label>
            <RowMenu.Item icon={<TopicIcon />} onClick={() => { onAddChild(item, 'TOPIC'); close(); }}>Teema</RowMenu.Item>
            <RowMenu.Item icon={<OutcomeIcon />} onClick={() => { onAddChild(item, 'LEARNING_OUTCOME'); close(); }}>Õpiväljund</RowMenu.Item>
            <RowMenu.Item icon={<TestIcon />} onClick={() => { onAddChild(item, 'TEST'); close(); }}>Test</RowMenu.Item>
            <RowMenu.Separator />
            <RowMenu.Item icon={<ImportIcon />} onClick={() => { onImport(item); close(); }}>Impordi graafist</RowMenu.Item>
          </>
        );
      }
      if (item.type === 'TOPIC') {
        return (close) => (
          <>
            <RowMenu.Label>Lisa teemasse</RowMenu.Label>
            <RowMenu.Item icon={<OutcomeIcon />} onClick={() => { onAddChild(item, 'LEARNING_OUTCOME'); close(); }}>Õpiväljund</RowMenu.Item>
            <RowMenu.Item icon={<TestIcon />} onClick={() => { onAddChild(item, 'TEST'); close(); }}>Test</RowMenu.Item>
            <RowMenu.Separator />
            <RowMenu.Item icon={<ImportIcon />} onClick={() => { onImport(item); close(); }}>Impordi graafist</RowMenu.Item>
          </>
        );
      }
      return null;
    }

    /* mode === 'content' */
    const isImportableParent = ['MODULE', 'TOPIC', 'LEARNING_OUTCOME'].includes(item.type);
    if (!isImportableParent) return null;
    return (close) => (
      <>
        {item.type === 'LEARNING_OUTCOME' && (
          <>
            <RowMenu.Label>Lisa sisu</RowMenu.Label>
            {CONTENT_ADD.map((c) => (
              <RowMenu.Item key={c.type} icon={<c.Icon />} onClick={() => { onAddChild(item, c.type); close(); }}>{c.label}</RowMenu.Item>
            ))}
            {(onSearchGraph || (onRelatedGraph && item.externalIri)) && <RowMenu.Separator />}
          </>
        )}
        {item.type !== 'LEARNING_OUTCOME' && (onSearchGraph || (onRelatedGraph && item.externalIri)) && (
          <RowMenu.Label>Graafist</RowMenu.Label>
        )}
        {onSearchGraph && (
          <RowMenu.Item icon={<SearchIcon />} onClick={() => { onSearchGraph(item); close(); }}>Otsi graafist</RowMenu.Item>
        )}
        {onRelatedGraph && item.externalIri && (
          <RowMenu.Item icon={<LinkIcon />} onClick={() => { onRelatedGraph(item); close(); }}>Seotud sisu</RowMenu.Item>
        )}
      </>
    );
  }

  function buildMoreMenu() {
    const canEdit = !isExternal && (mode === 'structure' || isContentType);
    const canDelete = mode === 'structure' || isContentType;
    if (!canEdit && !canDelete) return null;
    return (close) => (
      <>
        {canEdit && <RowMenu.Item icon={<EditIcon />} onClick={() => { onEdit(item); close(); }}>Muuda</RowMenu.Item>}
        {canDelete && <RowMenu.Item danger icon={<TrashIcon />} onClick={() => { onDelete(item); close(); }}>Kustuta</RowMenu.Item>}
      </>
    );
  }

  return (
    <div className={['relative rounded-[14px] border border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-800/70 transition-colors hover:border-slate-300/70 dark:hover:border-slate-600', indent, isSelected ? 'ring-2 ring-rose-300/70 dark:ring-rose-700' : ''].join(' ')}>
      {/* külgriba */}
      <span className={['pointer-events-none absolute left-0 top-2 bottom-2 w-[3px] rounded-full', style.rail].join(' ')} />

      <div className={['group flex items-center gap-2.5 pl-4 pr-3', sizing.card].join(' ')}>
        {selectMode && isContentType ? (
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={() => onToggleSelect?.(item)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 flex-shrink-0 rounded accent-rose-500 cursor-pointer"
          />
        ) : showCaret ? (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="flex h-4 w-4 flex-shrink-0 items-center justify-center text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300">
            <ChevronIcon className={['h-3.5 w-3.5 transition-transform', expanded ? '' : '-rotate-90'].join(' ')} />
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        {/* ikoon-medaljon */}
        <span className={['grid flex-shrink-0 place-items-center rounded-[10px]', sizing.med, style.medBg, style.medFg].join(' ')}>
          <Icon className={sizing.icon} />
        </span>

        {/* pealkiri + sildid */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0">
            {item.type !== 'LEARNING_OUTCOME' && !isContentType && (
              <div className="text-[9px] font-bold uppercase tracking-[.07em] text-slate-400 dark:text-slate-500">{TYPE_VISUALS[item.type]?.label}</div>
            )}
            <div className={['truncate font-semibold leading-snug text-slate-800 dark:text-slate-100', sizing.title].join(' ')}>{item.title}</div>
          </div>
          {chips}
        </div>

        {/* actions */}
        <div className="flex flex-shrink-0 items-center gap-1.5 opacity-70 transition-opacity group-hover:opacity-100">
          <ScheduleBadge scheduleInfo={scheduleInfo} />
          {(item.type === 'MODULE' || item.type === 'TOPIC' || (mode === 'structure' && item.type === 'LEARNING_OUTCOME')) && (
            <SourceBadge external={isExternal} externalIri={item.externalIri} />
          )}
          {isContentType && <SourceBadge external={isExternal} externalIri={item.externalIri} small />}

          {addMenu && (
            <RowMenu trigger={() => <IconBtn title="Lisa" as="span"><PlusIcon className="h-4 w-4" /></IconBtn>}>
              {addMenu}
            </RowMenu>
          )}
          {moreMenu ? (
            <RowMenu trigger={() => <IconBtn title="Veel" as="span"><MoreIcon className="h-4 w-4" /></IconBtn>}>
              {moreMenu}
            </RowMenu>
          ) : isExternal && mode === 'structure' && item.type !== 'MODULE' ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-2 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">Lukus</span>
          ) : null}
        </div>
      </div>

      {/* lapsed */}
      {hasChildren && expanded && (
        <div className={['pb-3 pr-3', item.type === 'MODULE' ? 'pl-5 pt-1' : 'pl-9 pt-0.5'].join(' ')}>
          <div className="flex flex-col gap-2">{children}</div>
        </div>
      )}
    </div>
  );
}

function Chip({ children }) {
  return <span className="rounded-full bg-slate-100 dark:bg-slate-700/60 px-2.5 py-0.5 text-[10.5px] font-semibold text-slate-500 dark:text-slate-300">{children}</span>;
}

function IconBtn({ children, title }) {
  return (
    <span
      title={title}
      className="grid h-[29px] w-[29px] place-items-center rounded-[9px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 cursor-pointer"
    >
      {children}
    </span>
  );
}

/* ───── Ajakava silt ───── */
function ScheduleBadge({ scheduleInfo }) {
  if (!scheduleInfo?.plannedStartAt) return null;
  const d = new Date(scheduleInfo.plannedStartAt);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const timeLabel = `${dd}.${mm} ${hh}:${min}`;
  const status = scheduleInfo.status;
  const isCompleted = status === 'COMPLETED';
  const isInProgress = status === 'IN_PROGRESS';
  const isCancelled = status === 'CANCELLED';

  const colorClass = isCompleted
    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
    : isCancelled
    ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 line-through'
    : isInProgress
    ? 'border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
    : 'border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';

  const statusLabel = isCompleted ? 'Tehtud' : isInProgress ? 'Pooleli' : isCancelled ? 'Tühistatud' : null;

  return (
    <span
      title={`Planeeritud: ${d.toLocaleString('et-EE')}${statusLabel ? ` · ${statusLabel}` : ''}`}
      className={['inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold', colorClass].join(' ')}
    >
      {isCompleted ? <CheckIcon className="h-2.5 w-2.5" /> : <ClockIcon className="h-2.5 w-2.5" />}
      {timeLabel}
      {statusLabel && <span className="ml-0.5">{`· ${statusLabel}`}</span>}
    </span>
  );
}

/* ───── Allikas silt ───── */
function SourceBadge({ external, externalIri }) {
  if (external) {
    if (externalIri) {
      return (
        <a
          href={externalIri}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Ava oppekava.edu.ee lehel"
          className="inline-flex items-center gap-1 rounded-lg border border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-400 transition-colors hover:bg-sky-100 dark:hover:bg-sky-900/50"
        >
          <ExternalIcon className="h-2.5 w-2.5" />
          Graaf
        </a>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-400">
        Väline
      </span>
    );
  }
  return (
    <span className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
      Lokaalne
    </span>
  );
}
