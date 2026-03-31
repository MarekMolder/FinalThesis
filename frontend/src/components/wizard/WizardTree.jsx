import TreeNode from './TreeNode';

export default function WizardTree({ items, mode, onEdit, onDelete, onAddChild, onImport, renderExtraButtons }) {
  const roots = buildTree(items);

  if (roots.length === 0) {
    return (
      <div className="mt-4 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-sm text-slate-400">
        Õppekava on tühi. Lisa esimene element ülalt.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {roots.map((node) => renderNode(node, 0, mode, onEdit, onDelete, onAddChild, onImport, renderExtraButtons))}
    </div>
  );
}

function renderNode(node, depth, mode, onEdit, onDelete, onAddChild, onImport, renderExtraButtons) {
  return (
    <TreeNode
      key={node.item.id}
      item={node.item}
      depth={depth}
      mode={mode}
      onEdit={onEdit}
      onDelete={onDelete}
      onAddChild={onAddChild}
      onImport={onImport}
      renderExtraButtons={renderExtraButtons}
    >
      {node.children.length > 0
        ? node.children.map((child) => renderNode(child, depth + 1, mode, onEdit, onDelete, onAddChild, onImport, renderExtraButtons))
        : null}
    </TreeNode>
  );
}

function buildTree(items) {
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
    nodes.sort((a, b) => (a.item.orderIndex ?? 0) - (b.item.orderIndex ?? 0));
    nodes.forEach((n) => sort(n.children));
    return nodes;
  };
  return sort(roots);
}
