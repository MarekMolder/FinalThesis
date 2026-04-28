function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

/**
 * Empty-state block: icon + title + description + optional action slot.
 * Replaces bare "No results found" text on list pages.
 */
export default function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {icon}
        </div>
      )}
      <div className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</div>
      {description && (
        <div className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">{description}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
