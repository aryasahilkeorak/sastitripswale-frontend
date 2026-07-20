import { useEffect, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { useAuth } from '../../store/auth.js';
import { imageUrl, paiseToRupee, formatDate, timeAgo, AVATAR_FALLBACK, DOC_FALLBACK, PREF_LABEL } from '../../lib/helpers.js';
import { toast } from '../../lib/toast.js';
import Loader from '../../components/Loader.jsx';
import Modal from '../../components/Modal.jsx';

const DOC_STATUS_BADGE = { pending: 'badge-gold', verified: 'badge-green', rejected: 'badge-red' };

export default function AdminUsers() {
  const isSuper = useAuth((s) => s.user?.role) === 'superadmin';
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState(null);

  // Live search — debounced so every keystroke doesn't fire a request.
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api.get('/admin/users', { params: { search: search.trim(), limit: 60 } })
        .then((r) => setUsers(r.data.users)).catch(() => {}).finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

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
      <form className="search-bar mb-3" style={{ maxWidth: 460 }} onSubmit={(e) => e.preventDefault()}>
        <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-3)' }} />
        <input placeholder="Search name / email / mobile" value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && (
          <button type="button" className="btn btn-sm btn-outline" onClick={() => setSearch('')}>
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </form>

      {loading ? <Loader /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Paid</th><th>Coupon</th><th>Verified</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label="Name">
                    <span className="admin-clickable" onClick={() => setDetailId(u.id)}>{u.fullName}</span>
                    {u.role === 'admin' && <span className="badge badge-gold" style={{ marginLeft: 8, fontSize: '0.62rem' }}>Admin</span>}
                  </td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Mobile">{u.mobile}</td>
                  <td data-label="Paid">{u.membershipPaid ? <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7' }} /> : '—'}</td>
                  <td data-label="Coupon">{u.couponUsed ? <span className="badge badge-cyan">{u.couponUsed}</span> : '—'}</td>
                  <td data-label="Verified">{u.isVerified ? <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7' }} /> : '—'}</td>
                  <td data-label="Status"><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'active' : 'banned'}</span></td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-sm btn-outline" title="View details" onClick={() => setDetailId(u.id)}><i className="fa-solid fa-eye" /></button>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}
                        title={u.isActive ? 'Disable account' : 'Enable account'}
                        onClick={() => toggle(u.id)}
                      >
                        {u.isActive ? 'Ban' : 'Unban'}
                      </button>
                      {(isSuper || u.role === 'member') && (
                        <button
                          className="btn btn-sm"
                          style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5' }}
                          title="Delete user permanently"
                          onClick={() => removeUser(u.id)}
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      )}
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

  const reviewDoc = async (docId, action) => {
    try {
      const { data } = await api.patch(`/admin/documents/${docId}`, { action });
      setD((x) => ({ ...x, documents: x.documents.map((doc) => (doc._id === docId ? data.document : doc)) }));
      toast(action === 'verify' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark', action === 'verify' ? 'Document verified' : 'Document rejected — member can re-upload it');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  return (
    <Modal open={Boolean(id)} onClose={onClose} title="Member details" maxWidth={900}>
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
              <Row label="Signup coupon" value={u.couponUsed} />
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
                <div key={doc._id} className="card" style={{ padding: 8 }}>
                  <a href={imageUrl(doc.fileUrl)} target="_blank" rel="noreferrer">
                    <img className="doc-thumb" src={imageUrl(doc.fileUrl)} alt={doc.docType} onError={(e) => (e.currentTarget.src = DOC_FALLBACK)} />
                  </a>
                  <div className="row-between" style={{ marginTop: 6, alignItems: 'center' }}>
                    <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      {doc.docType.replace('_', ' ')}{doc.side ? ` (${doc.side})` : ''} <i className="fa-solid fa-up-right-from-square" />
                    </div>
                    <span className={`badge ${DOC_STATUS_BADGE[doc.status] || 'badge-gold'}`} style={{ fontSize: '0.6rem' }}>{doc.status || 'pending'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button className="btn btn-sm btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => reviewDoc(doc._id, 'verify')}>
                      <i className="fa-solid fa-check" /> Verify
                    </button>
                    <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => reviewDoc(doc._id, 'reject')}>
                      <i className="fa-solid fa-xmark" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Couples Mode partner safety info — mobile + gov ID, collected once in the member's own profile */}
          {(u.partnerMobile || u.partnerDocUrl) && (
            <>
              <h4 className="mt-3 mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>
                <i className="fa-solid fa-heart" style={{ color: '#ec4899' }} /> Couples Mode — Partner Safety Info
              </h4>
              <Row label="Partner's mobile" value={u.partnerMobile} />
              {u.partnerDocUrl && (
                <a href={imageUrl(u.partnerDocUrl)} target="_blank" rel="noreferrer" className="card mt-2" style={{ padding: 8, maxWidth: 160, display: 'inline-block' }}>
                  <img className="doc-thumb" src={imageUrl(u.partnerDocUrl)} alt="Partner ID" onError={(e) => (e.currentTarget.src = DOC_FALLBACK)} />
                  <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', marginTop: 6 }}>Partner ID <i className="fa-solid fa-up-right-from-square" /></div>
                </a>
              )}
            </>
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
              <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5', marginLeft: 'auto' }} onClick={() => onDelete(u.id)}>
                <i className="fa-solid fa-trash" /> Delete user
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
