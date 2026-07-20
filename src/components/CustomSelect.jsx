import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Normalize "Male" | { value, label } into { value, label }.
function normalizeOptions(options) {
  return options.map((o) => (typeof o === 'object' && o !== null ? o : { value: o, label: o }));
}

// Fully custom dropdown — no native <select> involved, so the trigger's
// chevron icon never disappears while the panel is open (a native <select>
// hides/flips it, browser-controlled). Renders its panel through a portal
// so it always escapes `overflow: auto` ancestors (tables, modals).
//
// onChange is called with a fake event `{ target: { value } }` so it drops
// straight into this codebase's `set('key')` curried-handler pattern.
export default function CustomSelect({
  value,
  onChange,
  options,
  className = '',
  style,
  disabled = false,
}) {
  const norm = normalizeOptions(options);
  const selected = norm.find((o) => String(o.value) === String(value));

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const close = () => setOpen(false);

  const toggle = () => {
    if (disabled) return;
    if (open) return close();
    const startIndex = Math.max(0, norm.findIndex((o) => String(o.value) === String(value)));
    setActiveIndex(startIndex);
    setOpen(true);
  };

  // Two-pass positioning: mount the panel invisibly, measure its real
  // height, then place it (flipped above the trigger if there's no room
  // below) — all inside a layout effect so it never visibly flickers.
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
      const panelH = Math.min(panel.scrollHeight, 288);
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < panelH + 12 && rect.top > spaceBelow;
      setPos({
        top: openUp ? Math.max(8, rect.top - panelH - 8) : rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        maxHeight: panelH,
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open, norm.length]);

  useEffect(() => {
    if (!open) return undefined;

    const onDocMouseDown = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      close();
    };
    const onScroll = (e) => {
      if (panelRef.current?.contains(e.target)) return; // scrolling the option list itself
      close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(norm.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const opt = norm[activeIndex];
        if (opt) pick(opt);
      } else if (e.key === 'Tab') {
        close();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex, norm.length]);

  const pick = (opt) => {
    onChange?.({ target: { value: opt.value } });
    close();
    triggerRef.current?.focus();
  };

  return (
    <div className={`custom-select ${className}`} style={style} ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`custom-select-trigger${open ? ' open' : ''}${disabled ? ' disabled' : ''}`}
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="custom-select-value">{selected ? selected.label : ''}</span>
        <i className="fa-solid fa-chevron-down custom-select-arrow" />
      </button>

      {open &&
        createPortal(
          <div
            className="custom-select-panel"
            ref={panelRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: pos ? pos.top : 0,
              left: pos ? pos.left : 0,
              width: pos ? pos.width : undefined,
              maxHeight: pos ? pos.maxHeight : undefined,
              visibility: pos ? 'visible' : 'hidden',
            }}
          >
            {norm.map((o, i) => (
              <div
                key={o.value}
                role="option"
                aria-selected={String(o.value) === String(value)}
                className={`custom-select-option${String(o.value) === String(value) ? ' active' : ''}${i === activeIndex ? ' focused' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => pick(o)}
              >
                {o.label}
                {String(o.value) === String(value) && <i className="fa-solid fa-check" />}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
