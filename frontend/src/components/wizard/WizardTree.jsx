import TreeNode from './TreeNode';

export default function WizardTree({ items, mode, scheduleMap, onEdit, onDelete, onAddChild, onImport, renderExtraButtons }) {
  const roots = buildTree(items, scheduleMap ?? {});

  if (roots.length === 0) {
    return (
      <div className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-12 text-sm text-slate-400 dark:text-slate-500">
        Õppekava on tühi. Lisa esimene element ülalt.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {roots.map((node) => renderNode(node, 0, mode, scheduleMap ?? {}, items, onEdit, onDelete, onAddChild, onImport, renderExtraButtons))}
    </div>
  );
}

function renderNode(node, depth, mode, scheduleMap, allItems, onEdit, onDelete, onAddChild, onImport, renderExtraButtons) {
  return (
    <TreeNode
      key={node.item.id}
      item={node.item}
      allItems={allItems}
      depth={depth}
      mode={mode}
      scheduleInfo={scheduleMap[node.item.id] ?? null}
      onEdit={onEdit}
      onDelete={onDelete}
      onAddChild={onAddChild}
      onImport={onImport}
      renderExtraButtons={renderExtraButtons}
    >
      {node.children.length > 0
        ? node.children.map((child) => renderNode(child, depth + 1, mode, scheduleMap, allItems, onEdit, onDelete, onAddChild, onImport, renderExtraButtons))
        : null}
    </TreeNode>
  );
}

function buildTree(items, scheduleMap) {
  const map = {};
  items.forEach((item) => { map[item.id] = { item, children: [] }; });
  const roots = [];
  items.forEach((item) => {
    if (item.parentItemId && map[item.parentItemId]) {
      map[item.parentItemId].children.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });
  const sort = (nodes) => {
    nodes.sort((a, b) => {
      // TEST items always at the bottom within their parent
      const aIsTest = a.item.type === 'TEST';
      const bIsTest = b.item.type === 'TEST';
      if (aIsTest !== bIsTest) return aIsTest ? 1 : -1;

      const schedA = scheduleMap[a.item.id];
      const schedB = scheduleMap[b.item.id];
      if (schedA?.plannedStartAt && schedB?.plannedStartAt) {
        return schedA.plannedStartAt < schedB.plannedStartAt ? -1
             : schedA.plannedStartAt > schedB.plannedStartAt ? 1 : 0;
      }
      if (schedA?.plannedStartAt) return -1;
      if (schedB?.plannedStartAt) return 1;
      return (a.item.orderIndex ?? 0) - (b.item.orderIndex ?? 0);
    });
    nodes.forEach((n) => sort(n.children));
    return nodes;
  };
  return sort(roots);
}
