import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import Loader from '../components/Loader.jsx';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const accessToken = useAuth((s) => s.accessToken);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

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
      toast('🔒', 'Log in to connect');
      navigate('/login');
      return;
    }
    setBusy(true);
    try {
      await api.post('/members/connect', { receiverId: id });
      toast('🤝', `Connection request sent to ${member.fullName}!`);
      load();
    } catch (err) {
      toast('❌', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div style={{ paddingTop: 120 }}><Loader /></div>;
  if (!member)
    return (
      <div className="empty-state" style={{ paddingTop: 160 }}>
        <i className="ri-user-line" /><p>Member not found.</p>
        <Link to="/members" className="btn btn-primary mt-3">All members</Link>
      </div>
    );

  return (
    <section style={{ paddingTop: 110 }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <Link to="/members" style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>
          <i className="ri-arrow-left-line" /> All members
        </Link>

        <div className="card mt-3" style={{ padding: 32, textAlign: 'center' }}>
          <img className="member-avatar" style={{ width: 110, height: 110 }} src={imageUrl(member.avatarUrl, AVATAR_FALLBACK)} alt={member.fullName} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginTop: 12 }}>{member.fullName}</h1>
          {member.isVerified && (
            <div className="verified-badge" style={{ justifyContent: 'center' }}>
              <i className="ri-verified-badge-fill" /> Verified member
            </div>
          )}
          <p className="text-muted mt-2">
            {member.profession ? `${member.profession} · ` : ''}
            {member.city || 'India'}
            {member.age ? ` · ${member.age}` : ''}
          </p>

          {member.bio && <p style={{ color: 'var(--text-2)', maxWidth: 460, margin: '14px auto 0', lineHeight: 1.8 }}>{member.bio}</p>}

          <div className="member-tags mt-3">
            {member.vehicleType && <span className="badge badge-fire">{member.vehicleType}{member.vehicleModel ? ` · ${member.vehicleModel}` : ''}</span>}
            {(member.travelInterests || []).map((t) => (
              <span key={t} className="badge badge-cyan">{t}</span>
            ))}
          </div>

          <div className="mt-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span className="id-chip">{member.id}</span>
            <button className="btn btn-sm btn-outline" onClick={() => { navigator.clipboard?.writeText(String(member.id)); toast('📋', 'User ID copied — use it to add them to a group'); }}>
              <i className="ri-file-copy-line" /> Copy ID
            </button>
          </div>

          <div className="grid-2 mt-4" style={{ maxWidth: 300, margin: '24px auto 0' }}>
            <div className="mini-stat"><div className="num">{member.stats?.tripsOrganized ?? 0}</div><div className="lbl">Trips Organized</div></div>
            <div className="mini-stat"><div className="num">{member.stats?.connections ?? 0}</div><div className="lbl">Connections</div></div>
          </div>

          {!member.isSelf && (
            <div className="mt-4">
              {member.connection?.status === 'accepted' ? (
                <span className="btn btn-lg" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }}><i className="ri-check-double-line" /> Connected</span>
              ) : member.connection?.status === 'pending' ? (
                <span className="btn btn-lg btn-outline" style={{ opacity: 0.7 }}><i className="ri-time-line" /> Request pending</span>
              ) : (
                <button className="btn btn-lg btn-primary" onClick={connect} disabled={busy}>
                  {busy ? <span className="spinner" /> : <i className="ri-user-add-line" />} Connect
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
