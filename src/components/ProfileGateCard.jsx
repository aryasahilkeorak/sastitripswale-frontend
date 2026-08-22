import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { useHasRejectedDocument } from '../lib/useHasRejectedDocument.js';

// Mirrors the backend's requireMembership/requireProfileComplete gate
// (adminController.js) so a logged-in member sees exactly why they can't
// plan/join a trip or club yet, with a direct link to fix it - instead of
// just a toast when they click a button that's going to fail anyway.
// Renders nothing once the member is actually eligible.
export default function ProfileGateCard({ action = 'plan or join trips' }) {
  const user = useAuth((s) => s.user);

  const isStaff = user?.role === 'admin' || user?.role === 'superadmin';
  const membershipActive = isStaff || Boolean(user?.membershipActive);
  const profileComplete = isStaff || Boolean(user?.profileComplete);
  const needsDocCheck = Boolean(user) && membershipActive && !profileComplete;
  const hasRejectedDoc = useHasRejectedDocument(needsDocCheck);

  if (!user || (membershipActive && profileComplete)) return null;

  if (!membershipActive) {
    return (
      <div className="card mb-4" style={{ padding: 16, borderColor: 'rgba(255,107,0,0.3)' }}>
        <strong>Membership required.</strong>
        <p className="text-muted mt-2">Activate a membership (free with coupon FREEJOIN) to {action}.</p>
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

  return (
    <div className="card mb-4" style={{ padding: 16, borderColor: 'rgba(255,107,0,0.3)' }}>
      <strong>Complete your profile first.</strong>
      <p className="text-muted mt-2">Add your name, city, interests, vehicle and ID to {action}.</p>
      <Link to="/complete-profile" className="btn btn-primary mt-3"><i className="fa-solid fa-user-gear" /> Complete Profile</Link>
    </div>
  );
}
