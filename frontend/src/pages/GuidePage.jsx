import { Link } from 'react-router-dom';

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-[900px] px-6 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Juhend</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Töökava loomise juhend</h1>
        <p className="mt-2 text-slate-600">
          Siia lehele saad hiljem lisada täpse samm-sammult juhendi (nt mallid, vajalikud väljad, avalikustamine, jagamine).
        </p>

        <div className="mt-6 space-y-4 text-slate-700">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="font-semibold">1) Põhiandmed</div>
            <div className="mt-1 text-sm">Pealkiri, klass, aine, nähtavus, staatus.</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="font-semibold">2) Sisu</div>
            <div className="mt-1 text-sm">Õpiväljundid, teemad, ülesanded, materjalid, ajakava.</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="font-semibold">3) Kontroll ja jagamine</div>
            <div className="mt-1 text-sm">Kooskõla kontroll, versioonid, avalikustamine.</div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            to="/"
            className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
          >
            Tagasi avalehele
          </Link>
        </div>
      </div>
    </div>
  );
}

