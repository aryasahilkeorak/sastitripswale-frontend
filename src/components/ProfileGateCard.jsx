import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { useHasRejectedDocument } from '../lib/useHasRejectedDocument.js';
import { useUnverifiedRequiredDocs } from '../lib/useUnverifiedRequiredDocs.js';

// Mirrors the backend's requireMembership/requireProfileComplete/
// requireDocumentsVerified gate (middleware/auth.js) so a logged-in member
// sees exactly why they can't plan/join a trip or club yet, with a direct
// link to fix it - instead of just a toast when they click a button that's
// going to fail anyway. Renders nothing once the member is actually eligible.
//
// `kind` ('host' | 'join') additionally accepts a Trip Pass credit as
// eligibility, matching useCanTrip.js - omit it for actions a Trip Pass
// doesn't cover (clubs, group trips), which still require a membership.
export default function ProfileGateCard({ action = 'plan or join trips', kind }) {
  const user = useAuth((s) => s.user);
  // Trip host/join specifically gate on the admin-granted verification
  // tier, not just "documents submitted" - see requireVerifiedTraveler/
  // requireVehicleVerified in the backend. Clubs and group trips (kind
  // omitted) still use the more general unverifiedDocs check below.
  const isTripKind = kind === 'host' || kind === 'join';

  const isStaff = user?.role === 'admin' || user?.role === 'superadmin';
  const hasAccess =
    isStaff ||
    Boolean(user?.membershipActive) ||
    (kind === 'host' && (user?.hostCredits || 0) > 0) ||
    (kind === 'join' && (user?.joinCredits || 0) > 0);
  const profileComplete = isStaff || Boolean(user?.profileComplete);
  // A rejected document matters whether the profile is complete or still in
  // progress - checked as soon as there's a membership/Trip Pass to act on.
  const hasRejectedDoc = useHasRejectedDocument(Boolean(user) && hasAccess && !isTripKind);
  // Last-mile check: profile submitted + no rejections, but has an admin
  // actually approved everything yet? Only worth asking once the rest is in
  // order, same as ActivateProfile.jsx. Skipped for trips, which use the
  // verificationLevel tier check below instead.
  const readyToCheckVerification = Boolean(user) && !isStaff && !isTripKind && hasAccess && profileComplete && !hasRejectedDoc;
  const unverifiedDocs = useUnverifiedRequiredDocs(readyToCheckVerification, user?.hasVehicle);

  const verificationLevel = user?.verificationLevel || 'none';
  const meetsTripTier = kind === 'host' ? verificationLevel === 'vehicle_verified' : verificationLevel !== 'none';

  if (!user) return null;

  if (!hasAccess) {
    return (
      <div className="card mb-4" style={{ padding: 16, borderColor: 'rgba(255,107,0,0.3)' }}>
        <strong>Membership required.</strong>
        <p className="text-muted mt-2">
          {kind
            ? `Activate a membership (a coupon code from an influencer or someone you know could save you up to 100% off) or buy a Trip Pass from ₹29 to ${action}.`
            : `Activate a membership (a coupon code from an influencer or someone you know could save you up to 100% off) to ${action}.`}
        </p>
        <Link to="/join" className="btn btn-primary mt-3"><i className="fa-solid fa-crown" /> View Plans</Link>
      </div>
    );
  }

  if (hasRejectedDoc) {
    return (
      <div className="card mb-4" style={{ padding: 16, borderColor: 'rgba(239,68,68,0.35)' }}>
        <strong>Some documents were rejected.</strong>
        <p className="text-muted mt-2">Resubmit the flagged documents to {action}.</p>
        <Link to="/dashboard?tab=settings" className="btn btn-primary mt-3"><i className="fa-solid fa-rotate" /> Resubmit Documents</Link>
      </div>
    );
  }

  if (!profileComplete) {
    return (
      <div className="card mb-4" style={{ padding: 16, borderColor: 'rgba(255,107,0,0.3)' }}>
        <strong>Complete your profile first.</strong>
        <p className="text-muted mt-2">Add your name, city, interests, vehicle and ID to {action}.</p>
        <Link to="/complete-profile" className="btn btn-primary mt-3"><i className="fa-solid fa-user-gear" /> Complete Profile</Link>
      </div>
    );
  }

  if (isTripKind && !isStaff && !meetsTripTier) {
    return (
      <div className="card mb-4" style={{ padding: 16, borderColor: 'rgba(255,107,0,0.3)' }}>
        <strong>{kind === 'host' ? 'Verified Vehicle Owner tier required.' : 'Admin verification required.'}</strong>
        <p className="text-muted mt-2">
          {kind === 'host'
            ? 'Hosting a trip needs the full Verified Vehicle Owner tier (ID + Driving Licence + RC, all admin-approved) - a Verified traveler can only join.'
            : 'An admin needs to verify your profile documents before you can join a trip.'}
        </p>
        <Link to="/dashboard?tab=settings" className="btn btn-primary mt-3"><i className="fa-solid fa-hourglass-half" /> View Documents</Link>
      </div>
    );
  }

  if (unverifiedDocs.length > 0) {
    return (
      <div className="card mb-4" style={{ padding: 16, borderColor: 'rgba(255,107,0,0.3)' }}>
        <strong>Documents awaiting verification.</strong>
        <p className="text-muted mt-2">
          An admin still needs to approve {unverifiedDocs.map((d) => d.label).join(', ')} before you can {action}.
        </p>
        <Link to="/dashboard?tab=settings" className="btn btn-primary mt-3"><i className="fa-solid fa-hourglass-half" /> View Documents</Link>
      </div>
    );
  }

  return null;
}
