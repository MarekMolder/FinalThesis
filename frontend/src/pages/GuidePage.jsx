import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';

export default function GuidePage() {
  return (
    <AppShell currentNav="home">
      <PageContainer>
        <section className="mx-auto max-w-prose rounded-3xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/80">
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400">Juhend</div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Töökava loomise juhend</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Siia lehele saad hiljem lisada täpse samm-sammult juhendi (nt mallid, vajalikud väljad, avalikustamine, jagamine).
          </p>

          <div className="mt-6 space-y-4 text-slate-700 dark:text-slate-300">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/50">
              <div className="font-semibold">1) Põhiandmed</div>
              <div className="mt-1 text-sm">Pealkiri, klass, aine, nähtavus, staatus.</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/50">
              <div className="font-semibold">2) Sisu</div>
              <div className="mt-1 text-sm">Õpiväljundid, teemad, ülesanded, materjalid, ajakava.</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/50">
              <div className="font-semibold">3) Kontroll ja jagamine</div>
              <div className="mt-1 text-sm">Kooskõla kontroll, versioonid, avalikustamine.</div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              to="/"
              className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
            >
              Tagasi avalehele
            </Link>
          </div>
        </section>
      </PageContainer>
    </AppShell>
  );
}
