import { useEffect, useRef, useState } from 'react';
import './tutorial-overlay.css';

export default function TutorialOverlay({
  isActive,
  currentStep,
  totalSteps,
  stepConfig,
  onNext,
  onPrev,
  onEnd,
  onViewChange,
}) {
  const [rect, setRect] = useState(null);
  const [popupClass, setPopupClass] = useState('tutorial-popup-enter');
  const popupRef = useRef(null);
  const timerRef = useRef(null);

  // ---- Prevent scroll while tutorial is active ----
  useEffect(() => {
    if (!isActive) return;
    const prevent = (e) => e.preventDefault();
    document.addEventListener('wheel', prevent, { passive: false });
    document.addEventListener('touchmove', prevent, { passive: false });
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('wheel', prevent);
      document.removeEventListener('touchmove', prevent);
      document.documentElement.style.overflow = '';
    };
  }, [isActive]);

  // ---- On step change: switch view, scroll to element, measure ----
  useEffect(() => {
    if (!isActive || !stepConfig) return;

    setPopupClass('tutorial-popup-enter');
    setRect(null);

    // Switch view if step requires it
    if (stepConfig.view && onViewChange) {
      onViewChange(stepConfig.view);
    }

    if (!stepConfig.target) {
      requestAnimationFrame(() => setPopupClass('tutorial-popup-active'));
      return;
    }

    // Temporarily allow scroll so scrollIntoView works
    document.documentElement.style.overflow = '';

    // Use setTimeout to wait for React to render the new view (e.g. calendar/gantt)
    // then find the element, scroll to it, measure and re-lock scroll.
    const findTimer = setTimeout(() => {
      const el = document.querySelector(stepConfig.target);
      if (!el) {
        document.documentElement.style.overflow = 'hidden';
        setPopupClass('tutorial-popup-active');
        return;
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Wait for scroll to settle, then measure and re-lock
      const measureTimer = setTimeout(() => {
        document.documentElement.style.overflow = 'hidden';

        const r = el.getBoundingClientRect();
        const pad = 8;
        setRect({
          top: r.top - pad,
          left: r.left - pad,
          width: r.width + pad * 2,
          height: r.height + pad * 2,
        });
        setPopupClass('tutorial-popup-active');
      }, 500);

      timerRef.current = measureTimer;
    }, 100);

    timerRef.current = findTimer;
    return () => clearTimeout(timerRef.current);
  }, [isActive, currentStep, stepConfig, onViewChange]);

  // ---- ESC to close ----
  useEffect(() => {
    if (!isActive) return;
    const handler = (e) => {
      if (e.key === 'Escape') onEnd();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive, onEnd]);

  if (!isActive || !stepConfig) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  function popupStyle() {
    if (!rect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const gap = 14;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const popupW = 380;
    const popupH = 240;

    // Horizontally center popup under/over the highlight
    let left = rect.left + rect.width / 2 - popupW / 2;
    left = Math.max(gap, Math.min(left, vw - popupW - gap));

    // Try bottom first
    if (rect.top + rect.height + gap + popupH < vh) {
      return { top: `${rect.top + rect.height + gap}px`, left: `${left}px` };
    }
    // Try top
    if (rect.top - gap - popupH > 0) {
      return { top: `${rect.top - gap - popupH}px`, left: `${left}px` };
    }
    // Fallback: vertically center
    return { top: `${(vh - popupH) / 2}px`, left: `${left}px` };
  }

  function handleLastStep() {
    onEnd();
  }

  return (
    <>
      {!rect && <div className="tutorial-backdrop" onClick={onEnd} />}

      {rect && (
        <div
          className="tutorial-highlight"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}

      <div
        ref={popupRef}
        className={`tutorial-popup ${popupClass}`}
        style={popupStyle()}
      >
        <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-600">
              {currentStep + 1} / {totalSteps}
            </span>
            <button
              onClick={onEnd}
              className="text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              Lõpeta tutvustus
            </button>
          </div>

          <h3 className="text-base font-bold text-slate-900">{stepConfig.title}</h3>

          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {stepConfig.content}
          </p>

          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            {!isFirst ? (
              <button
                onClick={onPrev}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Eelmine
              </button>
            ) : (
              <div />
            )}
            {isLast ? (
              <button
                onClick={handleLastStep}
                className="rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg"
              >
                Valmis!
              </button>
            ) : (
              <button
                onClick={onNext}
                className="rounded-xl bg-sky-500 px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-sky-600"
              >
                Järgmine
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
