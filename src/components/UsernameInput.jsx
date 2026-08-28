import { useUsernameAvailability } from '../lib/useUsernameAvailability.js';

const STATUS_ICON = {
  checking: <span className="spinner" style={{ width: 14, height: 14 }} />,
  available: <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7' }} />,
  taken: <i className="fa-solid fa-circle-xmark" style={{ color: '#fca5a5' }} />,
  invalid: <i className="fa-solid fa-triangle-exclamation" style={{ color: '#fbbf24' }} />,
};

const STATUS_MESSAGE = {
  available: 'Username is available',
  taken: 'That username is already taken',
  invalid: '3-30 characters: lowercase letters, numbers, "_" or "." only',
};

// Instagram-style username field - checks availability against the live
// database as the member types (debounced), instead of only finding out
// on submit. `currentUsername` skips the check when unchanged (Edit
// Profile, where the value is trivially "available" to its own owner).
export default function UsernameInput({ value, onChange, currentUsername, id, placeholder, maxLength = 30, className = 'form-input' }) {
  const status = useUsernameAvailability(value, { currentUsername });

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          className={className}
          style={{ paddingRight: 40 }}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
        />
        {STATUS_ICON[status] && (
          <span
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.95rem',
            }}
          >
            {STATUS_ICON[status]}
          </span>
        )}
      </div>
      {STATUS_MESSAGE[status] && (
        <p
          style={{
            fontSize: '0.72rem',
            marginTop: 6,
            color: status === 'available' ? '#6ee7b7' : status === 'taken' ? '#fca5a5' : '#fbbf24',
          }}
        >
          {STATUS_MESSAGE[status]}
        </p>
      )}
    </div>
  );
}
