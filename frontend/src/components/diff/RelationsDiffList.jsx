function describe(rel) {
  const arrow = `${rel.sourceMatchKey} → ${rel.targetMatchKey}`;
  if (rel.status === 'ADDED') {
    return { text: `Lisatud seos (${rel.type}): ${arrow}`, tone: 'add' };
  }
  return { text: `Eemaldatud seos (${rel.type}): ${arrow}`, tone: 'rem' };
}

export default function RelationsDiffList({ relations }) {
  if (!relations || relations.length === 0) {
    return (
      <section className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Seosed</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Seoste muudatusi pole.</p>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Seosed</h2>
      <ul className="mt-2 space-y-1">
        {relations.map((rel, idx) => {
          const { text, tone } = describe(rel);
          const cls = tone === 'add'
            ? 'bg-[color:var(--diff-added-bg)] text-[color:var(--diff-added-text)] border-[color:var(--diff-added-border)]'
            : 'bg-[color:var(--diff-removed-bg)] text-[color:var(--diff-removed-text)] border-[color:var(--diff-removed-border)]';
          return (
            <li
              key={`${rel.sourceMatchKey}|${rel.targetMatchKey}|${rel.type}|${rel.status}|${idx}`}
              className={`rounded-lg border px-3 py-2 text-sm ${cls}`}
            >
              {text}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
