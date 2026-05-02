import { useMemo, useState } from 'react';
import DiffTreeNode from './DiffTreeNode';

export default function DiffTree({ items }) {
  const [hideUnchanged, setHideUnchanged] = useState(false);

  const visibleItems = useMemo(
    () => (hideUnchanged ? items.filter((i) => i.status !== 'UNCHANGED') : items),
    [items, hideUnchanged]
  );

  // Lookup table for resolving parent matchKeys to titles in FieldChangesList.
  // Built from the full items list (not visibleItems) so parents hidden via
  // "hide unchanged" still resolve.
  const itemsByMatchKey = useMemo(() => {
    const m = new Map();
    for (const i of items) m.set(i.matchKey, i);
    return m;
  }, [items]);

  // Build parent → children index using matchKey (parents must remain in the visible set;
  // if a child is visible but its parent is not, the child becomes top-level so it's not lost).
  const { roots, childrenByParent } = useMemo(() => {
    const visibleKeys = new Set(visibleItems.map((i) => i.matchKey));
    const map = new Map();
    const top = [];
    for (const i of visibleItems) {
      const parentKey = i.parentMatchKey && visibleKeys.has(i.parentMatchKey) ? i.parentMatchKey : null;
      if (parentKey == null) {
        top.push(i);
      } else {
        if (!map.has(parentKey)) map.set(parentKey, []);
        map.get(parentKey).push(i);
      }
    }
    return { roots: top, childrenByParent: map };
  }, [visibleItems]);

  return (
    <section className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Itemid</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] font-semibold bg-[color:var(--diff-added-bg)] text-[color:var(--diff-added-text)] border-[color:var(--diff-added-border)]">+</span>
            lisatud
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] font-semibold bg-[color:var(--diff-removed-bg)] text-[color:var(--diff-removed-text)] border-[color:var(--diff-removed-border)]">−</span>
            eemaldatud
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] font-semibold bg-[color:var(--diff-modified-bg)] text-[color:var(--diff-modified-text)] border-[color:var(--diff-modified-border)]">~</span>
            muudetud
          </span>
          <span className="hidden h-4 w-px bg-slate-300 dark:bg-slate-600 sm:inline-block" aria-hidden="true" />
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={hideUnchanged}
              onChange={(e) => setHideUnchanged(e.target.checked)}
            />
            Peida muutmata
          </label>
        </div>
      </div>

      {roots.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Pole ühtegi itemit kuvada.</p>
      ) : (
        <ul>
          {roots.map((r) => (
            <DiffTreeNode
              key={r.matchKey}
              item={r}
              childrenByParent={childrenByParent}
              itemsByMatchKey={itemsByMatchKey}
              depth={0}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
