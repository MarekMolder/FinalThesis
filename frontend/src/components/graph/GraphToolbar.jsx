const NODE_KINDS = [
  { key: 'OWN_ITEM', label: 'Sinu itemid', colour: '#0369a1' },
  { key: 'GRAPH_ITEM', label: 'Graafi naabrid', colour: '#fcd9c0' },
];

const EDGE_KINDS = [
  { key: 'PARENT_CHILD', label: 'Lapse-vanema seos', colour: '#94a3b8' },
  { key: 'INTERNAL_RELATION', label: 'Sisemine seos', colour: '#2563eb' },
  { key: 'GRAPH_REQUIRES', label: 'eeldab', colour: '#dc2626' },
  { key: 'GRAPH_REQUIRED_BY', label: 'on eelduseks', colour: '#ea580c' },
  { key: 'GRAPH_CONSISTS_OF', label: 'koosneb', colour: '#16a34a' },
  { key: 'GRAPH_PART_OF', label: 'on osaks', colour: '#65a30d' },
  { key: 'GRAPH_USES', label: 'kasutab', colour: '#7c3aed' },
  { key: 'GRAPH_RELATED_LO', label: 'seotud õpiväljund', colour: '#0d9488' },
  { key: 'GRAPH_CONTAINS_KNOBIT', label: 'sisaldab knobitit', colour: '#ca8a04' },
  { key: 'GRAPH_HAS_THEME', label: 'seotud teema', colour: '#0891b2' },
  { key: 'GRAPH_BELONGS_TO_MODULE', label: 'seotud moodul', colour: '#6366f1' },
  { key: 'GRAPH_BELONGS_TO_CURRICULUM', label: 'seotud õppekava', colour: '#be185d' },
];

export default function GraphToolbar({
  layoutName,
  onLayoutChange,
  hiddenNodeKinds,
  onToggleNodeKind,
  hiddenEdgeKinds,
  onToggleEdgeKind,
  onFit,
  fullscreen,
  onToggleFullscreen,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <label className="text-xs font-medium text-slate-600">Paigutus:</label>
      <select
        value={layoutName}
        onChange={(e) => onLayoutChange(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
      >
        <option value="fcose">fcose (jõud)</option>
        <option value="dagre">dagre (hierarhia)</option>
        <option value="grid">võrk</option>
        <option value="circle">ring</option>
      </select>

      <span className="mx-2 h-5 w-px bg-slate-200" />

      <label className="text-xs font-medium text-slate-600">Tipud:</label>
      {NODE_KINDS.map((k) => (
        <label key={k.key} className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={!hiddenNodeKinds.has(k.key)}
            onChange={() => onToggleNodeKind(k.key)}
          />
          <span style={{ color: k.colour }}>{k.label}</span>
        </label>
      ))}

      <span className="mx-2 h-5 w-px bg-slate-200" />

      <label className="text-xs font-medium text-slate-600">Servad:</label>
      {EDGE_KINDS.map((k) => (
        <label key={k.key} className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={!hiddenEdgeKinds.has(k.key)}
            onChange={() => onToggleEdgeKind(k.key)}
          />
          <span style={{ color: k.colour }}>{k.label}</span>
        </label>
      ))}

      <span className="mx-2 h-5 w-px bg-slate-200" />

      <button
        type="button"
        onClick={onFit}
        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-100"
      >
        Mahuta
      </button>
      <button
        type="button"
        onClick={onToggleFullscreen}
        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-100"
      >
        {fullscreen ? 'Sulge täisekraan' : 'Täisekraan'}
      </button>
    </div>
  );
}
