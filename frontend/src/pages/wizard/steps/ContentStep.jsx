import { useEffect, useState } from 'react';
import { curriculumItem, relation, graph } from '../../../api';
import WizardTree from '../../../components/wizard/WizardTree';
import ItemFormModal from '../../../components/wizard/ItemFormModal';
import ContentImportPanel from '../../../components/wizard/ContentImportPanel';

const CONTENT_TYPES = ['TASK', 'TEST', 'LEARNING_MATERIAL', 'KNOBIT'];
const IMPORTABLE_PARENT_TYPES = ['MODULE', 'TOPIC', 'LEARNING_OUTCOME'];

export default function ContentStep({ versionId, metadata, items, onItemsChange, onContentStatsReady }) {
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const [contentImport, setContentImport] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteSelected, setDeleteSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  // On mount: fetch content stats from graph
  useEffect(() => {
    if (!metadata?.subjectIri || !onContentStatsReady) return;
    let ignore = false;
    graph.contentByMetadata({
      subject: metadata.subjectIri,
      ...(metadata.schoolLevel && { schoolLevel: metadata.schoolLevel }),
      ...(metadata.grade && { grade: metadata.grade }),
    })
      .then((res) => {
        if (ignore) return;
        const contentItems = res.contentItems ?? [];
        const stats = {
          tasks: contentItems.filter((i) => i.type === 'TASK').length,
          tests: contentItems.filter((i) => i.type === 'TEST').length,
          learningMaterials: contentItems.filter((i) => i.type === 'LEARNING_MATERIAL').length,
          knobits: contentItems.filter((i) => i.type === 'KNOBIT').length,
        };
        onContentStatsReady(stats);
      })
      .catch(() => {}); // graph unavailable — non-fatal
    return () => { ignore = true; };
  }, [metadata?.subjectIri]);

  const itemDefaults = {
    curriculumVersionId: versionId,
    sourceType: 'TEACHER_CREATED',
    educationLevelIri: metadata.educationalLevelIri ?? '',
    schoolLevel: metadata.schoolLevel ?? '',
    grade: metadata.grade ?? '',
    educationalFramework: metadata.educationalFramework ?? 'ESTONIAN_NATIONAL_CURRICULUM',
    notation: '',
    verbIri: '',
    isMandatory: false,
  };

  const existingExternalIris = new Set(
    items.filter((i) => i.externalIri).map((i) => i.externalIri)
  );

  function handleAddChild(parentItem) {
    setModal({ item: null, type: 'TASK', parentItem });
  }

  async function handleSaveItem({ title, description, type, notation }) {
    const parentItem = modal?.parentItem ?? null;
    const existingItem = modal?.item ?? null;
    try {
      if (existingItem) {
        const updated = await curriculumItem.update(existingItem.id, { title, description, notation, verbIri: '', isMandatory: false });
        onItemsChange(items.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const created = await curriculumItem.create({
          ...itemDefaults,
          title,
          description: description || '',
          type,
          notation: notation || '',
          orderIndex: items.filter((i) => i.parentItemId === (parentItem?.id ?? null)).length,
          parentItemId: parentItem?.id ?? null,
        });
        onItemsChange([...items, created]);
      }
      setModal(null);
    } catch (e) {
      setError(e.message);
    }
  }

  function getDescendantIds(itemId) {
    const ids = new Set([itemId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const i of items) {
        if (i.parentItemId && ids.has(i.parentItemId) && !ids.has(i.id)) {
          ids.add(i.id);
          changed = true;
        }
      }
    }
    return ids;
  }

  async function handleDelete(item) {
    if (!window.confirm(`Kustuta "${item.title}"?`)) return;
    try {
      await curriculumItem.delete(item.id);
      const removedIds = getDescendantIds(item.id);
      onItemsChange(items.filter((i) => !removedIds.has(i.id)));
    } catch (e) {
      setError(e.message);
    }
  }

  function toggleDeleteSelect(item) {
    setDeleteSelected((prev) => {
      const next = new Set(prev);
      const descendantIds = getDescendantIds(item.id);
      if (next.has(item.id)) {
        descendantIds.forEach((id) => next.delete(id));
      } else {
        descendantIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function handleBulkDelete() {
    if (deleteSelected.size === 0) return;
    const count = deleteSelected.size;
    if (!window.confirm(`Kustuta ${count} elementi?`)) return;
    setDeleting(true);
    setError('');
    try {
      // Delete only root-level selected items (backend cascades children)
      const rootIds = [...deleteSelected].filter((id) => {
        const item = items.find((i) => i.id === id);
        return item && (!item.parentItemId || !deleteSelected.has(item.parentItemId));
      });
      for (const id of rootIds) {
        await curriculumItem.delete(id);
      }
      onItemsChange(items.filter((i) => !deleteSelected.has(i.id)));
      setDeleteSelected(new Set());
      setDeleteMode(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleContentImport(createdItems, selectedDtos) {
    // 1. Add created items to local state
    onItemsChange([...items, ...createdItems]);

    // 2. Create relations for imported items
    const allItems = [...items, ...createdItems];
    const iriToId = new Map();
    for (const item of allItems) {
      if (item.externalIri) iriToId.set(item.externalIri, item.id);
    }

    for (const dto of selectedDtos) {
      const parentCreated = createdItems.find((ci) => ci.externalIri === dto.fullUrl);
      if (!parentCreated) continue;

      // ON_OSA relations: child -> parent
      for (const child of (dto.children ?? [])) {
        const childCreated = createdItems.find((ci) => ci.externalIri === child.fullUrl);
        if (!childCreated) continue;
        try {
          await relation.create({
            curriculumVersionId: versionId,
            sourceItemId: childCreated.id,
            targetItemId: parentCreated.id,
            type: 'ON_OSA',
          });
        } catch (e) {
          console.warn('Failed to create ON_OSA relation:', e.message);
        }
      }

      // SEOTUD_OPIVALJUND: content item -> LO
      if (contentImport?.element?.type === 'LEARNING_OUTCOME' && contentImport?.element?.id) {
        try {
          await relation.create({
            curriculumVersionId: versionId,
            sourceItemId: parentCreated.id,
            targetItemId: contentImport.element.id,
            type: 'SEOTUD_OPIVALJUND',
          });
        } catch (e) {
          console.warn('Failed to create SEOTUD_OPIVALJUND relation:', e.message);
        }
      }

      // SEOTUD_TEEMA: content item -> topic
      if (contentImport?.element?.type === 'TOPIC' && contentImport?.element?.id) {
        try {
          await relation.create({
            curriculumVersionId: versionId,
            sourceItemId: parentCreated.id,
            targetItemId: contentImport.element.id,
            type: 'SEOTUD_TEEMA',
          });
        } catch (e) {
          console.warn('Failed to create SEOTUD_TEEMA relation:', e.message);
        }
      } else if (dto.topicLabel) {
        const topicItem = allItems.find(
          (i) => i.type === 'TOPIC' && i.title === dto.topicLabel
        );
        if (topicItem) {
          try {
            await relation.create({
              curriculumVersionId: versionId,
              sourceItemId: parentCreated.id,
              targetItemId: topicItem.id,
              type: 'SEOTUD_TEEMA',
            });
          } catch (e) {
            console.warn('Failed to create SEOTUD_TEEMA relation:', e.message);
          }
        }
      }
    }

    setContentImport(null);
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Sisu lisamine</h2>
          <p className="mt-1 text-sm text-slate-500">Lisa opivaljundite alla ulesanded, testid, materjalid ja knobitid.</p>
        </div>
        <div className="flex gap-2">
          {deleteMode ? (
            <>
              <button
                onClick={handleBulkDelete}
                disabled={deleteSelected.size === 0 || deleting}
                className="rounded-2xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-40"
              >
                {deleting ? 'Kustutan...' : `Kustuta valitud (${deleteSelected.size})`}
              </button>
              <button
                onClick={() => { setDeleteMode(false); setDeleteSelected(new Set()); }}
                className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white/90"
              >
                Loobu
              </button>
            </>
          ) : (
            <button
              onClick={() => setDeleteMode(true)}
              className="rounded-2xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Kustuta sisu
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <WizardTree
        items={items}
        mode="content"
        onEdit={(item) => setModal({ item, type: item.type, parentItem: null })}
        onDelete={handleDelete}
        onAddChild={handleAddChild}
        onImport={() => {}}
        renderExtraButtons={(item) => {
          const parts = [];
          if (deleteMode && CONTENT_TYPES.includes(item.type)) {
            parts.push(
              <label key="cb" className="flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={deleteSelected.has(item.id)}
                  onChange={() => toggleDeleteSelect(item)}
                  className="h-3.5 w-3.5 accent-red-600 rounded"
                />
              </label>
            );
          }
          if (IMPORTABLE_PARENT_TYPES.includes(item.type)) {
            if (item.externalIri) {
              parts.push(
                <button
                  key="related"
                  onClick={(e) => { e.stopPropagation(); setContentImport({ element: item, mode: 'related' }); }}
                  className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
                  title="Seotud sisu graafist"
                >
                  &#128279; Seotud
                </button>
              );
            }
            parts.push(
              <button
                key="search"
                onClick={(e) => { e.stopPropagation(); setContentImport({ element: item, mode: 'search' }); }}
                className="rounded-lg border border-slate-200 bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                title="Otsi sisu graafist"
              >
                &#128269; Otsi
              </button>
            );
          }
          return parts.length > 0 ? <span className="flex gap-1">{parts}</span> : null;
        }}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md p-1">
            {!modal.item && (
              <div className="mb-3 flex gap-2 flex-wrap rounded-2xl bg-white/90 border border-white/60 px-4 py-3 shadow">
                <span className="text-xs font-semibold text-slate-500 self-center">Tuup:</span>
                {CONTENT_TYPES.map((t) => (
                  <button key={t} onClick={() => setModal((m) => ({ ...m, type: t }))}
                    className={['rounded-xl px-3 py-1 text-xs font-semibold border', modal.type === t ? 'bg-sky-600 text-white border-sky-600' : 'bg-white/70 text-slate-700 border-slate-200'].join(' ')}>
                    {{ TASK: 'Ulesanne', TEST: 'Test', LEARNING_MATERIAL: 'Materjal', KNOBIT: 'Knobit' }[t]}
                  </button>
                ))}
              </div>
            )}
            <ItemFormModal item={modal.item} type={modal.type} parentItem={modal.parentItem} onSave={handleSaveItem} onClose={() => setModal(null)} noOverlay />
          </div>
        </div>
      )}

      {contentImport && (
        <ContentImportPanel
          mode={contentImport.mode}
          element={contentImport.element}
          metadata={metadata}
          versionId={versionId}
          existingExternalIris={existingExternalIris}
          onImport={handleContentImport}
          onClose={() => setContentImport(null)}
        />
      )}
    </div>
  );
}
