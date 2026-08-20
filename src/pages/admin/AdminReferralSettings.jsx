import { useEffect, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

// A blank open-ended tier appended when the admin adds a new row - `to`
// left blank means "and every referral after this, forever".
const BLANK_TIER = { from: '', to: '', amountRupees: '' };

const toRupees = (paise) => (paise || paise === 0 ? String(paise / 100) : '');

export default function AdminReferralSettings() {
  const [enabled, setEnabled] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [tiersBusy, setTiersBusy] = useState(false);

  const load = () =>
    api.get('/admin/settings').then((r) => {
      setEnabled(r.data.settings.referralEnabled);
      setTiers(
        (r.data.settings.referralTiers || []).map((t) => ({
          from: String(t.from),
          to: t.to === null || t.to === undefined ? '' : String(t.to),
          amountRupees: toRupees(t.amountPaise),
        }))
      );
    }).catch(() => {});
  useEffect(() => { load(); }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch('/admin/settings/referrals');
      setEnabled(data.referralEnabled);
      toast('fa-solid fa-circle-check', data.referralEnabled ? 'Referrals enabled' : 'Referrals disabled');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const setTier = (i, key, value) => setTiers((ts) => ts.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)));
  const addTier = () => setTiers((ts) => [...ts, { ...BLANK_TIER }]);
  const removeTier = (i) => setTiers((ts) => ts.filter((_, idx) => idx !== i));

  const saveTiers = async (e) => {
    e.preventDefault();
    setTiersBusy(true);
    try {
      const payload = tiers.map((t) => ({
        from: Number(t.from),
        to: t.to === '' ? null : Number(t.to),
        amountPaise: Math.round(Number(t.amountRupees || 0) * 100),
      }));
      const { data } = await api.patch('/admin/settings/referral-tiers', { tiers: payload });
      setTiers(
        data.referralTiers.map((t) => ({
          from: String(t.from),
          to: t.to === null ? '' : String(t.to),
          amountRupees: toRupees(t.amountPaise),
        }))
      );
      toast('fa-solid fa-circle-check', 'Referral reward tiers updated');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setTiersBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: 24, maxWidth: 720 }}>
        <h4 className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>Referral program</h4>
        <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
          When enabled, every member gets a shareable referral code and new signups can credit
          the member who referred them. Turning this off hides the referral field on signup and
          pauses new referral credit - existing codes and history are kept.
        </p>
        <div className="row-between">
          <span style={{ fontWeight: 700 }}>
            Referrals are currently {enabled === null ? '…' : enabled ? 'ON' : 'OFF'}
          </span>
          <button
            className={`btn ${enabled ? 'btn-outline' : 'btn-primary'}`}
            onClick={toggle}
            disabled={busy || enabled === null}
          >
            {busy ? <span className="spinner" /> : <i className={enabled ? 'fa-solid fa-toggle-off' : 'fa-solid fa-toggle-on'} />}
            {' '}{enabled ? 'Turn off' : 'Turn on'}
          </button>
        </div>
      </div>

      <form className="card" style={{ padding: 24, maxWidth: 720 }} onSubmit={saveTiers}>
        <h4 className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>Reward tiers</h4>
        <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
          How much a referrer earns per successfully-converted referral (credited once the
          referred member actually pays), based on how many they've earned a reward for so far.
          Leave "to" blank on a tier to make it open-ended (applies to every referral after that point).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10 }}>
            <label className="text-muted" style={{ fontSize: '0.72rem' }}>Referral # from</label>
            <label className="text-muted" style={{ fontSize: '0.72rem' }}>to (blank = onwards)</label>
            <label className="text-muted" style={{ fontSize: '0.72rem' }}>Reward (₹) each</label>
            <span />
          </div>
          {tiers.map((t, i) => (
            <div key={i} className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'center' }}>
              <input
                className="form-input"
                type="number"
                min="1"
                required
                value={t.from}
                onChange={(e) => setTier(i, 'from', e.target.value)}
                placeholder="e.g. 1"
              />
              <input
                className="form-input"
                type="number"
                min="1"
                value={t.to}
                onChange={(e) => setTier(i, 'to', e.target.value)}
                placeholder="onwards"
              />
              <input
                className="form-input"
                type="number"
                min="0"
                required
                value={t.amountRupees}
                onChange={(e) => setTier(i, 'amountRupees', e.target.value)}
                placeholder="e.g. 50"
              />
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}
                onClick={() => removeTier(i)}
                disabled={tiers.length <= 1}
                title="Remove tier"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-sm btn-outline" onClick={addTier}>
            <i className="fa-solid fa-plus" /> Add tier
          </button>
          <button className="btn btn-primary" disabled={tiersBusy} style={{ marginLeft: 'auto' }}>
            {tiersBusy ? <span className="spinner" /> : <i className="fa-solid fa-floppy-disk" />} Save tiers
          </button>
        </div>
      </form>
    </div>
  );
}
