export default function StepBar({ steps, current, gate, onStepClick, onSaveDraft }) {
  return (
    <div className="min-w-0 w-full flex-shrink-0 overflow-x-auto overscroll-x-contain border-b border-white/50 bg-white/40 [scrollbar-width:thin] dark:bg-slate-700/40 dark:border-slate-700">
      <div className="flex h-[50px] w-max min-w-full items-center justify-between gap-0 px-4 sm:px-5">
        <div className="flex min-w-0 items-stretch">
          {steps.map((s, i) => {
            const num = i + 1;
            const isDone = current > num;
            const isActive = current === num;
            const isLocked = num > gate && current <= gate;
            return (
              <div key={num} className="flex items-center">
                {i > 0 && <span className="px-0.5 text-sm text-slate-300 dark:text-slate-500 select-none">›</span>}
                <button
                  onClick={() => !isLocked && onStepClick(num)}
                  disabled={isLocked}
                  className={[
                    'flex flex-shrink-0 items-center gap-2 px-3 sm:px-4 h-full text-xs font-medium whitespace-nowrap transition-colors',
                    isActive ? 'text-sky-700 font-semibold' : '',
                    isDone ? 'text-emerald-700' : '',
                    isLocked ? 'text-slate-300 dark:text-slate-500 cursor-default' : '',
                    !isActive && !isDone && !isLocked ? 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300' : '',
                  ].join(' ')}
                >
                  <span className={[
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0',
                    isActive ? 'bg-sky-600 text-white' : '',
                    isDone ? 'bg-emerald-500 text-white' : '',
                    isLocked ? 'bg-slate-200 dark:bg-slate-600 text-slate-400 dark:text-slate-500' : '',
                    !isActive && !isDone && !isLocked ? 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400' : '',
                  ].join(' ')}>
                    {isDone ? '✓' : num}
                  </span>
                  <span>{s.label}</span>
                  {s.sub && <span className="hidden sm:inline text-[10px] text-slate-400 dark:text-slate-500">· {s.sub}</span>}
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={!onSaveDraft}
          className="flex-shrink-0 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-[7px] text-xs font-semibold text-slate-500 hover:bg-white/90 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-700/90"
        >
          Salvesta mustand
        </button>
      </div>
    </div>
  );
}
