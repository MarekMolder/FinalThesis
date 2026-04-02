import { useEffect, useRef, useState } from 'react';

export default function InfoTooltip({ title, content }) {
  const [open, setOpen] = useState(false);
  const [openLeft, setOpenLeft] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleToggle() {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      // Open to the left if less than 320px space on the right
      setOpenLeft(window.innerWidth - rect.right < 320);
    }
    setOpen(!open);
  }

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-500 shadow-sm transition hover:scale-110 hover:bg-sky-50 hover:text-sky-600"
        title="Info"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className={`absolute top-0 z-50 w-72 rounded-xl border border-white/70 bg-white/95 p-4 shadow-xl backdrop-blur-lg ${openLeft ? 'right-8' : 'left-8'}`}>
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{content}</p>
        </div>
      )}
    </div>
  );
}
