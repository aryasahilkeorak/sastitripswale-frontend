import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { rupee, planPrice, PREF_LABEL } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import Modal from '../components/Modal.jsx';

const PREFS = [
  { key: 'male', label: 'Only Male', icon: 'ri-men-line', note: 'Travel with male co-travelers' },
  { key: 'female', label: 'Only Female', icon: 'ri-women-line', note: 'Women-only verified groups' },
  { key: 'both', label: 'Male + Female', icon: 'ri-group-line', note: 'Mixed verified groups' },
];

const DURATIONS = [
  { key: '6m', label: '6 Months' },
  { key: '1y', label: '1 Year', tag: 'Best value' },
];

function launchConfetti() {
  const colors = ['#ff6b00', '#e040fb', '#00d4ff', '#ffd60a', '#ff3366'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div');
    c.style.cssText = `position:fixed;z-index:9999;width:${4 + Math.random() * 6}px;height:${4 + Math.random() * 6}px;border-radius:2px;background:${colors[Math.floor(Math.random() * colors.length)]};left:${Math.random() * 100}vw;top:-10px;pointer-events:none;animation:confettiFall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 0.8}s forwards;transform:rotate(${Math.random() * 360}deg);`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4000);
  }
  if (!document.getElementById('confetti-style')) {
    const s = document.createElement('style');
    s.id = 'confetti-style';
    s.textContent = '@keyframes confettiFall{to{top:110vh;transform:rotate(720deg);opacity:0}}';
    document.head.appendChild(s);
  }
}

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function Join() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const accessToken = useAuth((s) => s.accessToken);
  const setSession = useAuth((s) => s.setSession);
  const setUser = useAuth((s) => s.setUser);

  // Already an active member? go complete profile or dashboard.
  useEffect(() => {
    if (user?.membershipActive) {
      navigate(user.profileComplete ? '/dashboard' : '/complete-profile', { replace: true });
    }
  }, [user, navigate]);

  const [step, setStep] = useState(accessToken ? 2 : 1);
  const [form, setForm] = useState({
    email: '', mobile: '', password: '', gender: '', coTravelerPreference: '',
  });
  const [duration, setDuration] = useState('6m');
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState(null); // { code, finalRupees, isFree }
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  // Preference used for pricing (form for new signup, stored for logged-in).
  const preference = form.coTravelerPreference || user?.coTravelerPreference || 'both';
  const listPrice = planPrice(preference, duration);
  const payable = applied ? applied.finalRupees : listPrice;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Re-validate an applied coupon when the duration changes.
  useEffect(() => {
    if (!applied?.code) return;
    api
      .post('/payments/validate-coupon', { code: applied.code, duration })
      .then((r) => setApplied({ code: r.data.coupon, finalRupees: r.data.finalAmountRupees, isFree: r.data.isFree }))
      .catch(() => setApplied(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const validateStep1 = () => {
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email';
    if (!/^[0-9]{10,15}$/.test(form.mobile)) return 'Enter a valid mobile number';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (!form.gender) return 'Select your gender';
    if (!form.coTravelerPreference) return 'Choose who you want to travel with';
    return null;
  };

  const register = async () => {
    const err = validateStep1();
    if (err) return toast('⚠️', err);
    setBusy(true);
    try {
      const { data } = await api.post('/auth/register', {
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        gender: form.gender,
        coTravelerPreference: form.coTravelerPreference,
      });
      setSession({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      toast('🎉', 'Account created! Choose your plan.');
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      toast('❌', apiError(e, 'Registration failed'));
    } finally {
      setBusy(false);
    }
  };

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    try {
      const { data } = await api.post('/payments/validate-coupon', { code, duration });
      setApplied({ code: data.coupon, finalRupees: data.finalAmountRupees, isFree: data.isFree });
      toast('🎟️', data.isFree ? 'Coupon applied — FREE! 🎊' : `Coupon applied — pay ${rupee(data.finalAmountRupees)}`);
    } catch (e) {
      toast('❌', apiError(e, 'Invalid coupon'));
    }
  };

  const finish = async () => {
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => {});
    setSuccess(true);
    launchConfetti();
  };

  const pay = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/payments/create-order', { duration, coupon: applied?.code || undefined });
      if (data.isFree) {
        toast('✅', 'Membership activated!');
        return finish();
      }
      if (data.testMode) {
        await api.post('/payments/confirm-test');
        toast('✅', 'Payment successful (test mode)!');
        return finish();
      }
      const ok = await loadRazorpay();
      if (!ok) return toast('❌', 'Could not load payment gateway.');
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'SastiTripWale',
        description: 'Community Membership',
        order_id: data.orderId,
        prefill: data.prefill,
        theme: { color: '#ff6b00' },
        handler: async (resp) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            toast('✅', 'Payment successful!');
            finish();
          } catch (e) {
            toast('❌', apiError(e, 'Verification failed'));
          }
        },
        modal: { ondismiss: () => toast('ℹ️', 'Payment cancelled') },
      });
      rzp.open();
    } catch (e) {
      toast('❌', apiError(e, 'Could not start payment'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={{ paddingTop: 110 }}>
      <div className="container" style={{ maxWidth: 560 }}>
        <div className="text-center mb-4">
          <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="ri-rocket-fill" /> Join the Tribe</div>
          <h1 className="section-title" style={{ fontSize: '2rem' }}>Become a <span className="highlight">Member</span></h1>
        </div>

        {/* Step indicator */}
        <div className="steps-head" style={{ maxWidth: 300 }}>
          {[1, 2].map((n, i) => (
            <Fragment key={n}>
              <div className={`step-dot${step === n ? ' active' : step > n ? ' done' : ''}`}>
                {step > n ? <i className="ri-check-line" /> : n}
              </div>
              {i < 1 && <div className={`step-line${step > n ? ' done' : ''}`} />}
            </Fragment>
          ))}
        </div>

        <div className="card" style={{ padding: 32 }}>
          {/* STEP 1 — minimal signup */}
          {step === 1 && (
            <div className="form-step active">
              <h3 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Create your account</h3>
              <div className="form-group"><label>Email *</label><input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" /></div>
              <div className="form-group"><label>Mobile number *</label><input className="form-input" value={form.mobile} onChange={set('mobile')} placeholder="10-digit mobile" /></div>
              <div className="form-group"><label>Password *</label><input className="form-input" type="password" value={form.password} onChange={set('password')} placeholder="min 6 characters" /></div>
              <div className="form-group">
                <label>Your gender *</label>
                <select className="form-input" value={form.gender} onChange={set('gender')}>
                  <option value="">Select</option><option>Male</option><option>Female</option><option>Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label>Who do you want to travel with? *</label>
                <div style={{ display: 'grid', gap: 10 }}>
                  {PREFS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      className="card"
                      onClick={() => setForm((f) => ({ ...f, coTravelerPreference: p.key }))}
                      style={{
                        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                        borderColor: form.coTravelerPreference === p.key ? 'var(--fire)' : 'var(--glass-bdr)',
                        background: form.coTravelerPreference === p.key ? 'rgba(255,107,0,0.08)' : 'var(--surface)',
                        cursor: 'pointer', color: 'inherit',
                      }}
                    >
                      <i className={p.icon} style={{ fontSize: '1.4rem', color: 'var(--fire)' }} />
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.92rem' }}>{p.label}</strong>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{p.note}</div>
                      </div>
                      <i className={form.coTravelerPreference === p.key ? 'ri-radio-button-line' : 'ri-checkbox-blank-circle-line'} style={{ color: form.coTravelerPreference === p.key ? 'var(--fire)' : 'var(--text-3)' }} />
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={register} disabled={busy}>
                {busy ? <span className="spinner" /> : <i className="ri-arrow-right-line" />} Continue to Plan
              </button>
              <p className="auth-switch">Already a member? <Link to="/login">Log in</Link></p>
            </div>
          )}

          {/* STEP 2 — plan + payment */}
          {step === 2 && (
            <div className="form-step active">
              <h3 className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>Choose your plan</h3>
              <p className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>
                Preference: <strong>{PREF_LABEL[preference]}</strong>
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                {DURATIONS.map((d) => {
                  const price = planPrice(preference, d.key);
                  const activeSel = duration === d.key;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      className="card"
                      onClick={() => setDuration(d.key)}
                      style={{
                        padding: 18, textAlign: 'center', cursor: 'pointer', color: 'inherit',
                        borderColor: activeSel ? 'var(--fire)' : 'var(--glass-bdr)',
                        background: activeSel ? 'rgba(255,107,0,0.08)' : 'var(--surface)',
                      }}
                    >
                      {d.tag && <span className="badge badge-fire" style={{ marginBottom: 6 }}>{d.tag}</span>}
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{d.label}</div>
                      <div className="price-amount" style={{ fontSize: '1.8rem' }}>{rupee(price)}</div>
                    </button>
                  );
                })}
              </div>

              <div className={`price-card mb-3${applied?.isFree ? ' free' : ''}`}>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>You pay</div>
                <div className="price-amount">
                  {rupee(payable)}
                  {applied && payable !== listPrice && <span className="price-strike">{rupee(listPrice)}</span>}
                </div>
                {applied?.isFree && <div style={{ color: '#6ee7b7', fontSize: '0.85rem', fontWeight: 700 }}>FREE with {applied.code} 🎉</div>}
              </div>

              <div className="search-bar mb-3">
                <i className="ri-coupon-3-line" style={{ color: 'var(--text-3)' }} />
                <input placeholder="Coupon code (try FREEJOIN)" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                <button className="btn btn-sm btn-outline" type="button" onClick={applyCoupon}>Apply</button>
              </div>

              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={pay} disabled={busy}>
                {busy ? <span className="spinner" /> : <i className="ri-secure-payment-line" />}
                {applied?.isFree ? ' Activate Free Membership' : ` Pay ${rupee(payable)}`}
              </button>
              <p className="text-muted" style={{ fontSize: '0.72rem', textAlign: 'center', marginTop: 12 }}>
                🔒 Secure payment. Next: complete your profile to start planning &amp; joining trips.
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal open={success} onClose={() => navigate('/complete-profile')} title="🎉 Membership active!">
        <p style={{ color: 'var(--text-2)', lineHeight: 1.8 }}>
          One last step — complete your profile (name, city, interests, vehicle &amp; ID). You need a
          complete profile to plan or join trips.
        </p>
        <button className="btn btn-primary btn-lg mt-3" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/complete-profile')}>
          <i className="ri-user-settings-line" /> Complete My Profile
        </button>
      </Modal>
    </section>
  );
}
