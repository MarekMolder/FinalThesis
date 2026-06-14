import { useEffect, useState } from 'react';
import { curriculumItem } from '../../../api';
import WizardTree from '../../../components/wizard/WizardTree';
import ImportPanel from '../../../components/wizard/ImportPanel';
import ItemFormModal from '../../../components/wizard/ItemFormModal';
import RowMenu from '../../../components/wizard/RowMenu';
import { PlusIcon, ImportIcon, ModuleIcon, TopicIcon, OutcomeIcon } from '../../../components/wizard/treeIcons';

const STRUCTURE_TYPES = ['MODULE', 'TOPIC', 'LEARNING_OUTCOME', 'TEST'];

function buildTopicCatalog(catalogJson, topicItem) {
  if (!catalogJson) return null;
  const themes = catalogJson.themes ?? [];
  const match = themes.find((t) =>
    (topicItem.externalIri && t.fullUrl && topicItem.externalIri === t.fullUrl) ||
    (topicItem.title && t.title && topicItem.title === t.title)
  );
  const los = match ? (match.learningOutcomes ?? []) : [];
  return { themes: [], learningOutcomes: los, modules: [] };
}

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
        <div className="flex flex-shrink-0 gap-2">
          <button onClick={() => setImportParent({ id: null })} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60">
            <ImportIcon className="h-[15px] w-[15px]" /> Impordi graafist
          </button>
          <RowMenu
            trigger={() => (
              <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_9px_rgba(79,86,196,.26)] transition-colors hover:bg-indigo-600">
                <PlusIcon className="h-[15px] w-[15px]" /> Lisa
              </span>
            )}
          >
            {(close) => (
              <>
                <RowMenu.Label>Lisa juurelement</RowMenu.Label>
                <RowMenu.Item icon={<ModuleIcon />} onClick={() => { setModal({ item: null, type: 'MODULE', parentItem: null }); close(); }}>Uus moodul</RowMenu.Item>
                <RowMenu.Item icon={<TopicIcon />} onClick={() => { setModal({ item: null, type: 'TOPIC', parentItem: null }); close(); }}>Uus teema</RowMenu.Item>
                <RowMenu.Item icon={<OutcomeIcon />} onClick={() => { setModal({ item: null, type: 'LEARNING_OUTCOME', parentItem: null }); close(); }}>Uus õpiväljund</RowMenu.Item>
              </>
            )}
          </RowMenu>
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
          catalogJson={importParent.type === 'TOPIC' ? buildTopicCatalog(catalogJson, importParent) : catalogJson}
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
