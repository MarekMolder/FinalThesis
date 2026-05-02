import { useState } from 'react';
import { curriculumVersion } from '../../api';

export default function RestoreVersionDialog({ versionA, onClose, onRestored }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      const created = await curriculumVersion.restore(versionA.id);
      onRestored(created);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-[min(92vw,440px)] rounded-2xl border border-white/60 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Taasta versioon #{versionA.versionNumber}?
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          See loob uue DRAFT-versiooni versiooni #{versionA.versionNumber} sisuga. Olemasolevaid versioone ei muudeta.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Tühista
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500 disabled:opacity-60"
          >
            {busy ? 'Taastan…' : 'Taasta'}
          </button>
        </div>
      </div>
    </div>
  );
}
