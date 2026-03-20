import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, schedule } from '../../api';
import './google-schedule-modal.css';

const STATUS_OPTIONS = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const ACTIVITY_TYPES = ['TASK', 'TEST', 'LEARNING_MATERIAL', 'KNOBIT'];

function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function parseLocalDateTime(value) {
  if (!value) return null;
  const s = String(value);
  const [datePart, timePart] = s.split('T');
  if (!datePart || !timePart) return new Date(value);
  const [y, m, d] = datePart.split('-').map((x) => Number(x));
  const t = timePart.replace('Z', '');
  const parts = t.split(':');
  const hh = Number(parts[0]);
  const mm = Number(parts[1] ?? 0);
  const ss = Number(parts[2]?.split('.')[0] ?? 0);
  return new Date(y, m - 1, d, hh, mm, ss);
}

function formatLocalDateTime(d) {
  if (!d || Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function toDatetimeLocalValue(d) {
  if (!d) return '';
  return formatLocalDateTime(d);
}

function typeLabel(t) {
  if (!t) return '';
  if (t === 'LEARNING_OUTCOME') return 'ÕV';
  return String(t).replace(/_/g, ' ');
}

function parentChainTitles(itemId, itemById) {
  const parts = [];
  let id = itemId;
  const seen = new Set();
  while (id && itemById.has(id) && !seen.has(id)) {
    seen.add(id);
    const it = itemById.get(id);
    parts.unshift(it.title || typeLabel(it.type));
    id = it.parentItemId;
  }
  return parts;
}

export function parentScheduleWindow(parentItemId, blocks, parseDt) {
  if (!parentItemId || !blocks?.length) return null;
  const rows = blocks.filter((b) => b.kind === 'ITEM_SCHEDULE' && b.curriculumItemId === parentItemId);
  let minT = Infinity;
  let maxT = -Infinity;
  for (const b of rows) {
    const st = parseDt(b.plannedStartAt);
    const en = parseDt(b.plannedEndAt);
    if (!st || !en) continue;
    minT = Math.min(minT, st.getTime());
    maxT = Math.max(maxT, en.getTime());
  }
  if (minT === Infinity) return null;
  return { start: new Date(minT), end: new Date(maxT) };
}

/**
 * Range reegel: kui on vahetu parent (struktuur parent_item_id), peab olema täielikult parenti ajakava sees.
 * Moodulid ja iseseisvad ÕV-d on tipptaseme elemendid — neile seda reeglit ei rakenda (ka juhul kui DB-s on vana/vale parent viide).
 */
export function validateStrictParentWindow(itemId, start, end, items, blocks) {
  const itemById = new Map((items || []).filter((i) => i?.id).map((i) => [i.id, i]));
  const it = itemById.get(itemId);
  if (!it) return { ok: true };
  if (it.type === 'MODULE') return { ok: true };
  if (it.type === 'LEARNING_OUTCOME' && isStandaloneLearningOutcome(it, itemById)) return { ok: true };
  if (!it.parentItemId) return { ok: true };
  const win = parentScheduleWindow(it.parentItemId, blocks, parseLocalDateTime);
  const parent = itemById.get(it.parentItemId);
  const pname = parent?.title || 'vanem';
  if (!win) {
    return {
      ok: false,
      message: `Elemendil „${pname}” pole veel ajakava. Lisa kõigepealt vanema vahemik, siis saad seda last ajastada.`,
    };
  }
  if (start.getTime() < win.start.getTime() || end.getTime() > win.end.getTime()) {
    return {
      ok: false,
      message: `Aeg peab jääma täielikult vanema „${pname}” planeeritud akna sisse. Pikenda vanemat või kohanda last.`,
    };
  }
  return { ok: true };
}

function isStandaloneLearningOutcome(it, itemById) {
  if (!it || it.type !== 'LEARNING_OUTCOME') return false;
  if (!it.parentItemId) return true;
  const p = itemById.get(it.parentItemId);
  return !p || p.type !== 'MODULE';
}

/**
 * Google Calendar–inspired modal: create/edit curriculum_item_schedule or manual time buffer.
 */
export default function GoogleScheduleModal({
  open,
  onClose,
  curriculumVersionId,
  items,
  blocks,
  mode,
  initialStart,
  initialEnd,
  editingBlock,
  onSaved,
  /**
   * Loomisel: { moduleIds, loIds } — ITEM_SCHEDULE plokid, mis valitud slotiga lõikuvad.
   * null = filtrit pole (muutmine / ilma ülekatteta).
   */
  slotContext,
}) {
  const itemById = useMemo(() => {
    const m = new Map();
    for (const it of items || []) {
      if (it?.id) m.set(it.id, it);
    }
    return m;
  }, [items]);

  /** Ainult create + vähemalt üks lõikuv ajakava → kitsendatud valikud */
  const effectiveSlotFilter = useMemo(() => {
    if (mode === 'edit' || !slotContext) return null;
    const moduleIds = (slotContext.moduleIds || []).map(String);
    const loIds = (slotContext.loIds || []).map(String);
    if (moduleIds.length === 0 && loIds.length === 0) return null;
    return { moduleIds, loIds };
  }, [mode, slotContext]);

  const sortedItems = useMemo(() => {
    const list = [...(items || [])];
    list.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || String(a.title).localeCompare(String(b.title)));
    return list;
  }, [items]);

  const modules = useMemo(() => sortedItems.filter((i) => i.type === 'MODULE'), [sortedItems]);

  const modulesFiltered = useMemo(() => {
    if (!effectiveSlotFilter?.moduleIds.length) return modules;
    const allow = new Set(effectiveSlotFilter.moduleIds);
    return modules.filter((m) => allow.has(String(m.id)));
  }, [modules, effectiveSlotFilter]);

  const learningOutcomesFilteredForSlot = useMemo(() => {
    const all = sortedItems.filter((i) => i.type === 'LEARNING_OUTCOME');
    if (!effectiveSlotFilter) return all;
    if (effectiveSlotFilter.loIds.length > 0) {
      const allow = new Set(effectiveSlotFilter.loIds);
      return all.filter((i) => allow.has(String(i.id)));
    }
    if (effectiveSlotFilter.moduleIds.length > 0) {
      const modAllow = new Set(effectiveSlotFilter.moduleIds);
      return all.filter((i) => {
        if (isStandaloneLearningOutcome(i, itemById)) return true;
        const p = i.parentItemId ? itemById.get(i.parentItemId) : null;
        return p?.type === 'MODULE' && modAllow.has(String(p.id));
      });
    }
    return all;
  }, [sortedItems, effectiveSlotFilter, itemById]);

  const [entryKind, setEntryKind] = useState('SCHEDULE');
  /** MODULE | LEARNING_OUTCOME | ACTIVITY */
  const [itemTier, setItemTier] = useState('MODULE');
  /** STANDALONE ÕV vs mooduli all */
  const [loScope, setLoScope] = useState('STANDALONE');
  const [scopeModuleId, setScopeModuleId] = useState('');
  const [scopeLoId, setScopeLoId] = useState('');

  const [curriculumItemId, setCurriculumItemId] = useState('');
  const [startStr, setStartStr] = useState('');
  const [endStr, setEndStr] = useState('');
  const [status, setStatus] = useState('PLANNED');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localError, setLocalError] = useState('');

  const selectableItems = useMemo(() => {
    if (itemTier === 'MODULE') {
      /** Uut moodulit sama päeva peale ei tohi peita: alati kõik moodulid (filter kehtib ÕV / tegevuse juures). */
      return modules;
    }
    if (itemTier === 'LEARNING_OUTCOME') {
      if (loScope === 'STANDALONE') {
        return sortedItems.filter((i) => {
          if (!isStandaloneLearningOutcome(i, itemById)) return false;
          if (!effectiveSlotFilter?.loIds.length) return true;
          return effectiveSlotFilter.loIds.includes(String(i.id));
        });
      }
      if (!scopeModuleId) return [];
      return sortedItems.filter((i) => {
        if (i.type !== 'LEARNING_OUTCOME' || String(i.parentItemId) !== String(scopeModuleId)) return false;
        if (!effectiveSlotFilter?.loIds.length) return true;
        return effectiveSlotFilter.loIds.includes(String(i.id));
      });
    }
    if (itemTier === 'ACTIVITY') {
      if (!scopeLoId) return [];
      return sortedItems.filter((i) => i.parentItemId === scopeLoId && ACTIVITY_TYPES.includes(i.type));
    }
    return sortedItems;
  }, [itemTier, loScope, scopeModuleId, scopeLoId, sortedItems, itemById, modules, effectiveSlotFilter]);

  /** Vanema aken (hoiatus / info), kui valik on juba tehtud */
  const strictHint = useMemo(() => {
    if (entryKind !== 'SCHEDULE' || !curriculumItemId) return null;
    const v = validateStrictParentWindow(curriculumItemId, new Date(startStr), new Date(endStr), items, blocks);
    if (v.ok) return null;
    return v.message;
  }, [entryKind, curriculumItemId, startStr, endStr, items, blocks]);

  useEffect(() => {
    if (!open) return;
    setLocalError('');
    if (mode === 'edit' && editingBlock) {
      if (editingBlock.kind === 'MANUAL_BUFFER') {
        setEntryKind('BUFFER');
        setItemTier('MODULE');
        setLoScope('STANDALONE');
        setScopeModuleId('');
        setScopeLoId('');
        setCurriculumItemId('');
        setStartStr(toDatetimeLocalValue(parseLocalDateTime(editingBlock.plannedStartAt)));
        setEndStr(toDatetimeLocalValue(parseLocalDateTime(editingBlock.plannedEndAt)));
        setStatus(editingBlock.status || 'PLANNED');
        setNotes(editingBlock.notes || editingBlock.label || '');
      } else {
        setEntryKind('SCHEDULE');
        const it = itemById.get(editingBlock.curriculumItemId);
        if (it?.type === 'MODULE') {
          setItemTier('MODULE');
        } else if (it?.type === 'LEARNING_OUTCOME') {
          setItemTier('LEARNING_OUTCOME');
          const p = it.parentItemId ? itemById.get(it.parentItemId) : null;
          if (p?.type === 'MODULE') {
            setLoScope('UNDER_MODULE');
            setScopeModuleId(p.id);
          } else {
            setLoScope('STANDALONE');
            setScopeModuleId('');
          }
        } else if (ACTIVITY_TYPES.includes(it?.type)) {
          setItemTier('ACTIVITY');
          setScopeLoId(it.parentItemId || '');
        } else {
          setItemTier('MODULE');
        }
        setCurriculumItemId(editingBlock.curriculumItemId || '');
        setStartStr(toDatetimeLocalValue(parseLocalDateTime(editingBlock.plannedStartAt)));
        setEndStr(toDatetimeLocalValue(parseLocalDateTime(editingBlock.plannedEndAt)));
        setStatus(editingBlock.status || 'PLANNED');
        setNotes(editingBlock.notes || '');
      }
      return;
    }

    setEntryKind('SCHEDULE');
    const s = initialStart ? new Date(initialStart) : new Date();
    const e = initialEnd ? new Date(initialEnd) : new Date(s.getTime() + 60 * 60 * 1000);
    setStartStr(toDatetimeLocalValue(s));
    setEndStr(toDatetimeLocalValue(e));
    setStatus('PLANNED');
    setNotes('');

    const f = effectiveSlotFilter;
    const modF = f?.moduleIds?.length ? modules.filter((m) => f.moduleIds.includes(String(m.id))) : modules;
    const loOnly = f?.loIds?.length ? f.loIds : [];

    if (f?.loIds?.length === 1) {
      setItemTier('ACTIVITY');
      setLoScope('STANDALONE');
      setScopeModuleId('');
      setScopeLoId(loOnly[0]);
      const acts = sortedItems.filter(
        (i) => String(i.parentItemId) === String(loOnly[0]) && ACTIVITY_TYPES.includes(i.type)
      );
      setCurriculumItemId(acts[0]?.id || '');
    } else if ((f?.loIds?.length ?? 0) > 1) {
      setItemTier('ACTIVITY');
      setLoScope('STANDALONE');
      setScopeModuleId('');
      setScopeLoId(loOnly[0]);
      const acts = sortedItems.filter(
        (i) => String(i.parentItemId) === String(loOnly[0]) && ACTIVITY_TYPES.includes(i.type)
      );
      setCurriculumItemId(acts[0]?.id || '');
    } else if (f?.moduleIds?.length === 1) {
      setItemTier('LEARNING_OUTCOME');
      setLoScope('UNDER_MODULE');
      setScopeModuleId(f.moduleIds[0]);
      setScopeLoId('');
      const under = sortedItems.filter(
        (i) => i.type === 'LEARNING_OUTCOME' && String(i.parentItemId) === String(f.moduleIds[0])
      );
      setCurriculumItemId(under[0]?.id || '');
    } else if ((f?.moduleIds?.length ?? 0) > 1) {
      setItemTier('MODULE');
      setLoScope('STANDALONE');
      setScopeModuleId('');
      setScopeLoId('');
      setCurriculumItemId(modF[0]?.id || '');
    } else {
      setItemTier('MODULE');
      setLoScope('STANDALONE');
      setScopeModuleId('');
      setScopeLoId('');
      setCurriculumItemId(modules[0]?.id || '');
    }
  }, [open, mode, editingBlock, initialStart, initialEnd, sortedItems, effectiveSlotFilter, modules, itemById]);

  useEffect(() => {
    if (!open || mode === 'edit') return;
    const first = selectableItems[0]?.id || '';
    if (!selectableItems.some((i) => i.id === curriculumItemId)) {
      setCurriculumItemId(first);
    }
  }, [open, mode, selectableItems, curriculumItemId]);

  const selectedItem = curriculumItemId ? itemById.get(curriculumItemId) : null;
  const parentLine = selectedItem ? parentChainTitles(selectedItem.id, itemById).join(' › ') : '';
  const dotColor = selectedItem ? typeToDotColor(selectedItem.type) : '#5f6368';

  async function performSave(stayOpenAfterCreate) {
    setLocalError('');
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setLocalError('Sisesta kehtiv algus ja lõpp.');
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setLocalError('Lõpp peab olema pärast algust.');
      return;
    }

    if (entryKind === 'SCHEDULE' && curriculumItemId) {
      const gate = validateStrictParentWindow(curriculumItemId, start, end, items, blocks);
      if (!gate.ok) {
        setLocalError(gate.message);
        return;
      }
    }

    const plannedMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
    const plannedStartAt = `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}T${pad2(start.getHours())}:${pad2(start.getMinutes())}:00`;
    const plannedEndAt = `${end.getFullYear()}-${pad2(end.getMonth() + 1)}-${pad2(end.getDate())}T${pad2(end.getHours())}:${pad2(end.getMinutes())}:00`;

    setSaving(true);
    try {
      if (mode === 'edit' && editingBlock) {
        if (editingBlock.kind === 'MANUAL_BUFFER') {
          await api(`/curriculum-version-time-buffer/${editingBlock.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              id: editingBlock.id,
              plannedStartAt,
              plannedEndAt,
              plannedMinutes,
              status,
              bufferNotes: notes || 'Puhver',
            }),
          });
        } else {
          await schedule.update(editingBlock.id, {
            plannedStartAt,
            plannedEndAt,
            plannedMinutes,
            status,
            scheduleNotes: notes,
          });
        }
      } else if (entryKind === 'BUFFER') {
        await api('/curriculum-version-time-buffer', {
          method: 'POST',
          body: JSON.stringify({
            curriculumVersionId,
            plannedStartAt,
            plannedEndAt,
            plannedMinutes,
            status: status || 'PLANNED',
            bufferNotes: notes || 'Puhver',
          }),
        });
      } else {
        if (!curriculumItemId) {
          setLocalError('Vali element.');
          setSaving(false);
          return;
        }
        await schedule.create({
          curriculumItemId,
          plannedStartAt,
          plannedEndAt,
          plannedMinutes,
          actualStartAt: null,
          actualEndAt: null,
          actualMinutes: null,
          status,
          scheduleNotes: notes || '',
        });
      }
      onSaved?.();
      const canStayOpen = stayOpenAfterCreate && mode === 'create';
      if (canStayOpen) {
        setNotes('');
        if (entryKind === 'SCHEDULE' && curriculumItemId && selectableItems.length > 0) {
          const idx = selectableItems.findIndex((i) => String(i.id) === String(curriculumItemId));
          const next = selectableItems[idx + 1] || selectableItems[0];
          if (next && String(next.id) !== String(curriculumItemId)) {
            setCurriculumItemId(next.id);
          }
        }
        return;
      }
      onClose();
    } catch (err) {
      setLocalError(err?.message || 'Salvestamine ebaõnnestus');
    } finally {
      setSaving(false);
    }
  }

  function handleSave(e) {
    e.preventDefault();
    performSave(false);
  }

  async function handleDelete() {
    if (!editingBlock?.id || mode !== 'edit') return;
    if (!window.confirm('Kustuta see ajakirje?')) return;
    setDeleting(true);
    setLocalError('');
    try {
      if (editingBlock.kind === 'MANUAL_BUFFER') {
        await api(`/curriculum-version-time-buffer/${editingBlock.id}`, { method: 'DELETE' });
      } else {
        await schedule.delete(editingBlock.id);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setLocalError(err?.message || 'Kustutamine ebaõnnestus');
    } finally {
      setDeleting(false);
    }
  }

  if (!open) return null;

  return createPortal(
    <div className="gsm-overlay" role="dialog" aria-modal="true" aria-labelledby="gsm-title">
      <div className="gsm-backdrop" onClick={onClose} />
      <div className="gsm-panel" onClick={(ev) => ev.stopPropagation()}>
        <div className="gsm-header">
          <span className="gsm-drag" aria-hidden />
          <button type="button" className="gsm-close" onClick={onClose} aria-label="Sulge">
            ×
          </button>
        </div>

        <form className="gsm-body" onSubmit={handleSave}>
          <div className="gsm-title-row">
            <label htmlFor="gsm-title" className="gsm-sr-only">
              Element
            </label>
            {mode === 'edit' && editingBlock?.kind === 'MANUAL_BUFFER' ? (
              <input
                id="gsm-title"
                className="gsm-title-input"
                value={notes}
                onChange={(ev) => setNotes(ev.target.value)}
                placeholder="Puhvri nimi / märkus"
                autoComplete="off"
              />
            ) : mode === 'edit' && editingBlock?.kind === 'ITEM_SCHEDULE' ? (
              <div id="gsm-title" className="gsm-title-static">
                {editingBlock.itemTitle || editingBlock.label || 'Ajastatud element'}
              </div>
            ) : entryKind === 'BUFFER' ? (
              <input
                id="gsm-title"
                className="gsm-title-input"
                value={notes}
                onChange={(ev) => setNotes(ev.target.value)}
                placeholder="Lisa puhvri pealkiri"
                autoComplete="off"
              />
            ) : (
              <>
                <div className="gsm-tier-tabs" role="tablist" aria-label="Elemendi tüübi filter">
                  <button
                    type="button"
                    className={cn('gsm-tier-tab', itemTier === 'MODULE' && 'active')}
                    onClick={() => {
                      setItemTier('MODULE');
                      setLoScope('STANDALONE');
                      setScopeModuleId('');
                      setScopeLoId('');
                      setCurriculumItemId(modules[0]?.id || '');
                    }}
                  >
                    Moodul
                  </button>
                  <button
                    type="button"
                    className={cn('gsm-tier-tab', itemTier === 'LEARNING_OUTCOME' && 'active')}
                    onClick={() => {
                      setItemTier('LEARNING_OUTCOME');
                      setScopeLoId('');
                      const standalone = sortedItems.filter((i) => {
                        if (!isStandaloneLearningOutcome(i, itemById)) return false;
                        if (!effectiveSlotFilter?.loIds.length) return true;
                        return effectiveSlotFilter.loIds.includes(String(i.id));
                      });
                      setLoScope('STANDALONE');
                      setScopeModuleId('');
                      setCurriculumItemId(standalone[0]?.id || '');
                    }}
                  >
                    ÕV
                  </button>
                  <button
                    type="button"
                    className={cn('gsm-tier-tab', itemTier === 'ACTIVITY' && 'active')}
                    onClick={() => {
                      setItemTier('ACTIVITY');
                      const firstLo = learningOutcomesFilteredForSlot[0];
                      setScopeLoId(firstLo?.id || '');
                      const acts = firstLo
                        ? sortedItems.filter(
                            (i) => String(i.parentItemId) === String(firstLo.id) && ACTIVITY_TYPES.includes(i.type)
                          )
                        : [];
                      setCurriculumItemId(acts[0]?.id || '');
                    }}
                  >
                    Tegevus
                  </button>
                </div>
                {effectiveSlotFilter && mode === 'create' && (
                  <p className="gsm-slot-filter-hint">
                    ÕV ja tegevuse valikuid aitab kitsendada selle päeva/slotiga lõikuv ajakava. Moodulid: alati kogu nimekiri — saad lisada mitu moodulit samasse päeva.
                  </p>
                )}

                {itemTier === 'LEARNING_OUTCOME' && (
                  <div className="gsm-scope-block">
                    <div className="gsm-sub gsm-scope-label">Õpiväljundi ulatus</div>
                    <div className="gsm-lo-scope-row">
                      <label className="gsm-radio">
                        <input
                          type="radio"
                          name="loScope"
                          checked={loScope === 'STANDALONE'}
                          onChange={() => {
                            setLoScope('STANDALONE');
                            setScopeModuleId('');
                          }}
                        />
                        Iseseisvad ÕV (pole mooduli all)
                      </label>
                      <label className="gsm-radio">
                        <input
                          type="radio"
                          name="loScope"
                          checked={loScope === 'UNDER_MODULE'}
                          onChange={() => setLoScope('UNDER_MODULE')}
                        />
                        Konkreetse mooduli all
                      </label>
                    </div>
                    {loScope === 'UNDER_MODULE' && (
                      <select
                        className="gsm-select gsm-select-scope"
                        value={scopeModuleId}
                        onChange={(ev) => setScopeModuleId(ev.target.value)}
                        required
                      >
                        <option value="">Vali moodul…</option>
                        {modulesFiltered.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title || m.id}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {itemTier === 'ACTIVITY' && (
                  <div className="gsm-scope-block">
                    <label className="gsm-label" htmlFor="gsm-scope-lo">
                      ÕV (tegevuse vanem)
                    </label>
                    <select
                      id="gsm-scope-lo"
                      className="gsm-select"
                      value={scopeLoId}
                      onChange={(ev) => setScopeLoId(ev.target.value)}
                      required
                    >
                      <option value="">Vali õpiväljund…</option>
                      {learningOutcomesFilteredForSlot.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.title || i.id}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <select
                  id="gsm-title"
                  className="gsm-title-select"
                  value={curriculumItemId}
                  onChange={(e) => setCurriculumItemId(e.target.value)}
                  required
                  disabled={itemTier === 'LEARNING_OUTCOME' && loScope === 'UNDER_MODULE' && !scopeModuleId}
                >
                  <option value="">Vali element…</option>
                  {selectableItems.map((it) => (
                    <option key={it.id} value={it.id}>
                      [{typeLabel(it.type)}] {it.title || it.id}
                    </option>
                  ))}
                </select>
                {selectableItems.length === 0 && entryKind === 'SCHEDULE' && (
                  <p className="gsm-empty-hint">Selle filtri jaoks pole ükski element. Muuda tüüpi või lisa struktuuris puuduvad lapsed.</p>
                )}
              </>
            )}
          </div>

          {mode === 'create' && (
            <div className="gsm-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                className={cn('gsm-tab', entryKind === 'SCHEDULE' && 'active')}
                onClick={() => setEntryKind('SCHEDULE')}
              >
                Ajastus
              </button>
              <button type="button" role="tab" className={cn('gsm-tab', entryKind === 'BUFFER' && 'active')} onClick={() => setEntryKind('BUFFER')}>
                Puhver
              </button>
            </div>
          )}

          <div className="gsm-row">
            <span className="gsm-icon" aria-hidden>
              🕐
            </span>
            <div className="gsm-row-body">
              <div className="gsm-datetime-line">
                <input type="datetime-local" value={startStr} onChange={(ev) => setStartStr(ev.target.value)} className="gsm-input-dt" required />
                <span className="gsm-dash">–</span>
                <input type="datetime-local" value={endStr} onChange={(ev) => setEndStr(ev.target.value)} className="gsm-input-dt" required />
              </div>
              <div className="gsm-sub">Ajavöönd: lokaalne · kordus puudub</div>
            </div>
          </div>

          <div className="gsm-row">
            <span className="gsm-icon" aria-hidden>
              ⚑
            </span>
            <div className="gsm-row-body">
              <label className="gsm-label" htmlFor="gsm-status">
                Staatus
              </label>
              <select id="gsm-status" className="gsm-select" value={status} onChange={(ev) => setStatus(ev.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {entryKind === 'SCHEDULE' && (mode === 'edit' || curriculumItemId) && (
            <div className="gsm-row">
              <span className="gsm-icon" aria-hidden>
                📋
              </span>
              <div className="gsm-row-body">
                <label className="gsm-label" htmlFor="gsm-notes">
                  Märkused / kirjeldus
                </label>
                <textarea id="gsm-notes" className="gsm-textarea" rows={3} value={notes} onChange={(ev) => setNotes(ev.target.value)} placeholder="Lisa kirjeldus…" />
              </div>
            </div>
          )}

          <div className="gsm-row gsm-row-calendar">
            <span className="gsm-icon" aria-hidden>
              ▦
            </span>
            <div className="gsm-row-body">
              <div className="gsm-calendar-pill">
                <span className="gsm-dot" style={{ backgroundColor: entryKind === 'BUFFER' ? '#e07a7a' : dotColor }} />
                <span className="gsm-calendar-name">
                  {entryKind === 'BUFFER' ? 'Puhver' : selectedItem ? parentLine || selectedItem.title : 'Vali element'}
                </span>
              </div>
              <div className="gsm-sub">
                {entryKind === 'BUFFER'
                  ? 'Versiooni tasemel ajapuhver'
                  : 'curriculum_item_schedule — range: moodul / iseseisev ÕV vabalt; mooduli ÕV ja tegevus vanema ajakava sees'}
              </div>
            </div>
          </div>

          {strictHint && <div className="gsm-err">{strictHint}</div>}
          {localError && <div className="gsm-err">{localError}</div>}

          <div className="gsm-footer">
            {mode === 'edit' && (
              <button type="button" className="gsm-btn-text gsm-danger" disabled={saving || deleting} onClick={handleDelete}>
                {deleting ? '…' : 'Kustuta'}
              </button>
            )}
            <div className="gsm-footer-right">
              <button type="button" className="gsm-btn-text" onClick={onClose}>
                Katkesta
              </button>
              {mode === 'create' && (
                <button
                  type="button"
                  className="gsm-btn-secondary"
                  disabled={saving || deleting || (entryKind === 'SCHEDULE' && !!strictHint)}
                  onClick={() => performSave(true)}
                >
                  {saving ? '…' : 'Salvesta ja lisa veel üks'}
                </button>
              )}
              <button type="submit" className="gsm-btn-primary" disabled={saving || deleting || (entryKind === 'SCHEDULE' && !!strictHint)}>
                {saving ? '…' : 'Salvesta'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function typeToDotColor(type) {
  switch (type) {
    case 'MODULE':
      return '#6b7fd7';
    case 'LEARNING_OUTCOME':
      return '#4dad7a';
    case 'TASK':
      return '#5b9fd4';
    case 'TEST':
      return '#e6a23c';
    case 'TOPIC':
      return '#a78bfa';
    case 'LEARNING_MATERIAL':
      return '#5cb87a';
    default:
      return '#8b90a8';
  }
}
