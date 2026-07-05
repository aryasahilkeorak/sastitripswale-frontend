import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { paiseToRupee, timeAgo, formatDate } from '../../lib/helpers.js';
import Loader from '../../components/Loader.jsx';

export default function AdminOverview() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/admin/stats').then((r) => setData(r.data)).catch(() => {});
  }, []);
  if (!data) return <Loader />;
  const s = data.stats;

  const cards = [
    { icon: 'fa-solid fa-sack-dollar', val: paiseToRupee(s.payments.activeRevenuePaise), lbl: 'Revenue (active users)' },
    { icon: 'fa-solid fa-wallet', val: paiseToRupee(s.payments.revenuePaise), lbl: 'Total revenue' },
    { icon: 'fa-solid fa-users', val: s.users.total, lbl: 'Members' },
    { icon: 'fa-solid fa-circle-check', val: s.users.paid, lbl: 'Paid members' },
    { icon: 'fa-solid fa-id-card', val: s.users.verified, lbl: 'Verified' },
    { icon: 'fa-solid fa-route', val: s.trips.total, lbl: 'Trips' },
    { icon: 'fa-solid fa-star', val: `${s.reviews.average} (${s.reviews.count})`, lbl: 'Avg rating' },
    { icon: 'fa-solid fa-headset', val: s.openQueries, lbl: 'Open queries' },
  ];

  return (
    <>
      <div className="admin-stats-grid mb-4">
        {cards.map((c) => (
          <div className="admin-stat" key={c.lbl}>
            <div className="ico"><i className={c.icon} /></div>
            <div className="val">{c.val}</div>
            <div className="lbl">{c.lbl}</div>
          </div>
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
