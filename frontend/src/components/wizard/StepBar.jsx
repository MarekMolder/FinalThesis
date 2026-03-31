export default function StepBar({ steps, current, gate, onStepClick }) {
  return (
    <div className="min-w-0 w-full flex-shrink-0 overflow-x-auto overscroll-x-contain border-b border-white/50 bg-white/40 [scrollbar-width:thin]">
      <div className="flex h-12 w-max min-w-full items-center justify-between gap-3 px-4 sm:px-5">
        <div className="flex min-w-0 items-stretch">
          {steps.map((s, i) => {
            const num = i + 1;
            const isDone = current > num;
            const isActive = current === num;
            const isLocked = num > gate && current <= gate;
            return (
              <button
                key={num}
                onClick={() => !isLocked && onStepClick(num)}
                disabled={isLocked}
                className={[
                  'flex flex-shrink-0 items-center gap-2 px-3 sm:px-4 h-full text-xs font-medium whitespace-nowrap transition-colors',
                  isActive ? 'text-sky-700 font-semibold' : '',
                  isDone ? 'text-emerald-700' : '',
                  isLocked ? 'text-slate-300 cursor-default' : '',
                  !isActive && !isDone && !isLocked ? 'text-slate-500 hover:text-slate-700' : '',
                ].join(' ')}
              >
                <span className={[
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0',
                  isActive ? 'bg-sky-600 text-white' : '',
                  isDone ? 'bg-emerald-500 text-white' : '',
                  isLocked ? 'bg-slate-200 text-slate-400' : '',
                  !isActive && !isDone && !isLocked ? 'bg-slate-200 text-slate-600' : '',
                ].join(' ')}>
                  {isDone ? '✓' : num}
                </span>
                <span>{s.label}</span>
                {s.sub && <span className="hidden sm:inline text-[10px] text-slate-400">· {s.sub}</span>}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="flex-shrink-0 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white/90"
        >
          Salvesta mustand
        </button>
      </div>
    </div>
  );
}
