import { useMemo, useState } from 'react';

function GraphLink({ url }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="Ava oppekava.edu.ee lehel"
      className="flex-shrink-0 rounded p-0.5 text-sky-500 hover:bg-sky-50 hover:text-sky-700"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>
  );
}

const TABS = [
  { key: 'all', label: 'Kõik' },
  { key: 'themes', label: 'Teemad' },
  { key: 'los', label: 'Õpiväljundid' },
  { key: 'modules', label: 'Moodulid' },
];

export default function ImportPanel({ catalogJson, existingExternalIris, onImport, onClose }) {
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [expandedThemes, setExpandedThemes] = useState(new Set());

  if (!catalogJson) {
    return (
      <PanelShell onClose={onClose}>
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-slate-300">
            <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" strokeLinecap="round"/>
          </svg>
          <p className="text-sm text-slate-400 text-center px-4">Graafist ei leitud kataloogi.<br/>Kontrolli metaandmeid (Step 1).</p>
        </div>
      </PanelShell>
    );
  }

  const themes = catalogJson.themes ?? [];
  const allLos = catalogJson.learningOutcomes ?? [];
  const modules = catalogJson.modules ?? [];

  const q = search.toLowerCase().trim();

  const filteredThemes = useMemo(() => {
    if (tab === 'los' || tab === 'modules') return [];
    return themes.filter((t) => {
      if (!q) return true;
      const nameMatch = (t.title ?? '').toLowerCase().includes(q);
      const loMatch = (t.learningOutcomes ?? []).some((lo) => (lo.title ?? '').toLowerCase().includes(q));
      return nameMatch || loMatch;
    });
  }, [themes, q, tab]);

  const filteredLos = useMemo(() => {
    if (tab === 'themes' || tab === 'modules') return [];
    return allLos.filter((lo) => !q || (lo.title ?? '').toLowerCase().includes(q));
  }, [allLos, q, tab]);

  const filteredModules = useMemo(() => {
    if (tab === 'themes' || tab === 'los') return [];
    return modules.filter((m) => {
      if (!q) return true;
      return (m.title ?? '').toLowerCase().includes(q) || (m.curriculum ?? '').toLowerCase().includes(q);
    });
  }, [modules, q, tab]);

  function toggle(key) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleTheme(theme) {
    const key = theme.fullUrl ?? theme.title;
    const loKeys = (theme.learningOutcomes ?? []).map((lo) => lo.fullUrl ?? lo.title);
    const allSelected = [key, ...loKeys].every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        next.delete(key);
        loKeys.forEach((k) => next.delete(k));
      } else {
        next.add(key);
        loKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  }

  function handleImport() {
    const nodes = [];

    const loKeysInThemes = new Set();
    themes.forEach((theme) => {
      (theme.learningOutcomes ?? []).forEach((lo) => {
        if (lo.fullUrl) loKeysInThemes.add(lo.fullUrl);
        if (lo.title) loKeysInThemes.add(lo.title);
      });
    });

    themes.forEach((theme) => {
      const themeKey = theme.fullUrl ?? theme.title;
      const themeLos = theme.learningOutcomes ?? [];

      if (selected.has(themeKey)) {
        nodes.push({
          type: 'TOPIC', title: theme.title, externalIri: theme.fullUrl,
          children: themeLos.map((lo) => ({ type: 'LEARNING_OUTCOME', title: lo.title, externalIri: lo.fullUrl, children: [] })),
        });
        return;
      }

      const selectedLos = themeLos.filter((lo) => selected.has(lo.fullUrl ?? lo.title));
      if (selectedLos.length > 0) {
        nodes.push({
          type: 'TOPIC', title: theme.title, externalIri: theme.fullUrl,
          children: selectedLos.map((lo) => ({ type: 'LEARNING_OUTCOME', title: lo.title, externalIri: lo.fullUrl, children: [] })),
        });
      }
    });

    allLos.forEach((lo) => {
      const loKey = lo.fullUrl ?? lo.title;
      if (!selected.has(loKey)) return;
      if (loKeysInThemes.has(lo.fullUrl) || loKeysInThemes.has(lo.title)) return;
      nodes.push({ type: 'LEARNING_OUTCOME', title: lo.title, externalIri: lo.fullUrl, children: [] });
    });

    modules.forEach((mod) => {
      if (selected.has(mod.fullUrl ?? mod.title)) {
        nodes.push({ type: 'MODULE', title: mod.title, externalIri: mod.fullUrl, children: [] });
      }
    });

    onImport(nodes);
  }

  const alreadyImported = existingExternalIris ?? new Set();

  function tabCount(key) {
    if (key === 'all') return themes.length + allLos.length + modules.length;
    if (key === 'themes') return themes.length;
    if (key === 'los') return allLos.length;
    if (key === 'modules') return modules.length;
    return 0;
  }

  const noResults = filteredThemes.length === 0 && filteredLos.length === 0 && filteredModules.length === 0;

  return (
    <PanelShell onClose={onClose}>
      {/* Toolbar: search + tabs + actions */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Otsi teema, õpiväljundi või mooduli järgi..."
            className="w-full rounded-xl border border-slate-200/80 bg-white/70 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/40"
          />
        </div>

        <div className="flex gap-1 rounded-xl bg-slate-100/70 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap',
                tab === t.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {t.label} <span className="text-slate-400">({tabCount(t.key)})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs text-slate-500 font-medium">{selected.size} valitud</span>
          <button
            onClick={handleImport}
            disabled={selected.size === 0}
            className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:from-sky-700 hover:to-indigo-700 disabled:opacity-40 transition-all"
          >
            Impordi valitud
          </button>
        </div>
      </div>

      {/* Themes (with nested LOs) */}
      {filteredThemes.map((theme) => {
        const themeKey = theme.fullUrl ?? theme.title;
        const isThemeSel = selected.has(themeKey);
        const isAlreadyImported = alreadyImported.has(themeKey) || alreadyImported.has(theme.title);
        const hasLos = (theme.learningOutcomes ?? []).length > 0;
        const isExpanded = expandedThemes.has(themeKey);
        const visibleLos = !q
          ? (theme.learningOutcomes ?? [])
          : (theme.learningOutcomes ?? []).filter((lo) => (lo.title ?? '').toLowerCase().includes(q));
        return (
          <div key={themeKey} className="mb-2.5 overflow-hidden rounded-2xl border border-violet-100/60 bg-white shadow-sm">
            <div className={['flex items-center gap-2.5 bg-gradient-to-r from-violet-50/80 to-indigo-50/80 px-3.5 py-2.5', isAlreadyImported ? 'opacity-40' : ''].join(' ')}>
              {hasLos && (
                <button
                  type="button"
                  onClick={() => setExpandedThemes((prev) => {
                    const next = new Set(prev);
                    if (next.has(themeKey)) next.delete(themeKey); else next.add(themeKey);
                    return next;
                  })}
                  className="text-violet-400 hover:text-violet-600 flex-shrink-0 transition-colors"
                >
                  <svg className={['h-3.5 w-3.5 transition-transform', isExpanded ? 'rotate-0' : '-rotate-90'].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                </button>
              )}
              <label className="flex flex-1 items-center gap-2.5 cursor-pointer min-w-0">
                <input type="checkbox" checked={isThemeSel} disabled={isAlreadyImported} onChange={() => toggleTheme(theme)} className="h-3.5 w-3.5 accent-violet-600 flex-shrink-0 rounded" />
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 text-[8px] font-bold text-white shadow-sm">T</span>
                <span className="flex-1 truncate text-xs font-semibold text-indigo-900">{theme.title}</span>
              </label>
              {isAlreadyImported && <span className="text-[9px] text-slate-400 flex-shrink-0">Juba imporditud</span>}
              {hasLos && !isAlreadyImported && (
                <span className="rounded-md bg-violet-100/80 px-1.5 py-0.5 text-[9px] font-medium text-violet-600">{theme.learningOutcomes.length} OÕ</span>
              )}
              <GraphLink url={theme.fullUrl} />
            </div>
            {isExpanded && visibleLos.map((lo) => {
              const loKey = lo.fullUrl ?? lo.title;
              const isLoSel = selected.has(loKey);
              const loImported = alreadyImported.has(loKey) || alreadyImported.has(lo.title);
              return (
                <div key={loKey} className={['flex items-center gap-2 px-4 py-2 border-t border-slate-50', loImported ? 'opacity-40' : 'hover:bg-violet-50/30 transition-colors'].join(' ')}>
                  <label className="flex flex-1 items-center gap-2 cursor-pointer min-w-0">
                    <input type="checkbox" checked={isLoSel} disabled={loImported} onChange={() => toggle(loKey)} className="h-3.5 w-3.5 accent-emerald-600 flex-shrink-0 rounded" />
                    <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-emerald-500 text-[7px] font-bold text-white">OÕ</span>
                    <span className="flex-1 text-[11px] text-slate-700 leading-snug">{lo.title}</span>
                  </label>
                  <GraphLink url={lo.fullUrl} />
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Flat Learning Outcomes */}
      {filteredLos.length > 0 && (tab === 'los' || tab === 'all') && (
        <div className={tab === 'all' ? 'mt-3' : ''}>
          {tab === 'all' && (
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Õpiväljundid</div>
          )}
          {filteredLos.map((lo) => {
            const loKey = lo.fullUrl ?? lo.title;
            const isLoSel = selected.has(loKey);
            const loImported = alreadyImported.has(loKey) || alreadyImported.has(lo.title);
            return (
              <div key={loKey} className={['flex items-center gap-2 rounded-xl px-3 py-2 mb-1 border border-transparent', loImported ? 'opacity-40' : 'hover:bg-emerald-50/50 hover:border-emerald-100/60 transition-colors'].join(' ')}>
                <label className="flex flex-1 items-center gap-2 cursor-pointer min-w-0">
                  <input type="checkbox" checked={isLoSel} disabled={loImported} onChange={() => toggle(loKey)} className="h-3.5 w-3.5 accent-emerald-600 flex-shrink-0 rounded" />
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-emerald-500 text-[7px] font-bold text-white">OÕ</span>
                  <span className="flex-1 text-[11px] text-slate-700 leading-snug">{lo.title}</span>
                </label>
                <GraphLink url={lo.fullUrl} />
              </div>
            );
          })}
        </div>
      )}

      {/* Modules */}
      {filteredModules.length > 0 && (tab === 'modules' || tab === 'all') && (
        <div className={tab === 'all' ? 'mt-3' : ''}>
          {tab === 'all' && (
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Moodulid</div>
          )}
          {filteredModules.map((mod) => {
            const modKey = mod.fullUrl ?? mod.title;
            const isModSel = selected.has(modKey);
            const modImported = alreadyImported.has(modKey) || alreadyImported.has(mod.title);
            return (
              <div key={modKey} className={['flex items-center gap-2 rounded-xl px-3 py-2 mb-1 border border-transparent', modImported ? 'opacity-40' : 'hover:bg-sky-50/50 hover:border-sky-100/60 transition-colors'].join(' ')}>
                <label className="flex flex-1 items-center gap-2 cursor-pointer min-w-0">
                  <input type="checkbox" checked={isModSel} disabled={modImported} onChange={() => toggle(modKey)} className="h-3.5 w-3.5 accent-sky-600 flex-shrink-0 rounded" />
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-sky-600 to-blue-600 text-[8px] font-bold text-white shadow-sm">M</span>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-800">{mod.title}</span>
                    {mod.curriculum && (
                      <span className="block truncate text-[10px] text-slate-400">{mod.curriculum}</span>
                    )}
                  </div>
                </label>
                {modImported && <span className="text-[9px] text-slate-400 flex-shrink-0">Juba imporditud</span>}
                <GraphLink url={mod.fullUrl} />
              </div>
            );
          })}
        </div>
      )}

      {noResults && (
        <div className="flex items-center justify-center py-10 text-xs text-slate-400">
          Otsingutulemusi ei leitud
        </div>
      )}
    </PanelShell>
  );
}

function PanelShell({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex w-[90vw] max-w-[900px] flex-col rounded-3xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-xl overflow-hidden"
        style={{ maxHeight: '88vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100/80 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <div>
              <div className="text-base font-semibold text-slate-800">Impordi graafist</div>
              <div className="text-xs text-slate-500">oppekava.edu.ee</div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
