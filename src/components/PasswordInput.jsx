import { useState } from 'react';

// A password input with a show/hide eye toggle. Forwards all input props.
export default function PasswordInput({ className = 'form-input', style, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={className}
        style={{ paddingRight: 44, ...style }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute',
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: 'var(--text-3)',
          cursor: 'pointer',
          padding: '6px 8px',
          fontSize: '0.95rem',
          lineHeight: 1,
        }}
      >
        <i className={show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
      </button>
    </div>
  );
}
