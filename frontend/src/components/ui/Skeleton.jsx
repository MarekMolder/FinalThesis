function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

/**
 * Animated placeholder. Use as a stand-in for content that's loading.
 *
 * Examples:
 *   <Skeleton className="h-6 w-48" />            // text line
 *   <Skeleton className="h-32 w-full rounded-3xl" /> // card
 */
export default function Skeleton({ className = '' }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-700/60',
        className
      )}
      aria-hidden="true"
    />
  );
}
