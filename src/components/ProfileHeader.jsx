import { Link } from 'react-router-dom';
import { imageUrl, rupee, paiseToRupee, formatDate, AVATAR_FALLBACK, DESTINATION_PLACEHOLDER, SOCIAL_PLATFORMS, socialUrl, CLUB_CATEGORY_ICON } from '../lib/helpers.js';
import { VerifiedIcon, FounderPill } from './VerificationBadge.jsx';
import { toast } from '../lib/toast.js';

// The Instagram-style profile header (avatar+stat cards, name/bio/meta
// chips, Member Of + socials cards) - shared by MemberDetail.jsx (any
// member) and Dashboard.jsx (your own profile) so both look identical.
export default function ProfileHeader({ member, id, actions }) {
  const hasClubs = member.clubs?.length > 0;
  const hasSocials = SOCIAL_PLATFORMS.some((p) => member[p.key]);
  const referralLink = member.referralCode ? `${window.location.origin}/join?ref=${member.referralCode}` : '';

  const copyReferralLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(referralLink);
    toast('fa-solid fa-clipboard', 'Referral link copied!');
  };

  return (
    <div className="ig-header">
      <div className="ig-top-row">
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            className="ig-avatar"
            src={imageUrl(member.avatarUrl, AVATAR_FALLBACK)}
            alt={member.fullName}
            onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
          />
          {hasClubs && (
            <span className="member-club-badge" title={member.clubs.map((c) => c.name).join(', ')}>
              <i className={CLUB_CATEGORY_ICON[member.clubs[0].category] || 'fa-solid fa-people-group'} />
            </span>
          )}
        </div>
        <div className="ig-stats">
          <div className="ig-stat"><strong>{member.stats?.tripsOrganized ?? 0}</strong><span>Trips</span></div>
          <Link to={`/members/${id}/followers`} className="ig-stat" style={{ color: 'inherit', textDecoration: 'none' }}><strong>{member.followersCount ?? 0}</strong><span>Followers</span></Link>
          <Link to={`/members/${id}/following`} className="ig-stat" style={{ color: 'inherit', textDecoration: 'none' }}><strong>{member.followingCount ?? 0}</strong><span>Following</span></Link>
        </div>
      </div>

      <div className="ig-header-body">
        <div className="ig-name-row">
          <VerifiedIcon role={member.role} verificationLevel={member.verificationLevel} isVerified={member.isVerified} />
          <h1>{member.fullName}</h1>
          <FounderPill role={member.role} />
        </div>

        {member.username && <p className="ig-username">@{member.username}</p>}
        <p className="ig-joined"><i className="fa-regular fa-calendar" /> Member since {formatDate(member.createdAt)}</p>

        <div className="ig-chip-row">
          {member.profession && <span className="ig-chip"><i className="fa-solid fa-briefcase" /> {member.profession}</span>}
          <span className="ig-chip">
            <i className="fa-solid fa-location-dot" /> {[member.city, member.state].filter(Boolean).join(', ') || 'India'}{member.age ? ` · ${member.age}` : ''}
          </span>
          {member.vehicleType && (
            <span className="ig-chip ig-chip-accent">
              <i className="fa-solid fa-car" /> {member.vehicleType}{member.vehicleModel ? ` · ${member.vehicleModel}` : ''}
            </span>
          )}
        </div>

        {member.bio && <p className="ig-bio">{member.bio}</p>}

        {member.mutualFollowersTotal > 0 && (
          <div className="ig-mutual-row">
            <div className="ig-mutual-avatars">
              {member.mutualFollowers.slice(0, 3).map((f) => (
                <img
                  key={f.id}
                  src={imageUrl(f.avatarUrl, AVATAR_FALLBACK)}
                  alt=""
                  onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
                />
              ))}
            </div>
            <span className="text-muted" style={{ fontSize: '0.82rem' }}>
              Followed by{' '}
              {member.mutualFollowers.slice(0, 2).map((f, i) => (
                <span key={f.id}>
                  {i > 0 && ', '}
                  <Link to={`/members/${f.username || f.id}`} style={{ color: 'var(--text)', fontWeight: 600 }}>{f.username || f.fullName}</Link>
                </span>
              ))}
              {member.mutualFollowersTotal > 2 && ` and ${member.mutualFollowersTotal - 2} other${member.mutualFollowersTotal - 2 === 1 ? '' : 's'}`}
            </span>
          </div>
        )}

        {actions}

        {(hasClubs || hasSocials) && (
          <div className="ig-bottom-row">
            {hasClubs && (
              <div className="ig-member-of-card">
                <div className="profile-interests-label"><i className="fa-solid fa-people-group" /> Member Of</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {member.clubs.map((c) => (
                    <Link key={c._id} to={`/clubs/${c._id}`} className="ig-club-row">
                      <img
                        src={imageUrl(c.photoUrl, DESTINATION_PLACEHOLDER)}
                        alt=""
                        onError={(e) => (e.currentTarget.src = DESTINATION_PLACEHOLDER)}
                      />
                      {c.name}
                      <i className="fa-solid fa-chevron-right" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {hasSocials && (
              <div className="ig-social-card">
                <div className="profile-interests-label"><i className="fa-solid fa-share-nodes" /> Social Links</div>
                <div className="ig-social-icons">
                  {SOCIAL_PLATFORMS.filter((p) => member[p.key]).map((p) => (
                    <a key={p.key} href={socialUrl(p.key, member[p.key])} target="_blank" rel="noreferrer" title={p.label} className="ig-social-icon">
                      <i className={p.icon} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {member.influencer && (
          <div className="card mt-3" style={{ padding: 16, background: 'rgba(255,201,77,0.08)', borderColor: 'rgba(255,201,77,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>
              <i className="fa-solid fa-star" /> Influencer
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem' }}>{member.influencer.couponCode}</span>
              <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                Use this code for {member.influencer.discountPct ? `${member.influencer.discountPct}% off` : `${rupee(member.influencer.discountAmt)} off`} your membership
              </span>
            </div>
          </div>
        )}

        {member.isSelf && (
          <Link
            to="/dashboard?tab=settings&view=wallet"
            className="card mt-3"
            style={{ padding: 16, display: 'block', textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#6ee7b7' }}>
                <i className="fa-solid fa-wallet" /> Wallet
              </div>
              <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                Withdraw <i className="fa-solid fa-chevron-right" />
              </span>
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: 6 }}>
              {paiseToRupee(member.walletBalancePaise)}
            </div>
          </Link>
        )}

        {member.isSelf && member.referralCode && (
          <Link
            to="/referrals"
            className="card mt-3"
            style={{ padding: 16, display: 'block', textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: 'var(--fire)' }}>
                <i className="fa-solid fa-gift" /> Referrals
              </div>
              <span className="badge badge-fire">{member.referralCount ?? 0} joined</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.85rem', flex: '1 1 200px', minWidth: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {referralLink}
              </span>
              <button type="button" className="btn btn-sm btn-outline" onClick={copyReferralLink}>
                <i className="fa-solid fa-copy" /> Copy
              </button>
            </div>
            <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>
              Share this link and earn wallet rewards <i className="fa-solid fa-chevron-right" />
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
