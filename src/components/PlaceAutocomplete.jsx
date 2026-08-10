import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api.js';

// Drop-in replacement for a plain <input> that suggests Indian cities/places
// as you type (backed by GET /places/autocomplete, which proxies Google's
// Place Autocomplete API server-side so the key never reaches the browser).
// Renders just the <input> itself - not a wrapping trigger button like
// CustomSelect - so it slots into existing markup (.form-group,
// .ride-search-input, .hsw-input, ...) unchanged. The suggestion panel
// reuses .custom-select-panel/.custom-select-option so it matches the rest
// of the app's dropdowns with no new CSS. onChange fires the same fake
// `{ target: { value } }` event shape the codebase's `set('key')` pattern expects.
export default function PlaceAutocomplete({
  value,
  onChange,
  onKeyDown,
  onSelect,
  placeholder,
  className = '',
  required = false,
  // Optional - shown (with a clock icon) when the field is focused but
  // still empty, so a past pick can be reused without retyping/re-searching.
  // Callers own the storage (e.g. localStorage) and just pass the list in.
  recentPlaces = [],
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const debounceRef = useRef(null);
  const requestSeq = useRef(0);

  const close = () => setOpen(false);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const fetchSuggestions = (query) => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const seq = ++requestSeq.current;
      try {
        const { data } = await api.get('/places/autocomplete', { params: { q: query.trim() } });
        if (seq === requestSeq.current) setSuggestions(data.suggestions || []);
      } catch {
        if (seq === requestSeq.current) setSuggestions([]);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    }, 350);
  };

  const handleChange = (e) => {
    onChange?.(e);
    setActiveIndex(-1);
    setOpen(true);
    fetchSuggestions(e.target.value);
  };

  const pick = (s) => {
    onChange?.({ target: { value: s.label } });
    onSelect?.(s);
    setSuggestions([]);
    close();
  };

  // Two-pass positioning, same recipe as CustomSelect/CustomDatePicker.
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
      const panelH = Math.min(panel.scrollHeight, 260);
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
  }, [open, suggestions.length, loading]);

  const isEmpty = (value || '').trim().length === 0;
  const showRecent = isEmpty && recentPlaces.length > 0;
  const showPanel = open && (loading || suggestions.length > 0 || (value || '').trim().length >= 2 || showRecent);

  useEffect(() => {
    if (!showPanel) return undefined;

    const onDocMouseDown = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      close();
    };
    const onScroll = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      close();
    };

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [showPanel]);

  // Handled on the input itself (not a document listener) so an unhandled
  // key - e.g. Enter with no suggestion highlighted - falls through to the
  // caller's own onKeyDown (ChipListInput uses that to add a chip).
  const handleKeyDown = (e) => {
    if (showPanel && e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (showPanel && e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => Math.min(suggestions.length - 1, i + 1));
      return;
    }
    if (showPanel && e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (showPanel && e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      pick(suggestions[activeIndex]);
      return;
    }
    onKeyDown?.(e);
  };

  return (
    <>
      <input
        ref={triggerRef}
        className={className}
        value={value}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />

      {showPanel &&
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
            {showRecent ? (
              <>
                <div style={{ padding: '6px 10px 4px', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                  Recent searches
                </div>
                {recentPlaces.map((p) => (
                  <div
                    key={p}
                    className="custom-select-option"
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => {
                      onChange?.({ target: { value: p } });
                      onSelect?.({ label: p });
                      close();
                    }}
                  >
                    <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--text-3)', flexShrink: 0 }} /> {p}
                  </div>
                ))}
              </>
            ) : loading ? (
              <div className="custom-select-option" style={{ cursor: 'default', opacity: 0.7, justifyContent: 'flex-start' }}>
                <span className="spinner" style={{ width: 14, height: 14 }} /> Searching…
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((s, i) => (
                <div
                  key={s.id}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={`custom-select-option${i === activeIndex ? ' focused' : ''}`}
                  style={{ justifyContent: 'flex-start' }}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pick(s)}
                >
                  <i className="fa-solid fa-location-dot" style={{ color: 'var(--text-3)', flexShrink: 0 }} /> {s.label}
                </div>
              ))
            ) : /^\d{1,5}$/.test((value || '').trim()) ? (
              <div className="custom-select-option" style={{ cursor: 'default', opacity: 0.6, justifyContent: 'flex-start' }}>
                <i className="fa-solid fa-hashtag" style={{ color: 'var(--text-3)' }} /> Keep typing - enter all 6 digits of the PIN code
              </div>
            ) : (
              <div className="custom-select-option" style={{ cursor: 'default', opacity: 0.6, flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                <span>No places found</span>
                <span style={{ fontSize: '0.72rem' }}>You can still type it in - it'll be used as entered.</span>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
