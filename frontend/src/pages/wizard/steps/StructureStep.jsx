import { useEffect, useState } from 'react';
import { curriculumItem } from '../../../api';
import WizardTree from '../../../components/wizard/WizardTree';
import ImportPanel from '../../../components/wizard/ImportPanel';
import ItemFormModal from '../../../components/wizard/ItemFormModal';

const STRUCTURE_TYPES = ['MODULE', 'TOPIC', 'LEARNING_OUTCOME', 'TEST'];

export default function StructureStep({ versionId, metadata, catalogJson, items, onItemsChange, verbs, scheduleMap }) {
  const [loading, setLoading] = useState(items.length === 0);
  const [importParent, setImportParent] = useState(null);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (items.length > 0) { setLoading(false); return; }
    curriculumItem.list(versionId)
      .then((rows) => { onItemsChange(rows); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [versionId]);

  const itemDefaults = {
    curriculumVersionId: versionId,
    orderIndex: items.length,
    sourceType: 'TEACHER_CREATED',
    educationLevelIri: metadata.educationalLevelIri ?? '',
    schoolLevel: metadata.schoolLevel ?? '',
    grade: metadata.grade ?? '',
    educationalFramework: metadata.educationalFramework ?? 'ESTONIAN_NATIONAL_CURRICULUM',
    notation: '',
    verbIri: '',
    isMandatory: false,
  };

  async function handleSaveItem({ title, description, type, notation, verbIri, isMandatory }) {
    const parentItem = modal?.parentItem ?? null;
    const existingItem = modal?.item ?? null;
    try {
      if (existingItem) {
        const updated = await curriculumItem.update(existingItem.id, {
          title, description, notation, verbIri: verbIri || '', isMandatory: isMandatory ?? false,
        });
        onItemsChange(items.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const created = await curriculumItem.create({
          ...itemDefaults,
          title,
          description: description || '',
          type: type ?? modal?.type,
          notation: notation || '',
          verbIri: verbIri || '',
          isMandatory: isMandatory ?? false,
          parentItemId: parentItem?.id ?? null,
          orderIndex: items.filter((i) => i.parentItemId === (parentItem?.id ?? null)).length,
        });
        onItemsChange([...items, created]);
      }
      setModal(null);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Kustuta "${item.title}"?`)) return;
    try {
      await curriculumItem.delete(item.id);
      const removedIds = new Set([item.id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const i of items) {
          if (i.parentItemId && removedIds.has(i.parentItemId) && !removedIds.has(i.id)) {
            removedIds.add(i.id);
            changed = true;
          }
        }
      }
      onItemsChange(items.filter((i) => !removedIds.has(i.id)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleImport(nodes) {
    const targetParentId = importParent?.id ?? null;
    setImportParent(null);
    const created = [];
    for (const node of nodes) {
      try {
        const parent = await curriculumItem.create({
          ...itemDefaults,
          title: node.title,
          description: '',
          type: node.type,
          sourceType: 'OPPEKAVAWEB',
          externalIri: node.externalIri ?? '',
          orderIndex: items.filter((i) => i.parentItemId === targetParentId).length + created.filter((i) => i.parentItemId === targetParentId).length,
          parentItemId: targetParentId,
        });
        created.push(parent);
        for (const child of node.children ?? []) {
          const createdChild = await curriculumItem.create({
            ...itemDefaults,
            title: child.title,
            description: '',
            type: child.type,
            sourceType: 'OPPEKAVAWEB',
            externalIri: child.externalIri ?? '',
            orderIndex: created.filter((i) => i.parentItemId === parent.id).length,
            parentItemId: parent.id,
          });
          created.push(createdChild);
        }
      } catch (e) {
        setError(e.message);
      }
    }
    onItemsChange([...items, ...created]);
  }

  const existingIris = new Set(
    items
      .filter((i) => i.sourceType === 'OPPEKAVAWEB' || i.sourceType === 'EXTERNAL')
      .flatMap((i) => [i.externalIri, i.title].filter(Boolean))
  );

  return (
    <div className="relative px-6 py-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">Õppekava struktuur</h2>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{metadata.subjectLabel ?? ''} · {metadata.grade ?? ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setImportParent({ id: null })} className="rounded-xl border border-indigo-200/25 dark:border-indigo-800/40 bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-900/40 dark:to-blue-900/40 px-3.5 py-[7px] text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:brightness-105 transition">
            ⬇ Impordi graafist
          </button>
          <button onClick={() => setModal({ item: null, type: 'MODULE', parentItem: null })} className="rounded-xl bg-sky-600 px-3.5 py-[7px] text-xs font-semibold text-white shadow-[0_2px_6px_rgba(2,132,199,.25)] hover:bg-sky-700">
            + Moodul
          </button>
          <button onClick={() => setModal({ item: null, type: 'TOPIC', parentItem: null })} className="rounded-xl border border-sky-200/60 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-900/40 px-3.5 py-[7px] text-xs font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-100/80 dark:hover:bg-sky-900/40">
            + Teema
          </button>
          <button onClick={() => setModal({ item: null, type: 'LEARNING_OUTCOME', parentItem: null })} className="rounded-xl border border-sky-200/60 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-900/40 px-3.5 py-[7px] text-xs font-semibold text-sky-700 dark:text-sky-400 hover:bg-sky-100/80 dark:hover:bg-sky-900/40">
            + Õpiväljund
          </button>
        </div>
      </div>

      {error && <div className="mb-3 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 px-4 py-2 text-sm text-rose-700 dark:text-rose-300">{error}</div>}
      {loading ? <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Laen…</div> : (
        <WizardTree
          items={items.filter((i) => STRUCTURE_TYPES.includes(i.type))}
          mode="structure"
          scheduleMap={scheduleMap}
          onEdit={(item) => setModal({ item, type: item.type, parentItem: null })}
          onDelete={handleDelete}
          onAddChild={(parentItem, type) => setModal({ item: null, type, parentItem })}
          onImport={(parentItem) => setImportParent(parentItem ?? { id: null })}
        />
      )}

      {importParent && (
        <ImportPanel
          catalogJson={catalogJson}
          existingExternalIris={existingIris}
          onImport={handleImport}
          onClose={() => setImportParent(null)}
        />
      )}

      {modal && (
        <ItemFormModal
          item={modal.item}
          type={modal.type}
          parentItem={modal.parentItem}
          onSave={handleSaveItem}
          onClose={() => setModal(null)}
          verbs={verbs}
        />
      )}
    </div>
  );
}
