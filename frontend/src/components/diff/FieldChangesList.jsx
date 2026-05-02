function valueText(v) {
  if (v === null || v === undefined || v === '') return '∅';
  return String(v);
}

function resolveParentTitle(matchKey, itemsByMatchKey) {
  if (!matchKey) return '(juur)';
  const item = itemsByMatchKey?.get(matchKey);
  if (!item) return null;
  return item.titleB ?? item.titleA ?? null;
}

/**
 * Transforms raw FieldChangeDto[] into renderable rows. For `parent` field changes,
 * resolves both sides via the items index to human-readable titles. If both sides
 * resolve to the same string (e.g. two orphan items with identical titles whose
 * synthetic UUIDs differ), the change is dropped — it carries no useful signal.
 */
function preparedRows(fieldChanges, itemsByMatchKey) {
  const out = [];
  for (const fc of fieldChanges) {
    if (fc.field === 'parent') {
      const oldTitle = resolveParentTitle(fc.oldValue, itemsByMatchKey);
      const newTitle = resolveParentTitle(fc.newValue, itemsByMatchKey);
      // Both sides unresolvable, or resolved to the same string → not a meaningful change
      if (oldTitle === null && newTitle === null) continue;
      if (oldTitle === newTitle) continue;
      out.push({ field: 'parent', oldValue: oldTitle ?? '?', newValue: newTitle ?? '?' });
    } else {
      out.push({ field: fc.field, oldValue: valueText(fc.oldValue), newValue: valueText(fc.newValue) });
    }
  }
  return out;
}

export default function FieldChangesList({ fieldChanges, itemsByMatchKey }) {
  if (!fieldChanges || fieldChanges.length === 0) return null;
  const rows = preparedRows(fieldChanges, itemsByMatchKey);
  if (rows.length === 0) return null;

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-slate-300/70 bg-slate-50 font-mono text-[12.5px] leading-snug dark:border-slate-700 dark:bg-slate-900/60">
      {rows.map((row, idx) => (
        <div
          key={`${row.field}-${idx}`}
          className={idx > 0 ? 'border-t border-slate-200/70 dark:border-slate-700' : ''}
        >
          <div className="bg-slate-100/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            @@ {row.field}
          </div>
          <div className="whitespace-pre-wrap break-words bg-[color:var(--diff-removed-bg)] px-3 py-1 text-[color:var(--diff-removed-text)]">
            <span className="select-none">- </span>{row.oldValue}
          </div>
          <div className="whitespace-pre-wrap break-words bg-[color:var(--diff-added-bg)] px-3 py-1 text-[color:var(--diff-added-text)]">
            <span className="select-none">+ </span>{row.newValue}
          </div>
        </div>
      ))}
    </div>
  );
}
