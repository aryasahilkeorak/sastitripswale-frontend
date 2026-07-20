import { useEffect, useRef, useState } from 'react';

// Custom numeric input — replaces native <input type="number"> so the
// browser's own spinner arrows never appear; styled to match .form-input.
export default function CustomNumberStepper({ value, onChange, min = 0, max = Infinity, step = 1, prefix, className = '' }) {
  const [text, setText] = useState(String(value ?? ''));
  const inputRef = useRef(null);

  // Sync visible text when the value changes from outside (e.g. couples-mode
  // auto-adjust) — but not while the user is actively typing in this field.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setText(String(value ?? ''));
  }, [value]);

  const commit = (next) => {
    const clamped = Math.min(max, Math.max(min, next));
    setText(String(clamped));
    onChange?.({ target: { value: clamped } });
  };

  const step_ = (dir) => commit((Number(value) || 0) + dir * step);

  return (
    <div className={`stepper ${className}`}>
      <button type="button" className="stepper-btn" onClick={() => step_(-1)} disabled={Number(value) <= min}>
        <i className="fa-solid fa-minus" />
      </button>
      <div className="stepper-value-wrap">
        {prefix && <span className="stepper-prefix">{prefix}</span>}
        <input
          ref={inputRef}
          className="stepper-input"
          type="text"
          inputMode="numeric"
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={() => commit(Number(text) || min)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
      </div>
      <button type="button" className="stepper-btn" onClick={() => step_(1)} disabled={Number(value) >= max}>
        <i className="fa-solid fa-plus" />
      </button>
    </div>
  );
}
