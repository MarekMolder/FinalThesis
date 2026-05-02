import { useState } from 'react';
import { TYPE_COLOURS } from './graphStyles';

const TYPE_ORDER = [
  'module',
  'topic',
  'learning_outcome',
  'task',
  'test',
  'learning_material',
  'knobit',
  'theme',
  'curriculum',
];

const EDGE_LEGEND = [
  { label: 'Lapse-vanema seos', colour: '#94a3b8', style: 'solid' },
  { label: 'Sisemine seos (DB)', colour: '#2563eb', style: 'solid' },
  { label: 'eeldab', colour: '#dc2626', style: 'dashed' },
  { label: 'on eelduseks', colour: '#ea580c', style: 'dashed' },
  { label: 'koosneb / on osa', colour: '#16a34a', style: 'solid' },
  { label: 'on osaks', colour: '#65a30d', style: 'solid' },
  { label: 'kasutab', colour: '#7c3aed', style: 'dotted' },
  { label: 'seotud õpiväljund', colour: '#0d9488', style: 'dashed' },
  { label: 'sisaldab knobitit', colour: '#ca8a04', style: 'solid' },
  { label: 'seotud teema', colour: '#0891b2', style: 'dotted' },
  { label: 'seotud moodul', colour: '#6366f1', style: 'dotted' },
  { label: 'seotud õppekava', colour: '#be185d', style: 'dotted' },
];

export default function GraphLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute bottom-3 left-3 z-10 max-w-xs rounded-xl border border-slate-200 bg-white/90 p-3 text-xs shadow-md backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 font-semibold text-slate-700 dark:text-slate-200"
      >
        <span>Legend</span>
        <span className="text-slate-400">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-2 grid gap-3">
          <div>
            <div className="mb-1 font-medium text-slate-500 dark:text-slate-400">Tüübid</div>
            <ul className="grid grid-cols-1 gap-y-1">
              {TYPE_ORDER.map((t) => {
                const c = TYPE_COLOURS[t];
                if (!c) return null;
                return (
                  <li key={t} className="flex items-center gap-2">
                    <span
                      className="inline-block rounded-full"
                      style={{ width: 12, height: 12, background: c.own, border: `2px solid ${c.own}` }}
                      aria-hidden
                    />
                    <span
                      className="inline-block rounded-full"
                      style={{ width: 10, height: 10, background: c.graph, border: `2px dashed ${c.own}` }}
                      aria-hidden
                    />
                    <span className="text-slate-700 dark:text-slate-200">{c.label}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-1 text-[10px] text-slate-400">
              Vasak ring = sinu item, parem ring = graafi naaber.
            </div>
          </div>
          <div>
            <div className="mb-1 font-medium text-slate-500 dark:text-slate-400">Servad</div>
            <ul className="flex flex-col gap-1">
              {EDGE_LEGEND.map((e) => (
                <li key={e.label} className="flex items-center gap-2">
                  <span
                    className="inline-block"
                    style={{
                      width: 26,
                      height: 0,
                      borderTop: e.style === 'solid' ? `2px solid ${e.colour}` : '0',
                      borderBottom: e.style === 'solid' ? '0' : `2px ${e.style} ${e.colour}`,
                    }}
                  />
                  <span className="text-slate-700 dark:text-slate-200">{e.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
