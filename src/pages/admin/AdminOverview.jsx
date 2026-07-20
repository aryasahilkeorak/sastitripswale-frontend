import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { paiseToRupee, timeAgo, formatDate } from '../../lib/helpers.js';
import Loader from '../../components/Loader.jsx';
import MultiLineChart from '../../components/MultiLineChart.jsx';

const GROWTH_SERIES = [
  { key: 'signups', label: 'New signups' },
  { key: 'trips', label: 'Trips created' },
  { key: 'interests', label: 'Join requests' },
];

// "2026-07-19" -> "19 Jul"
const shortDate = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleDateString('en-IN', { month: 'short' })}`;
};

export default function AdminOverview() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/admin/stats').then((r) => setData(r.data)).catch(() => {});
  }, []);
  if (!data) return <Loader />;
  const s = data.stats;

  const cards = [
    ...(s.payments
      ? [
          { icon: 'fa-solid fa-sack-dollar', val: paiseToRupee(s.payments.activeRevenuePaise), lbl: 'Revenue (active users)' },
          { icon: 'fa-solid fa-wallet', val: paiseToRupee(s.payments.revenuePaise), lbl: 'Total revenue' },
        ]
      : []),
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

      {s.growth?.length > 0 && (
        <div className="card mb-4" style={{ padding: 20 }}>
          <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Last 30 days</h4>
          <MultiLineChart data={s.growth} series={GROWTH_SERIES} formatDate={shortDate} />
        </div>
      )}

      <div className="grid-2">
        <div className="card" style={{ padding: 20 }}>
          <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Recent signups</h4>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Name</th><th>City</th><th>Joined</th></tr></thead>
              <tbody>{data.recentSignups.map((u) => <tr key={u.id}><td data-label="Name">{u.fullName}</td><td data-label="City">{u.city || '—'}</td><td data-label="Joined">{formatDate(u.createdAt)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        {s.payments && (
          <div className="card" style={{ padding: 20 }}>
            <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Recent payments</h4>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>User</th><th>Amount</th><th>Coupon</th><th>When</th></tr></thead>
                <tbody>{data.recentPayments.map((p) => <tr key={p._id}><td data-label="User">{p.user?.fullName || '—'}</td><td data-label="Amount">{paiseToRupee(p.amount)}</td><td data-label="Coupon">{p.couponUsed ? <span className="badge badge-cyan">{p.couponUsed}</span> : '—'}</td><td data-label="When">{timeAgo(p.createdAt)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
