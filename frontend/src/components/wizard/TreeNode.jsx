import { useState } from 'react';

export default function TreeNode({ item, children, allItems, mode, scheduleInfo, onEdit, onDelete, onAddChild, onImport, renderExtraButtons, depth = 0 }) {
  const isExternal = item.sourceType === 'OPPEKAVAWEB' || item.sourceType === 'EXTERNAL';
  const CONTENT_TYPES = ['TASK', 'TEST', 'LEARNING_MATERIAL', 'KNOBIT'];
  const [expanded, setExpanded] = useState(!CONTENT_TYPES.includes(item.type));

  /* ───── MODULE ───── */
  if (item.type === 'MODULE') {
    const childItems = (allItems ?? []).filter((i) => i.parentItemId === item.id);
    const descendantIds = new Set();
    const collectDescendants = (parentId) => {
      for (const i of (allItems ?? [])) {
        if (i.parentItemId === parentId && !descendantIds.has(i.id)) {
          descendantIds.add(i.id);
          collectDescendants(i.id);
        }
      }
    };
    collectDescendants(item.id);
    const allDesc = (allItems ?? []).filter((i) => descendantIds.has(i.id));
    const topicCount = childItems.filter((i) => i.type === 'TOPIC').length;
    const loCount = allDesc.filter((i) => i.type === 'LEARNING_OUTCOME').length;
    const contentCount = allDesc.filter((i) => CONTENT_TYPES.includes(i.type)).length;

    return (
      <div className="mb-3 overflow-hidden rounded-[20px] border border-indigo-200/20 bg-white/90 shadow-[0_2px_12px_rgba(15,23,42,.07)] backdrop-blur-sm">
        <div className="flex min-h-[60px] items-stretch" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6d28d9 50%, #0284c7 100%)' }}>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-white"
          >
            <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[14px] bg-white/20 ring-1 ring-white/25 text-base">
              📦
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-bold uppercase tracking-[.08em] text-white/70">Moodul</div>
              <div className="truncate text-sm font-bold leading-snug">{item.title}</div>
              {(topicCount > 0 || loCount > 0 || contentCount > 0) && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {topicCount > 0 && <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-white/90">{topicCount} teemat</span>}
                  {loCount > 0 && <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-white/90">{loCount} OÕ-d</span>}
                  {contentCount > 0 && mode === 'content' && <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-white/90">{contentCount} sisu</span>}
                </div>
              )}
            </div>
            <svg className={['h-[18px] w-[18px] text-white/70 transition-transform', expanded ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div className="flex items-center gap-1.5 border-l border-white/15 px-3">
            <ScheduleBadge scheduleInfo={scheduleInfo} />
            {mode === 'structure' && !isExternal && (
              <>
                <ModuleBtn onClick={() => onAddChild(item, 'TOPIC')}>+ Teema</ModuleBtn>
                <ModuleBtn onClick={() => onAddChild(item, 'LEARNING_OUTCOME')}>+ OÕ</ModuleBtn>
                <ModuleBtn onClick={() => onAddChild(item, 'TEST')}>+ Test</ModuleBtn>
                <ModuleBtn onClick={() => onImport(item)}>⬇</ModuleBtn>
                <ModuleBtn onClick={() => onEdit(item)}>✎</ModuleBtn>
              </>
            )}
            {renderExtraButtons?.(item)}
            {item.externalIri && (
              <a
                href={item.externalIri}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Ava oppekava.edu.ee lehel"
                className="inline-flex items-center gap-1 rounded-[9px] border border-white/30 bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-white/25 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Graaf
              </a>
            )}
            {mode === 'structure' && (
              <ModuleBtn onClick={() => onDelete(item)} danger>✕</ModuleBtn>
            )}
          </div>
        </div>
        {expanded && children && (
          <div className="px-4 py-3">
            {children}
          </div>
        )}
      </div>
    );
  }

  /* ───── TOPIC ───── */
  if (item.type === 'TOPIC') {
    return (
      <div className={['mb-1.5 overflow-hidden rounded-[14px] border border-violet-200/20 bg-violet-50/80', depth > 0 ? 'ml-2' : ''].join(' ')}>
        <div className="flex items-center gap-2 bg-violet-100/60 px-3 py-2.5 border-b border-violet-200/10">
          <button onClick={() => setExpanded((v) => !v)} className="text-violet-500 flex-shrink-0">
            <svg className={['h-3 w-3 transition-transform', expanded ? 'rotate-0' : '-rotate-90'].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-violet-600 to-indigo-600 text-[11px] font-bold text-white">T</div>
          <span className="flex-1 truncate text-[13px] font-semibold text-violet-950">{item.title}</span>
          <ScheduleBadge scheduleInfo={scheduleInfo} small />
          <SourceBadge external={isExternal} externalIri={item.externalIri} />
          {mode === 'structure' && (
            <div className="flex gap-1">
              <NodeBtn sm onClick={() => onAddChild(item, 'LEARNING_OUTCOME')}>+ OÕ</NodeBtn>
              <NodeBtn sm onClick={() => onAddChild(item, 'TEST')}>+ Test</NodeBtn>
              {!isExternal && <NodeBtn sm onClick={() => onEdit(item)}>✎</NodeBtn>}
              <NodeBtn sm onClick={() => onDelete(item)} danger>✕</NodeBtn>
            </div>
          )}
          {renderExtraButtons?.(item)}
        </div>
        {expanded && children && <div className="px-2.5 py-2 pl-10">{children}</div>}
      </div>
    );
  }

  /* ───── LEARNING OUTCOME ───── */
  if (item.type === 'LEARNING_OUTCOME') {
    return (
      <div className={['mb-1.5 overflow-hidden rounded-[14px] border bg-white/90 shadow-[0_1px_4px_rgba(15,23,42,.05)]', isExternal ? 'border-sky-200/25' : 'border-emerald-200/20', depth > 0 ? 'ml-3' : ''].join(' ')}>
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className={['flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white', isExternal ? 'bg-gradient-to-br from-sky-500 to-sky-700' : 'bg-gradient-to-br from-emerald-500 to-emerald-700'].join(' ')}>OÕ</div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-bold uppercase tracking-[.06em] text-slate-400">Õpiväljund{item.parentItemId ? '' : ' · iseseisev'}{isExternal ? ' · väline' : ''}</div>
            <div className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">{item.title}</div>
          </div>
          <ScheduleBadge scheduleInfo={scheduleInfo} small />
          <SourceBadge external={isExternal} externalIri={item.externalIri} />
          <div className="flex flex-shrink-0 gap-1">
            {mode === 'content' && (
              <NodeBtn sm onClick={() => onAddChild(item, null)}>+ Sisu</NodeBtn>
            )}
            {renderExtraButtons?.(item)}
            {mode === 'structure' && !isExternal && (
              <NodeBtn sm onClick={() => onEdit(item)}>✎</NodeBtn>
            )}
            {mode === 'structure' && isExternal && (
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-400">🔒 Lukus</span>
            )}
            {mode === 'structure' && (
              <NodeBtn sm onClick={() => onDelete(item)} danger>✕</NodeBtn>
            )}
          </div>
        </div>
        {mode === 'content' && children && (
          <div className="border-t border-dashed border-emerald-100/50 px-2.5 py-2 pl-10">{children}</div>
        )}
      </div>
    );
  }

  /* ───── CONTENT ITEMS (TASK / TEST / LEARNING_MATERIAL / KNOBIT) ───── */
  const subConfig = {
    TASK:              { bg: 'bg-amber-50/80',  border: 'border-amber-200/50',  iconBg: 'from-amber-500 to-amber-600',   text: 'text-amber-900',  icon: '✏️' },
    TEST:              { bg: 'bg-red-50/80',    border: 'border-red-200/50',    iconBg: 'from-red-500 to-red-600',       text: 'text-red-900',    icon: '🧪' },
    LEARNING_MATERIAL: { bg: 'bg-fuchsia-50/80', border: 'border-purple-200/50', iconBg: 'from-violet-500 to-purple-600', text: 'text-purple-900', icon: '📄' },
    KNOBIT:            { bg: 'bg-blue-50/80',   border: 'border-blue-200/50',   iconBg: 'from-blue-600 to-blue-700',     text: 'text-blue-900',   icon: '⚡' },
  };
  const cfg = subConfig[item.type] ?? { bg: 'bg-white/60', border: 'border-slate-200', iconBg: 'from-slate-400 to-slate-500', text: 'text-slate-800', icon: '·' };
  const hasChildren = !!children;

  return (
    <div className={['mb-1 overflow-hidden rounded-[10px] border', cfg.border, cfg.bg].join(' ')}>
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        {hasChildren && (
          <button onClick={() => setExpanded((v) => !v)} className="flex-shrink-0 text-slate-400 hover:text-slate-600">
            <svg className={['h-3 w-3 transition-transform', expanded ? 'rotate-90' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
        <div className={['flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-br text-[9px] font-bold text-white', cfg.iconBg].join(' ')}>
          {cfg.icon}
        </div>
        <span className={['flex-1 truncate text-[11px] font-semibold', cfg.text].join(' ')}>{item.title}</span>
        <ScheduleBadge scheduleInfo={scheduleInfo} small />
        <SourceBadge external={isExternal} externalIri={item.externalIri} small />
        {renderExtraButtons?.(item)}
        <div className="flex gap-1">
          {!isExternal && <NodeBtn xs onClick={() => onEdit(item)}>✎</NodeBtn>}
          {isExternal && <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">🔒</span>}
          <NodeBtn xs onClick={() => onDelete(item)} danger>✕</NodeBtn>
        </div>
      </div>
      {hasChildren && expanded && <div className="border-t border-inherit px-3 py-1.5 pl-6">{children}</div>}
    </div>
  );
}

/* ───── Module header buttons (white on transparent) ───── */
function ModuleBtn({ onClick, children, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-[10px] border px-2.5 py-1 text-[10px] font-semibold transition-colors',
        danger
          ? 'border-red-300/40 bg-red-500/20 text-white hover:bg-red-500/30'
          : 'border-white/25 bg-white/20 text-white hover:bg-white/30',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/* ───── Generic small buttons ───── */
function NodeBtn({ onClick, children, sm, xs, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-[9px] border font-semibold transition-colors',
        xs ? 'px-2 py-0.5 text-[10px]' : sm ? 'px-2.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        danger
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-slate-200/80 bg-white/70 text-slate-600 hover:bg-white/90',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/* ───── Schedule badge ───── */
function ScheduleBadge({ scheduleInfo, small }) {
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
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : isCancelled
    ? 'border-slate-200 bg-slate-50 text-slate-500 line-through'
    : isInProgress
    ? 'border-blue-200 bg-blue-50 text-blue-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';

  const statusLabel = isCompleted ? 'Tehtud' : isInProgress ? 'Pooleli' : isCancelled ? 'Tühistatud' : null;

  return (
    <span
      title={`Planeeritud: ${d.toLocaleString('et-EE')}${statusLabel ? ` · ${statusLabel}` : ''}`}
      className={['inline-flex items-center gap-1 rounded-[7px] border font-semibold', colorClass, small ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'].join(' ')}
    >
      {isCompleted ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      )}
      {timeLabel}
      {statusLabel && <span className="ml-0.5">{`· ${statusLabel}`}</span>}
    </span>
  );
}

/* ───── Source badge ───── */
function SourceBadge({ external, externalIri, small }) {
  if (external) {
    if (externalIri) {
      return (
        <a
          href={externalIri}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Ava oppekava.edu.ee lehel"
          className={['inline-flex items-center gap-1 rounded-[7px] border border-sky-200 bg-sky-50 font-semibold text-sky-700 hover:bg-sky-100 transition-colors', small ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'].join(' ')}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Graaf
        </a>
      );
    }
    return (
      <span className={['rounded-[7px] border border-sky-200 bg-sky-50 font-semibold text-sky-700', small ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'].join(' ')}>
        🔗 Väline
      </span>
    );
  }
  return (
    <span className={['rounded-[7px] border border-emerald-200 bg-emerald-50 font-semibold text-emerald-700', small ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'].join(' ')}>
      Lokaalne
    </span>
  );
}
