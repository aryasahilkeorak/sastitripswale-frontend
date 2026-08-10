import { useEffect, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { toast } from '../../lib/toast.js';

export default function AdminReferralSettings() {
  const [enabled, setEnabled] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.get('/admin/settings').then((r) => setEnabled(r.data.settings.referralEnabled)).catch(() => {});
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

  return (
    <div className="card" style={{ padding: 24, maxWidth: 560 }}>
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
  );
}
