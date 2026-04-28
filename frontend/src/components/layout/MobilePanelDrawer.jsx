import { useEffect } from 'react';

function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

/**
 * Mobile-only sliding drawer for secondary panels (AI assistant, info sidebar, etc.).
 * Renders nothing when `open` is false.
 *
 * Props:
 * - open: bool — drawer visibility
 * - onClose: () => void — invoked on backdrop click or close button
 * - side: 'right' (default) | 'left' | 'bottom'
 * - title: string — small label above the close button
 * - hideAt: 'lg' (default) | 'xl' — Tailwind breakpoint at which the drawer is hidden via CSS
 *   (also the breakpoint above which the parent layout shows the panel inline)
 * - children: ReactNode — panel content
 */
export default function MobilePanelDrawer({ open, onClose, side = 'right', title, hideAt = 'lg', children }) {
  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const positionClasses = {
    right: 'absolute right-0 top-0 h-full w-[90%] max-w-[420px] border-l',
    left: 'absolute left-0 top-0 h-full w-[90%] max-w-[420px] border-r',
    bottom: 'absolute inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-3xl border-t',
  }[side];

  const wrapperBreakpointClass = hideAt === 'xl' ? 'xl:hidden' : 'lg:hidden';

  return (
    <div className={cn('fixed inset-0 z-50', wrapperBreakpointClass)} role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'flex flex-col gap-3 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:bg-slate-800/95',
          'border-white/60 dark:border-slate-700',
          positionClasses
        )}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sulge"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}
