import { useState } from 'react';

export default function TreeNode({ item, children, mode, onEdit, onDelete, onAddChild, onImport, renderExtraButtons, depth = 0 }) {
  const isExternal = item.sourceType === 'OPPEKAVAWEB' || item.sourceType === 'EXTERNAL';
  const [expanded, setExpanded] = useState(true);

  if (item.type === 'MODULE') {
    return (
      <div className="mb-3 overflow-hidden rounded-3xl border border-indigo-200/50 bg-white/90 shadow-sm backdrop-blur-sm">
        <div className="flex min-h-[56px] items-stretch bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-white"
          >
            <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/25">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h5A2.5 2.5 0 0 1 14 6.5V10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 9.5v-3Z"/><path d="M10 14h7.5A2.5 2.5 0 0 1 20 16.5V18a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-4Z"/>
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-bold uppercase tracking-wider text-white/70">Moodul</div>
              <div className="truncate text-sm font-bold">{item.title}</div>
            </div>
            <svg className={['h-4 w-4 text-white/70 transition-transform', expanded ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div className="flex items-center gap-1.5 border-l border-white/15 px-3">
            {mode === 'structure' && !isExternal && (
              <>
                <NodeBtn onClick={() => onAddChild(item, 'TOPIC')}>+ Teema</NodeBtn>
                <NodeBtn onClick={() => onAddChild(item, 'LEARNING_OUTCOME')}>+ OÕ</NodeBtn>
                <NodeBtn onClick={() => onImport(item)}>⬇</NodeBtn>
                <NodeBtn onClick={() => onEdit(item)}>✎</NodeBtn>
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
                className="inline-flex items-center gap-1 rounded-lg border border-white/30 bg-white/15 px-2 py-0.5 text-[10px] text-white hover:bg-white/25 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Graaf
              </a>
            )}
            {mode === 'structure' && (
              <NodeBtn onClick={() => onDelete(item)} danger>✕</NodeBtn>
            )}
          </div>
        </div>
        {expanded && children && (
          <div className="border-t border-indigo-100/60 bg-gradient-to-b from-slate-50/50 to-white/90 px-4 py-3">
            {children}
          </div>
        )}
      </div>
    );
  }

  if (item.type === 'TOPIC') {
    return (
      <div className={['mb-2 overflow-hidden rounded-2xl border border-violet-200/50 bg-violet-50/60', depth > 0 ? 'ml-2' : ''].join(' ')}>
        <div className="flex items-center gap-2 bg-violet-100/50 px-3 py-2">
          <button onClick={() => setExpanded((v) => !v)} className="text-violet-500">
            <svg className={['h-3.5 w-3.5 transition-transform', expanded ? 'rotate-0' : '-rotate-90'].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-[10px] font-bold text-white">T</div>
          <span className="flex-1 truncate text-xs font-semibold text-violet-900">{item.title}</span>
          <SourceBadge external={isExternal} externalIri={item.externalIri} />
          {mode === 'structure' && (
            <div className="flex gap-1">
              {!isExternal && <NodeBtn sm onClick={() => onAddChild(item, 'LEARNING_OUTCOME')}>+ OÕ</NodeBtn>}
              {!isExternal && <NodeBtn sm onClick={() => onEdit(item)}>✎</NodeBtn>}
              <NodeBtn sm onClick={() => onDelete(item)} danger>✕</NodeBtn>
            </div>
          )}
          {renderExtraButtons?.(item)}
        </div>
        {expanded && children && <div className="px-3 py-2">{children}</div>}
      </div>
    );
  }

  if (item.type === 'LEARNING_OUTCOME') {
    return (
      <div className={['mb-1.5 overflow-hidden rounded-2xl border bg-white/90 shadow-sm', isExternal ? 'border-sky-200/50' : 'border-emerald-200/50', depth > 0 ? 'ml-3' : ''].join(' ')}>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className={['flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white', isExternal ? 'bg-gradient-to-br from-sky-500 to-sky-700' : 'bg-gradient-to-br from-emerald-500 to-emerald-700'].join(' ')}>OÕ</div>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Õpiväljund{item.parentItemId ? '' : ' · iseseisev'}</div>
            <div className="text-xs font-medium text-slate-800 line-clamp-2">{item.title}</div>
          </div>
          <SourceBadge external={isExternal} externalIri={item.externalIri} />
          <div className="flex flex-shrink-0 gap-1">
            {mode === 'content' && (
              <NodeBtn sm onClick={() => onAddChild(item, null)}>+ Sisu</NodeBtn>
            )}
            {renderExtraButtons?.(item)}
            {mode === 'structure' && !isExternal && (
              <NodeBtn sm onClick={() => onEdit(item)}>✎</NodeBtn>
            )}
            {mode === 'structure' && (
              <NodeBtn sm onClick={() => onDelete(item)} danger>✕</NodeBtn>
            )}
          </div>
        </div>
        {mode === 'content' && children && (
          <div className="border-t border-dashed border-emerald-100 px-3 py-2 pl-9">{children}</div>
        )}
      </div>
    );
  }

  const subStyles = {
    TASK: 'border-amber-200/60 bg-amber-50/60 text-amber-800',
    TEST: 'border-red-200/60 bg-red-50/60 text-red-800',
    LEARNING_MATERIAL: 'border-violet-200/60 bg-violet-50/60 text-violet-800',
    KNOBIT: 'border-blue-200/60 bg-blue-50/60 text-blue-800',
  };
  const subIcons = { TASK: '✏️', TEST: '🧪', LEARNING_MATERIAL: '📄', KNOBIT: '⚡' };
  const hasChildren = !!children;

  return (
    <div className={['mb-1 overflow-hidden rounded-xl border', subStyles[item.type] ?? 'border-slate-200 bg-white/60'].join(' ')}>
      <div className="flex items-center gap-2 px-3 py-1.5">
        {hasChildren ? (
          <button onClick={() => setExpanded((v) => !v)} className="flex-shrink-0 text-slate-400 hover:text-slate-600">
            <svg className={['h-3 w-3 transition-transform', expanded ? 'rotate-90' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        ) : (
          <span>{subIcons[item.type] ?? '·'}</span>
        )}
        {hasChildren && <span>{subIcons[item.type] ?? '·'}</span>}
        <span className="flex-1 truncate text-xs font-medium">{item.title}</span>
        <SourceBadge external={isExternal} externalIri={item.externalIri} small />
        {renderExtraButtons?.(item)}
        <div className="flex gap-1">
          {!isExternal && <NodeBtn xs onClick={() => onEdit(item)}>✎</NodeBtn>}
          <NodeBtn xs onClick={() => onDelete(item)} danger>✕</NodeBtn>
        </div>
      </div>
      {hasChildren && expanded && <div className="border-t border-inherit px-3 py-1.5 pl-6">{children}</div>}
    </div>
  );
}

function NodeBtn({ onClick, children, sm, xs, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg border font-semibold transition-colors',
        xs ? 'px-1.5 py-0.5 text-[9px]' : sm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        danger
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-slate-200/80 bg-white/70 text-slate-600 hover:bg-white/90',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

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
          className={['inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 font-semibold text-sky-700 hover:bg-sky-100 transition-colors', small ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'].join(' ')}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Graaf
        </a>
      );
    }
    return (
      <span className={['rounded-lg border border-sky-200 bg-sky-50 font-semibold text-sky-700', small ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'].join(' ')}>
        🔗 Väline
      </span>
    );
  }
  return (
    <span className={['rounded-lg border border-emerald-200 bg-emerald-50 font-semibold text-emerald-700', small ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'].join(' ')}>
      Lokaalne
    </span>
  );
}
