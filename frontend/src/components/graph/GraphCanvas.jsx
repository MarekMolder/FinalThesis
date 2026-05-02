import { useEffect, useMemo, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import dagre from 'cytoscape-dagre';
import { graphStylesheet, layoutOptions } from './graphStyles';

cytoscape.use(fcose);
cytoscape.use(dagre);

/**
 * Pure presentation: receives nodes, edges, layoutName, hiddenEdgeKinds, onSelect.
 * The parent owns mutation; this component reflects props.
 */
export default function GraphCanvas({ nodes, edges, layoutName = 'fcose', hiddenNodeKinds, hiddenEdgeKinds, onSelect, onCanvasReady }) {
  const cyRef = useRef(null);

  const elements = useMemo(() => {
    const isNodeHidden = (n) => hiddenNodeKinds && hiddenNodeKinds.has(n.kind);
    const ns = (nodes || []).map((n) => ({
      data: {
        id: n.id,
        kind: n.kind,
        type: n.type,
        label: n.label || '',
        externalIri: n.externalIri || null,
        metadata: n.metadata || {},
      },
      classes: isNodeHidden(n) ? 'hidden' : '',
    }));
    const nodeById = new Map((nodes || []).map((n) => [n.id, n]));
    const es = (edges || [])
      .filter((e) => nodeById.has(e.sourceId) && nodeById.has(e.targetId))
      .map((e, i) => {
        const srcHidden = isNodeHidden(nodeById.get(e.sourceId));
        const tgtHidden = isNodeHidden(nodeById.get(e.targetId));
        const edgeKindHidden = hiddenEdgeKinds && hiddenEdgeKinds.has(e.kind);
        const hide = srcHidden || tgtHidden || edgeKindHidden;
        return {
          data: {
            id: `${e.sourceId}->${e.targetId}|${e.kind}|${i}`,
            source: e.sourceId,
            target: e.targetId,
            kind: e.kind,
            label: e.label || '',
          },
          classes: hide ? 'hidden' : '',
        };
      });
    return [...ns, ...es];
  }, [nodes, edges, hiddenNodeKinds, hiddenEdgeKinds]);

  // Re-run layout whenever the element set or layout choice changes.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const layout = cy.layout(layoutOptions[layoutName] || layoutOptions.fcose);
    layout.run();
  }, [elements, layoutName]);

  return (
    <CytoscapeComponent
      cy={(cy) => {
        cyRef.current = cy;
        if (onCanvasReady) onCanvasReady(cy);
        cy.removeListener('tap');
        cy.on('tap', 'node', (evt) => {
          if (onSelect) onSelect(evt.target.data());
        });
        cy.on('tap', (evt) => {
          if (evt.target === cy && onSelect) onSelect(null);
        });
      }}
      elements={elements}
      stylesheet={graphStylesheet}
      style={{ width: '100%', height: '100%' }}
      layout={layoutOptions[layoutName] || layoutOptions.fcose}
      wheelSensitivity={0.2}
    />
  );
}
