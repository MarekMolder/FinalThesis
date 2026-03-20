import { useCallback, useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { api, curriculumItem, relation, schedule, timeline } from '../../api';
import GoogleScheduleModal, { parseLocalDateTime, validateStrictParentWindow } from './GoogleScheduleModal';
import CurriculumGantt from './CurriculumGantt';
import './curriculum-calendar.css';

function cn(...xs) {
  return xs.filter(Boolean).join(' ');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatLocalDateTime(d) {
  if (!d || Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Järgmine kesköö (lokaalne), kasutatud päeva lõigu lõpuks (poolavatud lõik). */
function startOfNextDay(d) {
  const x = startOfDay(d);
  x.setDate(x.getDate() + 1);
  return x;
}

function startOfWeekMonday(d) {
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

function dateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Kõik kalendripäevad [start, end] vahemikus (kaasa arvatud mõlemad päevad). */
function eachCalendarDayBetween(startDate, endDate) {
  const out = [];
  let cur = startOfDay(startDate);
  const last = startOfDay(endDate);
  const endT = last.getTime();
  while (cur.getTime() <= endT) {
    out.push(new Date(cur));
    cur = addDays(cur, 1);
  }
  return out;
}

function monthRibbonRangeClassNames(ev, cellDay) {
  const sk = dateKey(startOfDay(ev.start));
  const ek = dateKey(startOfDay(ev.end));
  const dk = dateKey(startOfDay(cellDay));
  if (sk === ek) return ['cc-month-ribbon--single'];
  const xs = ['cc-month-ribbon--range'];
  if (dk === sk) xs.push('cc-month-ribbon--range-start');
  if (dk === ek) xs.push('cc-month-ribbon--range-end');
  if (dk !== sk && dk !== ek) xs.push('cc-month-ribbon--range-mid');
  return xs;
}

function defaultDayRange(dayDate) {
  const s = startOfDay(dayDate);
  s.setHours(9, 0, 0, 0);
  const e = new Date(s.getTime() + 60 * 60 * 1000);
  return { start: s, end: e };
}

function intervalsOverlap(slotStart, slotEnd, blockStart, blockEnd) {
  return slotStart.getTime() < blockEnd.getTime() && blockStart.getTime() < slotEnd.getTime();
}

/**
 * Valitud ajavahemiku ja olemasolevate ITEM_SCHEDULE plokkide ülekatted → moodulid ja ÕV-d,
 * mille ajakava selle slotiga lõikub (modal filtrid / vaikimisi vahekaart).
 * @param {'exact'|'fullDay'} contextSpan — fullDay: kuu/aasta päevaklõps, lõige = terve kalendripäev (mitte ainult 9–10).
 */
function computeScheduleSlotContext(blocks, items, slotStart, slotEnd, contextSpan = 'exact') {
  const moduleIds = new Set();
  const loIds = new Set();
  if (!slotStart || !slotEnd || !blocks?.length) {
    return { moduleIds: [], loIds: [] };
  }
  let rangeStart = slotStart;
  let rangeEnd = slotEnd;
  if (contextSpan === 'fullDay') {
    rangeStart = startOfDay(slotStart);
    rangeEnd = startOfNextDay(slotStart);
  }
  const itemById = new Map((items || []).filter((i) => i?.id).map((i) => [String(i.id), i]));
  for (const b of blocks) {
    if (b.kind !== 'ITEM_SCHEDULE' || !b.curriculumItemId) continue;
    const st = parseLocalDateTime(b.plannedStartAt);
    const en = parseLocalDateTime(b.plannedEndAt);
    if (!st || !en) continue;
    if (!intervalsOverlap(rangeStart, rangeEnd, st, en)) continue;
    const it = itemById.get(String(b.curriculumItemId));
    if (!it) continue;
    if (it.type === 'MODULE') moduleIds.add(String(it.id));
    if (it.type === 'LEARNING_OUTCOME') loIds.add(String(it.id));
  }
  return { moduleIds: [...moduleIds], loIds: [...loIds] };
}

/** Aktsentvärv (mumid, ribad, ääris) — pehmem palett kui “stoplight” täissolid. */
function typeToColor(type, kind) {
  if (kind === 'MANUAL_BUFFER') return '#e07a7a';
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
    case 'KNOBIT':
    default:
      return '#8b90a8';
  }
}

function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return { r: 120, g: 120, b: 130 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbaFromHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function renderFcEventContent(arg) {
  return (
    <div className="cc-fc-event-inner">
      <div className="cc-fc-ev-time">{arg.timeText}</div>
      <div className="cc-fc-ev-title">{arg.event.title}</div>
    </div>
  );
}

function rangeTitle(view, anchorDate) {
  if (view === 'YEAR') return String(anchorDate.getFullYear());
  if (view === 'MONTH') return anchorDate.toLocaleDateString('et-EE', { month: 'long', year: 'numeric' });
  if (view === 'GANTT') {
    return `Ajariba · ${anchorDate.toLocaleDateString('et-EE', { month: 'long', year: 'numeric' })}`;
  }
  if (view === 'WEEK') {
    const start = startOfWeekMonday(anchorDate);
    const end = addDays(start, 6);
    return `${start.toLocaleDateString('et-EE', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('et-EE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`;
  }
  return anchorDate.toLocaleDateString('et-EE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function YearMiniMonth({ monthDate, eventsByDay, onDayClick }) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const gridStart = startOfWeekMonday(monthStart);
  const todayKey = dateKey(startOfDay(new Date()));
  const cells = [];
  for (let i = 0; i < 42; i++) {
    cells.push(addDays(gridStart, i));
  }

  return (
    <div className="cc-mini-month">
      <div className="cc-mini-month-title">{monthStart.toLocaleDateString('et-EE', { month: 'long' })}</div>
      <div className="cc-mini-weekdays">
        {['E', 'T', 'K', 'N', 'R', 'L', 'P'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="cc-mini-grid">
        {cells.map((d) => {
          const key = dateKey(startOfDay(d));
          const events = eventsByDay.get(key) || [];
          const inMonth = d >= monthStart && d <= monthEnd;
          const isToday = key === todayKey;
          return (
            <button
              key={`${monthStart.getMonth()}-${key}`}
              type="button"
              className={cn('cc-mini-cell', 'cc-mini-cell-clickable', !inMonth && 'cc-mini-cell-outside')}
              onClick={() => onDayClick?.(d)}
            >
              <span className={cn('cc-mini-day-number', isToday && 'cc-mini-today-ring')}>{d.getDate()}</span>
              <div className="cc-mini-dots" aria-hidden>
                {events.slice(0, 10).map((ev) => (
                  <span key={ev.id} className="cc-mini-dot" style={{ backgroundColor: ev.color }} title={ev.title} />
                ))}
                {events.length > 10 && <span className="cc-mini-dot-more">+{events.length - 10}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthGrid({ anchorDate, eventsByDay, onDayClick, onEventClick }) {
  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const monthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
  const gridStart = startOfWeekMonday(monthStart);
  const cells = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));

  return (
    <div className="cc-month">
      <div className="cc-month-weekdays">
        {['E', 'T', 'K', 'N', 'R', 'L', 'P'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="cc-month-grid">
        {cells.map((d) => {
          const key = dateKey(startOfDay(d));
          const dayEvents = eventsByDay.get(key) || [];
          const inMonth = d >= monthStart && d <= monthEnd;
          const isToday = dateKey(startOfDay(new Date())) === key;
          return (
            <div key={key} className={cn('cc-month-cell', !inMonth && 'cc-month-cell-outside')}>
              <div className="cc-month-cell-inner">
                <div className="cc-month-ribbons" role="list" aria-label="Ajastused sel päeval">
                  {dayEvents.slice(0, 6).map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      role="listitem"
                      className={cn('cc-month-ribbon', ...monthRibbonRangeClassNames(ev, d))}
                      style={{
                        backgroundColor: rgbaFromHex(ev.color, 0.2),
                        borderLeftColor: ev.color,
                      }}
                      title={`${ev.timeLabel ? `${ev.timeLabel} · ` : ''}${ev.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(ev);
                      }}
                    >
                      <span className="cc-month-ribbon-label">{ev.title}</span>
                    </button>
                  ))}
                  {dayEvents.length > 6 && (
                    <span className="cc-month-ribbon-more" title={dayEvents.map((e) => e.title).join(' · ')}>
                      +{dayEvents.length - 6}
                    </span>
                  )}
                </div>
                <div className="cc-month-day-footer">
                  <button type="button" className="cc-month-day-head cc-month-day-hit" onClick={() => onDayClick?.(d)}>
                    <span className={cn('cc-month-day-number', isToday && 'cc-today-pill')}>{d.getDate()}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CurriculumCalendar({ curriculumVersionId }) {
  const [view, setView] = useState('YEAR');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [items, setItems] = useState([]);
  const [relations, setRelations] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [modalInitialStart, setModalInitialStart] = useState(null);
  const [modalInitialEnd, setModalInitialEnd] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  /** Loomisel: moodulid/ÕV-d, mille ajakava valitud slotiga lõikub (null = filtrit pole, nt muutmine). */
  const [slotContext, setSlotContext] = useState(null);

  const refreshBlocks = useCallback(() => {
    if (!curriculumVersionId) return Promise.resolve();
    return timeline.blocks(curriculumVersionId).then((rows) => {
      setBlocks(Array.isArray(rows) ? rows : []);
    });
  }, [curriculumVersionId]);

  useEffect(() => {
    if (!curriculumVersionId) return;
    let ignore = false;
    setLoading(true);
    setError('');
    Promise.allSettled([
      timeline.blocks(curriculumVersionId).then((rows) => (Array.isArray(rows) ? rows : [])),
      curriculumItem.list(curriculumVersionId, { page: 0, size: 3000 }),
      relation.list(curriculumVersionId, { page: 0, size: 5000 }),
    ])
      .then((results) => {
        if (ignore) return;
        const msgs = [];
        let blockRows = [];
        if (results[0].status === 'fulfilled') {
          blockRows = results[0].value;
        } else {
          msgs.push(results[0].reason?.message || 'Ajatelje plokid ei laadinud');
        }
        let itemRows = [];
        if (results[1].status === 'fulfilled') {
          const raw = results[1].value;
          itemRows = Array.isArray(raw) ? raw : raw?.content || [];
        } else {
          msgs.push(results[1].reason?.message || 'Õppekava elemendid ei laadinud (modal loend jääb tühjaks)');
        }
        let relationRows = [];
        if (results[2].status === 'fulfilled') {
          const raw = results[2].value;
          relationRows = Array.isArray(raw) ? raw : raw?.content || [];
        } else {
          relationRows = [];
        }
        /* RDF seosed on Gantti jaoks valikulised — ära blokeeri kogu kalendrit */
        setBlocks(blockRows);
        setItems(itemRows);
        setRelations(relationRows);
        if (msgs.length) setError(msgs.join(' · '));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [curriculumVersionId]);

  const events = useMemo(() => {
    return (blocks || [])
      .map((b) => {
        const start = parseLocalDateTime(b.plannedStartAt);
        const end = parseLocalDateTime(b.plannedEndAt);
        if (!start || !end) return null;
        const color = typeToColor(b.itemType, b.kind);
        return {
          id: b.id,
          rawBlock: b,
          title: b.label || b.itemTitle || (b.kind === 'MANUAL_BUFFER' ? 'Puhver' : 'Sündmus'),
          start,
          end,
          color,
          timeLabel: `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
        };
      })
      .filter(Boolean);
  }, [blocks]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      for (const day of eachCalendarDayBetween(ev.start, ev.end)) {
        const key = dateKey(day);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(ev);
      }
    }
    const out = new Map();
    for (const [key, list] of map.entries()) {
      const seen = new Set();
      const deduped = [];
      for (const e of list) {
        const id = String(e.id);
        if (seen.has(id)) continue;
        seen.add(id);
        deduped.push(e);
      }
      deduped.sort((a, b) => a.start.getTime() - b.start.getTime());
      out.set(key, deduped);
    }
    return out;
  }, [events]);

  const fullCalendarEvents = useMemo(
    () =>
      events.map((ev) => {
        const accent = ev.color;
        return {
          id: String(ev.id),
          title: ev.title,
          start: ev.start,
          end: ev.end,
          backgroundColor: rgbaFromHex(accent, 0.14),
          borderColor: rgbaFromHex(accent, 0.45),
          textColor: '#1e293b',
          classNames: ['cc-fc-event'],
          extendedProps: { block: ev.rawBlock, accent },
        };
      }),
    [events]
  );

  const canEditGrid = view === 'WEEK' || view === 'DAY';

  function openCreate(start, end, contextSpan = 'exact') {
    setSlotContext(computeScheduleSlotContext(blocks, items, start, end, contextSpan));
    setModalMode('create');
    setEditingBlock(null);
    setModalInitialStart(start);
    setModalInitialEnd(end);
    setModalOpen(true);
  }

  function openEdit(block) {
    setSlotContext(null);
    setModalMode('edit');
    setEditingBlock(block);
    setModalInitialStart(null);
    setModalInitialEnd(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingBlock(null);
    setSlotContext(null);
  }

  async function persistEventMove(block, start, end) {
    const plannedMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
    const plannedStartAt = formatLocalDateTime(start);
    const plannedEndAt = formatLocalDateTime(end);
    if (!plannedStartAt || !plannedEndAt) throw new Error('Vigane aeg');

    if (block.kind === 'MANUAL_BUFFER') {
      await api(`/curriculum-version-time-buffer/${block.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          id: block.id,
          plannedStartAt,
          plannedEndAt,
          plannedMinutes,
          status: block.status || 'PLANNED',
          bufferNotes: block.notes || block.label || 'Puhver',
        }),
      });
    } else {
      if (block.curriculumItemId) {
        const gate = validateStrictParentWindow(block.curriculumItemId, start, end, items, blocks);
        if (!gate.ok) throw new Error(gate.message || 'Aeg väljaspool vanema akent');
      }
      await schedule.update(block.id, {
        plannedStartAt,
        plannedEndAt,
        plannedMinutes,
        status: block.status,
        scheduleNotes: block.notes || '',
      });
    }
  }

  async function handleEventDrop(info) {
    const block = info.event.extendedProps.block;
    if (!block) {
      info.revert();
      return;
    }
    const start = info.event.start;
    const end = info.event.end;
    if (!start || !end) {
      info.revert();
      return;
    }
    try {
      await persistEventMove(block, start, end);
      await refreshBlocks();
    } catch {
      info.revert();
    }
  }

  async function handleEventResize(info) {
    const block = info.event.extendedProps.block;
    if (!block) {
      info.revert();
      return;
    }
    const start = info.event.start;
    const end = info.event.end;
    if (!start || !end) {
      info.revert();
      return;
    }
    try {
      await persistEventMove(block, start, end);
      await refreshBlocks();
    } catch {
      info.revert();
    }
  }

  function handleSelect(info) {
    const start = info.start;
    const end = info.end;
    if (!start || !end) return;
    /** FullCalendar timeGrid select end is exclusive — use as planned end instant */
    openCreate(start, end);
    const calApi = info.view.calendar;
    calApi.unselect();
  }

  function shiftAnchor(dir) {
    if (view === 'DAY') setAnchorDate((d) => addDays(d, dir));
    else if (view === 'WEEK') setAnchorDate((d) => addDays(d, dir * 7));
    else if (view === 'GANTT') setAnchorDate((d) => addDays(d, dir * 30));
    else if (view === 'MONTH') setAnchorDate((d) => addMonths(d, dir));
    else setAnchorDate((d) => addYears(d, dir));
  }

  function goToday() {
    setAnchorDate(new Date());
  }

  return (
    <div className="cc-shell">
      <div className="cc-toolbar">
        <div className="cc-toolbar-left">
          <button type="button" className="cc-btn" onClick={goToday}>
            Today
          </button>
          <div className="cc-nav">
            <button type="button" className="cc-btn-icon" onClick={() => shiftAnchor(-1)} aria-label="Previous">
              ‹
            </button>
            <button type="button" className="cc-btn-icon" onClick={() => shiftAnchor(1)} aria-label="Next">
              ›
            </button>
          </div>
          <h2 className="cc-title">{rangeTitle(view, anchorDate)}</h2>
        </div>

        <div className="cc-view-switch">
          {[
            { id: 'YEAR', label: 'Year' },
            { id: 'MONTH', label: 'Month' },
            { id: 'WEEK', label: 'Week' },
            { id: 'DAY', label: 'Day' },
            { id: 'GANTT', label: 'Riba' },
          ].map((v) => (
            <button key={v.id} type="button" className={cn('cc-switch-btn', view === v.id && 'active')} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view !== 'GANTT' && (
        <div className="cc-hint">
          Sama päeva võib ajastada mitu moodulit, ÕV-d ja tegevust (eraldi kirjed). Nädal / päev: vali ajavahemik ka olemasolevate sündmuste peal või kõrval. Kuu / aasta:
          klõpsa päeval. Olemasolev sündmus: klõpsa ja muuda.
        </div>
      )}
      {view === 'GANTT' && (
        <div className="cc-hint">
          Ajariba: keri horisontaalselt, suumi; hallad nooled näitavad struktuuri (laps → vanem). Märgi „RDF seosed“, et kuvada semantilised seosed (värviline legend).
        </div>
      )}

      {loading && <div className="cc-status">Laen kalendrit…</div>}
      {!loading && error && <div className="cc-status cc-error">{error}</div>}

      {!loading && !error && (
        <>
          {view === 'YEAR' && (
            <div className="cc-year-grid">
              {Array.from({ length: 12 }).map((_, idx) => (
                <YearMiniMonth
                  key={idx}
                  monthDate={new Date(anchorDate.getFullYear(), idx, 1)}
                  eventsByDay={eventsByDay}
                  onDayClick={(d) => {
                    const { start, end } = defaultDayRange(d);
                    openCreate(start, end, 'fullDay');
                  }}
                />
              ))}
            </div>
          )}

          {view === 'MONTH' && (
            <MonthGrid
              anchorDate={anchorDate}
              eventsByDay={eventsByDay}
              onDayClick={(d) => {
                const { start, end } = defaultDayRange(d);
                openCreate(start, end, 'fullDay');
              }}
              onEventClick={(ev) => openEdit(ev.rawBlock)}
            />
          )}

          {view === 'GANTT' && (
            <CurriculumGantt
              blocks={blocks}
              items={items}
              relations={relations}
              anchorDate={anchorDate}
              onBlockClick={(b) => openEdit(b)}
              typeToColor={(t) => typeToColor(t)}
            />
          )}

          {(view === 'WEEK' || view === 'DAY') && (
            <div className="cc-timegrid-wrap">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={view === 'WEEK' ? 'timeGridWeek' : 'timeGridDay'}
                headerToolbar={false}
                height="auto"
                events={fullCalendarEvents}
                nowIndicator
                editable={canEditGrid}
                selectable={canEditGrid}
                selectMirror
                selectOverlap
                slotEventOverlap={false}
                slotMinHeight={44}
                eventContent={renderFcEventContent}
                select={handleSelect}
                eventClick={(info) => {
                  info.jsEvent.preventDefault();
                  const block = info.event.extendedProps.block;
                  if (block) openEdit(block);
                }}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                eventStartEditable={canEditGrid}
                eventDurationEditable={canEditGrid}
                droppable={false}
                allDaySlot={false}
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                firstDay={1}
                dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
                slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                weekends
                initialDate={anchorDate}
                key={`${view}-${anchorDate.toISOString()}`}
              />
            </div>
          )}
        </>
      )}

      <GoogleScheduleModal
        open={modalOpen}
        onClose={closeModal}
        curriculumVersionId={curriculumVersionId}
        items={items}
        blocks={blocks}
        mode={modalMode}
        initialStart={modalInitialStart}
        initialEnd={modalInitialEnd}
        editingBlock={editingBlock}
        onSaved={refreshBlocks}
        slotContext={slotContext}
      />
    </div>
  );
}
