import SidebarNav from './SidebarNav';

function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

/**
 * On screens < lg (< 1024px): hidden — mobile uses the drawer rendered by AppShell.
 * On lg–3xl (1024–1799px): collapsed 68px shell, expands to 260px on hover.
 * On 3xl+ (≥1800px): always 260px wide, labels always visible.
 *
 * The component owns the visual sidebar shell (rounded card + glassmorphism).
 * AppShell positions it inside the page grid.
 */
export default function ResponsiveSidebar({ currentNav, sticky = false, className = '' }) {
  return (
    <>
      {/* Collapsible variant — visible lg up to 3xl */}
      <aside
        className={cn(
          'group relative -ml-8 hidden w-[68px] rounded-3xl border border-white/60 bg-white/55 p-3 shadow-sm backdrop-blur-md transition-[width] duration-200 hover:w-[260px] lg:block dark:border-slate-700 dark:bg-slate-800/80',
          sticky ? 'sticky top-[88px] max-h-[calc(100vh-104px)] overflow-y-auto self-start' : 'h-[calc(100vh-120px)]',
          '3xl:hidden',
          className
        )}
      >
        <SidebarNav currentNav={currentNav} variant="collapsible" />
      </aside>

      {/* Always-open variant — visible at 3xl+ */}
      <aside
        className={cn(
          'hidden 3xl:block w-[260px] rounded-3xl border border-white/60 bg-white/55 p-3 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80',
          sticky ? 'sticky top-[88px] max-h-[calc(100vh-104px)] overflow-y-auto self-start' : 'h-[calc(100vh-120px)]',
          className
        )}
      >
        <SidebarNav currentNav={currentNav} variant="open" />
      </aside>
    </>
  );
}
