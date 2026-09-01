import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { rupee, paiseToRupee, formatDate, timeAgo, planDurationLabel, membershipStatusInfo, PREF_LABEL, planPrice } from '../lib/helpers.js';
import PageHero from '../components/PageHero.jsx';
import Loader from '../components/Loader.jsx';
import Seo from '../components/Seo.jsx';
import { toast } from '../lib/toast.js';

export default function MyPlan() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Refresh membership fields in case a renewal completed earlier in this
    // session - Join.jsx redirects away on success rather than back here.
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => {});
    api
      .get('/payments/history')
      .then((r) => setPayments(r.data.payments))
      .catch((err) => toast('fa-solid fa-circle-xmark', apiError(err)))
      .finally(() => setLoading(false));
  }, [setUser]);

  const isStaff = user?.role === 'admin' || user?.role === 'superadmin';
  const isLifetime = isStaff || user?.membershipDuration === 'lifetime';
  const status = membershipStatusInfo(user);
  const hasCredits = (user?.hostCredits || 0) > 0 || (user?.joinCredits || 0) > 0;
  const planName = isStaff
    ? 'Staff account'
    : user?.membershipPaid
      ? `${PREF_LABEL[user.coTravelerPreference] || 'Membership'} · ${planDurationLabel(user.membershipDuration)}`
      : 'No active plan';

  return (
    <>
      <Seo noindex title="My Plan" path="/my-plan" />
      <PageHero tag="Account" tagIcon="fa-solid fa-id-badge" title="My" highlight="Plan" sub="Your membership status, renewal date, and payment history." />

      <section style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="container" style={{ maxWidth: 680 }}>
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <div className="row-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="text-muted" style={{ fontSize: '0.78rem', marginBottom: 4 }}>Current plan</div>
                <h3 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>{planName}</h3>
                {!isStaff && user?.membershipPaid && (
                  <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                    {rupee(planPrice(user.coTravelerPreference, user.membershipDuration))}
                  </div>
                )}
              </div>
              <span className={`badge ${status.badgeClass}`}>{status.label}</span>
            </div>

            {user?.membershipPaid && (
              <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 20 }}>
                <div className="admin-stat" style={{ padding: 14 }}>
                  <div className="lbl">Started</div>
                  <div className="val" style={{ fontSize: '1rem' }}>{user?.membershipPaidAt ? formatDate(user.membershipPaidAt) : '—'}</div>
                </div>
                <div className="admin-stat" style={{ padding: 14 }}>
                  <div className="lbl">{isLifetime ? 'Expires' : 'Renews / Expires'}</div>
                  <div className="val" style={{ fontSize: '1rem' }}>
                    {isLifetime ? 'Never' : user?.membershipExpiresAt ? formatDate(user.membershipExpiresAt) : '—'}
                  </div>
                </div>
              </div>
            )}

            {!isStaff && (
              <Link to="/join" className="btn btn-primary mt-3" style={{ width: '100%', justifyContent: 'center' }}>
                <i className="fa-solid fa-rotate" /> {user?.membershipActive ? 'Renew / Change plan' : 'Choose a plan'}
              </Link>
            )}
          </div>

          {hasCredits && (
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h4 className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>Trip Pass credits</h4>
              <div style={{ display: 'flex', gap: 20, fontSize: '0.88rem' }}>
                <span><i className="fa-solid fa-crown" style={{ color: 'var(--fire)' }} /> {user.hostCredits || 0} host credit{user.hostCredits === 1 ? '' : 's'}</span>
                <span><i className="fa-solid fa-route" style={{ color: 'var(--fire)' }} /> {user.joinCredits || 0} join credit{user.joinCredits === 1 ? '' : 's'}</span>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 20 }}>
            <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Payment history</h4>
            {loading ? (
              <Loader label="Loading payments…" />
            ) : payments.length === 0 ? (
              <div className="empty-state"><i className="fa-solid fa-credit-card" /><p>No payments yet.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {payments.map((p) => (
                  <div key={p._id} className="notif-item">
                    <div className="notif-icon"><i className="fa-solid fa-credit-card" /></div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.88rem' }}>
                        {p.purpose === 'trip_pack'
                          ? `Trip Pass - ${p.packTier} trip${p.packTier > 1 ? 's' : ''}`
                          : `${PREF_LABEL[p.planPreference] || 'Membership'}${p.planDuration ? ` · ${planDurationLabel(p.planDuration)}` : ''}`}
                      </strong>
                      <p className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {p.couponUsed ? `${p.couponUsed} · ` : ''}{timeAgo(p.createdAt)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700 }}>{paiseToRupee(p.amount)}</div>
                      <span className={`badge ${p.status === 'success' ? 'badge-green' : p.status === 'failed' ? 'badge-red' : 'badge-gold'}`}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
