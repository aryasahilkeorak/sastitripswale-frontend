// Renders the right combination of Founder / verified-tier badge for a
// member. The Founder (superadmin) always gets the gold crown badge PLUS a
// gold verified badge by default - no documents required.
export default function VerificationBadge({ role, verificationLevel, isVerified, block = false }) {
  const isFounder = role === 'superadmin';
  const El = block ? 'div' : 'span';

  const effectiveLevel = isFounder
    ? verificationLevel === 'vehicle_verified' ? 'vehicle_verified' : 'verified'
    : verificationLevel && verificationLevel !== 'none' ? verificationLevel : isVerified ? 'verified' : 'none';

  if (effectiveLevel === 'none') return null;

  const Wrap = block ? 'div' : 'span';
  return (
    <Wrap style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: block ? 'center' : undefined }}>
      {isFounder && (
        <El className="verified-badge founder-badge">
          <i className="fa-solid fa-crown" /> Founder
        </El>
      )}
      <El className={`verified-badge${isFounder ? ' founder-badge' : ''}`}>
        <i className={effectiveLevel === 'vehicle_verified' ? 'fa-solid fa-car-side' : 'fa-solid fa-circle-check'} />
        {effectiveLevel === 'vehicle_verified' ? ' Verified Vehicle Owner' : ' Verified'}
      </El>
    </Wrap>
  );
}
