import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import bgImg from '../../assets/background.png';
import AppHeader from './AppHeader';
import ResponsiveSidebar from './ResponsiveSidebar';
import SidebarNav from './SidebarNav';

function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

/**
 * Top-level chrome: background image + overlay + AppHeader + ResponsiveSidebar + main slot.
 *
 * On mobile (< lg): the sidebar is hidden and a hamburger in the header opens a drawer.
 *
 * Props:
 * - currentNav: 'home' | 'curriculums' | 'sample' | 'settings'
 * - fixedHeader: bool (use fixed-positioned header; needed for pages with overflow content)
 * - stickySidebar: bool (sidebar sticks while scrolling)
 * - headerActions: optional ReactNode (extra buttons in header)
 * - children: page content (typically wrapped in <PageContainer>)
 */
export default function AppShell({
  currentNav,
  fixedHeader = false,
  stickySidebar = false,
  headerActions = null,
  children,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close the drawer whenever the route changes (e.g. user clicks a nav link inside it).
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-full">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImg})` }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 -z-10 bg-white/55 dark:bg-slate-900/90" aria-hidden="true" />

      <AppHeader
        fixed={fixedHeader}
        headerActions={headerActions}
        onMenuClick={() => setDrawerOpen(true)}
      />

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[280px] flex-col gap-3 border-r border-white/60 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Menüü</div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Sulge menüü"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <SidebarNav currentNav={currentNav} variant="open" />
          </aside>
        </div>
      )}

      <div
        className={cn(
          'mx-auto grid max-w-app gap-6 px-4 py-6 lg:px-6 3xl:px-8',
          'grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]',
          fixedHeader && 'pt-[88px]'
        )}
      >
        <ResponsiveSidebar currentNav={currentNav} sticky={stickySidebar} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
