import { Link } from 'react-router-dom';
import { getCurrentUser, logout as apiLogout } from '../../api';
import logoImg from '../../assets/logo.png';

function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

/**
 * Sticky top header. Hamburger (mobile) + logo (left) + optional centered slot + user info + logout (right).
 *
 * fixed=true: header is fixed-positioned (used by pages with full-bleed layouts).
 * fixed=false (default): sticky.
 * onMenuClick: callback invoked when the mobile hamburger button is pressed (visible only < lg).
 */
export default function AppHeader({ fixed = false, headerActions = null, onMenuClick = null }) {
  const user = getCurrentUser();
  const positionClasses = fixed
    ? 'fixed inset-x-0 top-0 z-40'
    : 'sticky top-0 z-20';

  return (
    <header
      className={cn(
        positionClasses,
        'border-b border-white/35 bg-white/35 shadow-[0_12px_36px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80'
      )}
    >
      <div className="mx-auto flex max-w-app items-center gap-3 px-4 py-2 sm:gap-4 lg:px-6 3xl:px-8">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Ava menüü"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/55 bg-white/55 text-slate-700 shadow-sm transition duration-200 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <Link
          to="/"
          className="flex shrink-0 items-center rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-sky-400"
          title="Avaleht"
        >
          <img src={logoImg} alt="" className="h-12 w-auto object-contain sm:h-16" />
        </Link>

        {headerActions && <div className="hidden items-center gap-2 sm:flex">{headerActions}</div>}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/55 bg-white/55 text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
            type="button"
            title="Kasutaja"
          >
            <span className="text-sm font-semibold">{(user?.email || 'U').slice(0, 1).toUpperCase()}</span>
          </button>
          <div className="hidden text-right sm:block">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.label || 'Õpetaja'}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">{user?.email || '—'}</div>
          </div>
          <button
            onClick={apiLogout}
            className="rounded-xl border border-white/55 bg-white/55 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition duration-200 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Logi välja
          </button>
        </div>
      </div>
    </header>
  );
}
