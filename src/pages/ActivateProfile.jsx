import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { useHasRejectedDocument } from '../lib/useHasRejectedDocument.js';
import { DocumentsCard } from './Dashboard.jsx';
import Seo from '../components/Seo.jsx';

// A single landing spot for every "you're not quite eligible yet" banner
// across the app (AppHome's alert stack, ProfileGateCard on trip/club
// pages) - explains exactly what's missing and lets the member fix it
// right here, instead of bouncing between /join, /complete-profile and
// Dashboard settings and guessing which one applies.
export default function ActivateProfile() {
  const user = useAuth((s) => s.user);

  const isStaff = user?.role === 'admin' || user?.role === 'superadmin';
  const membershipActive = isStaff || Boolean(user?.membershipActive);
  const profileComplete = isStaff || Boolean(user?.profileComplete);
  // Independent of staff/membership/profile status - a rejected document is
  // a personal housekeeping notice that can apply to anyone, staff included.
  const hasRejectedDoc = useHasRejectedDocument(Boolean(user));

  const allSet = !user || (membershipActive && profileComplete && !hasRejectedDoc);

  return (
    <section className="cp-section">
      <Seo noindex title="Activate Your Account" path="/activate-profile" />
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 6 }}>Activate your account</h1>
        <p className="text-muted mb-4" style={{ fontSize: '0.88rem' }}>
          Finish these steps to plan or join trips and clubs.
        </p>

        {allSet ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: '2rem', color: '#6ee7b7' }} />
            <h3 className="mt-3" style={{ fontFamily: 'var(--font-display)' }}>You're all set!</h3>
            <p className="text-muted mt-2">Your account is fully active - go plan or join a trip.</p>
            <Link to="/" className="btn btn-primary mt-3"><i className="fa-solid fa-house" /> Back to Home</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!membershipActive && (
              <div className="card" style={{ padding: 20, borderColor: 'rgba(255,107,0,0.3)' }}>
                <strong><i className="fa-solid fa-crown" style={{ color: 'var(--fire)' }} /> Membership required</strong>
                <p className="text-muted mt-2">Activate a membership (free with coupon FREEJOIN) to plan or join trips and clubs.</p>
                <Link to="/join" className="btn btn-primary mt-3"><i className="fa-solid fa-crown" /> View Plans</Link>
              </div>
            )}

            {hasRejectedDoc ? (
              <div className="card" style={{ padding: 20, borderColor: 'rgba(239,68,68,0.35)' }}>
                <strong><i className="fa-solid fa-rotate" style={{ color: '#fca5a5' }} /> Some documents were rejected</strong>
                <p className="text-muted mt-2">Resubmit the flagged documents below to continue.</p>
                <div className="mt-3"><DocumentsCard /></div>
              </div>
            ) : (
              membershipActive && !profileComplete && (
                <div className="card" style={{ padding: 20, borderColor: 'rgba(255,107,0,0.3)' }}>
                  <strong><i className="fa-solid fa-user-gear" style={{ color: 'var(--fire)' }} /> Complete your profile</strong>
                  <p className="text-muted mt-2">Add your name, city, interests, vehicle and ID documents to plan or join trips.</p>
                  <Link to="/complete-profile" className="btn btn-primary mt-3"><i className="fa-solid fa-user-gear" /> Complete Profile</Link>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
