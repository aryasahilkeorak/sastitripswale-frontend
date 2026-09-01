import { useEffect, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { confirm } from '../../lib/confirm.js';
import Modal from '../../components/Modal.jsx';
import CustomSelect from '../../components/CustomSelect.jsx';
import CustomNumberStepper from '../../components/CustomNumberStepper.jsx';
import { imageUrl, AVATAR_FALLBACK, rupee, PLAN_LIST } from '../../lib/helpers.js';

const STATUS_BADGE = { pending: 'badge-gold', approved: 'badge-green', rejected: 'badge-fire' };

const PLAN_OPTIONS = PLAN_LIST.map((p) => ({ value: p.key, label: `${rupee(p.price)} - ${p.label}` }));

function suggestCode(user, discountPct) {
  const handle = (user?.username || user?.fullName || 'promo').replace(/[^a-zA-Z0-9]/g, '');
  return `${handle}${discountPct}`.toUpperCase();
}

// Same value for every plan, to start a fresh approve form from.
function flatPlanPcts(value) {
  return Object.fromEntries(PLAN_LIST.map((p) => [p.key, value]));
}

// Per-plan map for an already-approved influencer - falls back to their
// flat headline value for any plan not yet set individually (e.g. an
// influencer approved before per-plan rates existed).
function planPctsFrom(perPlan, legacyFlat, fallback) {
  return Object.fromEntries(PLAN_LIST.map((p) => [p.key, perPlan?.[p.key] ?? legacyFlat ?? fallback]));
}

// Compact display for a table cell - "20%" if every plan matches, else the
// spread, e.g. "10-30%".
function pctRangeLabel(perPlan, legacyFlat) {
  const vals = PLAN_LIST.map((p) => perPlan?.[p.key] ?? legacyFlat ?? 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return min === max ? `${min}%` : `${min}-${max}%`;
}

const SOCIAL_ICON = { instagram: 'fa-brands fa-instagram', facebook: 'fa-brands fa-facebook', twitter: 'fa-brands fa-x-twitter', youtube: 'fa-brands fa-youtube', linkedin: 'fa-brands fa-linkedin' };

// Reach proof collected at application time - shown wherever admin needs it
// to judge a fair 10-30% commission (the application-details modal, and
// inline atop the approve modal).
function ReachSummary({ inf }) {
  const links = Object.entries(inf.socialLinks || {}).filter(([, v]) => v);
  return (
    <div className="card" style={{ padding: 14, marginBottom: 14, background: 'var(--surface-2)' }}>
      <div className="form-row" style={{ marginBottom: links.length || inf.dashboardScreenshotUrl ? 10 : 0 }}>
        <div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Total followers</div>
          <strong>{(inf.totalFollowers || 0).toLocaleString()}</strong>
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Avg views per reel/video</div>
          <strong>{(inf.avgReelViews || 0).toLocaleString()}</strong>
        </div>
      </div>
      {links.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: inf.dashboardScreenshotUrl ? 10 : 0 }}>
          {links.map(([key, value]) => (
            <a key={key} href={/^https?:\/\//i.test(value) ? value : `https://${value}`} target="_blank" rel="noreferrer" title={value} className="ig-id-btn" style={{ width: 32, height: 32 }}>
              <i className={SOCIAL_ICON[key] || 'fa-solid fa-link'} style={{ fontSize: '0.85rem' }} />
            </a>
          ))}
        </div>
      )}
      {inf.dashboardScreenshotUrl && (
        <a href={imageUrl(inf.dashboardScreenshotUrl)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
          <i className="fa-solid fa-image" /> View dashboard screenshot
        </a>
      )}
    </div>
  );
}

export default function AdminInfluencers() {
  const [influencers, setInfluencers] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [viewing, setViewing] = useState(null); // application being viewed read-only
  const [approving, setApproving] = useState(null); // influencer being approved/reconsidered
  const [approveForm, setApproveForm] = useState({ couponCode: '', discountPcts: flatPlanPcts(10), commissionPcts: flatPlanPcts(10) });
  const [approvePlan, setApprovePlan] = useState(PLAN_LIST[3].key);
  const [editing, setEditing] = useState(null); // approved influencer being edited
  const [editPlan, setEditPlan] = useState(PLAN_LIST[3].key);

  const load = () => api.get('/admin/influencers').then((r) => setInfluencers(r.data.influencers)).catch(() => {});
  const loadCommissions = () => api.get('/admin/commissions').then((r) => setCommissions(r.data.commissions)).catch(() => {});
  useEffect(() => { load(); loadCommissions(); }, []);

  const openApprove = (inf) => {
    setApproveForm({ couponCode: suggestCode(inf.user, 10), discountPcts: flatPlanPcts(10), commissionPcts: flatPlanPcts(10) });
    setApprovePlan(PLAN_LIST[3].key);
    setApproving(inf);
  };

  const approve = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/admin/influencers/${approving._id}`, { action: 'approve', ...approveForm });
      setApproving(null);
      load();
      toast('fa-solid fa-star', 'Influencer approved');
    } catch (err) { toast('fa-solid fa-circle-xmark', apiError(err)); }
  };

  const reject = async (inf) => {
    if (!(await confirm({ message: `Reject ${inf.user?.fullName}'s application?`, danger: true, confirmLabel: 'Reject' }))) return;
    try {
      await api.patch(`/admin/influencers/${inf._id}`, { action: 'reject' });
      load();
      toast('fa-solid fa-circle-check', 'Application declined');
    } catch (err) { toast('fa-solid fa-circle-xmark', apiError(err)); }
  };

  const openEdit = (inf) => {
    setEditing({
      ...inf,
      discountPcts: planPctsFrom(inf.coupon?.discountPcts, inf.coupon?.discountPct, 0),
      commissionPcts: planPctsFrom(inf.commissionPcts, inf.commissionPct, 10),
    });
    setEditPlan(PLAN_LIST[3].key);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/influencers/${editing._id}`, {
        discountPcts: editing.discountPcts, commissionPcts: editing.commissionPcts,
      });
      setEditing(null);
      load();
      toast('fa-solid fa-circle-check', 'Influencer updated');
    } catch (err) { toast('fa-solid fa-circle-xmark', apiError(err)); }
  };

  const revoke = async (inf) => {
    if (!(await confirm({ message: `Revoke ${inf.user?.fullName}'s influencer status? Their coupon will be disabled.`, danger: true, confirmLabel: 'Revoke' }))) return;
    try {
      await api.delete(`/admin/influencers/${inf._id}`);
      setInfluencers((list) => list.filter((i) => i._id !== inf._id));
      toast('fa-solid fa-trash', 'Influencer revoked');
    } catch (err) { toast('fa-solid fa-circle-xmark', apiError(err)); }
  };

  const markPaid = async (c) => {
    try {
      await api.patch(`/admin/commissions/${c._id}`);
      setCommissions((list) => list.map((x) => (x._id === c._id ? { ...x, status: 'paid' } : x)));
      toast('fa-solid fa-circle-check', 'Marked paid');
    } catch (err) { toast('fa-solid fa-circle-xmark', apiError(err)); }
  };

  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Influencer applications</h4>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>User</th><th>Status</th><th>Coupon</th><th>Commission</th><th>Earned</th><th>Actions</th></tr></thead>
            <tbody>
              {influencers.map((inf) => (
                <tr key={inf._id}>
                  <td data-label="User">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img
                        src={imageUrl(inf.user?.avatarUrl, AVATAR_FALLBACK)}
                        alt=""
                        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
                      />
                      <span>
                        {inf.user?.fullName}
                        <br />
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>@{inf.user?.username}</span>
                      </span>
                    </div>
                  </td>
                  <td data-label="Status"><span className={`badge ${STATUS_BADGE[inf.status] || ''}`}>{inf.status}</span></td>
                  <td data-label="Coupon" style={{ fontFamily: 'var(--font-mono)' }}>
                    {inf.coupon ? `${inf.coupon.code} (${pctRangeLabel(inf.coupon.discountPcts, inf.coupon.discountPct)})` : '—'}
                  </td>
                  <td data-label="Commission">{inf.status === 'approved' ? pctRangeLabel(inf.commissionPcts, inf.commissionPct) : '—'}</td>
                  <td data-label="Earned">{inf.status === 'approved' ? `₹${((inf.totalEarnedPaise || 0) / 100).toFixed(2)}` : '—'}</td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => setViewing(inf)} title="View application details"><i className="fa-solid fa-eye" /></button>
                      {inf.status === 'pending' && (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => openApprove(inf)}><i className="fa-solid fa-check" /> Approve</button>
                          <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => reject(inf)}><i className="fa-solid fa-xmark" /> Reject</button>
                        </>
                      )}
                      {inf.status === 'approved' && (
                        <>
                          <button className="btn btn-sm btn-outline" onClick={() => openEdit(inf)}><i className="fa-solid fa-pen-to-square" /></button>
                          <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => revoke(inf)}><i className="fa-solid fa-trash" /></button>
                        </>
                      )}
                      {inf.status === 'rejected' && (
                        <button className="btn btn-sm btn-outline" onClick={() => openApprove(inf)}>Reconsider</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {influencers.length === 0 && (
                <tr><td colSpan={6} className="text-muted text-center">No applications yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Commission ledger</h4>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Influencer</th><th>Payer</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c._id}>
                  <td data-label="Influencer">{c.influencer?.user?.fullName || '—'}</td>
                  <td data-label="Payer">{c.user?.fullName || '—'}</td>
                  <td data-label="Amount">₹{((c.amountPaise || 0) / 100).toFixed(2)}</td>
                  <td data-label="Status"><span className={`badge ${c.status === 'paid' ? 'badge-green' : 'badge-gold'}`}>{c.status}</span></td>
                  <td data-label="Actions">
                    {c.status === 'pending' && (
                      <button className="btn btn-sm btn-primary" onClick={() => markPaid(c)}><i className="fa-solid fa-check" /> Mark paid</button>
                    )}
                  </td>
                </tr>
              ))}
              {commissions.length === 0 && (
                <tr><td colSpan={5} className="text-muted text-center">No commissions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={Boolean(approving)} onClose={() => setApproving(null)} title="Approve influencer">
        {approving && (
          <form onSubmit={approve}>
            <p className="text-muted" style={{ marginBottom: 12 }}>
              Approving <strong>{approving.user?.fullName}</strong> - this issues (or reuses) their personal coupon.
            </p>
            <ReachSummary inf={approving} />
            <div className="form-group">
              <label>Coupon code</label>
              <input className="form-input" value={approveForm.couponCode} onChange={(e) => setApproveForm({ ...approveForm, couponCode: e.target.value.toUpperCase() })} required />
            </div>
            <div className="form-group">
              <label>Membership plan</label>
              <CustomSelect value={approvePlan} onChange={(e) => setApprovePlan(e.target.value)} options={PLAN_OPTIONS} />
            </div>
            <p className="text-muted" style={{ fontSize: '0.76rem', marginTop: -6, marginBottom: 10 }}>
              Set separately for each plan - pick another plan above to set its rates too.
            </p>
            <div className="form-row">
              <div className="form-group">
                <label>Customer discount %</label>
                <CustomNumberStepper
                  min={0}
                  max={100}
                  value={approveForm.discountPcts[approvePlan]}
                  onChange={(e) => setApproveForm({ ...approveForm, discountPcts: { ...approveForm.discountPcts, [approvePlan]: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label>Influencer commission % (10-30)</label>
                <CustomNumberStepper
                  min={10}
                  max={30}
                  value={approveForm.commissionPcts[approvePlan]}
                  onChange={(e) => setApproveForm({ ...approveForm, commissionPcts: { ...approveForm.commissionPcts, [approvePlan]: e.target.value } })}
                />
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}><i className="fa-solid fa-star" /> Approve &amp; issue coupon</button>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Influencer application">
        {viewing && (
          <>
            <p className="text-muted" style={{ marginBottom: 12 }}>
              <strong>{viewing.user?.fullName}</strong> (@{viewing.user?.username}) - {viewing.user?.email}
            </p>
            <ReachSummary inf={viewing} />
            {viewing.appliedReason && (
              <div className="form-group">
                <label>Why they want to promote us</label>
                <p style={{ fontSize: '0.85rem' }}>{viewing.appliedReason}</p>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit influencer">
        {editing && (
          <form onSubmit={saveEdit}>
            <p className="text-muted" style={{ marginBottom: 12 }}>
              <strong>{editing.user?.fullName}</strong> - coupon <span style={{ fontFamily: 'var(--font-mono)' }}>{editing.coupon?.code}</span>
            </p>
            <div className="form-group">
              <label>Membership plan</label>
              <CustomSelect value={editPlan} onChange={(e) => setEditPlan(e.target.value)} options={PLAN_OPTIONS} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Customer discount %</label>
                <CustomNumberStepper
                  min={0}
                  max={100}
                  value={editing.discountPcts[editPlan]}
                  onChange={(e) => setEditing({ ...editing, discountPcts: { ...editing.discountPcts, [editPlan]: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label>Influencer commission % (10-30)</label>
                <CustomNumberStepper
                  min={10}
                  max={30}
                  value={editing.commissionPcts[editPlan]}
                  onChange={(e) => setEditing({ ...editing, commissionPcts: { ...editing.commissionPcts, [editPlan]: e.target.value } })}
                />
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}><i className="fa-solid fa-floppy-disk" /> Save changes</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
