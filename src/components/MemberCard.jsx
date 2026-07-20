import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';

export default function MemberCard({ member }) {
  const navigate = useNavigate();
  const accessToken = useAuth((s) => s.accessToken);
  const [conn, setConn] = useState(member.connection);
  const [busy, setBusy] = useState(false);

  const connect = async (e) => {
    e.preventDefault();
    if (!accessToken) {
      toast('fa-solid fa-lock', 'Log in to connect with members');
      navigate('/login');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/members/connect', { receiverId: member.id });
      setConn({ status: data.status, direction: 'sent' });
      toast('fa-solid fa-handshake', `Connection request sent to ${member.fullName}!`);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  let btn;
  if (member.isSelf) {
    btn = (
      <Link to="/dashboard" className="btn btn-sm btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
        This is you
      </Link>
    );
  } else if (conn?.status === 'accepted') {
    btn = (
      <span className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }}>
        <i className="fa-solid fa-check-double" /> Connected
      </span>
    );
  } else if (conn?.status === 'pending') {
    btn = (
      <span className="btn btn-sm btn-outline" style={{ width: '100%', justifyContent: 'center', opacity: 0.7 }}>
        <i className="fa-regular fa-clock" /> {conn.direction === 'received' ? 'Respond in dashboard' : 'Requested'}
      </span>
    );
  } else {
    btn = (
      <button className="btn btn-sm btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={connect} disabled={busy}>
        <i className="fa-solid fa-user-plus" /> Connect
      </button>
    );
  }

  return (
    <div className="member-card fade-up">
      <Link to={`/members/${member.id}`} style={{ color: 'inherit' }}>
        <div className="member-avatar">
          <img
            src={imageUrl(member.avatarUrl, AVATAR_FALLBACK)}
            alt={member.fullName}
            onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
          />
        </div>
        <h3>{member.fullName}</h3>
        {member.role === 'superadmin' ? (
          <div className="verified-badge founder-badge" style={{ justifyContent: 'center' }}>
            <i className="fa-solid fa-crown" /> Founder
          </div>
        ) : member.isVerified && (
          <div className="verified-badge" style={{ justifyContent: 'center' }}>
            <i className="fa-solid fa-circle-check" /> Verified
          </div>
        )}
      </Link>
      <p className="member-meta">
        {member.city || 'India'}
        {member.age ? ` • ${member.age}` : ''}
      </p>
      {member.profession && <p className="member-meta">{member.profession}</p>}

      <div className="member-tags">
        {member.vehicleType && <span className="badge badge-fire">{member.vehicleType}</span>}
        {(member.travelInterests || []).slice(0, 2).map((t) => (
          <span key={t} className="badge badge-cyan">
            {t}
          </span>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>{btn}</div>
    </div>
  );
}
