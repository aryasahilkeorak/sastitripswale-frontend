import { useEffect, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';
import { rupee, PLAN_PRICES } from '../../lib/helpers.js';
import CustomSelect from '../../components/CustomSelect.jsx';
import CustomNumberStepper from '../../components/CustomNumberStepper.jsx';

// A blank open-ended tier appended when the admin adds a new row - `to`
// left blank means "and every referral after this, forever".
const BLANK_TIER = { from: '', to: '', rewardPct: '' };

// Real membership prices (utils/plans.js) to preview the money flow against,
// instead of an arbitrary made-up number.
const EXAMPLE_PRICES = [
  { value: PLAN_PRICES.single['6m'], label: `${rupee(PLAN_PRICES.single['6m'])} - Single, 6 months` },
  { value: PLAN_PRICES.single['1y'], label: `${rupee(PLAN_PRICES.single['1y'])} - Single, 1 year` },
  { value: PLAN_PRICES.both['6m'], label: `${rupee(PLAN_PRICES.both['6m'])} - Both, 6 months` },
  { value: PLAN_PRICES.both['1y'], label: `${rupee(PLAN_PRICES.both['1y'])} - Both, 1 year` },
];

export default function AdminReferralSettings() {
  const [enabled, setEnabled] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [tiersBusy, setTiersBusy] = useState(false);
  const [discountPct, setDiscountPct] = useState('');
  const [discountBusy, setDiscountBusy] = useState(false);
  const [examplePrice, setExamplePrice] = useState(EXAMPLE_PRICES[3].value);

  const load = () =>
    api.get('/admin/settings').then((r) => {
      setEnabled(r.data.settings.referralEnabled);
      setDiscountPct(String(r.data.settings.referralDiscountPct ?? 0));
      setTiers(
        (r.data.settings.referralTiers || []).map((t) => ({
          from: String(t.from),
          to: t.to === null || t.to === undefined ? '' : String(t.to),
          rewardPct: String(t.rewardPct ?? 0),
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

  const saveDiscount = async (e) => {
    e.preventDefault();
    setDiscountBusy(true);
    try {
      const { data } = await api.patch('/admin/settings/referral-discount', {
        referralDiscountPct: Number(discountPct || 0),
      });
      setDiscountPct(String(data.referralDiscountPct));
      toast('fa-solid fa-circle-check', 'Referral discount updated');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setDiscountBusy(false);
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
        rewardPct: Number(t.rewardPct || 0),
      }));
      const { data } = await api.patch('/admin/settings/referral-tiers', { tiers: payload });
      setTiers(
        data.referralTiers.map((t) => ({
          from: String(t.from),
          to: t.to === null ? '' : String(t.to),
          rewardPct: String(t.rewardPct ?? 0),
        }))
      );
      toast('fa-solid fa-circle-check', 'Referral reward tiers updated');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setTiersBusy(false);
    }
  };

  // Live money-flow preview - updates as the admin types, before anything is
  // even saved, so the effect of a change is obvious immediately.
  const discountNum = Math.min(100, Math.max(0, Number(discountPct) || 0));
  const customerPays = Math.round(examplePrice * (1 - discountNum / 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: 24 }}>
        <div className="row-between" style={{ alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 560 }}>
            <h4 className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              <i className="fa-solid fa-gift" style={{ color: 'var(--fire)', marginRight: 8 }} />Referral program
            </h4>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              When enabled, every member gets a shareable referral code and new signups can credit
              the member who referred them. Turning this off hides the referral field on signup and
              pauses new referral credit - existing codes and history are kept.
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="text-muted mb-2" style={{ fontSize: '0.78rem', fontWeight: 700 }}>
              Referrals are currently {enabled === null ? '…' : enabled ? 'ON' : 'OFF'}
            </div>
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
      </div>

      <div className="grid-2">
        <form className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }} onSubmit={saveDiscount}>
          <h4 className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            <i className="fa-solid fa-percent" style={{ color: 'var(--fire)', marginRight: 8 }} />New member discount
          </h4>
          <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
            How much a new member saves on their <strong>first</strong> membership payment when they
            sign up with someone else's referral code - applied automatically, once per member.
          </p>
          <div className="form-group">
            <label htmlFor="referral-discount-pct" className="text-muted" style={{ fontSize: '0.72rem' }}>Discount off membership price</label>
            <CustomNumberStepper
              id="referral-discount-pct"
              suffix="%"
              min={0}
              max={100}
              step={1}
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              placeholder="e.g. 10"
            />
          </div>
          <button className="btn btn-primary" disabled={discountBusy} style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
            {discountBusy ? <span className="spinner" /> : <i className="fa-solid fa-floppy-disk" />} Save
          </button>
        </form>

        <div className="card" style={{ padding: 24 }}>
          <h4 className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            <i className="fa-solid fa-calculator" style={{ color: 'var(--fire)', marginRight: 8 }} />Live example
          </h4>
          <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
            What this actually looks like on a real membership price - updates as you type above, before you save.
          </p>
          <div className="form-group">
            <label htmlFor="example-price" className="text-muted" style={{ fontSize: '0.72rem' }}>Example membership plan</label>
            <CustomSelect
              id="example-price"
              value={examplePrice}
              onChange={(e) => setExamplePrice(Number(e.target.value))}
              options={EXAMPLE_PRICES}
            />
          </div>
          <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div className="admin-stat" style={{ padding: 14 }}>
              <div className="lbl">List price</div>
              <div className="val" style={{ fontSize: '1.3rem' }}>{rupee(examplePrice)}</div>
            </div>
            <div className="admin-stat" style={{ padding: 14, borderColor: 'rgba(255,107,0,0.3)' }}>
              <div className="lbl">Referred member pays</div>
              <div className="val" style={{ fontSize: '1.3rem' }}>{rupee(customerPays)}</div>
            </div>
          </div>
          <p className="text-muted mt-3" style={{ fontSize: '0.76rem' }}>
            The company collects <strong>{rupee(customerPays)}</strong> from this sale - the referrer's
            reward tiers on the right take their cut out of that amount, not the {rupee(examplePrice)} list price.
          </p>
        </div>
      </div>

      <div className="grid-2">
        <form className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }} onSubmit={saveTiers}>
          <h4 className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            <i className="fa-solid fa-layer-group" style={{ color: 'var(--fire)', marginRight: 8 }} />Reward tiers
          </h4>
          <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
            What percentage of the company's collected amount a referrer earns per successfully-converted
            referral, credited once the referred member actually pays - based on how many they've earned a
            reward for so far. Leave "to" blank to make a tier open-ended.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10 }}>
              <label className="text-muted" style={{ fontSize: '0.72rem' }}>Referral # from</label>
              <label className="text-muted" style={{ fontSize: '0.72rem' }}>to (blank = onwards)</label>
              <label className="text-muted" style={{ fontSize: '0.72rem' }}>Reward %</label>
              <span />
            </div>
            {tiers.map((t, i) => (
              <div key={i} className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'center' }}>
                <CustomNumberStepper
                  min={1}
                  value={t.from}
                  onChange={(e) => setTier(i, 'from', e.target.value)}
                  placeholder="e.g. 1"
                />
                <CustomNumberStepper
                  min={1}
                  allowEmpty
                  value={t.to}
                  onChange={(e) => setTier(i, 'to', e.target.value)}
                  placeholder="onwards"
                />
                <CustomNumberStepper
                  suffix="%"
                  min={0}
                  max={100}
                  value={t.rewardPct}
                  onChange={(e) => setTier(i, 'rewardPct', e.target.value)}
                  placeholder="e.g. 20"
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

          <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
            <button type="button" className="btn btn-sm btn-outline" onClick={addTier}>
              <i className="fa-solid fa-plus" /> Add tier
            </button>
            <button className="btn btn-primary" disabled={tiersBusy} style={{ marginLeft: 'auto' }}>
              {tiersBusy ? <span className="spinner" /> : <i className="fa-solid fa-floppy-disk" />} Save tiers
            </button>
          </div>
        </form>

        <div className="card" style={{ padding: 24 }}>
          <h4 className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            <i className="fa-solid fa-sack-dollar" style={{ color: 'var(--fire)', marginRight: 8 }} />What referrers earn
          </h4>
          <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
            Same {rupee(customerPays)} the company collects (from the example above), per tier.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tiers.map((t, i) => {
              const pct = Math.min(100, Math.max(0, Number(t.rewardPct) || 0));
              const earned = Math.round(customerPays * (pct / 100));
              const range = t.to === '' || t.to === undefined ? `${t.from || '?'}+` : `${t.from || '?'}-${t.to}`;
              return (
                <div key={i} className="row-between" style={{ padding: '10px 14px', borderRadius: 'var(--r)', background: 'var(--bg-2)' }}>
                  <span style={{ fontSize: '0.82rem' }}>
                    <span className="badge badge-fire" style={{ marginRight: 8 }}>Referral #{range}</span>
                    {pct}% of {rupee(customerPays)}
                  </span>
                  <strong style={{ fontSize: '0.9rem', color: '#6ee7b7' }}>{rupee(earned)}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
