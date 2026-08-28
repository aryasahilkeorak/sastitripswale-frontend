// Themed range slider - keeps the native <input type="range"> for its
// built-in drag/keyboard/touch/a11y handling, but fully re-skins the track
// and thumb via CSS (see .range-slider in style.scss) instead of relying on
// browser chrome, with a --range-pct custom property driving the filled
// portion of the track so it doesn't need its own pointer-math.
export default function RangeSlider({ value, onChange, min = 0, max = 100, step = 1, className = '' }) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      className={`range-slider ${className}`}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      style={{ '--range-pct': `${pct}%` }}
    />
  );
}
