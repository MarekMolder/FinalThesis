import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseLocalDateTime } from './GoogleScheduleModal';
import './curriculum-gantt.css';

const DAY_MS = 86400000;
/** Ribal kuvatav minimaalne „lõpu“ akna pikkus: kui tegelik ajavahemik on pikem, näidatakse viimast N ööpäeva. */
const DISPLAY_SPAN_MS = 5 * DAY_MS;
const ROW_H = 44;
/** Ajaskaala päise kõrgus (võrgusamm + kasti lõpu kuupäevad). */
const TIME_HEADER_H = 40;
const LABEL_W = 220;

const RELATION_COLORS = {
  EELDAB: '#c62828',
  ON_EELDUSEKS: '#ef5350',
  KOOSNEB: '#1565c0',
  ON_OSAKS: '#42a5f5',
  SISALDAB: '#2e7d32',
};

function parseMs(iso) {
  const d = parseLocalDateTime(iso);
  return d && !Number.isNaN(d.getTime()) ? d.getTime() : NaN;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatTick(d, weekMode) {
  if (weekMode) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Täielik algus/lõpp ribal kirjas (visuaal võib olla lühendatud 5-päeva aknaga). */
function formatGanttFullDate(d) {
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Pealkiri kastis: esimesed sõnad (kitsas ribas ei tohi „kaotada“ algust).
 * @param {string} text
 * @param {number} maxWords
 */
function titleLeadingWords(text, maxWords = 12) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length <= maxWords) return raw;
  return `${parts.slice(0, maxWords).join(' ')}…`;
}

/** Päise marker: kasti täieliku lõpu kuupäev (joondatud kasti parema servaga). */
function formatBarEndHeaderLabel(endMs) {
  const d = new Date(endMs);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function cubicPath(x1, y1, x2, y2) {
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

function barCenterY(rowIndex) {
  return rowIndex * ROW_H + ROW_H / 2;
}

/** Kuvatav ajavahemik: ≤5 ööpäeva täies ulatuses; muidu ainult viimased 5 ööpäeva (lõpp jääb samaks). */
function displayRangeMs(actualStartMs, actualEndMs) {
  if (!Number.isFinite(actualStartMs) || !Number.isFinite(actualEndMs) || actualEndMs <= actualStartMs) {
    return { d0: actualStartMs, d1: actualEndMs };
  }
  const dur = actualEndMs - actualStartMs;
  if (dur <= DISPLAY_SPAN_MS) return { d0: actualStartMs, d1: actualEndMs };
  return { d0: actualEndMs - DISPLAY_SPAN_MS, d1: actualEndMs };
}

/**
 * Hierarhiline järjekord: juur(parent) → selle lapsed → nende lapsed → järgmine juur …
 * @param {Set<string>} scheduledIds
 * @param {Map<string, object>} itemById
 */
function orderItemsTree(scheduledIds, itemById) {
  const present = new Set(scheduledIds);
  /** @type {Map<string, string[]>} */
  const childrenBy = new Map();

  for (const id of present) {
    const it = itemById.get(id);
    const p = it?.parentItemId;
    const parentKey = p && present.has(p) ? p : '__ROOT__';
    if (!childrenBy.has(parentKey)) childrenBy.set(parentKey, []);
    childrenBy.get(parentKey).push(id);
  }

  const siblingSort = (a, b) => {
    const ta = (itemById.get(a)?.type || '').localeCompare(itemById.get(b)?.type || '');
    if (ta !== 0) return ta;
    return (itemById.get(a)?.title || '').localeCompare(itemById.get(b)?.title || '');
  };
  for (const arr of childrenBy.values()) arr.sort(siblingSort);

  const roots = childrenBy.get('__ROOT__') || [];
  const ordered = [];
  const seen = new Set();

  function dfs(id) {
    if (seen.has(id)) return;
    seen.add(id);
    const it = itemById.get(id);
    if (it) ordered.push(it);
    const ch = childrenBy.get(id);
    if (ch) for (const c of ch) dfs(c);
  }

  for (const r of roots) dfs(r);
  for (const id of present) {
    if (!seen.has(id)) dfs(id);
  }
  return ordered;
}

/**
 * @param {object} props
 * @param {object[]} props.blocks — timeline API (kind, plannedStartAt, …)
 * @param {object[]} props.items
 * @param {object[]} props.relations
 * @param {Date} props.anchorDate
 * @param {(b: object) => void} props.onBlockClick
 * @param {(type: string, kind?: string) => string} props.typeToColor
 */
export default function CurriculumGantt({ blocks, items, relations, anchorDate, onBlockClick, typeToColor }) {
  const [pixelsPerDay, setPixelsPerDay] = useState(48);
  const [showModule, setShowModule] = useState(true);
  const [showLO, setShowLO] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [showBuffer, setShowBuffer] = useState(true);
  const [showSemanticRelations, setShowSemanticRelations] = useState(false);

  const scrollRef = useRef(null);

  const itemById = useMemo(() => {
    const m = new Map();
    (items || []).forEach((it) => m.set(it.id, it));
    return m;
  }, [items]);

  const { rangeStart, rangeEnd, totalMs, innerWidth } = useMemo(() => {
    const anchor = startOfDay(anchorDate);
    let rs = addDays(anchor, -45);
    let re = addDays(anchor, 135);

    (blocks || []).forEach((b) => {
      const s = parseMs(b.plannedStartAt);
      const e = parseMs(b.plannedEndAt);
      if (Number.isFinite(s)) rs = new Date(Math.min(rs.getTime(), s));
      if (Number.isFinite(e)) re = new Date(Math.max(re.getTime(), e));
    });

    rs = startOfDay(addDays(rs, -7));
    re = startOfDay(addDays(re, 14));

    const tm = Math.max(re.getTime() - rs.getTime(), DAY_MS);
    const days = tm / DAY_MS;
    const iw = Math.max(days * pixelsPerDay, 640);
    return { rangeStart: rs, rangeEnd: re, totalMs: tm, innerWidth: iw };
  }, [blocks, anchorDate, pixelsPerDay]);

  const timeToX = useCallback(
    (ms) => {
      if (!Number.isFinite(ms)) return 0;
      const t = ms - rangeStart.getTime();
      return (t / totalMs) * innerWidth;
    },
    [rangeStart, totalMs, innerWidth]
  );

  const visibleBlocks = useMemo(() => {
    return (blocks || []).filter((b) => {
      if (b.kind === 'MANUAL_BUFFER') return showBuffer;
      if (b.kind !== 'ITEM_SCHEDULE') return false;
      const it = itemById.get(b.curriculumItemId);
      const t = (it?.type || '').toUpperCase();
      if (t === 'MODULE') return showModule;
      if (t === 'LEARNING_OUTCOME') return showLO;
      return showActivity;
    });
  }, [blocks, itemById, showModule, showLO, showActivity, showBuffer]);

  const bufferBlocks = useMemo(
    () => visibleBlocks.filter((b) => b.kind === 'MANUAL_BUFFER'),
    [visibleBlocks]
  );

  const scheduleBlocks = useMemo(
    () => visibleBlocks.filter((b) => b.kind === 'ITEM_SCHEDULE'),
    [visibleBlocks]
  );

  const itemRows = useMemo(() => {
    const ids = new Set();
    scheduleBlocks.forEach((b) => ids.add(b.curriculumItemId));
    return orderItemsTree(ids, itemById);
  }, [scheduleBlocks, itemById]);

  const visibleItemIdSet = useMemo(() => new Set(itemRows.map((r) => r.id)), [itemRows]);

  const hasBufferRow = bufferBlocks.length > 0 && showBuffer;

  const rowIndexByItemId = useMemo(() => {
    const m = new Map();
    let i = 0;
    if (hasBufferRow) i = 1;
    itemRows.forEach((it) => {
      m.set(it.id, i);
      i += 1;
    });
    return m;
  }, [itemRows, hasBufferRow]);

  /** @type {Map<string, { left: number, right: number, rowIndex: number, innerTop: number, block: object, displayStartMs: number, displayEndMs: number, actualStartMs: number, actualEndMs: number }[]>} */
  const barLayout = useMemo(() => {
    const byItem = new Map();

    const pushBar = (key, rowIndex, block, innerTop) => {
      const s = parseMs(block.plannedStartAt);
      const e = parseMs(block.plannedEndAt);
      if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return;
      const { d0, d1 } = displayRangeMs(s, e);
      const left = timeToX(d0);
      const right = timeToX(d1);
      const arr = byItem.get(key) || [];
      arr.push({
        left,
        right,
        rowIndex,
        innerTop,
        block,
        displayStartMs: d0,
        displayEndMs: d1,
        actualStartMs: s,
        actualEndMs: e,
      });
      byItem.set(key, arr);
    };

    if (hasBufferRow) {
      bufferBlocks.forEach((b, idx) => {
        const innerTop = 6 + (idx % 3) * 6;
        pushBar('__buffer__', 0, b, innerTop);
      });
    }

    scheduleBlocks.forEach((b) => {
      const ri = rowIndexByItemId.get(b.curriculumItemId);
      if (ri === undefined) return;
      pushBar(b.curriculumItemId, ri, b, 6);
    });

    return byItem;
  }, [bufferBlocks, scheduleBlocks, hasBufferRow, rowIndexByItemId, timeToX]);

  const segmentForItemAtTime = useCallback(
    (itemId, tMs) => {
      const segs = barLayout.get(itemId);
      if (!segs?.length) return null;
      let best = segs[0];
      let bestDist = Infinity;
      for (const s of segs) {
        if (tMs >= s.actualStartMs && tMs <= s.actualEndMs) return s;
        const mid = (s.actualStartMs + s.actualEndMs) / 2;
        const d = Math.abs(tMs - mid);
        if (d < bestDist) {
          bestDist = d;
          best = s;
        }
      }
      return best;
    },
    [barLayout]
  );

  /** Ajainstant kuvataval ribal → X (klammitud kuvatava akna sisse). */
  const xOnSegmentForInstant = useCallback(
    (seg, tMs) => {
      if (!seg) return 0;
      const clamped = Math.min(Math.max(tMs, seg.displayStartMs), seg.displayEndMs);
      return timeToX(clamped);
    },
    [timeToX]
  );

  const parentArrows = useMemo(() => {
    const paths = [];
    /** Üks struktuurne nool (laps → vanem) paari kohta — muidu mitu plokki = kattuvad jooned ja näeb välja nagu kaheotsaline nool. */
    const blocksByChild = new Map();
    for (const b of scheduleBlocks) {
      if (!blocksByChild.has(b.curriculumItemId)) blocksByChild.set(b.curriculumItemId, []);
      blocksByChild.get(b.curriculumItemId).push(b);
    }
    const donePair = new Set();

    for (const b of scheduleBlocks) {
      const childItem = itemById.get(b.curriculumItemId);
      const pid = childItem?.parentItemId;
      if (!pid || !itemById.get(pid)) continue;

      const pairKey = `${b.curriculumItemId}::${pid}`;
      if (donePair.has(pairKey)) continue;
      donePair.add(pairKey);

      const childBlocks = blocksByChild.get(b.curriculumItemId) || [b];
      const rep = childBlocks.reduce((a, c) => (parseMs(c.plannedEndAt) > parseMs(a.plannedEndAt) ? c : a));

      const childSegs = barLayout.get(rep.curriculumItemId);
      const parentSegs = barLayout.get(pid);
      if (!childSegs?.length || !parentSegs?.length) continue;

      const s = parseMs(rep.plannedStartAt);
      const e = parseMs(rep.plannedEndAt);
      const midT = (s + e) / 2;
      const cs =
        childSegs.find((seg) => midT >= seg.actualStartMs && midT <= seg.actualEndMs) ||
        childSegs.reduce((a, c) => (c.actualStartMs < a.actualStartMs ? c : a));

      let ps = parentSegs[0];
      let best = Infinity;
      const attachMs = e;
      for (const seg of parentSegs) {
        const clampedT = Math.min(Math.max(attachMs, seg.displayStartMs), seg.displayEndMs);
        const dist = Math.abs(attachMs - clampedT);
        if (dist < best) {
          best = dist;
          ps = seg;
        }
      }

      const x2 = timeToX(Math.min(Math.max(attachMs, ps.displayStartMs), ps.displayEndMs));
      const cx = (cs.left + cs.right) / 2;
      const x1 = x2 >= cx ? cs.right : cs.left;
      const y1 = barCenterY(cs.rowIndex);
      const y2 = barCenterY(ps.rowIndex);
      if (Math.abs(y2 - y1) < 2 && Math.abs(x2 - x1) < 4) continue;
      paths.push({ key: `p-${pairKey}`, d: cubicPath(x1, y1, x2, y2), color: '#5f6368' });
    }
    return paths;
  }, [scheduleBlocks, itemById, barLayout, timeToX]);

  const relationArrows = useMemo(() => {
    if (!showSemanticRelations || !(relations || []).length) return [];
    const paths = [];

    const latestEndBlock = (itemId) => {
      const bs = scheduleBlocks.filter((b) => b.curriculumItemId === itemId);
      if (!bs.length) return null;
      return bs.reduce((a, c) => (parseMs(c.plannedEndAt) > parseMs(a.plannedEndAt) ? c : a));
    };
    const earliestStartBlock = (itemId) => {
      const bs = scheduleBlocks.filter((b) => b.curriculumItemId === itemId);
      if (!bs.length) return null;
      return bs.reduce((a, c) => (parseMs(c.plannedStartAt) < parseMs(a.plannedStartAt) ? c : a));
    };

    (relations || []).forEach((r, idx) => {
      const srcId = r.sourceItemId;
      const tgtId = r.targetItemId;
      if (!srcId || !tgtId) return;
      if (!itemById.get(srcId) || !itemById.get(tgtId)) return;

      const srcIt = itemById.get(srcId);
      const tgtIt = itemById.get(tgtId);
      /* Sama paar mis parentItemId hierarhia: struktuurne hall nool juba näitab suunda — RDF joon vastassuunas tekitab „kaheotsalise“ illusiooni */
      if (srcIt?.parentItemId === tgtId || tgtIt?.parentItemId === srcId) return;

      const srcBlock = latestEndBlock(srcId);
      const tgtBlock = earliestStartBlock(tgtId);
      if (!srcBlock || !tgtBlock) return;

      const sEnd = parseMs(srcBlock.plannedEndAt);
      const tStart = parseMs(tgtBlock.plannedStartAt);
      if (!Number.isFinite(sEnd) || !Number.isFinite(tStart)) return;

      const ss = segmentForItemAtTime(srcId, sEnd) || barLayout.get(srcId)?.[0];
      const ts = segmentForItemAtTime(tgtId, tStart) || barLayout.get(tgtId)?.[0];
      if (!ss || !ts) return;

      const x1 = xOnSegmentForInstant(ss, sEnd);
      const y1 = barCenterY(ss.rowIndex);
      const x2 = xOnSegmentForInstant(ts, tStart);
      const y2 = barCenterY(ts.rowIndex);
      const color = RELATION_COLORS[r.type] || '#7b1fa2';
      paths.push({ key: `r-${r.id || idx}`, d: cubicPath(x1, y1, x2, y2), color });
    });
    return paths;
  }, [showSemanticRelations, relations, itemById, scheduleBlocks, segmentForItemAtTime, barLayout, xOnSegmentForInstant]);

  const totalRows = (hasBufferRow ? 1 : 0) + itemRows.length;
  const gridHeight = TIME_HEADER_H + totalRows * ROW_H;
  const rowsAreaH = totalRows * ROW_H;

  const ticks = useMemo(() => {
    const out = [];
    const spanDays = totalMs / DAY_MS;
    const stepDays = spanDays > 200 ? 14 : spanDays > 90 ? 7 : spanDays > 40 ? 3 : 1;
    let cur = startOfDay(rangeStart);
    const end = rangeEnd.getTime();
    const weekMode = stepDays >= 7;
    while (cur.getTime() <= end) {
      const x = timeToX(cur.getTime());
      const isMajor = cur.getDate() === 1 || cur.getDay() === 1;
      out.push({ x, label: formatTick(cur, weekMode), major: isMajor, t: cur.getTime() });
      cur = addDays(cur, stepDays);
    }
    return out;
  }, [rangeStart, rangeEnd, totalMs, timeToX]);

  /** Kasti lõpu X + täieliku lõpu kuupäeva silt päises (min. pikslivahe, et sildid ei kattuks). */
  const barEndHeaderMarkers = useMemo(() => {
    const raw = [];
    for (const [, segs] of barLayout) {
      for (const seg of segs) {
        const label = formatBarEndHeaderLabel(seg.actualEndMs);
        if (!label) continue;
        raw.push({
          key: `end-${seg.block.id}`,
          x: seg.right,
          label,
        });
      }
    }
    raw.sort((a, b) => a.x - b.x);
    const MIN_PX = 16;
    const out = [];
    for (const m of raw) {
      if (out.length && Math.abs(out[out.length - 1].x - m.x) < MIN_PX) continue;
      out.push(m);
    }
    return out;
  }, [barLayout]);

  const todayX = useMemo(() => {
    const now = Date.now();
    if (now < rangeStart.getTime() || now > rangeEnd.getTime()) return null;
    return timeToX(now);
  }, [rangeStart, rangeEnd, timeToX]);

  useEffect(() => {
    if (!scrollRef.current || todayX == null) return;
    const el = scrollRef.current;
    const target = todayX - el.clientWidth / 3;
    el.scrollLeft = Math.max(0, target);
  }, [todayX, innerWidth, anchorDate]);

  const onZoom = (delta) => {
    setPixelsPerDay((p) => Math.min(120, Math.max(16, p + delta)));
  };

  const openModal = (block) => {
    if (onBlockClick) onBlockClick(block);
  };

  const markerIds = useMemo(() => {
    const colors = new Set(['#5f6368']);
    relationArrows.forEach((p) => colors.add(p.color));
    return [...colors];
  }, [relationArrows]);

  if (!(blocks || []).length) {
    return (
      <div className="cgantt-empty">
        Sellel versioonil pole ajakava blokke.
        <div className="cgantt-hint">Lisa blokke teistes vaadetes või impordi kalendrist.</div>
      </div>
    );
  }

  return (
    <div
      className="cgantt"
      style={{ '--cgantt-row-h': `${ROW_H}px`, '--cgantt-time-header-h': `${TIME_HEADER_H}px` }}
    >
      <div className="cgantt-toolbar">
        <div className="cgantt-toolbar-group">
          <span className="cgantt-toolbar-label">Suum</span>
          <button type="button" className="cgantt-zoom-btn" onClick={() => onZoom(-8)}>
            −
          </button>
          <button type="button" className="cgantt-zoom-btn" onClick={() => onZoom(8)}>
            +
          </button>
          <button type="button" className="cgantt-mini-btn" onClick={() => setPixelsPerDay(48)}>
            Reset
          </button>
        </div>
        <div className="cgantt-toolbar-group">
          <span className="cgantt-toolbar-label">Tüübid</span>
          <label className="cgantt-filter-chk">
            <input type="checkbox" checked={showModule} onChange={(e) => setShowModule(e.target.checked)} />
            Moodul
          </label>
          <label className="cgantt-filter-chk">
            <input type="checkbox" checked={showLO} onChange={(e) => setShowLO(e.target.checked)} />
            ÕV
          </label>
          <label className="cgantt-filter-chk">
            <input type="checkbox" checked={showActivity} onChange={(e) => setShowActivity(e.target.checked)} />
            Tegevused
          </label>
          <label className="cgantt-filter-chk">
            <input type="checkbox" checked={showBuffer} onChange={(e) => setShowBuffer(e.target.checked)} />
            Puhvrid
          </label>
        </div>
        <div className="cgantt-toolbar-group">
          <label className="cgantt-filter-chk">
            <input
              type="checkbox"
              checked={showSemanticRelations}
              onChange={(e) => setShowSemanticRelations(e.target.checked)}
            />
            Näita RDF seoseid
          </label>
        </div>
        {showSemanticRelations && (
          <div className="cgantt-legend">
            <span>
              <i style={{ background: RELATION_COLORS.EELDAB }} /> EELDAB
            </span>
            <span>
              <i style={{ background: RELATION_COLORS.ON_EELDUSEKS }} /> ON_EELDUSEKS
            </span>
            <span>
              <i style={{ background: RELATION_COLORS.KOOSNEB }} /> KOOSNEB
            </span>
            <span>
              <i style={{ background: RELATION_COLORS.ON_OSAKS }} /> ON_OSAKS
            </span>
            <span>
              <i style={{ background: RELATION_COLORS.SISALDAB }} /> SISALDAB
            </span>
            <span style={{ color: '#5f6368' }}>Hall: struktuur (vanem)</span>
          </div>
        )}
      </div>

      <div className="cgantt-body">
        <div className="cgantt-labels" style={{ width: LABEL_W }}>
          <div className="cgantt-header-spacer" />
          {hasBufferRow && <div className="cgantt-label-cell cgantt-label-cell--buffer">Versiooni puhvrid</div>}
          {itemRows.map((it) => {
            const depth = (() => {
              let d = 0;
              let x = it.parentItemId;
              const seen = new Set();
              while (x && visibleItemIdSet.has(x) && !seen.has(x)) {
                seen.add(x);
                d += 1;
                x = itemById.get(x)?.parentItemId;
              }
              return d;
            })();
            return (
              <div
                key={it.id}
                className="cgantt-label-cell"
                title={it.title}
                style={{ paddingLeft: 10 + Math.min(depth, 8) * 12 }}
              >
                <span className={it.type === 'MODULE' ? '' : 'cgantt-label-cell--muted'}>
                  [{it.type || '?'}] {it.title || it.id}
                </span>
              </div>
            );
          })}
        </div>

        <div className="cgantt-scroll" ref={scrollRef}>
          <div className="cgantt-timeline-inner" style={{ width: innerWidth, height: gridHeight }}>
            <div className="cgantt-time-header" style={{ width: innerWidth }}>
              {ticks.map((tk) => (
                <div
                  key={tk.t}
                  className={`cgantt-time-tick ${tk.major ? 'cgantt-time-tick--major' : ''}`}
                  style={{ left: tk.x }}
                >
                  {tk.label}
                </div>
              ))}
              {barEndHeaderMarkers.map((m) => (
                <div
                  key={m.key}
                  className="cgantt-bar-end-marker"
                  style={{ left: m.x }}
                  title={m.label}
                >
                  {m.label}
                </div>
              ))}
            </div>

            <div className="cgantt-grid-bg" style={{ top: TIME_HEADER_H, height: rowsAreaH, width: innerWidth }}>
              {ticks.map((tk) => (
                <div
                  key={`g-${tk.t}`}
                  className={`cgantt-grid-line ${tk.major ? 'cgantt-grid-line--week' : ''}`}
                  style={{ left: tk.x }}
                />
              ))}
            </div>

            {todayX != null && (
              <div
                className="cgantt-today-line"
                style={{ left: todayX, top: TIME_HEADER_H, height: rowsAreaH }}
              />
            )}

            <svg
              className="cgantt-svg-layer"
              width={innerWidth}
              height={rowsAreaH}
              style={{ top: TIME_HEADER_H }}
              viewBox={`0 0 ${innerWidth} ${rowsAreaH}`}
            >
              <defs>
                {markerIds.map((c) => {
                  const id = `cgantt-arr-${c.replace(/#/g, '')}`;
                  return (
                    <marker key={id} id={id} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                      <path d="M0,0 L7,3.5 L0,7 z" fill={c} />
                    </marker>
                  );
                })}
              </defs>
              {parentArrows.map((a) => (
                <path
                  key={a.key}
                  d={a.d}
                  fill="none"
                  stroke={a.color}
                  strokeWidth="1.5"
                  opacity="0.55"
                  markerEnd={`url(#cgantt-arr-${a.color.replace(/#/g, '')})`}
                />
              ))}
              {relationArrows.map((a) => (
                <path
                  key={a.key}
                  d={a.d}
                  fill="none"
                  stroke={a.color}
                  strokeWidth="2"
                  opacity="0.78"
                  markerEnd={`url(#cgantt-arr-${a.color.replace(/#/g, '')})`}
                />
              ))}
            </svg>

            <div className="cgantt-rows" style={{ width: innerWidth, top: TIME_HEADER_H, height: rowsAreaH }}>
              {hasBufferRow && (
                <div className="cgantt-row cgantt-row--buffer">
                  {(barLayout.get('__buffer__') || []).map((seg) => (
                    <button
                      key={seg.block.id}
                      type="button"
                      className="cgantt-bar cgantt-bar--buffer"
                      style={{
                        left: seg.left,
                        width: Math.max(4, seg.right - seg.left),
                        top: seg.innerTop,
                        background: 'rgba(229, 115, 115, 0.22)',
                        borderLeftColor: '#c62828',
                      }}
                      onClick={() => openModal(seg.block)}
                      title={`${seg.block.label || 'Puhver'}\nTäielik: ${formatGanttFullDate(parseLocalDateTime(seg.block.plannedStartAt))} – ${formatGanttFullDate(parseLocalDateTime(seg.block.plannedEndAt))}`}
                    >
                      <div className="cgantt-bar-inner">
                        <span className="cgantt-bar-label">
                          {titleLeadingWords(seg.block.label || seg.block.itemTitle || 'Puhver', 8)}
                        </span>
                        <span className="cgantt-bar-meta">
                          <span className="cgantt-bar-meta-strong">Täielik:</span>{' '}
                          {formatGanttFullDate(parseLocalDateTime(seg.block.plannedStartAt))} –{' '}
                          {formatGanttFullDate(parseLocalDateTime(seg.block.plannedEndAt))}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {itemRows.map((it) => {
                const segs = barLayout.get(it.id) || [];
                return (
                  <div key={it.id} className="cgantt-row">
                    {segs.map((seg) => {
                      const col = typeToColor ? typeToColor(it.type) : '#e8f0fe';
                      const fullTitle = seg.block.label || seg.block.itemTitle || it.title;
                      const displayTitle = titleLeadingWords(fullTitle, 14);
                      const a0 = parseLocalDateTime(seg.block.plannedStartAt);
                      const a1 = parseLocalDateTime(seg.block.plannedEndAt);
                      const truncated = seg.actualEndMs - seg.actualStartMs > DISPLAY_SPAN_MS;
                      const fullDateLine = `${formatGanttFullDate(a0)} – ${formatGanttFullDate(a1)}`;
                      const timeDetail = `${a0?.toLocaleString?.('et-EE') ?? ''} – ${a1?.toLocaleString?.('et-EE') ?? ''}`;
                      const tipExtra = truncated
                        ? `\nKast näitab viimast 5 päeva; kuupäevad all on täielik algus ja lõpp.`
                        : '';
                      return (
                        <button
                          key={seg.block.id}
                          type="button"
                          className="cgantt-bar"
                          style={{
                            left: seg.left,
                            width: Math.max(4, seg.right - seg.left),
                            top: seg.innerTop,
                            background: col,
                            borderLeftColor: col,
                          }}
                          onClick={() => openModal(seg.block)}
                          title={`${fullTitle}\nAlgus – lõpp: ${fullDateLine}\n${timeDetail}${tipExtra}`}
                        >
                          <div className="cgantt-bar-inner">
                            <div className="cgantt-bar-label">{displayTitle}</div>
                            <div className="cgantt-bar-meta" aria-label="Täielik ajavahemik">
                              <span className="cgantt-bar-meta-strong">Täielik:</span> {fullDateLine}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
