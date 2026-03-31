import { useEffect, useMemo, useRef, useState } from 'react';

const TYPE_LABELS = {
  MODULE: 'Moodul',
  TOPIC: 'Teema',
  LEARNING_OUTCOME: 'Õpiväljund',
  TASK: 'Ülesanne',
  TEST: 'Test',
  LEARNING_MATERIAL: 'Õppematerjal',
  KNOBIT: 'Knobit',
};

export default function ItemFormModal({ item, type, parentItem, onSave, onClose, noOverlay, verbs }) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [notation, setNotation] = useState(item?.notation ?? '');
  const [verbIri, setVerbIri] = useState(item?.verbIri ?? '');
  const [isMandatory, setIsMandatory] = useState(item?.isMandatory ?? false);

  const resolvedType = type ?? item?.type ?? 'MODULE';
  const isLO = resolvedType === 'LEARNING_OUTCOME';

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ title, description, type: resolvedType, notation, verbIri, isMandatory });
  }

  const formContent = (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      className={noOverlay
        ? 'w-full rounded-3xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-md p-6'
        : 'w-full max-w-md rounded-3xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-md p-6'}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">
          {item ? 'Muuda' : 'Lisa'} — {TYPE_LABELS[resolvedType]}
        </h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button>
      </div>

      {parentItem && (
        <div className="mb-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 text-xs text-slate-500">
          Vanem: <strong className="text-slate-700">{parentItem.title}</strong>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Pealkiri *</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200/30"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Kirjeldus</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200/30"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Notatsioon</span>
          <input
            value={notation}
            onChange={(e) => setNotation(e.target.value)}
            placeholder="nt LO-9-KEEMIA-01"
            className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200/30"
          />
        </label>

        {isLO && (
          <>
            <VerbComboField
              label="Verb"
              value={verbIri}
              onChange={setVerbIri}
              options={verbs ?? []}
              placeholder="Analüüsib"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="accent-sky-600"
              />
              <span className="text-xs font-medium text-slate-600">Kohustuslik</span>
            </label>
          </>
        )}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white/90"
        >
          Tühista
        </button>
        <button
          type="submit"
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
        >
          {item ? 'Salvesta' : 'Lisa'}
        </button>
      </div>
    </form>
  );

  if (noOverlay) return formContent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      {formContent}
    </div>
  );
}

function graphPageUrl(pageTitle) {
  return `https://oppekava.edu.ee/a/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;
}

function VerbComboField({ label, value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  const filtered = useMemo(() => {
    if (!filter) return options;
    const q = filter.toLowerCase();
    return options.filter((o) => String(o).toLowerCase().includes(q));
  }, [options, filter]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(e) {
    const v = e.target.value;
    setFilter(v);
    onChange(v);
    if (!open && v) setOpen(true);
  }

  function handleSelect(opt) {
    onChange(opt);
    setFilter('');
    setOpen(false);
  }

  const showGraphLink = value && options.includes(value);

  return (
    <div className="flex flex-col gap-1" ref={wrapRef}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="relative">
        <input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={['w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/30', showGraphLink ? 'pr-14' : 'pr-8'].join(' ')}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {showGraphLink && (
            <a
              href={graphPageUrl(value)}
              target="_blank"
              rel="noopener noreferrer"
              title="Ava oppekava.edu.ee lehel"
              className="rounded p-0.5 text-sky-500 hover:bg-sky-50 hover:text-sky-700"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          )}
          {options.length > 0 && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => { setOpen(!open); inputRef.current?.focus(); }}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          )}
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {filtered.map((opt) => (
              <div
                key={opt}
                className={[
                  'flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-sky-50 transition-colors',
                  opt === value ? 'bg-sky-50 text-sky-700 font-medium' : 'text-slate-700',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className="truncate flex-1 text-left"
                >
                  {opt}
                </button>
                <a
                  href={graphPageUrl(opt)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Ava oppekava.edu.ee lehel"
                  className="flex-shrink-0 rounded p-0.5 text-sky-400 hover:text-sky-700"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
