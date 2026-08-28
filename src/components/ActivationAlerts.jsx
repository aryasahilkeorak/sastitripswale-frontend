import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { useHasRejectedDocument } from '../lib/useHasRejectedDocument.js';
import { useT } from '../i18n/index.js';

// The "finish activating your account" pill stack - originally AppHome-only,
// now also shown on a member's own profile page so the nudge follows them
// wherever they land, not just the home dashboard. Renders nothing once the
// member (or staff) is fully activated.
export default function ActivationAlerts() {
  const t = useT();
  const user = useAuth((s) => s.user);
  const isStaff = user?.role === 'admin' || user?.role === 'superadmin';
  const hasRejectedDoc = useHasRejectedDocument(Boolean(user));
  const hasTripPack = (user?.hostCredits || 0) > 0 || (user?.joinCredits || 0) > 0;

  if (!user || isStaff) return null;

  const needsProfile = !user.profileComplete;
  const needsMembership = !user.membershipActive && !hasTripPack;
  if (!hasRejectedDoc && !needsProfile && !needsMembership) return null;

  return (
    <div className="ahg-alert-stack">
      {hasRejectedDoc ? (
        <Link to="/activate-profile" className="ahg-alert ahg-alert-magenta">
          <i className="fa-solid fa-rotate" />
          <span>{t('activationAlerts.documentsRejected')}</span>
          <i className="fa-solid fa-chevron-right" />
        </Link>
      ) : (
        needsProfile && (
          <Link to="/activate-profile" className="ahg-alert ahg-alert-magenta">
            <i className="fa-solid fa-user-gear" />
            <span>{t('activationAlerts.completeProfile')}</span>
            <i className="fa-solid fa-chevron-right" />
          </Link>
        )
      )}
      {needsMembership && (
        <Link to="/activate-profile" className="ahg-alert ahg-alert-fire">
          <i className="fa-solid fa-crown" />
          <span>{t('activationAlerts.activateMembership')}</span>
          <i className="fa-solid fa-chevron-right" />
        </Link>
      )}
    </div>
  );
}
