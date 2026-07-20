import { useState } from 'react';

const SRC = {
  horizontal: '/brand/logo-horizontal.png',
  mark: '/brand/logo-mark.png',
};

// Renders the real SastiTripsWale logo once the files exist at
// public/brand/{logo-horizontal,logo-mark}.png; falls back to the
// pre-rebrand look (text wordmark / shield icon) until then.
export default function BrandLogo({ variant = 'horizontal', className = '' }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return variant === 'mark' ? (
      <span className={`badge-shield ${className}`}>
        <i className="fa-solid fa-shield-halved" />
      </span>
    ) : (
      <span className={`nav-brand-text ${className}`}>SastiTripsWale</span>
    );
  }

  return (
    <img
      src={SRC[variant]}
      alt="SastiTripsWale"
      className={`brand-logo brand-logo-${variant} ${className}`}
      onError={() => setBroken(true)}
    />
  );
}
