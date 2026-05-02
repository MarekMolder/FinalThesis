import { useEffect, useState } from 'react';
import { curriculumItem } from '../../api';

/**
 * Convert backend node `type` (lower_snake) → CurriculumItemTypeEnum (UPPER_SNAKE).
 */
function toItemTypeEnum(type) {
  if (!type) return 'LEARNING_OUTCOME';
  return type.toUpperCase();
}

export default function AddGraphItemDialog({
  open,
  graphNode,
  curriculumVersionId,
  ownNodes,
  onClose,
  onCreated,
}) {
  const [parentId, setParentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) { setParentId(''); setError(null); }
  }, [open]);

  if (!open || !graphNode) return null;

  const meta = graphNode.metadata || {};
  const candidateParents = (ownNodes || []).filter(
    (n) => n.kind === 'OWN_ITEM' && n.id !== graphNode.id
  );

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        curriculumVersionId,
        parentItemId: parentId || null,
        type: toItemTypeEnum(graphNode.type),
        title: graphNode.label || '(graafist)',
        orderIndex: 0,
        sourceType: 'EXTERNAL',
        externalIri: graphNode.externalIri,
        educationLevelIri: meta.educationLevelIri || 'https://oppekava.edu.ee/a/level',
        schoolLevel: meta.schoolLevel || '',
        grade: meta.grade || '',
        educationalFramework: 'ESTONIAN_NATIONAL_CURRICULUM',
        notation: '',
        verbIri: meta.verbIri || 'https://oppekava.edu.ee/a/verb',
        isMandatory: false,
      };
      const created = await curriculumItem.create(body);
      onCreated(created, graphNode);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Lisa minu õppekavasse
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {graphNode.label} <span className="text-xs text-slate-400">({graphNode.type})</span>
        </p>

        <label className="mt-4 block text-xs font-medium text-slate-600">Vanemüksus (valikuline):</label>
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="">— üksikuna —</option>
          {candidateParents.map((p) => (
            <option key={p.id} value={p.id}>{p.label || '(nimetu)'}</option>
          ))}
        </select>

        {error && <div className="mt-3 text-xs text-rose-700">{error}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs">
            Tühista
          </button>
          <button onClick={submit} disabled={submitting}
                  className="rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">
            {submitting ? 'Lisan…' : 'Lisa'}
          </button>
        </div>
      </div>
    </div>
  );
}
