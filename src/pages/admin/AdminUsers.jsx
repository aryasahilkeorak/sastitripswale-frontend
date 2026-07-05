import { useEffect, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { useAuth } from '../../store/auth.js';
import { imageUrl, paiseToRupee, formatDate, timeAgo, AVATAR_FALLBACK, DOC_FALLBACK, PREF_LABEL } from '../../lib/helpers.js';
import { toast } from '../../lib/toast.js';
import Loader from '../../components/Loader.jsx';
import Modal from '../../components/Modal.jsx';

export default function AdminUsers() {
  const isSuper = useAuth((s) => s.user?.role) === 'superadmin';
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/users', { params: { search: q, limit: 60 } })
      .then((r) => setUsers(r.data.users)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [q]);

  const patchLocal = (id, changes) => setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...changes } : u)));

  const verify = async (id, verified) => {
    try { await api.patch(`/admin/users/${id}/verify`, { verified }); patchLocal(id, { isVerified: verified }); toast('fa-solid fa-circle-check', verified ? 'Verified' : 'Unverified'); }
    catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
  };
  const toggle = async (id) => {
    try { const { data } = await api.patch(`/admin/users/${id}/toggle`); patchLocal(id, { isActive: data.isActive }); toast(data.isActive ? 'fa-solid fa-circle-check' : 'fa-solid fa-ban', data.isActive ? 'Unbanned' : 'Banned'); }
    catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
  };
  const removeUser = async (id) => {
    if (!window.confirm('Permanently DELETE this user and ALL their data? This cannot be undone.')) return;
    try { await api.delete(`/admin/users/${id}`); setUsers((us) => us.filter((u) => u.id !== id)); setDetailId(null); toast('fa-solid fa-trash', 'User deleted'); }
    catch (e) { toast('fa-solid fa-circle-xmark', apiError(e)); }
  };

  return (
    <>
      <form className="search-bar mb-3" style={{ maxWidth: 460 }} onSubmit={(e) => { e.preventDefault(); setQ(search.trim()); }}>
        <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-3)' }} />
        <input placeholder="Search name / email / mobile" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-sm btn-primary">Search</button>
      </form>

      {loading ? <Loader /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Paid</th><th>Verified</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><span className="admin-clickable" onClick={() => setDetailId(u.id)}>{u.fullName}</span></td>
                  <td>{u.email}</td>
                  <td>{u.mobile}</td>
                  <td>{u.membershipPaid ? <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7' }} /> : '—'}</td>
                  <td>{u.isVerified ? <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7' }} /> : '—'}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'active' : 'banned'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => setDetailId(u.id)}><i className="fa-solid fa-eye" /></button>
                      <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => toggle(u.id)}>{u.isActive ? 'Ban' : 'Unban'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserDetailModal
        id={detailId}
        isSuper={isSuper}
        onClose={() => setDetailId(null)}
        onVerify={verify}
        onToggle={toggle}
        onDelete={removeUser}
      />
    </>
  );
}

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="row-between" style={{ padding: '7px 0', borderBottom: '1px solid var(--glass-bdr)' }}>
      <span className="text-muted" style={{ fontSize: '0.78rem' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function UserDetailModal({ id, isSuper, onClose, onVerify, onToggle, onDelete }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    if (!id) { setD(null); return; }
    api.get(`/admin/users/${id}`).then((r) => setD(r.data)).catch(() => {});
  }, [id]);

  if (!id) return null;
  const u = d?.user;

  return (
    <Modal open={Boolean(id)} onClose={onClose} title="Member details" maxWidth={640}>
      {!d ? <Loader /> : (
        <>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
            <img src={imageUrl(u.avatarUrl, AVATAR_FALLBACK)} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{u.fullName}</h3>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                {u.role !== 'member' && <span className={`role-badge ${u.role === 'superadmin' ? 'super' : 'admin'}`}>{u.role}</span>}
                <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'active' : 'banned'}</span>
                {u.isVerified && <span className="badge badge-cyan"><i className="fa-solid fa-circle-check" /> verified</span>}
                <span className={`badge ${u.membershipActive ? 'badge-green' : 'badge-gold'}`}>{u.membershipActive ? 'member' : 'inactive'}</span>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ gap: 24 }}>
            <div>
              <Row label="Email" value={u.email} />
              <Row label="Mobile" value={u.mobile} />
              <Row label="WhatsApp" value={u.whatsapp} />
              <Row label="Emergency" value={u.emergencyContact} />
              <Row label="City / State" value={[u.city, u.state].filter(Boolean).join(', ')} />
              <Row label="Gender / Age" value={[u.gender, u.age].filter(Boolean).join(' · ')} />
            </div>
            <div>
              <Row label="Profession" value={u.profession} />
              <Row label="Travels with" value={PREF_LABEL[u.coTravelerPreference]} />
              <Row label="Vehicle" value={[u.vehicleType, u.vehicleModel].filter(Boolean).join(' · ')} />
              <Row label="Plan" value={u.membershipActive ? `${u.membershipDuration === '1y' ? '1 year' : '6 months'} · till ${formatDate(u.membershipExpiresAt)}` : 'Inactive'} />
              <Row label="Trips (host / joined)" value={`${d.stats.tripsOrganized} / ${d.stats.tripsJoined}`} />
              <Row label="Connections" value={d.stats.connections} />
            </div>
          </div>

          {u.travelInterests?.length > 0 && (
            <div className="member-tags mt-2" style={{ justifyContent: 'flex-start' }}>
              {u.travelInterests.map((t) => <span key={t} className="badge badge-cyan">{t}</span>)}
            </div>
          )}

          {/* Documents */}
          <h4 className="mt-3 mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>ID Documents</h4>
          {d.documents.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.82rem' }}>No documents uploaded.</p>
          ) : (
            <div className="grid-2">
              {d.documents.map((doc) => (
                <a key={doc._id} href={imageUrl(doc.fileUrl)} target="_blank" rel="noreferrer" className="card" style={{ padding: 8 }}>
                  <img className="doc-thumb" src={imageUrl(doc.fileUrl)} alt={doc.docType} onError={(e) => (e.currentTarget.src = DOC_FALLBACK)} />
                  <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', marginTop: 6 }}>{doc.docType} <i className="fa-solid fa-up-right-from-square" /></div>
                </a>
              ))}
            </div>
          )}

          {/* Payments */}
          {d.payments.length > 0 && (
            <>
              <h4 className="mt-3 mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>Payments</h4>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Amount</th><th>Status</th><th>Coupon</th><th>When</th></tr></thead>
                  <tbody>{d.payments.map((p) => <tr key={p._id}><td>{paiseToRupee(p.amount)}</td><td>{p.status}</td><td>{p.couponUsed || '—'}</td><td>{timeAgo(p.createdAt)}</td></tr>)}</tbody>
                </table>
              </div>
            </>
          )}

          {/* Actions */}
          {u.role === 'member' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              <button className="btn btn-sm btn-outline" onClick={() => { onVerify(u.id, !u.isVerified); setD((x) => ({ ...x, user: { ...x.user, isVerified: !x.user.isVerified } })); }}>
                <i className="fa-solid fa-circle-check" /> {u.isVerified ? 'Unverify' : 'Verify'}
              </button>
              <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => { onToggle(u.id); setD((x) => ({ ...x, user: { ...x.user, isActive: !x.user.isActive } })); }}>
                {u.isActive ? 'Ban' : 'Unban'}
              </button>
              {isSuper && (
                <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5', marginLeft: 'auto' }} onClick={() => onDelete(u.id)}>
                  <i className="fa-solid fa-trash" /> Delete user
                </button>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
