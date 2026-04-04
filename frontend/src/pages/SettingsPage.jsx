import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { user as userApi, getCurrentUser, logout as apiLogout } from '../api';
import useTheme from '../hooks/useTheme';
import bgImg from '../assets/background.png';
import logoImg from '../assets/logo.png';

function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

function getRoleLabel(role) {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'STUDENT') return 'Õpilane';
  return 'Õpetaja';
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function SidebarItem({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={cn(
        'flex w-full items-center rounded-2xl text-sm font-medium transition',
        'justify-center px-2 py-2.5 group-hover:justify-start group-hover:gap-3 group-hover:px-3',
        active ? 'bg-sky-600/90 text-white shadow-sm' : 'text-slate-700 hover:bg-white/55 dark:text-slate-300 dark:hover:bg-slate-700/50'
      )}
    >
      <span
        className={cn(
          'grid h-12 w-12 place-items-center rounded-2xl text-slate-700',
          active && 'text-white'
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          'truncate transition-all duration-200',
          'w-0 opacity-0 group-hover:w-auto group-hover:opacity-100'
        )}
      >
        {label}
      </span>
    </Link>
  );
}

const TABS = [
  { id: 'profile', label: 'Profiil', icon: '👤' },
  { id: 'security', label: 'Turvalisus', icon: '🔒' },
  { id: 'appearance', label: 'Välimus', icon: '🎨' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile state
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Theme
  const [dark, setDark] = useTheme();

  useEffect(() => {
    userApi
      .getProfile()
      .then((data) => {
        setProfile(data);
        setName(data.name || '');
      })
      .catch(() => setProfileMsg({ type: 'error', text: 'Profiili laadimine ebaõnnestus' }))
      .finally(() => setProfileLoading(false));
  }, []);

  async function handleSaveName(e) {
    e.preventDefault();
    setProfileMsg(null);
    try {
      const updated = await userApi.updateName(name);
      setProfile(updated);
      setProfileMsg({ type: 'success', text: 'Nimi salvestatud!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Salvestamine ebaõnnestus' });
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Paroolid ei kattu' });
      return;
    }
    try {
      await userApi.changePassword(currentPassword, newPassword, confirmPassword);
      setPasswordMsg({ type: 'success', text: 'Parool muudetud!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Parooli muutmine ebaõnnestus' });
    }
  }

  function logout() {
    apiLogout();
  }

  const nameChanged = profile && name !== profile.name;
  const passwordFilled = currentPassword && newPassword && confirmPassword;

  return (
    <div className="min-h-full">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImg})` }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 -z-10 bg-white/55 dark:bg-slate-900/90" aria-hidden="true" />

      {/* Top header */}
      <header className="sticky top-0 z-20 border-b border-white/35 bg-white/35 shadow-[0_12px_36px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-6 py-2">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex shrink-0 items-center rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-sky-400"
              title="Avaleht"
            >
              <img src={logoImg} alt="" className="h-16 w-22 object-contain" />
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/55 bg-white/55 text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              type="button"
              title="Kasutaja"
              onClick={() => {}}
            >
              <span className="text-sm font-semibold">{(user?.email || 'U').slice(0, 1).toUpperCase()}</span>
            </button>
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.label || 'Õpetaja'}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">{user?.email || '—'}</div>
            </div>
            <button
              onClick={logout}
              className="rounded-xl border border-white/55 bg-white/55 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white/70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Logi välja
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto grid max-w-[1400px] grid-cols-[auto_1fr] gap-6 px-2 py-6">
        {/* Sidebar */}
        <aside
          className={cn(
            'group relative -ml-8 h-[calc(100vh-120px)] w-[68px] rounded-3xl border border-white/60 bg-white/55 p-3 shadow-sm backdrop-blur-md transition-[width] duration-200 hover:w-[260px] dark:border-slate-700 dark:bg-slate-800/80'
          )}
        >
          <div className="flex flex-col gap-2">
            <SidebarItem
              to="/"
              label="Minu õppekavad"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              }
            />
            <SidebarItem
              to="/curriculums"
              label="Õppekavad"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M7 4h10a2 2 0 0 1 2 2v14l-5-3-5 3-5-3V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              }
            />
            <SidebarItem
              to="/sample"
              label="Näidisõppekava"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 10h8M8 13h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              }
            />
            <SidebarItem
              to="/settings"
              label="Seaded"
              active
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M19.4 15a8.7 8.7 0 0 0 .1-1 8.7 8.7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.9 7.9 0 0 0-1.7-1l-.3-2.6H11l-.3 2.6a7.9 7.9 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a8.7 8.7 0 0 0-.1 1 8.7 8.7 0 0 0 .1 1l-2 1.6 2 3.4 2.4-1a7.9 7.9 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.9 7.9 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />
          </div>
        </aside>

        {/* Main */}
        <main className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80">
          <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Seaded</h1>

          <div className="flex flex-col gap-6 sm:flex-row">
            {/* Settings tabs */}
            <nav className="flex shrink-0 flex-row gap-1 sm:w-[200px] sm:flex-col">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition',
                    activeTab === tab.id
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-700/70'
                  )}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="min-w-0 flex-1 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
              {/* Profile tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Profiil</h2>
                  {profileLoading ? (
                    <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Laen…</div>
                  ) : (
                    <>
                      <div className="mt-4 flex items-center gap-4">
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3264e6] to-[#1e50c8] text-xl font-bold text-white">
                          {getInitials(profile?.name)}
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{profile?.name}</div>
                          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800 dark:border-sky-800 dark:bg-sky-900/50 dark:text-sky-400">
                            {getRoleLabel(profile?.role || user?.role)}
                          </span>
                        </div>
                      </div>

                      <form onSubmit={handleSaveName} className="mt-6 space-y-4">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Nimi
                          </label>
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-11 w-full rounded-xl border-[1.5px] border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:bg-slate-700"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Email
                          </label>
                          <input
                            value={profile?.email || ''}
                            disabled
                            className="h-11 w-full rounded-xl border-[1.5px] border-slate-200 bg-slate-100 px-3 text-sm text-slate-500 shadow-sm outline-none dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400"
                          />
                        </div>

                        {profileMsg && (
                          <div
                            className={cn(
                              'rounded-xl border px-4 py-2 text-sm',
                              profileMsg.type === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                            )}
                          >
                            {profileMsg.text}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={!nameChanged}
                          className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#3264e6] to-[#1e50c8] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Salvesta
                        </button>
                      </form>
                    </>
                  )}
                </div>
              )}

              {/* Security tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Parooli muutmine</h2>
                  <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Praegune parool
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-11 w-full rounded-xl border-[1.5px] border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:bg-slate-700"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Uus parool
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-11 w-full rounded-xl border-[1.5px] border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:bg-slate-700"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Kinnita uus parool
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 w-full rounded-xl border-[1.5px] border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-200/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:bg-slate-700"
                      />
                    </div>

                    {passwordMsg && (
                      <div
                        className={cn(
                          'rounded-xl border px-4 py-2 text-sm',
                          passwordMsg.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                        )}
                      >
                        {passwordMsg.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!passwordFilled}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#3264e6] to-[#1e50c8] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Muuda parool
                    </button>
                  </form>
                </div>
              )}

              {/* Appearance tab */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Välimus</h2>
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-5 py-4 dark:border-slate-700 dark:bg-slate-700/50">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tume režiim</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Muuda rakenduse välimust</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={dark}
                      onClick={() => setDark(!dark)}
                      className={cn(
                        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
                        dark ? 'bg-sky-600' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                          dark ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {/* Preview */}
                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/60 dark:border-slate-700">
                    <div className="flex gap-0">
                      <div className="flex-1 bg-white p-4 text-center">
                        <div className="text-xs font-medium text-slate-500">Hele</div>
                        <div className="mt-2 rounded-lg bg-slate-50 p-3">
                          <div className="h-2 w-3/4 rounded bg-slate-200" />
                          <div className="mt-1.5 h-2 w-1/2 rounded bg-slate-200" />
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-900 p-4 text-center">
                        <div className="text-xs font-medium text-slate-400">Tume</div>
                        <div className="mt-2 rounded-lg bg-slate-800 p-3">
                          <div className="h-2 w-3/4 rounded bg-slate-700" />
                          <div className="mt-1.5 h-2 w-1/2 rounded bg-slate-700" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
