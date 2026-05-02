function Counter({ label, value, tone }) {
  const toneClass = {
    add: 'text-[color:var(--diff-added-text)]',
    rem: 'text-[color:var(--diff-removed-text)]',
    mod: 'text-[color:var(--diff-modified-text)]',
    neutral: 'text-slate-600 dark:text-slate-300',
  }[tone];
  return (
    <span className={`inline-flex items-baseline gap-1 ${toneClass}`}>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-xs uppercase tracking-wide">{label}</span>
    </span>
  );
}

export default function DiffSummaryCard({ summary }) {
  const allZero =
    summary.itemsAdded === 0 &&
    summary.itemsRemoved === 0 &&
    summary.itemsModified === 0 &&
    summary.relationsAdded === 0 &&
    summary.relationsRemoved === 0;

  return (
    <section className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Counter label="lisatud" value={`+${summary.itemsAdded}`} tone="add" />
        <Counter label="eemaldatud" value={`−${summary.itemsRemoved}`} tone="rem" />
        <Counter label="muudetud" value={`~${summary.itemsModified}`} tone="mod" />
        <Counter label="muutmata" value={summary.itemsUnchanged} tone="neutral" />
        <span className="mx-2 hidden h-5 w-px bg-slate-300 dark:bg-slate-600 sm:inline-block" aria-hidden="true" />
        <Counter label="seost lisatud" value={`+${summary.relationsAdded}`} tone="add" />
        <Counter label="seost eemaldatud" value={`−${summary.relationsRemoved}`} tone="rem" />
      </div>

      {allZero && (
        <p className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          Versioonid on identsed.
        </p>
      )}
    </section>
  );
}
