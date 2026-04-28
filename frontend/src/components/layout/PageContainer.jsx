function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

/**
 * Inner content wrapper. Centers content up to max-w-app (1800px), with responsive
 * horizontal padding. Use inside AppShell's main slot.
 */
export default function PageContainer({ children, className = '' }) {
  return (
    <div className={cn('mx-auto max-w-app px-4 lg:px-6 3xl:px-8', className)}>
      {children}
    </div>
  );
}
