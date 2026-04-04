import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ai } from '../../api';

function renderMarkdown(text, role) {
  const boldClass = role === 'ai' ? 'font-semibold text-sky-700' : 'font-semibold text-white';
  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];
  let listType = null;
  let key = 0;

  function flushList() {
    if (listBuffer.length === 0) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    const cls = listType === 'ol'
      ? 'list-decimal pl-4 my-1 space-y-0.5'
      : 'list-disc pl-4 my-1 space-y-0.5';
    elements.push(
      <Tag key={key++} className={cls}>
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item, boldClass)}</li>
        ))}
      </Tag>
    );
    listBuffer = [];
    listType = null;
  }

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      elements.push(
        <div key={key++} className="font-bold text-slate-800 dark:text-slate-200 mt-1.5 mb-0.5">
          {renderInline(headingMatch[2], boldClass)}
        </div>
      );
      continue;
    }

    const ulMatch = line.match(/^[\-\*]\s+(.+)$/);
    if (ulMatch) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listBuffer.push(ulMatch[1]);
      continue;
    }

    const olMatch = line.match(/^\d+[\.\)]\s+(.+)$/);
    if (olMatch) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listBuffer.push(olMatch[1]);
      continue;
    }

    flushList();

    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1.5" />);
    } else {
      elements.push(<p key={key++} className="my-0.5">{renderInline(line, boldClass)}</p>);
    }
  }
  flushList();
  return elements;
}

function renderInline(text, boldClass) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className={boldClass}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function ExpandSelect({ label, value, active, options, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return options;
    const q = filter.toLowerCase();
    return options.filter((o) => String(o).toLowerCase().includes(q));
  }, [options, filter]);

  const isChanged = value && value !== active;

  return (
    <div className="flex flex-col gap-0.5" ref={wrapRef}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{label}</span>
        {active && (
          <span className={['text-[9px] rounded px-1.5 py-0.5 font-medium', isChanged ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'].join(' ')}>
            {isChanged ? 'muudetud' : 'aktiivne'}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value); setFilter(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700 px-2.5 py-1.5 pr-7 text-[11px] text-slate-800 dark:text-slate-100 outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200"
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-0.5 max-h-32 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg">
            {filtered.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setFilter(''); setOpen(false); }}
                className={[
                  'block w-full px-2.5 py-1.5 text-left text-[11px] hover:bg-violet-50 transition-colors',
                  opt === value ? 'bg-violet-50 dark:bg-violet-900/40 font-semibold text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300',
                ].join(' ')}
              >
                {opt}
                {opt === active && <span className="ml-1 text-[9px] text-emerald-500">(aktiivne)</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AISidebar({ width, onWidthChange, step, metadata, catalogJson, items, onRefreshCatalog, taxonomyOptions, contentStats }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Tere! Olen valmis aitama õppekava loomisel. Küsi julgelt!' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [expandForm, setExpandForm] = useState(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(width);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (catalogJson) {
      const themeCount = catalogJson.themes?.length ?? 0;
      const loCount = catalogJson.learningOutcomes?.length ?? 0;
      const moduleCount = catalogJson.modules?.length ?? 0;
      const parts = [];
      if (themeCount > 0) parts.push(`**${themeCount} teemat**`);
      if (loCount > 0) parts.push(`**${loCount} õpiväljundit**`);
      if (moduleCount > 0) parts.push(`**${moduleCount} moodulit**`);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Graafist leitud: ${parts.join(', ')}.\n\nSoovitatavad toimingud:`,
          chips: ['Impordi kõik teemad', 'Näita kohustuslikke OÕ-d', 'Soovita struktuuri', 'Laienda graafiparingut'],
        },
      ]);
    }
  }, [catalogJson]);

  useEffect(() => {
    if (step === 3 && contentStats) {
      const parts = [];
      if (contentStats.tasks > 0) parts.push(`**${contentStats.tasks} ülesannet**`);
      if (contentStats.tests > 0) parts.push(`**${contentStats.tests} testi**`);
      if (contentStats.learningMaterials > 0) parts.push(`**${contentStats.learningMaterials} õppematerjali**`);
      if (contentStats.knobits > 0) parts.push(`**${contentStats.knobits} knobitit**`);
      if (parts.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: `Oled nüüd Step 3 — Sisu. Graafist on leitud: ${parts.join(', ')}. Saad neid lisada iga õpiväljundi, teema või mooduli alla.`,
            chips: ['Lisa seotud ülesanded', 'Otsi materjale graafist'],
          },
        ]);
      }
    }
  }, [step, contentStats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onMouseDown = useCallback((e) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startW.current = width;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  useEffect(() => {
    function onMouseMove(e) {
      if (!isResizing.current) return;
      const delta = startX.current - e.clientX;
      const next = Math.max(200, Math.min(600, startW.current + delta));
      onWidthChange(next);
    }
    function onMouseUp() {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onWidthChange]);

  function buildContext() {
    const stepLabel = ['', 'Metaandmed', 'Struktuur', 'Sisu', 'Ajakava'][step] ?? '';
    const parts = [`Praegune samm: ${step} (${stepLabel})`];
    if (metadata?.subjectLabel) parts.push(`Aine: ${metadata.subjectLabel}`);
    if (metadata?.subjectAreaIri) parts.push(`Ainevaldkond: ${metadata.subjectAreaIri}`);
    if (metadata?.grade) parts.push(`Klass: ${metadata.grade}`);
    if (metadata?.schoolLevel) parts.push(`Kooliaste: ${metadata.schoolLevel}`);
    if (metadata?.educationalLevelIri) parts.push(`Haridusaste: ${metadata.educationalLevelIri}`);
    parts.push(`Elemente kokku: ${items.length}`);
    if (catalogJson) {
      const themeCount = catalogJson.themes?.length ?? 0;
      const loCount = catalogJson.learningOutcomes?.length ?? 0;
      const moduleCount = catalogJson.modules?.length ?? 0;
      parts.push(`Graafist leitud ${themeCount} teemat, ${loCount} õpiväljundit ja ${moduleCount} moodulit`);
    }
    if (contentStats) {
      parts.push(`Graafist leitud sisu: ${contentStats.tasks ?? 0} ülesannet, ${contentStats.tests ?? 0} testi, ${contentStats.learningMaterials ?? 0} õppematerjali, ${contentStats.knobits ?? 0} knobitit`);
    }
    return parts.join('. ') + '.';
  }

  async function send(overrideText) {
    const text = overrideText || input.trim();
    if (!text || sending) return;

    const userMsg = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    const apiMessages = [];
    apiMessages.push({ role: 'system', content: `Kontekst: ${buildContext()}` });

    const allMsgs = [...messages, userMsg];
    for (const m of allMsgs) {
      if (m.role === 'user') {
        apiMessages.push({ role: 'user', content: m.text });
      } else if (m.role === 'ai') {
        apiMessages.push({ role: 'assistant', content: m.text });
      }
    }

    try {
      const response = await ai.chat(apiMessages);
      setMessages((prev) => [...prev, { role: 'ai', text: response.reply || 'Vabandust, vastust ei saadud.' }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai', text: `Viga: ${err.message || 'AI teenus pole kättesaadav.'}` }]);
    } finally {
      setSending(false);
    }
  }

  function handleChipClick(chip) {
    if (chip === 'Laienda graafiparingut') {
      setExpandForm({
        subject: metadata?.subjectIri || '',
        schoolLevel: metadata?.schoolLevel || '',
        grade: metadata?.grade || '',
        educationLevel: metadata?.educationalLevelIri || '',
        subjectArea: metadata?.subjectAreaIri || '',
      });
      return;
    }
    send(chip);
  }

  function handleExpandApply() {
    if (!expandForm || !onRefreshCatalog) return;
    const overrides = {};
    if (expandForm.subject) overrides.subject = expandForm.subject;
    if (expandForm.schoolLevel) overrides.schoolLevel = expandForm.schoolLevel;
    if (expandForm.grade) overrides.grade = expandForm.grade;
    if (expandForm.educationLevel) overrides.educationLevel = expandForm.educationLevel;
    if (expandForm.subjectArea) overrides.subjectArea = expandForm.subjectArea;
    onRefreshCatalog(overrides);
    const parts = [];
    if (expandForm.subject) parts.push(`Õppeaine: **${expandForm.subject}**`);
    if (expandForm.schoolLevel) parts.push(`Kooliaste: **${expandForm.schoolLevel}**`);
    if (expandForm.grade) parts.push(`Klass: **${expandForm.grade}**`);
    if (expandForm.educationLevel) parts.push(`Haridusaste: **${expandForm.educationLevel}**`);
    if (expandForm.subjectArea) parts.push(`Ainevaldkond: **${expandForm.subjectArea}**`);
    setMessages((prev) => [...prev, {
      role: 'ai',
      text: `Graafiparingut uuendatud:\n${parts.map((p) => `- ${p}`).join('\n')}\n\nLaen uusi andmeid...`,
    }]);
    setExpandForm(null);
  }

  const stepLabel = ['', 'Metaandmed', 'Struktuur', 'Sisu', 'Ajakava'][step] ?? '';

  return (
    <div
      className="relative flex flex-col rounded-3xl border border-white/60 dark:border-slate-700 bg-white/55 dark:bg-slate-800/80 shadow-sm backdrop-blur-md overflow-hidden flex-shrink-0 min-h-0 h-[calc(100vh-120px)]"
      style={{ width }}
    >
      <div
        onMouseDown={onMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-10 flex items-center justify-center group"
      >
        <div className="h-10 w-1 rounded-full bg-slate-200 group-hover:bg-sky-400 transition-colors" />
      </div>

      <div className="flex items-center gap-2 border-b border-white/50 dark:border-slate-700 px-4 py-3 pl-5">
        <span className={['h-2.5 w-2.5 rounded-full flex-shrink-0', sending ? 'bg-amber-500 animate-pulse' : 'bg-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,.2)]'].join(' ')} />
        <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">AI Assistent</span>
        {sending && <span className="text-[10px] text-amber-600 animate-pulse">Mõtlen…</span>}
      </div>

      <div className="mx-3 mt-2 rounded-xl border border-sky-100 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-900/40 px-3 py-1.5 text-[10px] text-sky-700 dark:text-sky-400 font-medium">
        Step {step} · {stepLabel} · {items.length} elementi
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 flex flex-col gap-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'self-end max-w-[88%]' : ''}>
            <div className={[
              'rounded-2xl px-3 py-2 text-xs leading-relaxed',
              m.role === 'ai'
                ? 'bg-white/80 dark:bg-slate-700/80 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                : 'bg-sky-600 text-white',
            ].join(' ')}>
              {renderMarkdown(m.text, m.role)}
            </div>
            {m.chips && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {m.chips.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleChipClick(c)}
                    disabled={sending}
                    className={[
                      'rounded-lg border px-2 py-1 text-[10px] font-semibold disabled:opacity-50 transition-colors',
                      c === 'Laienda graafiparingut'
                        ? 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
                        : 'border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40',
                    ].join(' ')}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {expandForm && (
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-indigo-50/80 p-3">
            <div className="text-[11px] font-semibold text-violet-800 dark:text-violet-300 mb-2">Graafiparingu seaded</div>
            <div className="space-y-2">
              <ExpandSelect
                label="Õppeaine"
                value={expandForm.subject}
                active={metadata?.subjectIri}
                options={taxonomyOptions?.subjects ?? []}
                onChange={(v) => setExpandForm((f) => ({ ...f, subject: v }))}
                placeholder="nt. Keemia"
              />
              <ExpandSelect
                label="Kooliaste"
                value={expandForm.schoolLevel}
                active={metadata?.schoolLevel}
                options={taxonomyOptions?.schoolLevels ?? []}
                onChange={(v) => setExpandForm((f) => ({ ...f, schoolLevel: v }))}
                placeholder="nt. III kooliaste"
              />
              <ExpandSelect
                label="Klass"
                value={expandForm.grade}
                active={metadata?.grade}
                options={taxonomyOptions?.grades ?? []}
                onChange={(v) => setExpandForm((f) => ({ ...f, grade: v }))}
                placeholder="nt. 8. klass"
              />
              <ExpandSelect
                label="Haridusaste"
                value={expandForm.educationLevel}
                active={metadata?.educationalLevelIri}
                options={taxonomyOptions?.educationLevels ?? []}
                onChange={(v) => setExpandForm((f) => ({ ...f, educationLevel: v }))}
                placeholder="nt. Põhiharidus"
              />
              <ExpandSelect
                label="Ainevaldkond"
                value={expandForm.subjectArea}
                active={metadata?.subjectAreaIri}
                options={taxonomyOptions?.subjectAreas ?? []}
                onChange={(v) => setExpandForm((f) => ({ ...f, subjectArea: v }))}
                placeholder="nt. Loodusained"
              />
            </div>
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={handleExpandApply}
                className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm hover:from-violet-700 hover:to-indigo-700"
              >
                Rakenda
              </button>
              <button
                onClick={() => setExpandForm(null)}
                className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700 px-3 py-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Tühista
              </button>
            </div>
          </div>
        )}

        {sending && (
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 border-t border-white/50 dark:border-slate-700 p-2.5">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={sending ? 'Ootan vastust…' : 'Küsi midagi...'}
          disabled={sending}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-slate-200/80 dark:border-slate-600 bg-white/70 dark:bg-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/40 disabled:opacity-60"
        />
        <button
          onClick={() => send()}
          disabled={sending || !input.trim()}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center self-end rounded-xl bg-sky-600 text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
