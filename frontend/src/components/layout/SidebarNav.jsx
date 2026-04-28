import { Link } from 'react-router-dom';

function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

const ICONS = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  curriculums: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M7 4h10a2 2 0 0 1 2 2v14l-5-3-5 3-5-3V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  sample: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10h8M8 13h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.4 15a8.7 8.7 0 0 0 .1-1 8.7 8.7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.9 7.9 0 0 0-1.7-1l-.3-2.6H11l-.3 2.6a7.9 7.9 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a8.7 8.7 0 0 0-.1 1 8.7 8.7 0 0 0 .1 1l-2 1.6 2 3.4 2.4-1a7.9 7.9 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.9 7.9 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const ITEMS = [
  { key: 'home',        to: '/',            label: 'Minu õppekavad',  icon: ICONS.home },
  { key: 'curriculums', to: '/curriculums', label: 'Õppekavad',        icon: ICONS.curriculums },
  { key: 'sample',      to: '/sample',      label: 'Näidisõppekava',   icon: ICONS.sample },
  { key: 'settings',    to: '/settings',    label: 'Seaded',           icon: ICONS.settings },
];

/**
 * variant: 'collapsible' (default) — labels hidden until group-hover; used inside ResponsiveSidebar at < 3xl
 * variant: 'open'                  — labels always visible; used at 3xl+
 */
export default function SidebarNav({ currentNav, variant = 'collapsible' }) {
  const open = variant === 'open';
  return (
    <div className="flex flex-col gap-2">
      {ITEMS.map((item) => {
        const active = currentNav === item.key;
        return (
          <Link
            key={item.key}
            to={item.to}
            className={cn(
              'flex w-full items-center rounded-2xl text-sm font-medium transition duration-200',
              open
                ? 'gap-3 px-3 py-2.5'
                : 'justify-center px-2 py-2.5 group-hover:justify-start group-hover:gap-3 group-hover:px-3',
              active
                ? 'bg-sky-600/90 text-white shadow-sm'
                : 'text-slate-700 hover:bg-white/55 dark:text-slate-300 dark:hover:bg-slate-700/50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2'
            )}
          >
            <span className={cn('grid h-12 w-12 place-items-center rounded-2xl', active && 'text-white')}>
              {item.icon}
            </span>
            <span
              className={cn(
                'truncate transition-all duration-200',
                open
                  ? 'w-auto opacity-100'
                  : 'w-0 opacity-0 group-hover:w-auto group-hover:opacity-100'
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
