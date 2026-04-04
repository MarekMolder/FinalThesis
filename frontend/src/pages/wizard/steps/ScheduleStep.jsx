import { useState } from 'react';
import { curriculumVersion } from '../../../api';
import CurriculumCalendar from '../../../components/curriculumTimeline/CurriculumCalendar';

export default function ScheduleStep({ versionId, curriculumId, items, onFinish, schoolWeeks }) {
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');

  async function finish() {
    setFinishing(true);
    setError('');
    try {
      await curriculumVersion.generateContentJson(versionId);
      onFinish();
    } catch (err) {
      setError(err.message);
      setFinishing(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Ajakava</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Planeeri millal iga element õpetatakse.</p>
        </div>
        <button
          onClick={finish}
          disabled={finishing}
          className="rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
        >
          {finishing ? 'Valmistan…' : '✓ Lõpeta õppekava'}
        </button>
      </div>

      {error && <div className="mb-3 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 px-4 py-2 text-sm text-rose-700 dark:text-rose-300">{error}</div>}

      <CurriculumCalendar curriculumVersionId={versionId} schoolWeeks={schoolWeeks} />
    </div>
  );
}
