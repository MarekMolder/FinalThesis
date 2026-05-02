import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { graphExplorer } from '../../api';
import GraphCanvas from './GraphCanvas';
import GraphToolbar from './GraphToolbar';
import GraphSidebar from './GraphSidebar';
import GraphLegend from './GraphLegend';
import AddGraphItemDialog from './AddGraphItemDialog';

export default function GraphExplorerView({ curriculumId, versionId, onOpenInEditor }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [importTarget, setImportTarget] = useState(null);
  const [layoutName, setLayoutName] = useState('fcose');
  const [hiddenNodeKinds, setHiddenNodeKinds] = useState(() => new Set());
  const [hiddenEdgeKinds, setHiddenEdgeKinds] = useState(() => new Set());
  const [toast, setToast] = useState(null);
  const cyRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const fullscreen = searchParams.get('fullscreen') === 'true';

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function expandNode(iri) {
    if (!iri) return;
    const knownIris = nodes
      .filter((n) => n.kind === 'GRAPH_ITEM' && n.externalIri)
      .map((n) => n.externalIri);
    try {
      const data = await graphExplorer.expand(iri, knownIris);
      if (!data?.nodes?.length) {
        showToast('Naabrid juba kuvatud');
        return;
      }
      setNodes((prev) => [...prev, ...data.nodes]);
      setEdges((prev) => [...prev, ...data.edges]);
    } catch (e) {
      showToast(`Naabrite laadimine ebaõnnestus: ${e.message}`);
    }
  }

  useEffect(() => {
    if (!curriculumId || !versionId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    graphExplorer.get(curriculumId, versionId)
      .then((data) => {
        if (cancelled) return;
        setNodes(data?.nodes || []);
        setEdges(data?.edges || []);
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [curriculumId, versionId]);

  function toggleEdgeKind(kind) {
    setHiddenEdgeKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  function toggleNodeKind(kind) {
    setHiddenNodeKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  function fitView() {
    cyRef.current?.fit(undefined, 40);
  }

  function toggleFullscreen() {
    const next = new URLSearchParams(searchParams);
    if (fullscreen) next.delete('fullscreen');
    else next.set('fullscreen', 'true');
    setSearchParams(next, { replace: false });
  }

  function hideNeighboursOf(node) {
    if (!node) return;
    const neighbourIds = new Set();
    edges.forEach((e) => {
      if (e.sourceId === node.id) neighbourIds.add(e.targetId);
      if (e.targetId === node.id) neighbourIds.add(e.sourceId);
    });
    setNodes((prev) => prev.filter((n) => !(n.kind === 'GRAPH_ITEM' && neighbourIds.has(n.id))));
    setEdges((prev) => prev.filter((e) => !(neighbourIds.has(e.sourceId) || neighbourIds.has(e.targetId))));
  }

  const containerCls = fullscreen
    ? 'fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-slate-950'
    : 'relative flex h-[calc(100vh-12rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900';

  return (
    <div className={containerCls}>
      <div className="px-3 pt-3">
        <GraphToolbar
          layoutName={layoutName}
          onLayoutChange={setLayoutName}
          hiddenNodeKinds={hiddenNodeKinds}
          onToggleNodeKind={toggleNodeKind}
          hiddenEdgeKinds={hiddenEdgeKinds}
          onToggleEdgeKind={toggleEdgeKind}
          onFit={fitView}
          fullscreen={fullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
      {!loading && !error && nodes.length > 200 && (
        <div className="mx-3 mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Graph on suur, paigutus võib võtta paar sekundit.
        </div>
      )}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          {loading && <div className="p-6 text-sm text-slate-500">Laen graafi…</div>}
          {error && (
            <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}
          {!loading && !error && nodes.length === 0 && (
            <div className="m-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Pole itemeid. Lisa esimene item alustamiseks.
            </div>
          )}
          {!loading && !error && nodes.length > 0 && (
            <div className="relative h-full w-full">
              <GraphCanvas
                nodes={nodes}
                edges={edges}
                layoutName={layoutName}
                hiddenNodeKinds={hiddenNodeKinds}
                hiddenEdgeKinds={hiddenEdgeKinds}
                onSelect={setSelected}
                onCanvasReady={(cy) => { cyRef.current = cy; }}
              />
              <GraphLegend />
            </div>
          )}
        </div>
        <GraphSidebar
          selected={selected}
          onClose={() => setSelected(null)}
          onOpenInEditor={(itemId) => { if (onOpenInEditor) onOpenInEditor(itemId); }}
          onHideNeighbours={() => hideNeighboursOf(selected)}
          onAddToCurriculum={() => setImportTarget(selected)}
          onExpand={expandNode}
        />
      </div>
      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
          {toast}
        </div>
      )}
      <AddGraphItemDialog
        open={!!importTarget}
        graphNode={importTarget}
        curriculumVersionId={versionId}
        ownNodes={nodes}
        onClose={() => setImportTarget(null)}
        onCreated={(created, originalNode) => {
          const newId = created.id;
          setNodes((prev) => prev.map((n) =>
            n.id === originalNode.id
              ? { ...n, id: newId, kind: 'OWN_ITEM', metadata: { ...(n.metadata || {}) } }
              : n
          ));
          setEdges((prev) => prev.map((e) => ({
            ...e,
            sourceId: e.sourceId === originalNode.id ? newId : e.sourceId,
            targetId: e.targetId === originalNode.id ? newId : e.targetId,
          })));
          setImportTarget(null);
        }}
      />
    </div>
  );
}
