import { useState } from 'react';
import FieldChangesList from './FieldChangesList';

function statusBadge(status) {
  switch (status) {
    case 'ADDED':
      return { sym: '+', cls: 'bg-[color:var(--diff-added-bg)] text-[color:var(--diff-added-text)] border-[color:var(--diff-added-border)]' };
    case 'REMOVED':
      return { sym: '−', cls: 'bg-[color:var(--diff-removed-bg)] text-[color:var(--diff-removed-text)] border-[color:var(--diff-removed-border)]' };
    case 'MODIFIED':
      return { sym: '~', cls: 'bg-[color:var(--diff-modified-bg)] text-[color:var(--diff-modified-text)] border-[color:var(--diff-modified-border)]' };
    default:
      return { sym: ' ', cls: 'bg-transparent text-[color:var(--diff-unchanged-text)] border-transparent' };
  }
}

function renderTitle(item) {
  const titleChange = (item.fieldChanges || []).find((fc) => fc.field === 'title');
  if (titleChange) {
    return (
      <span>
        <span className="line-through text-[color:var(--diff-removed-text)]">{titleChange.oldValue}</span>
        <span className="mx-1 text-slate-400">→</span>
        <span className="text-[color:var(--diff-added-text)]">{titleChange.newValue}</span>
      </span>
    );
  }
  if (item.status === 'REMOVED') return <span>{item.titleA}</span>;
  return <span>{item.titleB ?? item.titleA}</span>;
}

export default function DiffTreeNode({ item, childrenByParent, itemsByMatchKey, depth }) {
  const [expanded, setExpanded] = useState(false);
  const children = childrenByParent.get(item.matchKey) || [];
  const badge = statusBadge(item.status);
  const hasFieldChanges = (item.fieldChanges || []).length > 0;

  return (
    <li className="list-none">
      <div
        className="flex items-start gap-2 rounded-lg border border-transparent px-2 py-1 hover:border-slate-200 dark:hover:border-slate-700"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <span
          aria-label={item.status}
          className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border text-xs font-semibold ${badge.cls}`}
        >
          {badge.sym}
        </span>
        <span className="flex-1">
          {item.type && (
            <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {item.type}
            </span>
          )}
          {renderTitle(item)}
        </span>
        {hasFieldChanges && (
          <button
            type="button"
            onClick={() => setExpanded((x) => !x)}
            className="text-xs text-sky-700 hover:underline dark:text-sky-400"
          >
            {expanded ? 'Peida' : 'Kuva'} muudatused ({item.fieldChanges.length})
          </button>
        )}
      </div>
      {expanded && hasFieldChanges && (
        <div style={{ paddingLeft: `${depth * 16 + 32}px` }}>
          <FieldChangesList fieldChanges={item.fieldChanges} itemsByMatchKey={itemsByMatchKey} />
        </div>
      )}
      {children.length > 0 && (
        <ul className="mt-1">
          {children.map((c) => (
            <DiffTreeNode
              key={c.matchKey}
              item={c}
              childrenByParent={childrenByParent}
              itemsByMatchKey={itemsByMatchKey}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
