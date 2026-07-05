import { useEffect, useState } from 'react';
import { api, apiError } from '../lib/api.js';
import { paiseToRupee, timeAgo, formatDate } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import Loader from '../components/Loader.jsx';

const TABS = ['overview', 'users', 'trips', 'coupons', 'reviews', 'messages'];

export default function Admin() {
  const [tab, setTab] = useState('overview');

  return (
    <section style={{ paddingTop: 100 }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div className="notif-icon" style={{ width: 48, height: 48, fontSize: '1.4rem' }}><i className="ri-shield-star-line" /></div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>Admin Panel</h1>
            <p className="text-muted" style={{ fontSize: '0.82rem' }}>Manage members, trips, coupons and reviews</p>
          </div>
        </div>

        <div className="dash-tabs">
          {TABS.map((t) => (
            <button key={t} className={`dash-tab${tab === t ? ' active' : ''}`} style={{ textTransform: 'capitalize' }} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && <Overview />}
        {tab === 'users' && <Users />}
        {tab === 'trips' && <Trips />}
        {tab === 'coupons' && <Coupons />}
        {tab === 'reviews' && <Reviews />}
        {tab === 'messages' && <Messages />}
      </div>
    </section>
  );
}

function Overview() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/admin/stats').then((r) => setData(r.data)).catch(() => {});
  }, []);
  if (!data) return <Loader />;
  const s = data.stats;
  const cards = [
    { icon: '👥', num: s.users.total, label: 'Members' },
    { icon: '💳', num: s.users.paid, label: 'Paid' },
    { icon: '✅', num: s.users.verified, label: 'Verified' },
    { icon: '🗺️', num: s.trips.total, label: 'Trips' },
    { icon: '💰', num: paiseToRupee(s.payments.revenuePaise), label: 'Revenue' },
    { icon: '⭐', num: s.reviews.average, label: `Avg (${s.reviews.count})` },
  ];
  return (
    <>
      <div className="grid-3 mb-4">
        {cards.map((c) => (
          <div className="mini-stat" key={c.label}><div style={{ fontSize: '1.4rem' }}>{c.icon}</div><div className="num">{c.num}</div><div className="lbl">{c.label}</div></div>
        ))}
      </div>
      <div className="grid-2">
        <div className="card" style={{ padding: 20 }}>
          <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Recent signups</h4>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Name</th><th>City</th><th>Joined</th></tr></thead>
              <tbody>{data.recentSignups.map((u) => <tr key={u.id}><td>{u.fullName}</td><td>{u.city || '—'}</td><td>{formatDate(u.createdAt)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Recent payments</h4>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>User</th><th>Amount</th><th>When</th></tr></thead>
              <tbody>{data.recentPayments.map((p) => <tr key={p._id}><td>{p.user?.fullName || '—'}</td><td>{paiseToRupee(p.amount)}</td><td>{timeAgo(p.createdAt)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/users', { params: { search: q, limit: 50 } }).then((r) => setUsers(r.data.users)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [q]);

  const verify = async (id, verified) => {
    try {
      await api.patch(`/admin/users/${id}/verify`, { verified });
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, isVerified: verified } : u)));
      toast('✅', verified ? 'Member verified' : 'Verification removed');
    } catch (e) { toast('❌', apiError(e)); }
  };
  const toggle = async (id) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/toggle`);
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, isActive: data.isActive } : u)));
      toast(data.isActive ? '✅' : '⛔', data.isActive ? 'Member unbanned' : 'Member banned');
    } catch (e) { toast('❌', apiError(e)); }
  };

  return (
    <>
      <form className="search-bar mb-3" style={{ maxWidth: 420 }} onSubmit={(e) => { e.preventDefault(); setQ(search.trim()); }}>
        <i className="ri-search-line" style={{ color: 'var(--text-3)' }} />
        <input placeholder="Search name / email / mobile" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-sm btn-primary">Search</button>
      </form>
      {loading ? <Loader /> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Paid</th><th>Verified</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.membershipPaid ? '✅' : '—'}</td>
                  <td>{u.isVerified ? '✅' : '—'}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'active' : 'banned'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => verify(u.id, !u.isVerified)}>{u.isVerified ? 'Unverify' : 'Verify'}</button>
                      <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => toggle(u.id)}>{u.isActive ? 'Ban' : 'Unban'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Trips() {
  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState('');
  const load = () => api.get('/admin/trips', { params: status ? { status } : {} }).then((r) => setTrips(r.data.trips)).catch(() => {});
  useEffect(() => { load(); }, [status]);

  const setTripStatus = async (id, value) => {
    try {
      await api.patch(`/admin/trips/${id}/status`, { status: value });
      setTrips((ts) => ts.map((t) => (t._id === id ? { ...t, status: value } : t)));
      toast('✅', 'Trip status updated');
    } catch (e) { toast('❌', apiError(e)); }
  };

  return (
    <>
      <div className="filter-chips">
        {['', 'upcoming', 'ongoing', 'completed', 'cancelled'].map((s) => (
          <button key={s || 'all'} className={`chip${status === s ? ' active' : ''}`} onClick={() => setStatus(s)} style={{ textTransform: 'capitalize' }}>{s || 'All'}</button>
        ))}
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Trip</th><th>Organizer</th><th>Dates</th><th>Seats</th><th>Status</th></tr></thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t._id}>
                <td>{t.title || t.destination}</td>
                <td>{t.organizer?.fullName || '—'}</td>
                <td>{formatDate(t.startDate)}</td>
                <td>{t.filledSeats}/{t.totalSeats}</td>
                <td>
                  <select className="form-input" style={{ padding: '6px 10px', width: 'auto' }} value={t.status} onChange={(e) => setTripStatus(t._id, e.target.value)}>
                    <option value="upcoming">upcoming</option><option value="ongoing">ongoing</option><option value="completed">completed</option><option value="cancelled">cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({ code: '', discountPct: '', discountAmt: '', maxUses: 1000 });
  const load = () => api.get('/admin/coupons').then((r) => setCoupons(r.data.coupons)).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', form);
      toast('🎟️', 'Coupon created');
      setForm({ code: '', discountPct: '', discountAmt: '', maxUses: 1000 });
      load();
    } catch (err) { toast('❌', apiError(err)); }
  };
  const toggle = async (id) => {
    try { const { data } = await api.patch(`/admin/coupons/${id}`); setCoupons((cs) => cs.map((c) => (c._id === id ? { ...c, isActive: data.isActive } : c))); }
    catch (e) { toast('❌', apiError(e)); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this coupon permanently?')) return;
    try { await api.delete(`/admin/coupons/${id}`); setCoupons((cs) => cs.filter((c) => c._id !== id)); toast('🗑️', 'Coupon removed'); }
    catch (e) { toast('❌', apiError(e)); }
  };

  return (
    <div className="grid-2">
      <form className="card" style={{ padding: 24, alignSelf: 'flex-start' }} onSubmit={create}>
        <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Create coupon</h4>
        <div className="form-group"><label>Code</label><input className="form-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
        <div className="form-row">
          <div className="form-group"><label>% off</label><input className="form-input" type="number" value={form.discountPct} onChange={(e) => setForm({ ...form, discountPct: e.target.value })} /></div>
          <div className="form-group"><label>₹ off</label><input className="form-input" type="number" value={form.discountAmt} onChange={(e) => setForm({ ...form, discountAmt: e.target.value })} /></div>
        </div>
        <div className="form-group"><label>Max uses</label><input className="form-input" type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></div>
        <button className="btn btn-primary"><i className="ri-add-line" /> Create</button>
      </form>
      <div className="card" style={{ padding: 20 }}>
        <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>All coupons</h4>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Code</th><th>Discount</th><th>Used</th><th></th></tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{c.code}</td>
                  <td>{c.discountPct ? `${c.discountPct}%` : `₹${c.discountAmt}`}</td>
                  <td>{c.usedCount}/{c.maxUses}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className={`btn btn-sm ${c.isActive ? 'btn-outline' : 'btn-primary'}`} onClick={() => toggle(c._id)}>{c.isActive ? 'Disable' : 'Enable'}</button>
                      <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => remove(c._id)} title="Remove coupon"><i className="ri-delete-bin-line" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const load = () => api.get('/admin/reviews').then((r) => setReviews(r.data.reviews)).catch(() => {});
  useEffect(() => { load(); }, []);
  const feature = async (id, featured) => {
    try { await api.patch(`/admin/reviews/${id}/feature`, { featured }); setReviews((rs) => rs.map((r) => (r._id === id ? { ...r, isFeatured: featured } : r))); toast('⭐', featured ? 'Featured' : 'Unfeatured'); }
    catch (e) { toast('❌', apiError(e)); }
  };
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>User</th><th>Rating</th><th>Review</th><th>Featured</th></tr></thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r._id}>
              <td>{r.user?.fullName || '—'}</td>
              <td>{'★'.repeat(r.rating)}</td>
              <td style={{ maxWidth: 320 }}>{r.message}</td>
              <td><button className={`btn btn-sm ${r.isFeatured ? 'btn-primary' : 'btn-outline'}`} onClick={() => feature(r._id, !r.isFeatured)}>{r.isFeatured ? 'Featured' : 'Feature'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Messages() {
  const [messages, setMessages] = useState([]);
  useEffect(() => { api.get('/admin/contact-messages').then((r) => setMessages(r.data.messages)).catch(() => {}); }, []);
  if (messages.length === 0) return <div className="empty-state"><i className="ri-mail-line" /><p>No messages yet.</p></div>;
  return (
    <div style={{ maxWidth: 760 }}>
      {messages.map((m) => (
        <div className="card mb-3" style={{ padding: 18 }} key={m._id}>
          <div className="row-between">
            <strong>{m.name} {m.subject ? <span className="text-muted" style={{ fontWeight: 400 }}>· {m.subject}</span> : ''}</strong>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>{timeAgo(m.createdAt)}</span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.82rem', margin: '4px 0' }}>{m.email} {m.mobile ? `· ${m.mobile}` : ''}</p>
          <p style={{ fontSize: '0.9rem' }}>{m.message}</p>
        </div>
      ))}
    </div>
  );
}
