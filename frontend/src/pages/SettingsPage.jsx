import { useState, useEffect } from 'react';
import { user as userApi, getCurrentUser } from '../api';
import useTheme from '../hooks/useTheme';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';

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

export default function SettingsPage() {
  const user = getCurrentUser();

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

  const nameChanged = profile && name !== profile.name;
  const passwordFilled = currentPassword && newPassword && confirmPassword;

  return (
    <AppShell currentNav="settings">
      <PageContainer>
        <div className="space-y-6">
          {/* Heading — full-width row */}
          <div className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Seaded
            </h1>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Halda oma profiili, parooli ja rakenduse välimust.
            </div>
          </div>

          {/* Settings sections — 2-col grid at xl: */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

            {/* Profile section */}
            <section className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80">
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
            </section>

            {/* Security section */}
            <section className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80">
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
            </section>

            {/* Appearance section — full-width row at xl: */}
            <section className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80 xl:col-span-2">
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
            </section>

          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
