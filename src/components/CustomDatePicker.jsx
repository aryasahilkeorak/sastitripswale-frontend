import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const YEAR_PAGE_SIZE = 12;

// All date math happens in UTC so the calendar never drifts a day
// depending on the browser's local timezone offset.
const pad = (n) => String(n).padStart(2, '0');
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parseISO = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
};
const formatDisplay = (iso) => {
  const p = parseISO(iso);
  if (!p) return '';
  return `${p.d} ${MONTHS[p.m].slice(0, 3)} ${p.y}`;
};

// Fully custom calendar popover matching CustomSelect.jsx's portal +
// two-pass positioning + outside-click/Escape pattern, so date inputs
// never fall back to the native browser date-picker chrome.
export default function CustomDatePicker({ value, onChange, min, max, placeholder = 'Select date', className = '' }) {
  const today = new Date();
  // For fields with no value yet (e.g. date of birth), default the view to
  // the max bound rather than "today" - for an 18+ DOB field that lands the
  // calendar ~18 years back instead of forcing dozens of prev-month clicks.
  const initial = parseISO(value) || parseISO(max) || parseISO(min) || { y: today.getFullYear(), m: today.getMonth(), d: 1 };

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('days'); // 'days' | 'years'
  const [viewY, setViewY] = useState(initial.y);
  const [viewM, setViewM] = useState(initial.m);
  const [yearPageStart, setYearPageStart] = useState(Math.floor(initial.y / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE);
  const [pos, setPos] = useState(null);

  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const close = () => setOpen(false);
  const toggle = () => {
    if (open) return close();
    const p = parseISO(value) || parseISO(max) || parseISO(min) || { y: today.getFullYear(), m: today.getMonth() };
    setViewY(p.y);
    setViewM(p.m);
    setYearPageStart(Math.floor(p.y / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE);
    setMode('days');
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return undefined;
    }
    const place = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;
      const rect = trigger.getBoundingClientRect();
      const panelH = Math.min(panel.scrollHeight, 340);
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < panelH + 12 && rect.top > spaceBelow;
      setPos({
        top: openUp ? Math.max(8, rect.top - panelH - 8) : rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 280),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open, mode]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocMouseDown = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      close();
    };
    const onScroll = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('scroll', onScroll, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const minP = parseISO(min);
  const minTime = minP ? Date.UTC(minP.y, minP.m, minP.d) : null;
  const maxP = parseISO(max);
  const maxTime = maxP ? Date.UTC(maxP.y, maxP.m, maxP.d) : null;

  const firstOfMonth = new Date(Date.UTC(viewY, viewM, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewY, viewM + 1, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selected = parseISO(value);
  const isSelected = (d) => selected && selected.y === viewY && selected.m === viewM && selected.d === d;
  const isDisabled = (d) => {
    const t = Date.UTC(viewY, viewM, d);
    return (minTime !== null && t < minTime) || (maxTime !== null && t > maxTime);
  };

  const pick = (d) => {
    onChange?.({ target: { value: toISO(viewY, viewM, d) } });
    close();
    triggerRef.current?.focus();
  };

  const prevMonth = () => {
    if (viewM === 0) {
      setViewY((y) => y - 1);
      setViewM(11);
    } else {
      setViewM((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (viewM === 11) {
      setViewY((y) => y + 1);
      setViewM(0);
    } else {
      setViewM((m) => m + 1);
    }
  };

  const pickYear = (y) => {
    setViewY(y);
    setMode('days');
  };

  return (
    <div className={`date-picker ${className}`} ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`date-picker-trigger${open ? ' open' : ''}`}
        onClick={toggle}
      >
        <i className="fa-solid fa-calendar-days" />
        <span className="date-picker-value">{value ? formatDisplay(value) : <span className="date-picker-placeholder">{placeholder}</span>}</span>
      </button>

      {open &&
        createPortal(
          <div
            className="date-picker-panel"
            ref={panelRef}
            style={{
              position: 'fixed',
              top: pos ? pos.top : 0,
              left: pos ? pos.left : 0,
              width: pos ? pos.width : undefined,
              visibility: pos ? 'visible' : 'hidden',
            }}
          >
            <div className="date-picker-header">
              <button
                type="button"
                className="date-picker-nav"
                onClick={() => (mode === 'days' ? prevMonth() : setYearPageStart((s) => s - YEAR_PAGE_SIZE))}
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              <button
                type="button"
                className="date-picker-title"
                onClick={() => {
                  if (mode === 'days') {
                    setYearPageStart(Math.floor(viewY / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE);
                    setMode('years');
                  } else {
                    setMode('days');
                  }
                }}
              >
                {mode === 'days' ? `${MONTHS[viewM]} ${viewY}` : `${yearPageStart} – ${yearPageStart + YEAR_PAGE_SIZE - 1}`}
              </button>
              <button
                type="button"
                className="date-picker-nav"
                onClick={() => (mode === 'days' ? nextMonth() : setYearPageStart((s) => s + YEAR_PAGE_SIZE))}
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
            {mode === 'years' ? (
              <div className="date-picker-year-grid">
                {Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => yearPageStart + i).map((y) => (
                  <button
                    type="button"
                    key={y}
                    className={`date-picker-year-cell${y === viewY ? ' selected' : ''}`}
                    onClick={() => pickYear(y)}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="date-picker-weekdays">
                  {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
                </div>
                <div className="date-picker-grid">
                  {cells.map((d, i) =>
                    d === null ? (
                      <span key={i} className="date-picker-cell empty" />
                    ) : (
                      <button
                        type="button"
                        key={i}
                        className={`date-picker-cell${isSelected(d) ? ' selected' : ''}`}
                        disabled={isDisabled(d)}
                        onClick={() => pick(d)}
                      >
                        {d}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
