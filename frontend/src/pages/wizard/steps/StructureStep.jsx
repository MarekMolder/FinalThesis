import { useEffect, useState } from 'react';
import { curriculumItem } from '../../../api';
import WizardTree from '../../../components/wizard/WizardTree';
import ImportPanel from '../../../components/wizard/ImportPanel';
import ItemFormModal from '../../../components/wizard/ItemFormModal';

const STRUCTURE_TYPES = ['MODULE', 'TOPIC', 'LEARNING_OUTCOME'];

export default function StructureStep({ versionId, metadata, catalogJson, items, onItemsChange, verbs }) {
  const [loading, setLoading] = useState(items.length === 0);
  const [importOpen, setImportOpen] = useState(false);
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
    setImportOpen(false);
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
          orderIndex: items.length + created.length,
          parentItemId: null,
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
            orderIndex: created.length,
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
    <div className="relative p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Õppekava struktuur</h2>
          <p className="mt-1 text-sm text-slate-500">{metadata.subjectLabel ?? ''} · {metadata.grade ?? ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setImportOpen(true)} className="rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
            ⬇ Impordi graafist
          </button>
          <button onClick={() => setModal({ item: null, type: 'MODULE', parentItem: null })} className="rounded-2xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700">
            + Moodul
          </button>
          <button onClick={() => setModal({ item: null, type: 'TOPIC', parentItem: null })} className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white/90">
            + Teema
          </button>
          <button onClick={() => setModal({ item: null, type: 'LEARNING_OUTCOME', parentItem: null })} className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white/90">
            + Õpiväljund
          </button>
        </div>
      </div>

      {error && <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}
      {loading ? <div className="py-10 text-center text-sm text-slate-400">Laen…</div> : (
        <WizardTree
          items={items.filter((i) => STRUCTURE_TYPES.includes(i.type))}
          mode="structure"
          onEdit={(item) => setModal({ item, type: item.type, parentItem: null })}
          onDelete={handleDelete}
          onAddChild={(parentItem, type) => setModal({ item: null, type, parentItem })}
          onImport={() => setImportOpen(true)}
        />
      )}

      {importOpen && (
        <ImportPanel
          catalogJson={catalogJson}
          existingExternalIris={existingIris}
          onImport={handleImport}
          onClose={() => setImportOpen(false)}
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
