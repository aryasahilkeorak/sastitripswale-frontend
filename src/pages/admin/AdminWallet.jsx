import { useEffect, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { confirm } from '../../lib/confirm.js';
import { useAuth } from '../../store/auth.js';
import { imageUrl, authedFileUrl, paiseToRupee, formatDate, AVATAR_FALLBACK } from '../../lib/helpers.js';
import Lightbox from '../../components/Lightbox.jsx';
import Modal from '../../components/Modal.jsx';

const STATUS_BADGE = { pending: 'badge-gold', approved: 'badge-cyan', paid: 'badge-green', rejected: 'badge-red' };
const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminWallet() {
  const accessToken = useAuth((s) => s.accessToken);
  const [stats, setStats] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [qrPreview, setQrPreview] = useState(null);
  const [payingReq, setPayingReq] = useState(null); // withdrawal being marked paid
  const [transactionRef, setTransactionRef] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/wallet-stats').then((r) => setStats(r.data.stats)).catch(() => {}),
      api
        .get('/admin/withdrawals', { params: statusFilter ? { status: statusFilter } : {} })
        .then((r) => setWithdrawals(r.data.withdrawals))
        .catch(() => setWithdrawals([])),
    ]).finally(() => setLoading(false));
  };
  useEffect(load, [statusFilter]);

  const respond = async (id, action) => {
    if (action === 'reject' && !(await confirm({ message: 'Decline this request? The amount will be refunded to their wallet.', danger: true, confirmLabel: 'Decline' }))) return;
    try {
      await api.patch(`/admin/withdrawals/${id}`, { action });
      toast('fa-solid fa-circle-check', action === 'approve' ? 'Approved' : 'Declined & refunded');
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  const openMarkPaid = (w) => {
    setTransactionRef('');
    setPayingReq(w);
  };

  const confirmMarkPaid = async (e) => {
    e.preventDefault();
    if (!transactionRef.trim()) return toast('fa-solid fa-triangle-exclamation', 'Enter the UPI/bank transaction reference (UTR)');
    setBusy(true);
    try {
      await api.patch(`/admin/withdrawals/${payingReq._id}`, { action: 'paid', transactionRef: transactionRef.trim() });
      toast('fa-solid fa-circle-check', 'Marked paid');
      setPayingReq(null);
      load();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="grid-4 mb-4">
        <div className="card" style={{ padding: 18 }}>
          <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Paid Out</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{paiseToRupee(stats?.totalPaidPaise)}</div>
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{stats?.totalPaidCount || 0} payouts</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending Requests</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{paiseToRupee(stats?.totalPendingPaise)}</div>
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{stats?.totalPendingCount || 0} requests</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Approved (awaiting payout)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{paiseToRupee(stats?.totalApprovedPaise)}</div>
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{stats?.totalApprovedCount || 0} requests</div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Outstanding Wallet Balance</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{paiseToRupee(stats?.totalOutstandingPaise)}</div>
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{stats?.usersWithBalance || 0} members with balance</div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div className="row-between mb-3">
          <h4 style={{ fontFamily: 'var(--font-display)' }}>Withdrawal requests</h4>
          <div className="filter-chips">
            {STATUS_FILTERS.map((f) => (
              <button key={f.key} className={`chip${statusFilter === f.key ? ' active' : ''}`} onClick={() => setStatusFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Loading…</p>
        ) : withdrawals.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>No withdrawal requests here.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Payout details</th>
                  <th>QR</th>
                  <th>Status</th>
                  <th>Txn ref</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w._id}>
                    <td data-label="Member">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={imageUrl(w.user?.avatarUrl, AVATAR_FALLBACK)}
                          alt=""
                          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                          onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
                        />
                        <span>
                          {w.user?.fullName || 'Deleted user'}
                          <br />
                          <span className="text-muted" style={{ fontSize: '0.72rem' }}>{timeAgoOrDate(w.createdAt)}</span>
                        </span>
                      </div>
                    </td>
                    <td data-label="Amount" style={{ fontWeight: 700 }}>{paiseToRupee(w.amountPaise)}</td>
                    <td data-label="Payout details" style={{ fontSize: '0.78rem' }}>
                      <div>{w.name}</div>
                      <div className="text-muted">{w.email}</div>
                      <div className="text-muted" style={{ fontFamily: 'var(--font-mono)' }}>{w.upiId}</div>
                      <div className="text-muted" style={{ fontFamily: 'var(--font-mono)' }}>{w.panNumber}</div>
                    </td>
                    <td data-label="QR">
                      {w.qrCodeUrl && (
                        <img
                          src={authedFileUrl(w.qrCodeUrl, accessToken)}
                          alt="QR code"
                          onClick={() => setQrPreview(authedFileUrl(w.qrCodeUrl, accessToken))}
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--glass-bdr)' }}
                        />
                      )}
                    </td>
                    <td data-label="Status"><span className={`badge ${STATUS_BADGE[w.status] || ''}`}>{w.status}</span></td>
                    <td data-label="Txn ref" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{w.transactionRef || '—'}</td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {w.status === 'pending' && (
                          <>
                            <button className="btn btn-sm btn-primary" onClick={() => respond(w._id, 'approve')}><i className="fa-solid fa-check" /> Approve</button>
                            <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => respond(w._id, 'reject')}><i className="fa-solid fa-xmark" /> Decline</button>
                          </>
                        )}
                        {w.status === 'approved' && (
                          <button className="btn btn-sm btn-primary" onClick={() => openMarkPaid(w)}><i className="fa-solid fa-money-bill-transfer" /> Mark Paid</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Lightbox images={qrPreview ? [qrPreview] : []} index={qrPreview ? 0 : null} onClose={() => setQrPreview(null)} onIndex={() => {}} />

      <Modal open={Boolean(payingReq)} onClose={() => setPayingReq(null)} title="Mark withdrawal as paid">
        {payingReq && (
          <form onSubmit={confirmMarkPaid}>
            <p className="text-muted" style={{ marginBottom: 12 }}>
              Confirm you've transferred <strong>{paiseToRupee(payingReq.amountPaise)}</strong> to{' '}
              <strong>{payingReq.upiId}</strong>, then enter the UPI/bank transaction reference (UTR) - this is shown to the member as their transaction ID.
            </p>
            <div className="form-group">
              <label>Transaction reference (UTR)</label>
              <input
                className="form-input"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. 123456789012"
                autoFocus
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
              {busy ? <span className="spinner" /> : <i className="fa-solid fa-check" />} Confirm paid
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}

function timeAgoOrDate(d) {
  return formatDate(d);
}
