import { useState } from 'react';
import PlaceAutocomplete from './PlaceAutocomplete.jsx';

// Ordered, removable chip list - used for a trip's via-stops.
export default function ChipListInput({ values = [], onChange, placeholder = 'Add a stop…', max = 6 }) {
  const [draft, setDraft] = useState('');

  const add = (raw) => {
    const v = (raw ?? draft).trim();
    if (!v || values.length >= max) return;
    onChange?.([...values, v]);
    setDraft('');
  };

  const remove = (i) => onChange?.(values.filter((_, idx) => idx !== i));

  return (
    <div className="chip-input">
      {values.length > 0 && (
        <div className="chip-input-list">
          {values.map((v, i) => (
            <span className="chip chip-removable" key={i}>
              {v}
              <button type="button" onClick={() => remove(i)} aria-label={`Remove ${v}`}>
                <i className="fa-solid fa-xmark" />
              </button>
            </span>
          ))}
        </div>
      )}
      {values.length < max && (
        <div className="chip-input-row">
          <PlaceAutocomplete
            className="form-input"
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onSelect={(s) => add(s.label)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
          <button type="button" className="btn btn-outline btn-sm chip-input-add" onClick={() => add()} disabled={!draft.trim()}>
            <i className="fa-solid fa-plus" /> Add stop
          </button>
        </div>
      )}
    </div>
  );
}
