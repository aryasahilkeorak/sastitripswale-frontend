function computeLevel(role, verificationLevel, isVerified) {
  const isFounder = role === 'superadmin';
  const effectiveLevel = isFounder
    ? verificationLevel === 'vehicle_verified' ? 'vehicle_verified' : 'verified'
    : verificationLevel && verificationLevel !== 'none' ? verificationLevel : isVerified ? 'verified' : 'none';
  return { isFounder, effectiveLevel };
}

// Just the checkmark glyph (gold for the founder, cyan otherwise) - used
// where the icon needs to sit BEFORE the name, e.g. ProfileHeader's
// icon-then-name-then-Founder-pill layout.
export function VerifiedIcon({ role, verificationLevel, isVerified, style }) {
  const { isFounder, effectiveLevel } = computeLevel(role, verificationLevel, isVerified);
  if (effectiveLevel === 'none') return null;
  const label = effectiveLevel === 'vehicle_verified' ? 'Verified vehicle owner' : 'Verified';
  return (
    <i
      className="fa-solid fa-circle-check"
      title={label}
      aria-label={label}
      style={{ color: isFounder ? 'var(--gold)' : 'var(--cyan)', ...style }}
    />
  );
}

// Just the "Founder" text pill, standalone (no verified icon bundled in).
export function FounderPill({ role }) {
  if (role !== 'superadmin') return null;
  return (
    <span className="verified-badge founder-badge">
      <i className="fa-solid fa-crown" /> Founder
    </span>
  );
}

// Renders the right combination of Founder / verified-tier badge for a
// member. The Founder (superadmin) always gets the gold crown badge PLUS a
// gold verified badge by default - no documents required.
export default function VerificationBadge({ role, verificationLevel, isVerified, block = false, icon = false, verifiedIconOnly = false }) {
  const { isFounder, effectiveLevel } = computeLevel(role, verificationLevel, isVerified);
  const El = block ? 'div' : 'span';

  if (effectiveLevel === 'none') return null;

  // Instagram-style: just a small checkmark glyph next to the name, no
  // text pill - used inline (e.g. in the Members grid), never as a block.
  if (icon) {
    const label = isFounder ? 'Founder' : effectiveLevel === 'vehicle_verified' ? 'Verified vehicle owner' : 'Verified';
    return (
      <i
        className={isFounder ? 'fa-solid fa-crown' : 'fa-solid fa-circle-check'}
        title={label}
        aria-label={label}
        style={{ color: isFounder ? 'var(--gold)' : 'var(--cyan)', fontSize: '0.8em', marginLeft: 5 }}
      />
    );
  }

  const Wrap = block ? 'div' : 'span';
  return (
    <Wrap style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: block ? 'center' : undefined }}>
      {isFounder && (
        <El className="verified-badge founder-badge">
          <i className="fa-solid fa-crown" /> Founder
        </El>
      )}
      {verifiedIconOnly ? (
        <i
          className="fa-solid fa-circle-check"
          title={effectiveLevel === 'vehicle_verified' ? 'Verified vehicle owner' : 'Verified'}
          aria-label={effectiveLevel === 'vehicle_verified' ? 'Verified vehicle owner' : 'Verified'}
          style={{ color: 'var(--cyan)' }}
        />
      ) : (
        <El className={`verified-badge${isFounder ? ' founder-badge' : ''}`}>
          <i className="fa-solid fa-circle-check" />
          {effectiveLevel === 'vehicle_verified' ? ' Verified Vehicle Owner' : ' Verified'}
        </El>
      )}
    </Wrap>
  );
}
