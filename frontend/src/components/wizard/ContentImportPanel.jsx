import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { graph, curriculumItem } from '../../api';

const TYPE_TABS = [
  { key: 'all', label: 'Koik' },
  { key: 'TASK', label: 'Ulesanded' },
  { key: 'TEST', label: 'Testid' },
  { key: 'LEARNING_MATERIAL', label: 'Materjalid' },
  { key: 'KNOBIT', label: 'Knobitid' },
];

const TYPE_BADGE = {
  TASK: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
  TEST: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60',
  LEARNING_MATERIAL: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800/60',
  KNOBIT: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
};

const TYPE_LABEL = {
  TASK: 'Ulesanne',
  TEST: 'Test',
  LEARNING_MATERIAL: 'Materjal',
  KNOBIT: 'Knobit',
};

function GraphLink({ url }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="Ava oppekava.edu.ee lehel"
      className="flex-shrink-0 rounded p-0.5 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-700 dark:hover:text-sky-300"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}

const MODULE_TOPIC_TYPES = new Set(['MODULE', 'TOPIC']);

export default function ContentImportPanel({
  mode,
  element,
  metadata,
  versionId,
  existingExternalIris,
  onImport,
  onClose,
}) {
  const allowedTypes = MODULE_TOPIC_TYPES.has(element?.type) ? new Set(['TEST']) : null;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState(new Set());
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    setData(null);
    setSelected(new Set());

    const promise =
      mode === 'related'
        ? graph.itemsForElement(element.externalIri)
        : graph.contentByMetadata({
            subject: metadata.subjectIri,
            ...(metadata.schoolLevel && { schoolLevel: metadata.schoolLevel }),
            ...(metadata.grade && { grade: metadata.grade }),
          });

    promise
      .then((res) => {
        if (ignore) return;
        const items = mode === 'related' ? res : (res.contentItems ?? []);
        setData(items);
        setLoading(false);
      })
      .catch((e) => {
        if (ignore) return;
        setError(e.message || 'Graafiga uhendus ebaonnestus - proovi hiljem uuesti');
        setLoading(false);
      });

    return () => { ignore = true; };
  }, [mode, element, metadata]);

  const alreadyImported = existingExternalIris ?? new Set();

  const q = search.toLowerCase().trim();

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((item) => {
      if (allowedTypes && !allowedTypes.has(item.type)) return false;
      if (tab !== 'all' && item.type !== tab) return false;
      if (q && !(item.headline ?? item.pageTitle ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, tab, q, allowedTypes]);

  const grouped = useMemo(() => {
    if (mode !== 'related') return null;
    const groups = {};
    for (const t of ['TASK', 'TEST', 'LEARNING_MATERIAL', 'KNOBIT']) {
      if (!allowedTypes || allowedTypes.has(t)) groups[t] = [];
    }
    for (const item of filtered) {
      if (groups[item.type]) groups[item.type].push(item);
    }
    return groups;
  }, [mode, filtered, allowedTypes]);

  function itemKey(item) {
    return item.fullUrl ?? item.pageTitle;
  }

  function toggleParent(item) {
    const key = itemKey(item);
    const childKeys = (item.children ?? []).map(itemKey);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        childKeys.forEach((k) => next.delete(k));
      } else {
        next.add(key);
        childKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  }

  function toggleChild(child) {
    const key = itemKey(child);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function deselectAllChildren(item) {
    const childKeys = (item.children ?? []).map(itemKey);
    setSelected((prev) => {
      const next = new Set(prev);
      childKeys.forEach((k) => next.delete(k));
      return next;
    });
  }

  function selectAllChildren(item) {
    const childKeys = (item.children ?? []).map(itemKey);
    setSelected((prev) => {
      const next = new Set(prev);
      childKeys.forEach((k) => next.add(k));
      return next;
    });
  }

  function toggleExpand(item) {
    const key = itemKey(item);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function getSelectedItems() {
    if (!data) return [];
    const items = [];
    for (const item of data) {
      if (selected.has(itemKey(item))) {
        const selectedChildren = (item.children ?? []).filter((c) => selected.has(itemKey(c)));
        items.push({ ...item, children: selectedChildren });
      }
    }
    return items;
  }

  async function handleImport() {
    setImporting(true);
    setError('');
    try {
      const selectedItems = getSelectedItems();
      const createdItems = [];
      const currentCount = 0;

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        if (alreadyImported.has(itemKey(item))) continue;

        const parent = await curriculumItem.create({
          curriculumVersionId: versionId,
          type: item.type,
          title: item.headline ?? item.pageTitle,
          description: '',
          sourceType: 'OPPEKAVAWEB',
          externalIri: item.fullUrl,
          parentItemId: element.id,
          orderIndex: currentCount + i,
          educationLevelIri: metadata.educationalLevelIri ?? '',
          schoolLevel: metadata.schoolLevel ?? '',
          grade: metadata.grade ?? '',
          educationalFramework: metadata.educationalFramework ?? 'ESTONIAN_NATIONAL_CURRICULUM',
          notation: '',
          verbIri: '',
          isMandatory: false,
        });
        createdItems.push(parent);

        for (let j = 0; j < (item.children ?? []).length; j++) {
          const child = item.children[j];
          if (alreadyImported.has(itemKey(child))) continue;

          const createdChild = await curriculumItem.create({
            curriculumVersionId: versionId,
            type: child.type,
            title: child.headline ?? child.pageTitle,
            description: '',
            sourceType: 'OPPEKAVAWEB',
            externalIri: child.fullUrl,
            parentItemId: parent.id,
            orderIndex: j,
            educationLevelIri: metadata.educationalLevelIri ?? '',
            schoolLevel: metadata.schoolLevel ?? '',
            grade: metadata.grade ?? '',
            educationalFramework: metadata.educationalFramework ?? 'ESTONIAN_NATIONAL_CURRICULUM',
            notation: '',
            verbIri: '',
            isMandatory: false,
          });
          createdItems.push(createdChild);
        }
      }

      onImport(createdItems, selectedItems);
    } catch (e) {
      setError(e.message || 'Import ebaonnestus');
    } finally {
      setImporting(false);
    }
  }

  function renderItemRow(item, isChild = false) {
    const key = itemKey(item);
    const isSelected = selected.has(key);
    const isImported = alreadyImported.has(key);
    const hasChildren = (item.children ?? []).length > 0;
    const isExpanded = expanded.has(key);

    return (
      <div key={key}>
        <div
          className={[
            'flex items-center gap-2 px-3 py-2 border-b border-slate-50 dark:border-slate-700/50 last:border-0',
            isChild ? 'pl-8' : '',
            isImported ? 'opacity-40' : 'hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors',
          ].join(' ')}
        >
          {hasChildren && !isChild && (
            <button
              onClick={() => toggleExpand(item)}
              className="flex-shrink-0 rounded p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className={['transition-transform', isExpanded ? 'rotate-90' : ''].join(' ')}
              >
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {!hasChildren && !isChild && <div className="w-[16px] flex-shrink-0" />}

          <label className="flex flex-1 items-center gap-2 cursor-pointer min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              disabled={isImported || importing}
              onChange={() => (isChild ? toggleChild(item) : toggleParent(item))}
              className="h-3.5 w-3.5 accent-sky-600 flex-shrink-0 rounded"
            />
            <span className="flex-1 text-[11px] text-slate-700 dark:text-slate-300 leading-snug truncate">
              {item.headline ?? item.pageTitle}
            </span>
          </label>

          <span
            className={[
              'flex-shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold',
              TYPE_BADGE[item.type] ?? 'bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600',
            ].join(' ')}
          >
            {TYPE_LABEL[item.type] ?? item.type}
          </span>

          {isImported && <span className="text-[9px] text-slate-400 dark:text-slate-500 flex-shrink-0">Juba imporditud</span>}
          <GraphLink url={item.fullUrl} />
        </div>

        {hasChildren && isExpanded && (
          <div>
            <div className="flex gap-1.5 pl-8 py-1 border-b border-slate-50 dark:border-slate-700/50">
              <button
                onClick={() => selectAllChildren(item)}
                className="text-[9px] font-medium text-sky-600 hover:text-sky-800"
              >
                Vali koik ({(item.children ?? []).length})
              </button>
              <span className="text-[9px] text-slate-300 dark:text-slate-600">|</span>
              <button
                onClick={() => deselectAllChildren(item)}
                className="text-[9px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Tuhjenda koik
              </button>
            </div>
            {(item.children ?? []).map((child) => renderItemRow(child, true))}
          </div>
        )}
      </div>
    );
  }

  function renderGroupSection(type, items) {
    if (items.length === 0) return null;
    return (
      <div key={type} className="mb-3">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {TYPE_LABEL[type] ?? type} ({items.length})
        </div>
        <div className="rounded-2xl border border-slate-100/60 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          {items.map((item) => renderItemRow(item))}
        </div>
      </div>
    );
  }

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex w-[90vw] max-w-[900px] flex-col rounded-3xl border border-white/60 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 shadow-2xl overflow-hidden"
        style={{ maxHeight: '88vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100/80 dark:border-slate-700 bg-gradient-to-r from-sky-50/50 to-indigo-50/50 dark:from-slate-800 dark:to-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-indigo-600 shadow-sm">
              {mode === 'related' ? (
                <span className="text-sm">&#128279;</span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
              )}
            </div>
            <div>
              <div className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {mode === 'related' ? 'Seotud sisu graafist' : 'Otsi sisu graafist'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {element.title ?? 'Element'} &middot; oppekava.edu.ee
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-sm text-slate-400 dark:text-slate-500 animate-pulse">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Laen andmeid graafist...
              </div>
            </div>
          )}

          {!loading && !error && data && data.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-slate-300 dark:text-slate-600">
                <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center px-4">
                Graafist ei leitud seotud objekte.
              </p>
            </div>
          )}

          {!loading && data && data.length > 0 && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Otsi pealkirja jargi..."
                    className="w-full rounded-xl border border-slate-200/80 dark:border-slate-600 bg-white/70 dark:bg-slate-700 py-2.5 pl-10 pr-3 text-sm text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-300 dark:focus:border-sky-600 focus:ring-2 focus:ring-sky-200/40 dark:focus:ring-sky-800/40"
                  />
                </div>

                <div className="flex gap-1 rounded-xl bg-slate-100/70 dark:bg-slate-700/70 p-1">
                  {TYPE_TABS
                    .filter((t) => !allowedTypes || t.key === 'all' || allowedTypes.has(t.key))
                    .map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={[
                        'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap',
                        tab === t.key
                          ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                      ].join(' ')}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{selected.size} valitud</span>
                  <button
                    onClick={handleImport}
                    disabled={selected.size === 0 || importing}
                    className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:from-sky-700 hover:to-indigo-700 disabled:opacity-40 transition-all"
                  >
                    {importing ? 'Impordin...' : `Impordi valitud (${selected.size})`}
                  </button>
                </div>
              </div>

              {mode === 'related' && grouped
                ? Object.entries(grouped).map(([type, items]) => renderGroupSection(type, items))
                : (
                  <div className="rounded-2xl border border-slate-100/60 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
                    {filtered.map((item) => renderItemRow(item))}
                  </div>
                )}

              {filtered.length === 0 && (
                <div className="flex items-center justify-center py-10 text-xs text-slate-400 dark:text-slate-500">
                  Otsingutulemusi ei leitud
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
