// Cytoscape stylesheet for the knowledge graph explorer.
//   - Node colour encodes the curriculum item type (module / topic / LO / task / test / material / knobit / ...).
//   - Node kind (OWN_ITEM vs GRAPH_ITEM) controls border + size + saturation.

export const TYPE_COLOURS = {
  module:            { own: '#6366f1', graph: '#c7d2fe', label: 'moodul' },
  topic:             { own: '#0ea5e9', graph: '#bae6fd', label: 'teema' },
  learning_outcome:  { own: '#16a34a', graph: '#bbf7d0', label: 'õpiväljund' },
  task:              { own: '#f97316', graph: '#fed7aa', label: 'ülesanne' },
  test:              { own: '#dc2626', graph: '#fecaca', label: 'test' },
  learning_material: { own: '#2563eb', graph: '#bfdbfe', label: 'õppematerjal' },
  knobit:            { own: '#ca8a04', graph: '#fde68a', label: 'knobit' },
  theme:             { own: '#0891b2', graph: '#a5f3fc', label: 'teema (graaf)' },
  curriculum:        { own: '#be185d', graph: '#fbcfe8', label: 'õppekava (graaf)' },
  default:           { own: '#475569', graph: '#e2e8f0', label: 'muu' },
};

const ownTypeRules = Object.entries(TYPE_COLOURS).flatMap(([type, c]) => [
  {
    selector: `node[kind = "OWN_ITEM"][type = "${type}"]`,
    style: { 'background-color': c.own, 'border-color': c.own },
  },
  {
    selector: `node[kind = "GRAPH_ITEM"][type = "${type}"]`,
    style: { 'background-color': c.graph, 'border-color': c.own },
  },
]);

export const graphStylesheet = [
  // Default node — applies to all, type-specific colours layer on top.
  {
    selector: 'node',
    style: {
      width: 28,
      height: 28,
      'border-width': 2,
      'border-color': '#475569',
      'background-color': '#cbd5e1',
      'color': '#0f172a',
      'label': 'data(label)',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'font-size': 9,
      'text-margin-y': 4,
      'text-wrap': 'ellipsis',
      'text-max-width': 110,
    },
  },
  // OWN_ITEM — slightly bigger, thicker border.
  {
    selector: 'node[kind = "OWN_ITEM"]',
    style: {
      width: 34,
      height: 34,
      'border-width': 3,
      'font-size': 10,
      'font-weight': 'bold',
    },
  },
  // GRAPH_ITEM — smaller, dashed border to read as "from outside".
  {
    selector: 'node[kind = "GRAPH_ITEM"]',
    style: {
      width: 22,
      height: 22,
      'border-width': 2,
      'border-style': 'dashed',
      'font-size': 9,
      'font-style': 'italic',
    },
  },
  // Type-specific colours (OWN + GRAPH variants).
  ...ownTypeRules,
  // Selected
  {
    selector: 'node:selected',
    style: { 'border-color': '#f59e0b', 'border-width': 4 },
  },
  // Edges by kind
  {
    selector: 'edge',
    style: {
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle',
      'width': 1.5,
      'arrow-scale': 0.8,
    },
  },
  {
    selector: 'edge[kind = "PARENT_CHILD"]',
    style: {
      'line-color': '#94a3b8',
      'target-arrow-color': '#94a3b8',
      'width': 2,
    },
  },
  {
    selector: 'edge[kind = "INTERNAL_RELATION"]',
    style: {
      'line-color': '#2563eb',
      'target-arrow-color': '#2563eb',
      'width': 2,
    },
  },
  {
    selector: 'edge[kind = "GRAPH_REQUIRES"]',
    style: {
      'line-color': '#dc2626',
      'line-style': 'dashed',
      'target-arrow-color': '#dc2626',
    },
  },
  {
    selector: 'edge[kind = "GRAPH_REQUIRED_BY"]',
    style: {
      'line-color': '#ea580c',
      'line-style': 'dashed',
      'target-arrow-color': '#ea580c',
    },
  },
  {
    selector: 'edge[kind = "GRAPH_CONSISTS_OF"]',
    style: {
      'line-color': '#16a34a',
      'target-arrow-color': '#16a34a',
      'target-arrow-shape': 'tee',
      'width': 2.5,
    },
  },
  {
    selector: 'edge[kind = "GRAPH_PART_OF"]',
    style: {
      'line-color': '#65a30d',
      'target-arrow-color': '#65a30d',
      'target-arrow-shape': 'tee',
    },
  },
  {
    selector: 'edge[kind = "GRAPH_USES"]',
    style: {
      'line-color': '#7c3aed',
      'line-style': 'dotted',
      'target-arrow-color': '#7c3aed',
    },
  },
  {
    selector: 'edge[kind = "GRAPH_RELATED_LO"]',
    style: {
      'line-color': '#0d9488',
      'line-style': 'dashed',
      'target-arrow-color': '#0d9488',
    },
  },
  {
    selector: 'edge[kind = "GRAPH_CONTAINS_KNOBIT"]',
    style: {
      'line-color': '#ca8a04',
      'target-arrow-color': '#ca8a04',
    },
  },
  {
    selector: 'edge[kind = "GRAPH_HAS_THEME"]',
    style: {
      'line-color': '#0891b2',
      'line-style': 'dotted',
      'target-arrow-color': '#0891b2',
    },
  },
  {
    selector: 'edge[kind = "GRAPH_BELONGS_TO_MODULE"]',
    style: {
      'line-color': '#6366f1',
      'line-style': 'dotted',
      'target-arrow-color': '#6366f1',
    },
  },
  {
    selector: 'edge[kind = "GRAPH_BELONGS_TO_CURRICULUM"]',
    style: {
      'line-color': '#be185d',
      'line-style': 'dotted',
      'target-arrow-color': '#be185d',
    },
  },
  // Hidden by edge filter
  { selector: '.hidden', style: { display: 'none' } },
];

export const layoutOptions = {
  fcose: { name: 'fcose', animate: true, randomize: true, fit: true, padding: 40, nodeRepulsion: 6500, idealEdgeLength: 80 },
  dagre: { name: 'dagre', animate: true, fit: true, padding: 40, rankDir: 'TB', nodeSep: 30, rankSep: 70 },
  grid: { name: 'grid', animate: true, fit: true, padding: 40 },
  circle: { name: 'circle', animate: true, fit: true, padding: 40 },
};
