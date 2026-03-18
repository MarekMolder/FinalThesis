import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { curriculum } from '../api';

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('et-EE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default function CurriculumDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    curriculum
      .get(id)
      .then((d) => {
        if (!ignore) setData(d);
      })
      .catch((e) => {
        if (!ignore) setError(e.message || 'Viga detaili laadimisel');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Detailvaade</div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{data?.title || 'Õppekava'}</h1>
            <div className="mt-2 text-sm text-slate-600">{data?.description || ''}</div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Tagasi
            </Link>
            <Link
              to="/curriculum-versions"
              className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              title="Praegu viib demo versioonide lehele"
            >
              Ava versioonid
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-10 text-center text-sm text-slate-600">Laen…</div>
        ) : data ? (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Staatus</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{data.status || '—'}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nähtavus</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{data.visibility || '—'}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loodud</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(data.createdAt)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Muudetud</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(data.updatedAt)}</div>
            </div>
          </div>
        ) : (
          <div className="mt-10 text-center text-sm text-slate-600">Ei leitud.</div>
        )}
      </div>
    </div>
  );
}

