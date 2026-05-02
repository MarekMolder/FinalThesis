export default function GraphSidebar({
  selected,
  onClose,
  onOpenInEditor,
  onHideNeighbours,
  onAddToCurriculum,
  onExpand,
}) {
  if (!selected) {
    return (
      <aside className="w-80 shrink-0 border-l border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
        Klõpsa graafil tipule, et näha üksikasju.
      </aside>
    );
  }
  const meta = selected.metadata || {};
  const isOwn = selected.kind === 'OWN_ITEM';
  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500">{selected.type}</div>
          <h3 className="mt-1 text-base font-semibold text-slate-800 dark:text-slate-100">
            {selected.label || '(silt puudub)'}
          </h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
      </div>

      <dl className="mt-4 space-y-1 text-xs text-slate-600 dark:text-slate-400">
        {Object.entries(meta).map(([k, v]) => (
          <div key={k} className="flex gap-2"><dt className="font-medium">{k}:</dt><dd>{v}</dd></div>
        ))}
      </dl>

      <div className="mt-4 flex flex-col gap-2">
        {selected.externalIri && (
          <a
            href={selected.externalIri}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-center text-xs hover:bg-slate-100"
          >
            Vaata oppekava.edu.ee-s
          </a>
        )}
        {isOwn ? (
          <>
            <button onClick={() => onOpenInEditor && onOpenInEditor(selected.id)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-100">
              Ava redaktoris
            </button>
            <button onClick={onHideNeighbours}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-100">
              Peida naabrid
            </button>
          </>
        ) : (
          <>
            {onExpand && (
              <button onClick={() => onExpand(selected.externalIri)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-100">
                Laienda
              </button>
            )}
            <button onClick={onAddToCurriculum}
                    className="rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-700">
              Lisa minu õppekavasse
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
