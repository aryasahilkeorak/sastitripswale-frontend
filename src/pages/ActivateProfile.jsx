import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { useHasRejectedDocument } from '../lib/useHasRejectedDocument.js';
import { useUnverifiedRequiredDocs } from '../lib/useUnverifiedRequiredDocs.js';
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
  // A Trip Pass covers hosting/joining a regular trip only - clubs,
  // connections and unlimited trips still need the full membership below.
  const hostCredits = user?.hostCredits || 0;
  const joinCredits = user?.joinCredits || 0;
  const hasTripPack = hostCredits > 0 || joinCredits > 0;
  // Independent of staff/membership/profile status - a rejected document is
  // a personal housekeeping notice that can apply to anyone, staff included.
  const hasRejectedDoc = useHasRejectedDocument(Boolean(user));
  // Only worth checking once profile+membership are otherwise in order -
  // this is the last mile (admin approval) before trips/clubs unlock.
  const readyToCheckVerification = !isStaff && membershipActive && profileComplete && !hasRejectedDoc;
  const unverifiedDocs = useUnverifiedRequiredDocs(readyToCheckVerification, user?.hasVehicle);

  const allSet = !user || (membershipActive && profileComplete && !hasRejectedDoc && unverifiedDocs.length === 0);

  return (
    <section className="cp-section activate-profile-section">
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
              <div className="card" style={{ padding: 20, borderColor: 'rgba(255,107,0,0.3)', textAlign: 'center' }}>
                {hasTripPack ? (
                  <>
                    <strong><i className="fa-solid fa-ticket" style={{ color: 'var(--fire)' }} /> Trip Pass active</strong>
                    <p className="text-muted mt-2">
                      You have {hostCredits} host and {joinCredits} join credit{hostCredits === 1 && joinCredits === 1 ? '' : 's'} - enough
                      to plan or join a trip. A full membership additionally unlocks clubs, connections, and unlimited trips.
                    </p>
                    <Link to="/join" className="btn btn-primary mt-3"><i className="fa-solid fa-crown" /> View Plans</Link>
                  </>
                ) : (
                  <>
                    <strong><i className="fa-solid fa-crown" style={{ color: 'var(--fire)' }} /> Membership required</strong>
                    <p className="text-muted mt-2">Activate a membership (a coupon code from an influencer or someone you know could save you up to 100% off) or buy a Trip Pass from ₹29 to plan or join trips and clubs.</p>
                    <Link to="/join" className="btn btn-primary mt-3"><i className="fa-solid fa-crown" /> View Plans</Link>
                  </>
                )}
              </div>
            )}

            {hasRejectedDoc ? (
              <div className="card" style={{ padding: 20, borderColor: 'rgba(239,68,68,0.35)' }}>
                <strong><i className="fa-solid fa-rotate" style={{ color: '#fca5a5' }} /> Some documents were rejected</strong>
                <p className="text-muted mt-2">Resubmit the flagged documents below to continue.</p>
                <div className="mt-3"><DocumentsCard user={user} /></div>
              </div>
            ) : (membershipActive || hasTripPack) && !profileComplete ? (
              <div className="card" style={{ padding: 20, borderColor: 'rgba(255,107,0,0.3)' }}>
                <strong><i className="fa-solid fa-user-gear" style={{ color: 'var(--fire)' }} /> Complete your profile</strong>
                <p className="text-muted mt-2">Add your name, city, interests, vehicle and ID documents to plan or join trips.</p>
                <Link to="/complete-profile" className="btn btn-primary mt-3"><i className="fa-solid fa-user-gear" /> Complete Profile</Link>
              </div>
            ) : (
              readyToCheckVerification &&
              unverifiedDocs.length > 0 && (
                <div className="card" style={{ padding: 20, borderColor: 'rgba(255,107,0,0.3)' }}>
                  <strong><i className="fa-solid fa-hourglass-half" style={{ color: 'var(--fire)' }} /> Documents awaiting verification</strong>
                  <p className="text-muted mt-2">
                    Your profile is complete, but an admin still needs to approve: {unverifiedDocs.map((d) => d.label).join(', ')}.
                    You'll be able to plan or join trips and clubs as soon as they're verified.
                  </p>
                  <div className="mt-3"><DocumentsCard user={user} /></div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
