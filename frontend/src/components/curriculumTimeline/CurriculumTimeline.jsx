import { useEffect, useMemo, useRef, useState } from 'react';
import { api, curriculumItem, schedule, timeline, relation } from '../../api';

const STATUS = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function parseLocalDateTime(value) {
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
  // LocalDateTime is treated as local time in the UI.
  return new Date(y, m - 1, d, hh, mm, ss);
}

function formatLocalDateTime(date) {
  if (!date) return null;
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(
    date.getMinutes()
  )}:00`;
}

function diffMinutes(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

function diffDays(a, b) {
  const sa = startOfDay(a);
  const sb = startOfDay(b);
  return Math.round((sb.getTime() - sa.getTime()) / 86400000);
}

function dateKey(d) {
  if (!d) return '';
  const x = new Date(d);
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
}

function snapMinutes(minutes, gridMinutes) {
  const g = gridMinutes || 15;
  return Math.round(minutes / g) * g;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toDateInputValue(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(d) {
  // JS: Sun=0, Mon=1...; we want Mon as 0.
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function addMonths(d, months) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

function addYears(d, years) {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + years);
  return x;
}

function formatTimeShort(date) {
  if (!date) return '';
  return date.toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(date) {
  return date.toLocaleDateString('et-EE', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function typeToPaletteTone(type) {
  switch (type) {
    case 'MODULE':
      return 'red';
    case 'TOPIC':
      return 'violet';
    case 'LEARNING_OUTCOME':
      return 'emerald';
    case 'TASK':
      return 'sky';
    case 'TEST':
      return 'amber';
    case 'LEARNING_MATERIAL':
      return 'teal';
    case 'KNOBIT':
    default:
      return 'slate';
  }
}

function toneClasses(tone) {
  const tones = {
    red: 'border-red-200/90 bg-red-50/60 text-red-900 dark:border-red-800/60 dark:bg-red-900/30 dark:text-red-200',
    violet: 'border-violet-200/90 bg-violet-50/60 text-violet-900 dark:border-violet-800/60 dark:bg-violet-900/30 dark:text-violet-200',
    emerald: 'border-emerald-200/90 bg-emerald-50/60 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-200',
    sky: 'border-sky-200/90 bg-sky-50/60 text-sky-900 dark:border-sky-800/60 dark:bg-sky-900/30 dark:text-sky-200',
    amber: 'border-amber-200/90 bg-amber-50/60 text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-200',
    teal: 'border-teal-200/90 bg-teal-50/60 text-teal-900 dark:border-teal-800/60 dark:bg-teal-900/30 dark:text-teal-200',
    slate: 'border-slate-200/90 bg-slate-50/60 text-slate-900 dark:border-slate-700/60 dark:bg-slate-700/30 dark:text-slate-200',
  };
  return tones[tone] || tones.slate;
}

function relationTypeToStrokeClass(type) {
  switch (type) {
    case 'EELDAB':
    case 'ON_EELDUSEKS':
      return 'stroke-amber-500';
    case 'KOOSNEB':
    case 'ON_OSAKS':
      return 'stroke-violet-500';
    case 'SISALDAB':
    default:
      return 'stroke-sky-500';
  }
}

function BlockEditorPopover({ block, onClose, onDelete }) {
  const [local, setLocal] = useState(() => ({
    status: block?.status ?? 'PLANNED',
    notes: block?.notes ?? '',
  }));

  if (!block) return null;

  return (
    <div className="absolute right-4 top-4 z-50 w-[320px] rounded-2xl border border-white/70 bg-white/90 p-4 shadow-lg backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{block.kind === 'ITEM_SCHEDULE' ? 'Ajastatud õpiobjekt' : 'Puhver'}</div>
          <div className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 dark:text-slate-100">{block.label}</div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {formatTimeShort(block.plannedStartAt)} - {formatTimeShort(block.plannedEndAt)}
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-xl border border-white/70 bg-white/70 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
          Sulge
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Staatus</div>
          <select
            value={local.status}
            onChange={(e) => setLocal((p) => ({ ...p, status: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Märkmed</div>
          <textarea
            value={local.notes}
            onChange={(e) => setLocal((p) => ({ ...p, notes: e.target.value }))}
            className="mt-1 h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
      </div>

      {block?.kind !== 'GHOST_BUFFER' && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onDelete?.(block)}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50"
          >
            Kustuta
          </button>
        </div>
      )}
    </div>
  );
}

export default function CurriculumTimeline({ curriculumVersionId, editable = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paletteItems, setPaletteItems] = useState([]);
  const [blocks, setBlocks] = useState([]); // ITEM_SCHEDULE (manual buffers added later)

  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [bufferMode, setBufferMode] = useState(false);
  const [autoBufferMinutes, setAutoBufferMinutes] = useState(10);

  const lastInteractionValuesRef = useRef(null);

  const [moduleAddOpen, setModuleAddOpen] = useState(false);
  const [moduleAddStartAt, setModuleAddStartAt] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  const [relations, setRelations] = useState([]);

  // Timeline rendering constants.
  const gridMinutes = 15;
  const laneHeight = 92;
  const blockHeight = 66;
  const minDurationMinutes = 15;
  const defaultDurationMinutes = 45;
  const defaultBufferDurationMinutes = 30;

  // Month view layout (Google Calendar inspired).
  const monthHeaderHeightPx = 30;
  const monthWeekRowHeightPx = 120;
  const monthModuleLayerHeightPx = 14;
  const monthLoLayerHeightPx = 24;
  // Leave space for the day number (top-left), then module + LO bars.
  const monthSmallLayerTopPadPx = 18 + monthModuleLayerHeightPx + monthLoLayerHeightPx + 6;

  const scrollRef = useRef(null);
  const viewportRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(1200);

  const [timelineMode, setTimelineMode] = useState('YEAR'); // DAY | WEEK | MONTH | YEAR
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const canEdit = editable && (timelineMode === 'DAY' || timelineMode === 'WEEK');
  // We allow creating blocks in any mode (DAY/WEEK/MONTH/YEAR), but resizing/editing is restricted.
  const canCreate = Boolean(editable);

  useEffect(() => {
    if (!canEdit) setBufferMode(false);
  }, [canEdit]);

  const [now, setNow] = useState(() => new Date());

  const range = useMemo(() => {
    let start;
    let end;
    if (timelineMode === 'DAY') {
      start = startOfDay(anchorDate);
      end = addDays(start, 1);
    } else if (timelineMode === 'WEEK') {
      start = startOfWeekMonday(anchorDate);
      end = addDays(start, 7);
    } else if (timelineMode === 'MONTH') {
      const x = startOfDay(anchorDate);
      start = new Date(x.getFullYear(), x.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(x.getFullYear(), x.getMonth() + 1, 1, 0, 0, 0, 0);
    } else {
      // YEAR
      const x = startOfDay(anchorDate);
      start = new Date(x.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(x.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
    }
    const totalMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
    return { start, end, totalMinutes };
  }, [timelineMode, anchorDate]);

  // Keep the timeline scaling stable with viewport width changes.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const w = Math.max(600, Math.round(cr.width));
      setViewportWidth(w);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pxPerMinute = viewportWidth / range.totalMinutes;
  const contentWidthPx = viewportWidth;

  const gridStepMinutes =
    timelineMode === 'DAY'
      ? 60
      : timelineMode === 'WEEK'
        ? 24 * 60
        : timelineMode === 'MONTH'
          ? 7 * 24 * 60
          : 30 * 24 * 60;
  const gridStepPx = Math.max(1, gridStepMinutes * pxPerMinute);

  // Fetch palette items + their schedules.
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!curriculumVersionId) return;
      setLoading(true);
      setError('');
      try {
        const itemsPage = await curriculumItem.list(curriculumVersionId, { page: 0, size: 1000 });
        const items = Array.isArray(itemsPage?.content) ? itemsPage.content : itemsPage;
        if (ignore) return;
        setPaletteItems(items || []);

        // Timeline blocks (item schedules + manual buffers in one call).
        const dtoBlocks = await timeline.blocks(curriculumVersionId);
        const mapped = (dtoBlocks || []).map((d) => {
          if (d.kind === 'ITEM_SCHEDULE') {
            return {
              kind: 'ITEM_SCHEDULE',
              id: d.id,
              itemId: d.curriculumItemId,
              itemType: d.itemType,
              label: d.itemTitle,
              plannedStartAt: parseLocalDateTime(d.plannedStartAt),
              plannedEndAt: parseLocalDateTime(d.plannedEndAt),
              plannedMinutes: d.plannedMinutes,
              status: d.status,
              notes: d.notes || '',
            };
          }
          return {
            kind: 'MANUAL_BUFFER',
            id: d.id,
            itemId: null,
            itemType: null,
            label: d.label || 'Puhver',
            plannedStartAt: parseLocalDateTime(d.plannedStartAt),
            plannedEndAt: parseLocalDateTime(d.plannedEndAt),
            plannedMinutes: d.plannedMinutes,
            status: d.status,
            notes: d.notes || '',
          };
        });

        if (ignore) return;
        setBlocks(mapped);
      } catch (e) {
        if (!ignore) setError(e?.message || 'Ajatelje laadimine ebaõnnestus');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [curriculumVersionId]);

  async function refreshTimelineBlocks() {
    if (!curriculumVersionId) return;
    const dtoBlocks = await timeline.blocks(curriculumVersionId);
    const mapped = (dtoBlocks || []).map((d) => {
      if (d.kind === 'ITEM_SCHEDULE') {
        return {
          kind: 'ITEM_SCHEDULE',
          id: d.id,
          itemId: d.curriculumItemId,
          itemType: d.itemType,
          label: d.itemTitle,
          plannedStartAt: parseLocalDateTime(d.plannedStartAt),
          plannedEndAt: parseLocalDateTime(d.plannedEndAt),
          plannedMinutes: d.plannedMinutes,
          status: d.status,
          notes: d.notes || '',
        };
      }
      return {
        kind: 'MANUAL_BUFFER',
        id: d.id,
        itemId: null,
        itemType: null,
        label: d.label || 'Puhver',
        plannedStartAt: parseLocalDateTime(d.plannedStartAt),
        plannedEndAt: parseLocalDateTime(d.plannedEndAt),
        plannedMinutes: d.plannedMinutes,
        status: d.status,
        notes: d.notes || '',
      };
    });
    setBlocks(mapped);
  }

  useEffect(() => {
    if (!curriculumVersionId) return;
    // Relations are optional for the MVP; if they fail to load, we still render hierarchy membership links.
    relation
      .list(curriculumVersionId, { page: 0, size: 10000 })
      .then((rows) => setRelations(Array.isArray(rows?.content) ? rows.content : rows || []))
      .catch(() => setRelations([]));
  }, [curriculumVersionId]);

  // Update "today" marker.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const ghostBlocks = useMemo(() => {
    if (autoBufferMinutes <= 0) return [];
    return blocks
      .filter(
        (b) =>
          b.kind === 'ITEM_SCHEDULE' &&
          b.plannedStartAt &&
          b.plannedEndAt &&
          // MVP: ainult kavandatud plokid (PLANNED) tekitavad ghost-puhvri.
          (b.status === 'PLANNED' || !b.status)
      )
      .map((b) => {
        const startAt = new Date(b.plannedEndAt.getTime());
        const endAt = new Date(startAt.getTime() + autoBufferMinutes * 60000);
        return {
          kind: 'GHOST_BUFFER',
          id: `ghost-${b.id}`,
          itemId: b.itemId,
          itemType: b.itemType,
          label: 'Auto puhver',
          plannedStartAt: startAt,
          plannedEndAt: endAt,
          plannedMinutes: autoBufferMinutes,
          status: null,
          notes: '',
        };
      });
  }, [blocks, autoBufferMinutes]);

  const visibleBlocks = useMemo(() => {
    // Filter blocks that have any overlap with the visible range.
    const all = [...blocks, ...ghostBlocks];
    return all.filter((b) => {
      if (!b.plannedStartAt || !b.plannedEndAt) return false;
      return b.plannedEndAt.getTime() >= range.start.getTime() && b.plannedStartAt.getTime() <= range.end.getTime();
    });
  }, [blocks, ghostBlocks, range.end, range.start]);

  const lanes = useMemo(() => {
    // Greedy lane assignment to avoid overlaps.
    const sorted = [...visibleBlocks].sort((a, b) => {
      const sa = a.plannedStartAt?.getTime() ?? 0;
      const sb = b.plannedStartAt?.getTime() ?? 0;
      if (sa !== sb) return sa - sb;
      return (a.plannedEndAt?.getTime() ?? 0) - (b.plannedEndAt?.getTime() ?? 0);
    });

    const laneLastEnd = [];
    const withLane = sorted.map((b) => {
      const startMs = b.plannedStartAt.getTime();
      const endMs = b.plannedEndAt.getTime();
      let laneIndex = -1;
      for (let i = 0; i < laneLastEnd.length; i++) {
        if (startMs >= laneLastEnd[i]) {
          laneIndex = i;
          break;
        }
      }
      if (laneIndex === -1) {
        laneIndex = laneLastEnd.length;
        laneLastEnd.push(endMs);
      } else {
        laneLastEnd[laneIndex] = endMs;
      }
      return { ...b, laneIndex };
    });

    // Restore stable order for rendering.
    return withLane.sort((a, b) => a.laneIndex - b.laneIndex);
  }, [visibleBlocks]);

  const todayLeftPx = diffMinutes(range.start, now) * pxPerMinute;

  const selectedBlock = useMemo(() => lanes.find((b) => b.id === selectedBlockId) || null, [lanes, selectedBlockId]);

  const childrenByParent = useMemo(() => {
    const map = new Map();
    for (const it of paletteItems || []) {
      const pid = it.parentItemId ?? null;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid).push(it);
    }
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || String(a.id).localeCompare(String(b.id)));
      map.set(k, list);
    }
    return map;
  }, [paletteItems]);

  const modulesForAdd = useMemo(() => {
    return (paletteItems || [])
      .filter((it) => it.type === 'MODULE')
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || String(a.id).localeCompare(String(b.id)));
  }, [paletteItems]);

  const itemById = useMemo(() => {
    const map = new Map();
    for (const it of paletteItems || []) {
      if (it?.id) map.set(it.id, it);
    }
    return map;
  }, [paletteItems]);

  const axisTicks = useMemo(() => {
    const ticks = [];
    if (timelineMode === 'DAY') {
      for (let h = 0; h < 24; h += 2) {
        const d = new Date(range.start);
        d.setHours(h, 0, 0, 0);
        ticks.push({ date: d, label: `${pad2(h)}:00` });
      }
    } else if (timelineMode === 'WEEK') {
      for (let i = 0; i < 7; i++) {
        const d = addDays(range.start, i);
        ticks.push({ date: d, label: formatDayLabel(d) });
      }
    } else if (timelineMode === 'MONTH') {
      let d = startOfDay(range.start);
      while (d.getTime() < range.end.getTime()) {
        ticks.push({ date: new Date(d), label: formatDayLabel(d) });
        d = addDays(d, 7);
      }
    } else {
      // YEAR
      const y = range.start.getFullYear();
      for (let m = 0; m < 12; m++) {
        const d = new Date(y, m, 1, 0, 0, 0, 0);
        if (d.getTime() >= range.start.getTime() && d.getTime() < range.end.getTime()) {
          const label = d.toLocaleDateString('et-EE', { month: 'short' });
          ticks.push({ date: d, label });
        }
      }
    }
    return ticks;
  }, [timelineMode, range.start, range.end]);

  const blockCentersByItemId = useMemo(() => {
    const map = new Map();
    for (const b of lanes) {
      if (b.kind !== 'ITEM_SCHEDULE' || !b.itemId || !b.plannedStartAt || !b.plannedEndAt) continue;
      const visibleStartAt = b.plannedStartAt.getTime() < range.start.getTime() ? range.start : b.plannedStartAt;
      const visibleEndAt = b.plannedEndAt.getTime() > range.end.getTime() ? range.end : b.plannedEndAt;
      const startMins = diffMinutes(range.start, visibleStartAt);
      const left = startMins * pxPerMinute;
      const width = Math.max(minDurationMinutes * pxPerMinute, diffMinutes(visibleStartAt, visibleEndAt) * pxPerMinute);
      const top = b.laneIndex * laneHeight + 10;
      map.set(b.itemId, { x: left + width / 2, y: top + blockHeight / 2, blockId: b.id, itemType: b.itemType });
    }
    return map;
  }, [lanes, range.start, range.end, pxPerMinute, minDurationMinutes]);

  const membershipEdges = useMemo(() => {
    const edges = [];
    const seen = new Set();
    for (const b of lanes) {
      if (b.kind !== 'ITEM_SCHEDULE' || b.itemType !== 'MODULE' || !b.itemId) continue;
      const moduleId = b.itemId;
      const loIds = getDescendants(moduleId).filter((id) => itemById.get(id)?.type === 'LEARNING_OUTCOME');
      for (const loId of loIds) {
        if (!blockCentersByItemId.has(loId)) continue;
        const key = `${moduleId}->${loId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ from: moduleId, to: loId, strokeClass: 'stroke-emerald-500', width: 2 });
      }
    }
    return edges;
  }, [lanes, blockCentersByItemId, itemById, childrenByParent]);

  const relationEdges = useMemo(() => {
    const edges = [];
    const seen = new Set();
    for (const r of relations || []) {
      if (!r?.sourceItemId || !r?.targetItemId) continue;
      if (!blockCentersByItemId.has(r.sourceItemId) || !blockCentersByItemId.has(r.targetItemId)) continue;
      const key = `${r.sourceItemId}->${r.targetItemId}:${r.type}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        from: r.sourceItemId,
        to: r.targetItemId,
        strokeClass: relationTypeToStrokeClass(r.type),
        width: 1.5,
      });
    }
    return edges;
  }, [relations, blockCentersByItemId]);

  const allEdges = useMemo(() => [...membershipEdges, ...relationEdges], [membershipEdges, relationEdges]);

  const monthViewData = useMemo(() => {
    if (timelineMode !== 'MONTH') return null;
    if (!range?.start || !range?.end) return null;

    const displayStart = startOfWeekMonday(range.start);
    const lastDay = addDays(range.end, -1);
    const displayEndExclusive = addDays(startOfWeekMonday(lastDay), 7);
    const totalDays = diffDays(displayStart, displayEndExclusive);
    const weeksCount = Math.max(1, Math.ceil(totalDays / 7));
    const cellCount = weeksCount * 7;
    const dayDates = Array.from({ length: cellCount }, (_, i) => addDays(displayStart, i));

    const cellWidth = contentWidthPx / 7;

    const monthItemSchedules = visibleBlocks.filter((b) => b.kind === 'ITEM_SCHEDULE' && b.plannedStartAt && b.plannedEndAt);
    const monthModules = monthItemSchedules.filter((b) => b.itemType === 'MODULE');
    const monthLos = monthItemSchedules.filter((b) => b.itemType === 'LEARNING_OUTCOME');
    const monthSmall = monthItemSchedules.filter((b) => b.itemType && b.itemType !== 'MODULE' && b.itemType !== 'LEARNING_OUTCOME');

    // Manual buffers are shown as "small" items as well.
    const monthManualBuffers = visibleBlocks.filter((b) => b.kind === 'MANUAL_BUFFER' && b.plannedStartAt && b.plannedEndAt);

    const smallByDayKey = new Map();
    const pushToMap = (dayD, row) => {
      const key = dateKey(dayD);
      if (!smallByDayKey.has(key)) smallByDayKey.set(key, []);
      smallByDayKey.get(key).push(row);
    };

    for (const b of monthSmall) {
      pushToMap(startOfDay(b.plannedStartAt), { kind: 'ITEM', id: b.id, label: b.label, itemType: b.itemType, plannedStartAt: b.plannedStartAt });
    }
    for (const b of monthManualBuffers) {
      pushToMap(startOfDay(b.plannedStartAt), { kind: 'BUFFER', id: b.id, label: b.label, itemType: 'MANUAL_BUFFER', plannedStartAt: b.plannedStartAt });
    }

    for (const [, list] of smallByDayKey.entries()) {
      list.sort((a, b) => a.plannedStartAt.getTime() - b.plannedStartAt.getTime());
    }

    const moduleSegments = [];
    for (const m of monthModules) {
      const startIdx = Math.max(0, diffDays(displayStart, startOfDay(m.plannedStartAt)));
      let endExclusiveIdx = diffDays(displayStart, startOfDay(m.plannedEndAt));
      if (endExclusiveIdx <= startIdx) endExclusiveIdx = startIdx + 1;
      endExclusiveIdx = Math.min(totalDays, endExclusiveIdx);

      for (let r = 0; r < weeksCount; r++) {
        const weekStartIdx = r * 7;
        const weekEndExclusiveIdx = weekStartIdx + 7;
        const overlapStart = Math.max(startIdx, weekStartIdx);
        const overlapEnd = Math.min(endExclusiveIdx, weekEndExclusiveIdx);
        if (overlapEnd <= overlapStart) continue;

        moduleSegments.push({
          moduleId: m.itemId,
          id: m.id,
          label: m.label,
          left: overlapStart * cellWidth,
          width: Math.max(1, (overlapEnd - overlapStart) * cellWidth),
          top: monthHeaderHeightPx + r * monthWeekRowHeightPx + 18,
          height: monthModuleLayerHeightPx,
        });
      }
    }

    const loSegments = [];
    for (const lo of monthLos) {
      const startIdx = Math.max(0, diffDays(displayStart, startOfDay(lo.plannedStartAt)));
      let endExclusiveIdx = diffDays(displayStart, startOfDay(lo.plannedEndAt));
      if (endExclusiveIdx <= startIdx) endExclusiveIdx = startIdx + 1;
      endExclusiveIdx = Math.min(totalDays, endExclusiveIdx);

      for (let r = 0; r < weeksCount; r++) {
        const weekStartIdx = r * 7;
        const weekEndExclusiveIdx = weekStartIdx + 7;
        const overlapStart = Math.max(startIdx, weekStartIdx);
        const overlapEnd = Math.min(endExclusiveIdx, weekEndExclusiveIdx);
        if (overlapEnd <= overlapStart) continue;

        loSegments.push({
          loId: lo.itemId,
          id: lo.id,
          label: lo.label,
          left: overlapStart * cellWidth,
          width: Math.max(1, (overlapEnd - overlapStart) * cellWidth),
          top: monthHeaderHeightPx + r * monthWeekRowHeightPx + 18 + monthModuleLayerHeightPx + 3,
          height: monthLoLayerHeightPx,
        });
      }
    }

    const todayKey = dateKey(now);
    const todayDayIdx = totalDays > 0 ? diffDays(displayStart, startOfDay(now)) : -1;
    const todayInRange = todayDayIdx >= 0 && todayDayIdx < cellCount;
    const todayCol = todayInRange ? todayDayIdx % 7 : 0;
    const todayRow = todayInRange ? Math.floor(todayDayIdx / 7) : 0;

    return {
      displayStart,
      dayDates,
      weeksCount,
      totalDays,
      cellWidth,
      smallByDayKey,
      moduleSegments,
      loSegments,
      todayKey,
      todayInRange,
      todayLeft: todayInRange ? todayCol * cellWidth : 0,
      todayTop: todayInRange ? monthHeaderHeightPx + todayRow * monthWeekRowHeightPx + 2 : 0,
      monthHeightPx: monthHeaderHeightPx + weeksCount * monthWeekRowHeightPx + 10,
    };
  }, [
    timelineMode,
    range?.start,
    range?.end,
    visibleBlocks,
    relations,
    contentWidthPx,
    now,
    monthHeaderHeightPx,
    monthWeekRowHeightPx,
    monthModuleLayerHeightPx,
    monthLoLayerHeightPx,
  ]);

  useEffect(() => {
    function onKeyDown(e) {
      if (!canEdit) return;
      if (!selectedBlock) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = e.target?.tagName?.toLowerCase?.();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') return;
      deleteBlock(selectedBlock);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canEdit, selectedBlock, timelineMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Interaction state for drag/resize.
  const [interacting, setInteracting] = useState(null);
  // interacting: { kind:'DRAG'|'RESIZE_LEFT'|'RESIZE_RIGHT', blockId, startMouseX, initialStart, initialEnd, initialPlannedStart, initialPlannedEnd }

  function getTimelineMetrics() {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return null;
    const rect = scrollEl.getBoundingClientRect();
    const scrollLeft = scrollEl.scrollLeft || 0;
    return { rect, scrollLeft };
  }

  function minutesFromClientX(clientX) {
    const m = getTimelineMetrics();
    if (!m) return 0;
    const xInContent = clientX - m.rect.left + m.scrollLeft;
    return xInContent / pxPerMinute;
  }

  function clientXToSnappedMinutes(clientX) {
    const m = minutesFromClientX(clientX);
    const snapped = snapMinutes(m, gridMinutes);
    return snapped;
  }

  function minutesToDate(minsFromStart) {
    return new Date(range.start.getTime() + minsFromStart * 60000);
  }

  function onDragStartPalette(itemId, e) {
    e.dataTransfer.setData('text/plain', String(itemId));
    e.dataTransfer.effectAllowed = 'copy';
  }

  async function commitScheduleUpdate(block, nextStartAt, nextEndAt) {
    if (!block?.id) return;
    const plannedMinutes = Math.max(minDurationMinutes, diffMinutes(nextStartAt, nextEndAt));
    const payload = {
      plannedStartAt: formatLocalDateTime(nextStartAt),
      plannedEndAt: formatLocalDateTime(nextEndAt),
      plannedMinutes,
    };
    await schedule.update(block.id, payload);
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === block.id
          ? {
              ...b,
              plannedStartAt: nextStartAt,
              plannedEndAt: nextEndAt,
              plannedMinutes,
            }
          : b
      )
    );
  }

  async function commitBufferUpdate(block, nextStartAt, nextEndAt) {
    if (!block?.id) return;
    const plannedMinutes = Math.max(minDurationMinutes, diffMinutes(nextStartAt, nextEndAt));
    const payload = {
      plannedStartAt: formatLocalDateTime(nextStartAt),
      plannedEndAt: formatLocalDateTime(nextEndAt),
      plannedMinutes,
    };
    await api(`/curriculum-version-time-buffer/${block.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === block.id
          ? {
              ...b,
              plannedStartAt: nextStartAt,
              plannedEndAt: nextEndAt,
              plannedMinutes,
            }
          : b
      )
    );
  }

  async function commitScheduleCreate(itemId, plannedStartAt, plannedMinutes) {
    const startAt = plannedStartAt;
    const endAt = new Date(startAt.getTime() + plannedMinutes * 60000);
    const payload = {
      curriculumItemId: itemId,
      plannedStartAt: formatLocalDateTime(startAt),
      plannedEndAt: formatLocalDateTime(endAt),
      plannedMinutes,
      actualStartAt: null,
      actualEndAt: null,
      actualMinutes: null,
      status: 'PLANNED',
      scheduleNotes: '',
    };
    const created = await schedule.create(payload);
    const paletteItem = paletteItems.find((p) => p.id === itemId);
    setBlocks((prev) => [
      ...prev,
      {
        kind: 'ITEM_SCHEDULE',
        id: created.id,
        itemId,
        itemType: paletteItem?.type ?? null,
        label: paletteItem?.title || 'Õpiobjekt',
        plannedStartAt: parseLocalDateTime(created.plannedStartAt),
        plannedEndAt: parseLocalDateTime(created.plannedEndAt),
        plannedMinutes: created.plannedMinutes,
        status: created.status,
        notes: created.scheduleNotes || '',
      },
    ]);
  }

  async function commitBufferCreate(plannedStartAt, plannedMinutes, bufferNotes) {
    const startAt = plannedStartAt;
    const endAt = new Date(startAt.getTime() + plannedMinutes * 60000);
    const payload = {
      curriculumVersionId,
      plannedStartAt: formatLocalDateTime(startAt),
      plannedEndAt: formatLocalDateTime(endAt),
      plannedMinutes,
      status: 'PLANNED',
      bufferNotes: bufferNotes || 'Puhver',
    };
    const created = await api('/curriculum-version-time-buffer', { method: 'POST', body: JSON.stringify(payload) });
    setBlocks((prev) => [
      ...prev,
      {
        kind: 'MANUAL_BUFFER',
        id: created.id,
        itemId: null,
        itemType: null,
        label: created.bufferNotes && String(created.bufferNotes).trim() ? created.bufferNotes : 'Puhver',
        plannedStartAt: parseLocalDateTime(created.plannedStartAt),
        plannedEndAt: parseLocalDateTime(created.plannedEndAt),
        plannedMinutes: created.plannedMinutes,
        status: created.status,
        notes: created.bufferNotes || '',
      },
    ]);
  }

  function getDescendants(rootItemId, maxDepth = 50) {
    const visited = new Set([rootItemId]);
    const out = [];
    const stack = [{ id: rootItemId, depth: 0 }];

    while (stack.length > 0) {
      const { id, depth } = stack.pop();
      if (depth >= maxDepth) continue;

      const kids = childrenByParent.get(id) || [];
      for (const child of kids) {
        if (!child?.id) continue;
        if (visited.has(child.id)) continue;
        visited.add(child.id);
        out.push(child.id);
        stack.push({ id: child.id, depth: depth + 1 });
      }
    }

    return out;
  }

  async function createModulePlan(moduleId, moduleStartAt) {
    if (!moduleId || !moduleStartAt) return;
    if (!canCreate) return;
    if (!itemById.has(moduleId)) return;

    const existingByItemId = new Map((blocks || []).filter((b) => b.kind === 'ITEM_SCHEDULE' && b.itemId).map((b) => [b.itemId, b]));

    const moduleDesc = getDescendants(moduleId);
    const loIds = moduleDesc
      .filter((id) => itemById.get(id)?.type === 'LEARNING_OUTCOME')
      .sort((a, b) => (itemById.get(a)?.orderIndex ?? 0) - (itemById.get(b)?.orderIndex ?? 0) || String(a).localeCompare(String(b)));

    const weekMinutes = 7 * 24 * 60;
    const moduleWeekCount = Math.max(1, loIds.length);
    const moduleEndAt = new Date(moduleStartAt.getTime() + moduleWeekCount * weekMinutes * 60000);

    async function ensureSchedule(itemId, startAt, endAt) {
      if (!startAt || !endAt) return;
      if (endAt.getTime() <= startAt.getTime()) return;
      const plannedMinutes = Math.max(15, diffMinutes(startAt, endAt));
      const payload = {
        plannedStartAt: formatLocalDateTime(startAt),
        plannedEndAt: formatLocalDateTime(endAt),
        plannedMinutes,
        status: 'PLANNED',
        scheduleNotes: '',
      };

      const existing = existingByItemId.get(itemId);
      if (existing?.id) {
        await schedule.update(existing.id, {
          plannedStartAt: payload.plannedStartAt,
          plannedEndAt: payload.plannedEndAt,
          plannedMinutes: payload.plannedMinutes,
          status: payload.status,
          scheduleNotes: payload.scheduleNotes,
        });
      } else {
        const created = await schedule.create({
          curriculumItemId: itemId,
          plannedStartAt: payload.plannedStartAt,
          plannedEndAt: payload.plannedEndAt,
          plannedMinutes: payload.plannedMinutes,
          actualStartAt: null,
          actualEndAt: null,
          actualMinutes: null,
          status: payload.status,
          scheduleNotes: payload.scheduleNotes,
        });
        // Update map so later descendants can reuse the same itemId.
        if (created?.id) existingByItemId.set(itemId, { id: created.id, itemId });
      }
    }

    function getSmallIds(loId) {
      const loDesc = getDescendants(loId);
      return loDesc
        .filter((id) => {
          const t = itemById.get(id)?.type;
          return t && t !== 'LEARNING_OUTCOME' && t !== 'MODULE';
        })
        .sort((a, b) => (itemById.get(a)?.orderIndex ?? 0) - (itemById.get(b)?.orderIndex ?? 0) || String(a).localeCompare(String(b)));
    }

    if (timelineMode === 'MONTH') {
      const h = moduleStartAt.getHours();
      const mm = moduleStartAt.getMinutes();

      const monthStartAt = new Date(range.start);
      monthStartAt.setHours(h, mm, 0, 0);
      const monthEndAt = new Date(range.end);
      monthEndAt.setHours(h, mm, 0, 0);

      const safeModuleStartAt = moduleStartAt.getTime() < monthStartAt.getTime() ? monthStartAt : moduleStartAt;
      const safeModuleEndAt =
        monthEndAt.getTime() <= safeModuleStartAt.getTime() ? new Date(safeModuleStartAt.getTime() + 7 * 24 * 60 * 60000) : monthEndAt;

      await ensureSchedule(moduleId, safeModuleStartAt, safeModuleEndAt);

      const weekMinutes = 7 * 24 * 60;
      const firstWeekStart = startOfWeekMonday(monthStartAt);
      const weekStarts = [];
      let ws = new Date(firstWeekStart);
      while (ws.getTime() < safeModuleEndAt.getTime()) {
        weekStarts.push(new Date(ws));
        ws = addDays(ws, 7);
      }
      if (weekStarts.length === 0) weekStarts.push(new Date(firstWeekStart));

      const perWeek = Math.max(1, Math.ceil(loIds.length / weekStarts.length));
      const slotMinutes = Math.max(15, Math.floor(weekMinutes / perWeek));

      for (let i = 0; i < loIds.length; i++) {
        const loId = loIds[i];
        const weekIndex = Math.min(Math.floor(i / perWeek), weekStarts.length - 1);
        const idxInWeek = i % perWeek;

        const loWeekStart = new Date(weekStarts[weekIndex]);
        loWeekStart.setHours(h, mm, 0, 0);

        let loStartAt = new Date(loWeekStart.getTime() + idxInWeek * slotMinutes * 60000);
        let loEndAt = new Date(loStartAt.getTime() + slotMinutes * 60000);

        if (loStartAt.getTime() < safeModuleStartAt.getTime()) loStartAt = new Date(safeModuleStartAt);
        if (loEndAt.getTime() > safeModuleEndAt.getTime()) loEndAt = new Date(safeModuleEndAt);
        if (loEndAt.getTime() <= loStartAt.getTime()) continue;

        await ensureSchedule(loId, loStartAt, loEndAt);

        const smallIds = getSmallIds(loId);
        if (smallIds.length === 0) continue;

        const loMinutes = Math.max(1, diffMinutes(loStartAt, loEndAt));
        const childDurationMinutes = Math.max(15, Math.floor(loMinutes / smallIds.length));
        let childStartAt = new Date(loStartAt);

        for (let j = 0; j < smallIds.length; j++) {
          const childId = smallIds[j];
          const childEndAt = j === smallIds.length - 1 ? loEndAt : new Date(childStartAt.getTime() + childDurationMinutes * 60000);
          if (childEndAt.getTime() <= childStartAt.getTime()) break;
          await ensureSchedule(childId, childStartAt, childEndAt);
          childStartAt = childEndAt;
        }
      }
    } else if (timelineMode === 'WEEK') {
      const h = moduleStartAt.getHours();
      const mm = moduleStartAt.getMinutes();

      const safeWeekStartAt = new Date(moduleStartAt);
      safeWeekStartAt.setHours(h, mm, 0, 0);
      const safeWeekEndAt = addDays(safeWeekStartAt, 7);
      safeWeekEndAt.setHours(h, mm, 0, 0);

      await ensureSchedule(moduleId, safeWeekStartAt, safeWeekEndAt);

      const dayMinutes = 24 * 60;
      const perDay = Math.max(1, Math.ceil(loIds.length / 7));
      const slotMinutes = Math.max(15, Math.floor(dayMinutes / perDay));

      for (let i = 0; i < loIds.length; i++) {
        const loId = loIds[i];
        const dayIndex = Math.min(Math.floor(i / perDay), 6);
        const idxInDay = i % perDay;

        const dayStart = addDays(safeWeekStartAt, dayIndex);
        dayStart.setHours(h, mm, 0, 0);

        let loStartAt = new Date(dayStart.getTime() + idxInDay * slotMinutes * 60000);
        let loEndAt = new Date(loStartAt.getTime() + slotMinutes * 60000);

        if (loStartAt.getTime() < safeWeekStartAt.getTime()) loStartAt = new Date(safeWeekStartAt);
        if (loEndAt.getTime() > safeWeekEndAt.getTime()) loEndAt = new Date(safeWeekEndAt);
        if (loEndAt.getTime() <= loStartAt.getTime()) continue;

        await ensureSchedule(loId, loStartAt, loEndAt);

        const smallIds = getSmallIds(loId);
        if (smallIds.length === 0) continue;

        const loMinutes = Math.max(1, diffMinutes(loStartAt, loEndAt));
        const childDurationMinutes = Math.max(15, Math.floor(loMinutes / smallIds.length));
        let childStartAt = new Date(loStartAt);

        for (let j = 0; j < smallIds.length; j++) {
          const childId = smallIds[j];
          const childEndAt = j === smallIds.length - 1 ? loEndAt : new Date(childStartAt.getTime() + childDurationMinutes * 60000);
          if (childEndAt.getTime() <= childStartAt.getTime()) break;
          await ensureSchedule(childId, childStartAt, childEndAt);
          childStartAt = childEndAt;
        }
      }
    } else {
      // Fallback: old behaviour (weeks inside the module span).
      await ensureSchedule(moduleId, moduleStartAt, moduleEndAt);

      for (let i = 0; i < loIds.length; i++) {
        const loId = loIds[i];
        const loStartAt = new Date(moduleStartAt.getTime() + i * weekMinutes * 60000);
        const loEndAt = new Date(loStartAt.getTime() + weekMinutes * 60000);

        await ensureSchedule(loId, loStartAt, loEndAt);

        const smallIds = getSmallIds(loId);
        if (smallIds.length === 0) continue;

        const childDurationMinutes = Math.max(15, Math.floor(weekMinutes / smallIds.length));
        let childStartAt = new Date(loStartAt);

        for (let j = 0; j < smallIds.length; j++) {
          const childId = smallIds[j];
          const childEndAt = j === smallIds.length - 1 ? loEndAt : new Date(childStartAt.getTime() + childDurationMinutes * 60000);
          if (childEndAt.getTime() <= childStartAt.getTime()) break;
          await ensureSchedule(childId, childStartAt, childEndAt);
          childStartAt = childEndAt;
        }
      }
    }

    await refreshTimelineBlocks();
  }

  async function deleteBlock(block) {
    if (!canEdit || !block?.id) return;
    try {
      if (block.kind === 'MANUAL_BUFFER') {
        await api(`/curriculum-version-time-buffer/${block.id}`, { method: 'DELETE' });
      } else {
        // ITEM_SCHEDULE
        await schedule.delete(block.id);
      }
      setBlocks((prev) => prev.filter((b) => b.id !== block.id));
      setSelectedBlockId(null);
      setBufferMode(false);
    } catch (err) {
      setError(err?.message || 'Ploki kustutamine ebaõnnestus');
    }
  }

  function getBlockFromId(id) {
    return blocks.find((b) => b.id === id) || null;
  }

  useEffect(() => {
    function onPointerMove(e) {
      if (!interacting) return;
      const block = getBlockFromId(interacting.blockId);
      if (!block) return;

      const currentPointerMinsRaw = minutesFromClientX(e.clientX);

      let nextStartAt = block.plannedStartAt;
      let nextEndAt = block.plannedEndAt;
      if (interacting.kind === 'DRAG') {
        const newStartMinsRaw = currentPointerMinsRaw - interacting.pointerOffsetMinutesRaw;
        const newStartMinsSnapped = snapMinutes(newStartMinsRaw, gridMinutes);
        nextStartAt = minutesToDate(newStartMinsSnapped);
        nextEndAt = minutesToDate(newStartMinsSnapped + interacting.initialDurationMinutes);
      } else if (interacting.kind === 'RESIZE_LEFT') {
        const endAt = interacting.initialEndAt;
        nextEndAt = endAt;
        const snappedMinutes = clientXToSnappedMinutes(e.clientX);
        nextStartAt = minutesToDate(snappedMinutes);
        // Enforce minimum duration.
        if (diffMinutes(nextStartAt, nextEndAt) < minDurationMinutes) {
          nextStartAt = new Date(nextEndAt.getTime() - minDurationMinutes * 60000);
        }
        const startMins = diffMinutes(range.start, nextStartAt);
        nextStartAt = minutesToDate(snapMinutes(startMins, gridMinutes));
      } else if (interacting.kind === 'RESIZE_RIGHT') {
        const startAt = interacting.initialStartAt;
        nextStartAt = startAt;
        const snappedMinutes = clientXToSnappedMinutes(e.clientX);
        nextEndAt = minutesToDate(snappedMinutes);
        if (diffMinutes(nextStartAt, nextEndAt) < minDurationMinutes) {
          nextEndAt = new Date(nextStartAt.getTime() + minDurationMinutes * 60000);
        }
        const endMins = diffMinutes(range.start, nextEndAt);
        nextEndAt = minutesToDate(snapMinutes(endMins, gridMinutes));
      }

      setBlocks((prev) =>
        prev.map((b) =>
          b.id === interacting.blockId
            ? {
                ...b,
                plannedStartAt: nextStartAt,
                plannedEndAt: nextEndAt,
                plannedMinutes: diffMinutes(nextStartAt, nextEndAt),
              }
            : b
        )
      );

      // Store final interaction values to avoid state update races on pointerup.
      lastInteractionValuesRef.current = { plannedStartAt: nextStartAt, plannedEndAt: nextEndAt };
    }

    function onPointerUp() {
      if (!interacting) return;
      const block = getBlockFromId(interacting.blockId);
      const finalVals = lastInteractionValuesRef.current;
      lastInteractionValuesRef.current = null;
      setInteracting(null);

      if (!canEdit) return;
      if (!block?.id) return;
      if (!block.plannedStartAt || !block.plannedEndAt) return;

      const nextStartAt = finalVals?.plannedStartAt || block.plannedStartAt;
      const nextEndAt = finalVals?.plannedEndAt || block.plannedEndAt;

      // Commit after interaction ends.
      const updatePromise =
        block.kind === 'MANUAL_BUFFER'
          ? commitBufferUpdate(block, nextStartAt, nextEndAt)
          : commitScheduleUpdate(block, nextStartAt, nextEndAt);

      updatePromise.catch((e) => {
        setError(e?.message || 'Ploki salvestamine ebaõnnestus');
      });
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [canEdit, interacting, gridMinutes]); // eslint-disable-line react-hooks/exhaustive-deps

  function onBlockPointerDown(e, block, kind) {
    if (!canEdit) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedBlockId(block.id);
    const pointerMinsRaw = minutesFromClientX(e.clientX);
    const startMins = diffMinutes(range.start, block.plannedStartAt);
    const endMins = diffMinutes(range.start, block.plannedEndAt);
    const initialDurationMinutes = endMins - startMins;
    setInteracting({
      kind,
      blockId: block.id,
      startMouseX: e.clientX,
      initialStartAt: block.plannedStartAt,
      initialEndAt: block.plannedEndAt,
      pointerOffsetMinutesRaw: kind === 'DRAG' ? pointerMinsRaw - startMins : 0,
      initialDurationMinutes,
    });
  }

  function onTimelineDrop(e) {
    e.preventDefault();
    if (!canCreate) return;

    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;

    const mins = clientXToSnappedMinutes(e.clientX);
    const plannedStartAt = minutesToDate(mins);
    const plannedMinutes = defaultDurationMinutes;
    commitScheduleCreate(itemId, plannedStartAt, plannedMinutes).catch((err) => {
      setError(err?.message || 'Ajastuse loomine ebaõnnestus');
    });
  }

  function onTimelineDragOver(e) {
    if (!canCreate) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  function onTimelineClick(e) {
    if (!canCreate) return;
    if (interacting) return;

    const target = e.target;
    if (target && target.closest && target.closest('[data-timeline-block="true"]')) return;
    if (target && target.closest && target.closest('[data-module-add-popover="true"]')) return;

    const mins = clientXToSnappedMinutes(e.clientX);
    const clickedAt = minutesToDate(mins);

    if (bufferMode) {
      commitBufferCreate(clickedAt, defaultBufferDurationMinutes, 'Puhver')
        .then(() => setBufferMode(false))
        .catch((err) => {
          setError(err?.message || 'Puhvri loomine ebaõnnestus');
        });
      return;
    }

    // Open "Add module" popover on timeline click.
    const d = new Date(clickedAt);
    if (timelineMode === 'DAY') {
      d.setHours(9, 0, 0, 0);
    } else if (timelineMode === 'WEEK') {
      const w = startOfWeekMonday(d);
      w.setHours(9, 0, 0, 0);
      d.setTime(w.getTime());
    } else if (timelineMode === 'MONTH') {
      const m = startOfDay(d);
      d.setTime(m.getTime());
      d.setDate(1);
      d.setHours(9, 0, 0, 0);
    } else {
      // YEAR
      d.setMonth(0, 1);
      d.setHours(9, 0, 0, 0);
    }

    setModuleAddStartAt(d);
    setSelectedModuleId((prev) => prev ?? modulesForAdd[0]?.id ?? null);
    setModuleAddOpen(true);
  }

  function shiftAnchor(dir) {
    if (timelineMode === 'DAY') setAnchorDate((d) => addDays(d, dir));
    else if (timelineMode === 'WEEK') setAnchorDate((d) => addDays(d, dir * 7));
    else if (timelineMode === 'MONTH') setAnchorDate((d) => addMonths(d, dir));
    else setAnchorDate((d) => addYears(d, dir));
  }

  function onAnchorDateInputChange(value) {
    if (!value) return;
    const parts = String(value).split('-').map((x) => Number(x));
    if (parts.length !== 3) return;
    const [y, m, d] = parts;
    setAnchorDate(new Date(y, m - 1, d, 12, 0, 0, 0)); // noon avoids DST edge cases
  }

  const lanesCount = useMemo(() => {
    let max = 0;
    for (const b of lanes) max = Math.max(max, b.laneIndex + 1);
    return max || 1;
  }, [lanes]);

  if (loading) {
    return (
      <div className="mt-10 flex min-h-[min(50vh,28rem)] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/40 px-6 py-16 text-center dark:border-slate-700/90 dark:bg-slate-800/40">
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Laen ajatelje…</p>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">Sündmused ja ajaplaani plokid koonduvad siia.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800/60 dark:bg-rose-900/30 dark:text-rose-300">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-sky-700">Ajatelg</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Klõpsa ajateljel ja lisa moodul koos sisuga.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
            {canEdit ? 'Redigeerimine on sisse lülitatud' : 'Vaade (read-only)'}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="rounded-3xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95">
          <div className="relative">
            <div className="mb-3 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'DAY', label: 'Päev' },
                    { id: 'WEEK', label: 'Nädal' },
                    { id: 'MONTH', label: 'Kuu' },
                    { id: 'YEAR', label: 'Aasta' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTimelineMode(m.id)}
                      className={cn(
                        'rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm transition',
                        timelineMode === m.id ? 'bg-sky-600 border-sky-700 text-white' : 'bg-white/70 border-white/70 text-slate-700 hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    disabled={!canCreate}
                    onClick={() => setBufferMode((v) => !v)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition',
                      canEdit
                        ? bufferMode
                          ? 'bg-sky-600 border-sky-700 text-white'
                          : 'bg-white/70 border-white/70 text-slate-700 hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                        : 'cursor-not-allowed opacity-60'
                    )}
                  >
                    {bufferMode ? 'Lisa: ON' : 'Ajapuhver'}
                  </button>

                  <div className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-3 py-2 dark:border-slate-600 dark:bg-slate-700">
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="5"
                      value={autoBufferMinutes}
                      onChange={(e) => setAutoBufferMinutes(Number(e.target.value))}
                      disabled={!canCreate}
                      className="w-32 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{autoBufferMinutes}m</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => shiftAnchor(-1)}
                    className="rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                    aria-label="Eelmine"
                  >
                    ←
                  </button>
                  <input
                    type="date"
                    value={toDateInputValue(anchorDate)}
                    onChange={(e) => onAnchorDateInputChange(e.target.value)}
                    className="rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => shiftAnchor(1)}
                    className="rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                    aria-label="Järgmine"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="grid h-2 w-2 place-items-center rounded-full bg-slate-400" aria-hidden />
                  {canEdit ? `Snap: ${gridMinutes} min` : 'Kuu/Aasta vaates redigeerimine on välja lülitatud'}
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Nähtav: {formatDayLabel(range.start)} - {formatDayLabel(new Date(range.end.getTime() - 1 * 60000))}
                </div>
              </div>
            </div>

            <div
              ref={(node) => {
                scrollRef.current = node;
                viewportRef.current = node;
              }}
              onDrop={onTimelineDrop}
              onDragOver={onTimelineDragOver}
              onClick={onTimelineClick}
              className="relative overflow-x-auto overflow-y-auto rounded-3xl border border-white/60 bg-white/40 dark:border-slate-700 dark:bg-slate-900/40"
              style={{ height: 'min(88vh, 1200px)' }}
            >
              <div
                className="relative"
                style={{
                  width: contentWidthPx,
                  height: timelineMode === 'MONTH' && monthViewData ? monthViewData.monthHeightPx : lanesCount * laneHeight + 50,
                }}
              >
                {moduleAddOpen && (
                  <div
                    data-module-add-popover="true"
                    onClick={(ev) => ev.stopPropagation()}
                    className="absolute left-4 top-4 z-50 w-[340px] rounded-2xl border border-white/70 bg-white/95 p-4 shadow-lg backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-sky-700">Lisa moodul</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {moduleAddStartAt ? moduleAddStartAt.toLocaleDateString('et-EE') : '—'}
                    </div>

                    <div className="mt-3">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Vali moodul</div>
                      <select
                        value={selectedModuleId ?? ''}
                        onChange={(e) => setSelectedModuleId(e.target.value || null)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      >
                        {modulesForAdd.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setModuleAddOpen(false)}
                        className="rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        Katkesta
                      </button>
                      <button
                        type="button"
                        disabled={!selectedModuleId || !canCreate}
                        onClick={async () => {
                          try {
                            await createModulePlan(selectedModuleId, moduleAddStartAt);
                          } catch (err) {
                            setError(err?.message || 'Mooduli lisamine ebaõnnestus');
                          } finally {
                            setModuleAddOpen(false);
                          }
                        }}
                        className={cn(
                          'rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition',
                          canCreate ? 'bg-sky-600 text-white hover:bg-sky-700' : 'cursor-not-allowed opacity-60'
                        )}
                      >
                        Lisa ajateljele
                      </button>
                    </div>
                  </div>
                )}

                {timelineMode !== 'MONTH' && (
                  <>
                    {/* Background time grid */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          `linear-gradient(to right, rgba(148,163,184,0.20) 1px, transparent 1px)`,
                        backgroundSize: `${gridStepPx}px 100%`,
                      }}
                      aria-hidden
                    />

                    {/* Axis labels */}
                    {axisTicks.map((t, i) => {
                      const mins = diffMinutes(range.start, t.date);
                      const left = mins * pxPerMinute;
                      return (
                        <div key={`${t.label}-${i}`} className="absolute top-2 z-10" style={{ left }}>
                          <div className="w-fit rounded-xl border border-white/70 bg-white/70 px-2 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                            {t.label}
                          </div>
                        </div>
                      );
                    })}

                    {/* Today marker */}
                    {todayLeftPx >= 0 && todayLeftPx <= contentWidthPx && (
                      <div
                        className="absolute top-10 z-20 flex flex-col items-center"
                        style={{ left: todayLeftPx, pointerEvents: 'none' }}
                      >
                        <div className="h-[28px] w-[2px] bg-rose-500 shadow-sm" />
                        <div className="mt-1 rounded-xl border border-rose-200/90 bg-white/80 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:border-rose-800/60 dark:bg-slate-800/80 dark:text-rose-400">
                          Täna
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Lanes and blocks */}
                {timelineMode !== 'MONTH' && (
                  <div className="relative z-30 pt-10">
                  <svg
                    className="absolute inset-0 z-0 pointer-events-none"
                    width={contentWidthPx}
                    height={lanesCount * laneHeight + 50}
                  >
                    {allEdges.map((e, idx) => {
                      const from = blockCentersByItemId.get(e.from);
                      const to = blockCentersByItemId.get(e.to);
                      if (!from || !to) return null;
                      return (
                        <line
                          // eslint-disable-next-line react/no-array-index-key
                          key={`${idx}-${e.from}-${e.to}`}
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          className={e.strokeClass}
                          strokeWidth={e.width}
                          opacity={e.width === 2 ? 0.95 : 0.65}
                        />
                      );
                    })}
                  </svg>

                  {lanesCount > 1 &&
                    Array.from({ length: lanesCount }).map((_, lane) => (
                      <div
                        key={lane}
                        className="absolute left-0 right-0"
                        style={{ top: lane * laneHeight }}
                        aria-hidden
                      >
                        <div className="h-px w-full bg-slate-200/60" />
                      </div>
                    ))}

                  {lanes.map((b) => {
                    const visibleStartAt = b.plannedStartAt.getTime() < range.start.getTime() ? range.start : b.plannedStartAt;
                    const visibleEndAt = b.plannedEndAt.getTime() > range.end.getTime() ? range.end : b.plannedEndAt;
                    const startMins = diffMinutes(range.start, visibleStartAt);
                    const left = startMins * pxPerMinute;
                    const width = Math.max(
                      minDurationMinutes * pxPerMinute,
                      diffMinutes(visibleStartAt, visibleEndAt) * pxPerMinute
                    );
                    const top = b.laneIndex * laneHeight + 10;
                    const isGhost = b.kind === 'GHOST_BUFFER';
                    const isInteractive = canEdit && (b.kind === 'ITEM_SCHEDULE' || b.kind === 'MANUAL_BUFFER');
                    const tone = isGhost ? 'slate' : b.kind === 'MANUAL_BUFFER' ? 'sky' : typeToPaletteTone(b.itemType);
                    const isSelected = selectedBlockId === b.id;

                    return (
                      <div
                        key={b.id}
                        className={cn(
                          'absolute select-none rounded-2xl border shadow-sm backdrop-blur-sm',
                          toneClasses(tone),
                          isGhost ? 'border-dashed opacity-60' : '',
                          isInteractive ? 'cursor-grab hover:shadow-md' : 'cursor-default opacity-95'
                        )}
                        style={{ left, top, width, height: blockHeight }}
                        data-timeline-block="true"
                        onClick={() => isInteractive && setSelectedBlockId(b.id)}
                        role="button"
                        tabIndex={0}
                        onPointerDown={(e) => isInteractive && onBlockPointerDown(e, b, 'DRAG')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && isInteractive) setSelectedBlockId(b.id);
                        }}
                      >
                        {/* Resize handles */}
                        {isInteractive && (
                          <>
                            <div
                              className="absolute left-0 top-0 h-full w-2 cursor-ew-resize"
                              onPointerDown={(e) => onBlockPointerDown(e, b, 'RESIZE_LEFT')}
                              aria-hidden
                            />
                            <div
                              className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
                              onPointerDown={(e) => onBlockPointerDown(e, b, 'RESIZE_RIGHT')}
                              aria-hidden
                            />
                          </>
                        )}

                        <div className="flex h-full items-center gap-2 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-1 text-[11px] font-extrabold uppercase tracking-wide">
                              {isGhost ? 'AUTO' : b.kind === 'MANUAL_BUFFER' ? 'BUFFER' : b.itemType}
                            </div>
                            <div className="mt-0.5 line-clamp-1 text-sm font-bold">{b.label}</div>
                            <div className="mt-0.5 text-[11px] font-semibold opacity-80">
                              {formatTimeShort(b.plannedStartAt)} - {formatTimeShort(b.plannedEndAt)}
                            </div>
                          </div>
                          {b.status && (
                            <div className="shrink-0 rounded-xl border border-white/70 bg-white/70 px-2 py-1 text-[11px] font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                              {b.status}
                            </div>
                          )}
                        </div>

                        {canEdit && isSelected && !isGhost && (
                          <button
                            type="button"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBlock(b);
                            }}
                            className="absolute right-2 top-2 rounded-xl border border-rose-200 bg-white/90 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-white dark:border-rose-800/60 dark:bg-slate-800/90 dark:text-rose-400 dark:hover:bg-slate-700"
                            title="Kustuta plokk"
                          >
                            ×
                          </button>
                        )}

                      </div>
                    );
                  })}
                  </div>
                )}

              {timelineMode === 'MONTH' && monthViewData && (
                <div className="relative" style={{ width: contentWidthPx, height: monthViewData.monthHeightPx }}>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 border-b border-slate-200/70" style={{ height: monthHeaderHeightPx }}>
                    {['E', 'T', 'K', 'N', 'R', 'L', 'P'].map((d) => (
                      <div key={d} className="flex items-center justify-center text-[11px] font-bold text-slate-500">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  <div style={{ height: monthViewData.weeksCount * monthWeekRowHeightPx }}>
                    {Array.from({ length: monthViewData.weeksCount }).map((_, weekRow) => (
                      <div
                        // eslint-disable-next-line react/no-array-index-key
                        key={weekRow}
                        className="grid grid-cols-7 border-b border-slate-200/60 last:border-b-0"
                        style={{ height: monthWeekRowHeightPx }}
                      >
                        {Array.from({ length: 7 }).map((__, dayCol) => {
                          const dayIdx = weekRow * 7 + dayCol;
                          const dayD = monthViewData.dayDates[dayIdx];
                          const key = dateKey(startOfDay(dayD));
                          const isInMonth = dayD.getMonth() === range.start.getMonth();
                          const dayItems = monthViewData.smallByDayKey.get(key) || [];
                          return (
                            <div
                              key={dayCol}
                              className={cn(
                                'relative border-r border-slate-200/60 last:border-r-0',
                                !isInMonth ? 'bg-slate-50/40' : ''
                              )}
                            >
                              <div className={cn('absolute left-1 top-1 text-[11px] font-bold', isInMonth ? 'text-slate-700' : 'text-slate-400')}>
                                {dayD.getDate()}
                              </div>

                              <div className="px-1" style={{ paddingTop: monthSmallLayerTopPadPx }}>
                                {dayItems.slice(0, 3).map((it) => {
                                  const tone =
                                    it.kind === 'BUFFER' || it.itemType === 'MANUAL_BUFFER'
                                      ? 'sky'
                                      : typeToPaletteTone(it.itemType);
                                  return (
                                    <div
                                      key={it.id}
                                      title={it.label}
                                      className={cn(
                                        'mb-1 h-5 overflow-hidden rounded-md border px-1 py-[2px] text-[10px] font-semibold leading-4',
                                        toneClasses(tone)
                                      )}
                                    >
                                      {it.label}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Overlay (modules + LO bars) */}
                  <div className="absolute inset-0 pointer-events-none">
                    {monthViewData.moduleSegments.map((seg) => (
                      <div
                        key={seg.id}
                        className={cn('absolute overflow-hidden rounded-lg border px-1 py-1 text-[10px] font-extrabold', toneClasses(typeToPaletteTone('MODULE')))}
                        style={{ left: seg.left, top: seg.top, width: seg.width, height: seg.height, opacity: 0.92 }}
                        title={seg.label}
                      >
                        <div className="line-clamp-1">{seg.label}</div>
                      </div>
                    ))}
                    {monthViewData.loSegments.map((seg) => (
                      <div
                        key={seg.id}
                        className={cn('absolute overflow-hidden rounded-lg border px-1 py-1 text-[10px] font-bold', toneClasses(typeToPaletteTone('LEARNING_OUTCOME')))}
                        style={{ left: seg.left, top: seg.top, width: seg.width, height: seg.height, opacity: 0.86 }}
                        title={seg.label}
                      >
                        <div className="line-clamp-1">{seg.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Today marker */}
                  {monthViewData.todayInRange && (
                    <div
                      className="absolute z-10 rounded-full border-2 border-rose-500 bg-white/80 dark:bg-slate-800/80"
                      style={{ left: monthViewData.todayLeft - 2, top: monthViewData.todayTop - 2, width: 18, height: 18 }}
                    />
                  )}
                </div>
              )}

                {/* Editor */}
              {canEdit && (
                <BlockEditorPopover
                  key={selectedBlock?.id ?? 'none'}
                  block={
                    selectedBlock
                      ? {
                          ...selectedBlock,
                          label: selectedBlock.label,
                        }
                      : null
                  }
                  onClose={() => setSelectedBlockId(null)}
                  onDelete={(b) => deleteBlock(b)}
                />
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

