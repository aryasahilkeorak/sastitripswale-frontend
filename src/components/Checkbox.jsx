// Themed checkbox - reuses the .perm-check-input recipe (native input with
// appearance:none, styled via CSS) so no browser default checkbox chrome
// ever shows. With label/children it renders as a label+box pair; without
// either, it renders just the styled box (for standalone overlay checkboxes
// like a photo-grid "select" tick).
export default function Checkbox({ checked, onChange, children, label, icon, disabled, className = '' }) {
  const content = children ?? label;
  const input = (
    <input type="checkbox" className="perm-check-input" checked={checked} onChange={onChange} disabled={disabled} />
  );

  if (content == null) {
    return <span className={`checkbox-bare ${className}`}>{input}</span>;
  }

  return (
    <label className={`checkbox-inline${disabled ? ' disabled' : ''} ${className}`}>
      {input}
      {icon && <i className={icon} />}
      <span>{content}</span>
    </label>
  );
}
