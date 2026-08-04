import { useEffect, useState } from 'react';
import { api, apiError } from '../lib/api.js';
import { imageUrl, AVATAR_FALLBACK, timeAgo } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';

export default function Referrals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/referrals/me')
      .then((r) => setData(r.data))
      .catch((e) => toast('fa-solid fa-circle-xmark', apiError(e)))
      .finally(() => setLoading(false));
  }, []);

  const shareLink = data?.referralCode ? `${window.location.origin}/join?ref=${data.referralCode}` : '';

  const copyLink = () => {
    navigator.clipboard?.writeText(shareLink);
    toast('fa-solid fa-clipboard', 'Referral link copied!');
  };

  const shareLinkNative = () => {
    if (navigator.share) {
      navigator.share({ title: 'Join me on SastiTripsWale', url: shareLink }).catch(() => {});
    } else {
      copyLink();
    }
  };

  if (loading) {
    return (
      <section className="detail-section">
        <div className="container text-center"><span className="spinner" /></div>
      </section>
    );
  }

  return (
    <section className="detail-section">
      <div className="container" style={{ maxWidth: 700 }}>
        <div className="text-center mb-4">
          <div className="section-tag" style={{ margin: '0 auto 12px' }}>
            <i className="fa-solid fa-gift" /> Refer &amp; Grow the Tribe
          </div>
          <h1 className="section-title" style={{ fontSize: '2rem' }}>
            Your <span className="highlight">Referrals</span>
          </h1>
        </div>

        {!data?.enabled && (
          <div className="card mb-3" style={{ padding: 14, borderColor: 'rgba(255,107,0,0.3)' }}>
            <strong>Referrals are currently paused</strong>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              The admin has temporarily turned off new referral signups. Your code and history below are still yours.
            </p>
          </div>
        )}

        <div className="card mb-3" style={{ padding: 16, textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Your referral code</p>
          <div
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 700,
              letterSpacing: 2, color: 'var(--fire)', margin: '8px 0',
            }}
          >
            {data?.referralCode}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
            <button className="btn btn-primary" onClick={shareLinkNative} disabled={!data?.enabled}>
              <i className="fa-solid fa-share-nodes" /> Share link
            </button>
            <button className="btn btn-outline" onClick={copyLink} disabled={!data?.enabled}>
              <i className="fa-solid fa-copy" /> Copy link
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div className="row-between mb-3">
            <h4 style={{ fontFamily: 'var(--font-display)' }}>People you've referred</h4>
            <span className="badge badge-fire">{data?.referralCount || 0}</span>
          </div>

          {!data?.referredUsers?.length ? (
            <div className="empty-state">
              <i className="fa-solid fa-user-group" />
              <p>No one has joined with your code yet. Share your link to start earning referrals!</p>
            </div>
          ) : (
            data.referredUsers.map((u) => (
              <div key={u._id} className="row-between" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={imageUrl(u.avatarUrl, AVATAR_FALLBACK)}
                    alt=""
                    style={{ width: 36, height: 36, borderRadius: '50%' }}
                  />
                  <span style={{ fontSize: '0.88rem' }}>{u.fullName}</span>
                </div>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>{timeAgo(u.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
