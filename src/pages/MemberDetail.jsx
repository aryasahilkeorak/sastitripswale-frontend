import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, rupee, formatDate, AVATAR_FALLBACK, SOCIAL_PLATFORMS, socialUrl, TRAVEL_INTEREST_ICONS } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import Loader from '../components/Loader.jsx';
import Lightbox from '../components/Lightbox.jsx';
import Modal from '../components/Modal.jsx';
import ProfileEditForm from '../components/ProfileEditForm.jsx';
import DestinationImage from '../components/DestinationImage.jsx';

const TABS = [
  { key: 'trips', label: 'Trips', icon: 'fa-solid fa-map-location-dot' },
  { key: 'photos', label: 'Photos', icon: 'fa-regular fa-image' },
];

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const accessToken = useAuth((s) => s.accessToken);
  const authUser = useAuth((s) => s.user);
  const setAuthUser = useAuth((s) => s.setUser);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('trips');
  const [lb, setLb] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const load = () => {
    setLoading(true);
    api
      .get(`/members/${id}`)
      .then((r) => setMember(r.data.member))
      .catch(() => setMember(null))
      .finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const connect = async () => {
    if (!accessToken) {
      toast('fa-solid fa-lock', 'Log in to connect');
      navigate('/login');
      return;
    }
    setBusy(true);
    try {
      await api.post('/members/connect', { receiverId: id });
      toast('fa-solid fa-handshake', `Connection request sent to ${member.fullName}!`);
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const respond = async (action) => {
    setBusy(true);
    try {
      await api.patch(`/members/connect/${member.connection.connectionId}`, { action });
      toast(
        action === 'accept' ? 'fa-solid fa-handshake' : 'fa-solid fa-hand',
        action === 'accept' ? 'Connection accepted!' : 'Request declined'
      );
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const message = async () => {
    setBusy(true);
    try {
      const { data } = await api.get(`/chat/dm/${id}`);
      navigate(`/chat/${data.groupId}`);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const shareProfile = () => {
    setMenuOpen(false);
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${member.fullName} on SastiTripsWale`, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast('fa-solid fa-clipboard', 'Profile link copied!');
    }
  };

  const copyProfileUrl = () => {
    setMenuOpen(false);
    navigator.clipboard?.writeText(window.location.href);
    toast('fa-solid fa-clipboard', 'Profile link copied!');
  };

  const toggleBlockUser = async () => {
    setMenuOpen(false);
    if (!member.isBlockedByMe && !window.confirm(`Block ${member.fullName}? They won't be able to connect or message you.`)) return;
    try {
      const { data } = await api.post(`/members/${id}/block`);
      toast(data.blocked ? 'fa-solid fa-ban' : 'fa-solid fa-circle-check', data.blocked ? 'Member blocked' : 'Member unblocked');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const openReport = () => {
    setMenuOpen(false);
    setReportReason('');
    setShowReport(true);
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return toast('fa-solid fa-triangle-exclamation', 'Please describe the issue');
    setReportBusy(true);
    try {
      await api.post(`/members/${id}/report`, { reason: reportReason.trim() });
      toast('fa-solid fa-flag', 'Report sent to our team — thanks for flagging this');
      setShowReport(false);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setReportBusy(false);
    }
  };

  if (loading) return <div style={{ paddingTop: 120 }}><Loader /></div>;
  if (!member)
    return (
      <div className="empty-state" style={{ paddingTop: 160 }}>
        <i className="fa-solid fa-user" /><p>Member not found.</p>
        <Link to="/members" className="btn btn-primary mt-3">All members</Link>
      </div>
    );

  const photoImgs = (member.recentPhotos || []).map((p) => imageUrl(p.photoUrl));

  return (
    <section style={{ paddingTop: 110, paddingBottom: 60 }}>
      <div className="container" style={{ maxWidth: 1120 }}>
        <Link to="/members" style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>
          <i className="fa-solid fa-arrow-left" /> All members
        </Link>

        <div className="detail-grid mt-3">
          <div>
        <div className="ig-header">
          <div className="ig-top-row">
            <img
              className="ig-avatar"
              src={imageUrl(member.avatarUrl, AVATAR_FALLBACK)}
              alt={member.fullName}
              onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
            />
            <div className="ig-stats">
              <div className="ig-stat"><strong>{member.stats?.tripsOrganized ?? 0}</strong><span>Trips</span></div>
              <div className="ig-stat"><strong>{member.stats?.connections ?? 0}</strong><span>Connections</span></div>
              <div className="ig-stat"><strong>{member.stats?.photos ?? 0}</strong><span>Photos</span></div>
            </div>
          </div>

          <div className="ig-header-body">
            <div className="ig-name-row">
              <h1>{member.fullName}</h1>
              {member.role === 'superadmin' ? (
                <span className="verified-badge founder-badge"><i className="fa-solid fa-crown" /> Founder</span>
              ) : member.isVerified && (
                <span className="verified-badge"><i className="fa-solid fa-circle-check" /> Verified</span>
              )}
              <button
                className="ig-id-btn"
                onClick={() => {
                  navigator.clipboard?.writeText(String(member.id));
                  toast('fa-solid fa-clipboard', 'User ID copied — use it to add them to a group');
                }}
                title="Copy user ID"
              >
                <i className="fa-solid fa-copy" />
              </button>

              <div className="ig-menu" ref={menuRef} style={{ marginLeft: 'auto', position: 'relative' }}>
                <button className="ig-id-btn" onClick={() => setMenuOpen((v) => !v)} title="More options">
                  <i className="fa-solid fa-ellipsis-vertical" />
                </button>
                {menuOpen && (
                  <div className="ig-menu-dropdown">
                    <button onClick={shareProfile}><i className="fa-solid fa-share-nodes" /> Share profile</button>
                    <button onClick={copyProfileUrl}><i className="fa-solid fa-link" /> Copy profile URL</button>
                    {!member.isSelf && accessToken && (
                      <>
                        <button onClick={openReport}><i className="fa-solid fa-flag" /> Report user</button>
                        <button className="danger" onClick={toggleBlockUser}>
                          <i className="fa-solid fa-ban" /> {member.isBlockedByMe ? 'Unblock user' : 'Block user'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {member.username && <p className="ig-username">@{member.username}</p>}
            <p className="ig-joined">Member since {formatDate(member.createdAt)}</p>

            <p className="ig-meta">
              {member.profession && <span><i className="fa-solid fa-briefcase" /> {member.profession}</span>}
              <span><i className="fa-solid fa-location-dot" /> {member.city || 'India'}{member.age ? ` · ${member.age}` : ''}</span>
            </p>

            {member.bio && <p className="ig-bio">{member.bio}</p>}

            {member.vehicleType && (
              <div className="mt-2">
                <span className="badge badge-fire">
                  <i className="fa-solid fa-car" /> {member.vehicleType}{member.vehicleModel ? ` · ${member.vehicleModel}` : ''}
                </span>
              </div>
            )}

            {SOCIAL_PLATFORMS.some((p) => member[p.key]) && (
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                {SOCIAL_PLATFORMS.filter((p) => member[p.key]).map((p) => (
                  <a key={p.key} href={socialUrl(p.key, member[p.key])} target="_blank" rel="noreferrer" title={p.label} style={{ fontSize: '1.2rem', color: 'var(--text-2)' }}>
                    <i className={p.icon} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card ig-secondary-card mt-3">
          <div className="ig-actions">
            {member.isSelf ? (
              <button className="btn btn-outline" onClick={() => setShowEdit(true)}>
                <i className="fa-solid fa-pen" /> Edit Profile
              </button>
            ) : member.connection?.status === 'accepted' ? (
              <button className="btn btn-primary" onClick={message} disabled={busy}>
                <i className="fa-solid fa-comment-dots" /> Message
              </button>
            ) : member.connection?.status === 'pending' && member.connection.direction === 'received' ? (
              <>
                <button className="btn btn-primary" onClick={() => respond('accept')} disabled={busy}>
                  <i className="fa-solid fa-check" /> Accept
                </button>
                <button className="btn btn-outline" onClick={() => respond('reject')} disabled={busy}>
                  <i className="fa-solid fa-xmark" /> Decline
                </button>
              </>
            ) : member.connection?.status === 'pending' ? (
              <span className="btn btn-outline" style={{ opacity: 0.7 }}>
                <i className="fa-regular fa-clock" /> Request pending
              </span>
            ) : (
              <button className="btn btn-primary" onClick={connect} disabled={busy}>
                {busy ? <span className="spinner" /> : <i className="fa-solid fa-user-plus" />} Connect
              </button>
            )}
          </div>

          {member.travelInterests?.length > 0 && (
            <>
              <div className="ig-v-divider" />
              <div className="profile-interests">
                <div className="profile-interests-label"><i className="fa-solid fa-compass" /> Travel Interests</div>
                <div className="interest-pill-row">
                  {member.travelInterests.map((t) => (
                    <span key={t} className="interest-pill">
                      <i className={TRAVEL_INTEREST_ICONS[t] || 'fa-solid fa-star'} /> {t}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="ig-tabs mt-4">
          {TABS.map((t) => (
            <button key={t.key} className={`ig-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)} title={t.label}>
              <i className={t.icon} /> <span>{t.label}</span>
            </button>
          ))}
        </div>

        {tab === 'trips' ? (
          (member.recentTrips || []).length === 0 ? (
            <div className="empty-state mt-4"><i className="fa-solid fa-map-location-dot" /><p>No trips organized yet.</p></div>
          ) : (
            <div className="ig-grid mt-3">
              {member.recentTrips.map((t) => (
                <Link to={`/trips/${t._id}`} key={t._id} className="ig-tile">
                  <DestinationImage trip={t} loading="lazy" />
                  <div className="ig-tile-overlay">
                    <div className="ig-tile-dest">{t.destination}</div>
                    <div className="ig-tile-meta">{rupee(t.budgetPerHead)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (member.recentPhotos || []).length === 0 ? (
          <div className="empty-state mt-4"><i className="fa-regular fa-image" /><p>No photos yet.</p></div>
        ) : (
          <div className="ig-grid mt-3">
            {member.recentPhotos.map((p, i) => (
              <div className="ig-tile" key={p._id} onClick={() => setLb(i)}>
                <img src={photoImgs[i]} alt={p.caption || ''} loading="lazy" />
                <div className="ig-tile-overlay ig-tile-overlay-hover"><i className="fa-solid fa-magnifying-glass-plus" /></div>
              </div>
            ))}
          </div>
        )}
          </div>

          <SuggestedTravelers members={member.suggested} />
        </div>
      </div>

      <Lightbox images={photoImgs} index={lb} onClose={() => setLb(null)} onIndex={setLb} />

      {member.isSelf && (
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit profile" maxWidth={640}>
          <ProfileEditForm
            user={authUser}
            onSaved={(updated) => {
              setAuthUser(updated);
              setShowEdit(false);
              load();
            }}
          />
        </Modal>
      )}

      {!member.isSelf && (
        <Modal open={showReport} onClose={() => setShowReport(false)} title={`Report ${member.fullName}`}>
          <form onSubmit={submitReport}>
            <div className="form-group">
              <label>What's going on?</label>
              <textarea
                className="form-input"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue — fake profile, harassment, scam, etc."
                rows={5}
              />
            </div>
            <p className="text-muted" style={{ fontSize: '0.72rem', marginBottom: 14 }}>
              This goes straight to our admin team for review.
            </p>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={reportBusy}>
              {reportBusy ? <span className="spinner" /> : <i className="fa-solid fa-flag" />} Send report
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}

function SuggestedTravelers({ members }) {
  if (!members?.length) return null;
  return (
    <div className="card suggested-card" style={{ padding: 20 }}>
      <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
        <i className="fa-solid fa-user-group" style={{ color: 'var(--fire)' }} /> Suggested Travelers
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {members.map((m) => (
          <Link key={m.id} to={`/members/${m.id}`} className="suggested-row">
            <img
              className="suggested-ava"
              src={imageUrl(m.avatarUrl, AVATAR_FALLBACK)}
              alt={m.fullName}
              onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <strong style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.fullName}</strong>
                {m.isVerified && <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7', fontSize: '0.7rem' }} />}
              </div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{m.city || 'India'}</div>
              {m.sharedInterests?.length > 0 && (
                <div style={{ fontSize: '0.68rem', color: 'var(--fire-2)', marginTop: 2 }}>
                  <i className="fa-solid fa-star" /> {m.sharedInterests.slice(0, 2).join(', ')}
                  {m.sharedInterests.length > 2 ? ` +${m.sharedInterests.length - 2} more` : ''}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
