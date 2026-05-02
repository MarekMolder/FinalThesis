import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { curriculumVersion } from '../api';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import DiffSummaryCard from '../components/diff/DiffSummaryCard';
import DiffTree from '../components/diff/DiffTree';
import RelationsDiffList from '../components/diff/RelationsDiffList';
import RestoreVersionDialog from '../components/diff/RestoreVersionDialog';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('et-EE');
}

function VersionRefBadge({ label, version }) {
  if (!version) return <span className="text-sm text-slate-500">{label}</span>;
  return (
    <div className="text-sm text-slate-700 dark:text-slate-200">
      <span className="font-semibold">{label}:</span>{' '}
      #{version.versionNumber} · {version.state} · {formatDate(version.createdAt)}
    </div>
  );
}

export default function VersionDiffPage() {
  const { curriculumId, versionAId, versionBId } = useParams();
  const navigate = useNavigate();
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRestore, setShowRestore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    curriculumVersion
      .diff(versionAId, versionBId)
      .then((d) => { if (!cancelled) setDiff(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [versionAId, versionBId]);

  const swapHref = useMemo(
    () => `/curriculum/${curriculumId}/diff/${versionBId}/${versionAId}`,
    [curriculumId, versionAId, versionBId]
  );

  function handleRestored(created) {
    setShowRestore(false);
    navigate(`/curriculum/${curriculumId}?version=${created.id}`);
  }

  return (
    <AppShell currentNav="curriculums">
      <PageContainer>
        <div className="sticky top-0 z-10 -mx-4 mb-4 flex flex-col gap-2 border-b border-white/60 bg-white/85 px-4 py-3 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/85 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
            <VersionRefBadge label="Versioon A" version={diff?.versionA} />
            <VersionRefBadge label="Versioon B" version={diff?.versionB} />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowRestore(true)}
              disabled={!diff}
              className="rounded-lg border border-sky-600 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50 disabled:opacity-50 dark:border-sky-400 dark:text-sky-300 dark:hover:bg-sky-500/10"
            >
              Taasta A uue versioonina
            </button>
            <button
              type="button"
              onClick={() => navigate(swapHref)}
              disabled={!diff}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Vaheta A↔B
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-600 dark:text-slate-300">Laadin diffi…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {diff && (
          <div className="space-y-4">
            <DiffSummaryCard summary={diff.summary} />
            <DiffTree items={diff.items} />
            <RelationsDiffList relations={diff.relations} />
          </div>
        )}

        {showRestore && diff && (
          <RestoreVersionDialog
            versionA={diff.versionA}
            onClose={() => setShowRestore(false)}
            onRestored={handleRestored}
          />
        )}
      </PageContainer>
    </AppShell>
  );
}
