import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { rupee, planPrice, PREF_LABEL, formatDate, TRIP_PACK_TIERS, TRIP_PACK_PRICES, tripPackLabel } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import Modal from '../components/Modal.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import UsernameInput from '../components/UsernameInput.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import Checkbox from '../components/Checkbox.jsx';
import Seo from '../components/Seo.jsx';

const PREFS = [
  { key: 'male', label: 'Only Male', icon: 'fa-solid fa-mars', note: 'Travel with male co-travelers' },
  { key: 'female', label: 'Only Female', icon: 'fa-solid fa-venus', note: 'Women-only verified groups' },
  { key: 'both', label: 'Male + Female', icon: 'fa-solid fa-users', note: 'Mixed verified groups' },
];

const DURATIONS = [
  { key: '6m', label: '6 Months' },
  { key: '1y', label: '1 Year', tag: 'Best value' },
];

function launchConfetti() {
  const colors = ['#ff7a1a', '#ff9b4d', '#3e8ef7', '#7fb2ff', '#ffc94d'];
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
  const [searchParams] = useSearchParams();
  const user = useAuth((s) => s.user);
  const accessToken = useAuth((s) => s.accessToken);
  const setSession = useAuth((s) => s.setSession);
  const setUser = useAuth((s) => s.setUser);
  const [referralsEnabled, setReferralsEnabled] = useState(false);

  // Already an active member? go complete profile or dashboard.
  useEffect(() => {
    if (user?.membershipActive) {
      navigate(user.profileComplete ? '/dashboard' : '/complete-profile', { replace: true });
    }
  }, [user, navigate]);

  const [step, setStep] = useState(accessToken ? 2 : 1);
  const [form, setForm] = useState({
    email: '', username: '', mobile: '', password: '', gender: '', coTravelerPreference: '',
    referralCode: searchParams.get('ref') || '', agreedToTerms: false,
  });
  // Whether this session just walked through Step 1 (fresh signup, code
  // asked exactly once there and silently auto-applied below) vs. arrived
  // straight at Step 2 as an already-registered member (e.g. paying for
  // membership later) - who never got a Step 1 moment to enter a code, so
  // still needs the manual coupon box there.
  const [freshSignup, setFreshSignup] = useState(false);
  // A fresh signup has no account (and so no session/accessToken) until
  // their payment actually succeeds - see authController.register. This is
  // the token proving which not-yet-created signup they're paying for;
  // every payments/* call below includes it while there's no session yet.
  const [pendingToken, setPendingToken] = useState('');

  useEffect(() => {
    api.get('/referrals/status').then((r) => setReferralsEnabled(r.data.enabled)).catch(() => {});
  }, []);
  const [duration, setDuration] = useState('6m');
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState(null); // { code, finalRupees, isFree }
  // Stashes a coupon/referral discount while browsing Trip Pass (which never
  // takes one) so switching back to Membership restores it instead of
  // silently losing it - see switchPlanType below.
  const [stashedApplied, setStashedApplied] = useState(null);
  const [busy, setBusy] = useState(false);
  // { status: 'success', planLabel, duration, amountRupees, isFree, isTest, reference, expiresAt, planType, hostCredits, joinCredits }
  // { status: 'failure', title, message, reference }
  const [outcome, setOutcome] = useState(null);
  // Set when Step 1 fails with ACCOUNT_EXISTS - the email or mobile they
  // typed already belongs to a real account, so this points them at Log In
  // instead of a plain error toast.
  const [accountExists, setAccountExists] = useState(false);

  // Membership (duration) vs. Trip Pass (pay-per-trip) - two independent
  // plan families a member can choose between at checkout, per Pricing.jsx.
  const [planType, setPlanType] = useState('membership');
  const [packTier, setPackTier] = useState(1);
  const switchPlanType = (type) => {
    setPlanType(type);
    // Coupons never apply to Trip Pass - stash any applied one rather than
    // dropping it, so switching back to Membership gets it back.
    if (type === 'trip_pack') {
      setApplied((a) => {
        if (a) setStashedApplied(a);
        return null;
      });
      setCoupon('');
    } else if (stashedApplied) {
      setApplied(stashedApplied);
      setCoupon(stashedApplied.code);
      setStashedApplied(null);
    }
  };
  // Both plan families show on screen together (not a tabbed toggle), so
  // picking a card sets planType + its specific option in one click.
  const selectMembership = (d) => {
    if (planType !== 'membership') switchPlanType('membership');
    setDuration(d);
  };
  const selectTripPack = (t) => {
    if (planType !== 'trip_pack') switchPlanType('trip_pack');
    setPackTier(t);
  };

  // Preference used for pricing (form for new signup, stored for logged-in).
  // Trip Pass is flat-priced regardless of preference.
  const preference = form.coTravelerPreference || user?.coTravelerPreference || 'both';
  const listPrice = planType === 'trip_pack' ? TRIP_PACK_PRICES[packTier] : planPrice(preference, duration);
  const payable = planType === 'trip_pack' ? TRIP_PACK_PRICES[packTier] : applied ? applied.finalRupees : listPrice;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // A male can only travel with "male" or "both" groups, never a
  // female-only group - and symmetrically for female users.
  const setGender = (e) => {
    const gender = e.target.value;
    setForm((f) => {
      const incompatible =
        (gender === 'Male' && f.coTravelerPreference === 'female') ||
        (gender === 'Female' && f.coTravelerPreference === 'male');
      return { ...f, gender, coTravelerPreference: incompatible ? '' : f.coTravelerPreference };
    });
  };
  const availablePrefs =
    form.gender === 'Male' ? PREFS.filter((p) => p.key !== 'female')
    : form.gender === 'Female' ? PREFS.filter((p) => p.key !== 'male')
    : PREFS;

  // Builds the `applied` state from a /payments/validate-coupon response -
  // shared by every call site so a real Coupon and an auto-matched referral
  // discount (isReferral + who referred them) both carry the same shape.
  const appliedFrom = (data) => ({
    code: data.coupon,
    finalRupees: data.finalAmountRupees,
    isFree: data.isFree,
    isReferral: Boolean(data.isReferral),
    discountPct: data.discountPct ?? null,
    referrerUsername: data.referrerUsername || '',
  });

  // A fresh signup has no session yet (see `pendingToken` above), so every
  // /payments/* call needs their pendingToken instead of the usual Bearer
  // token. An already-authenticated member (accessToken set) needs neither.
  const withPendingToken = (body) => (accessToken ? body : pendingToken ? { ...body, pendingToken } : body);

  // Re-validate an applied coupon when the duration changes.
  useEffect(() => {
    if (!applied?.code) return;
    api
      .post('/payments/validate-coupon', withPendingToken({ code: applied.code, duration }))
      .then((r) => setApplied(appliedFrom(r.data)))
      .catch(() => setApplied(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  // (Re-)matches `code` against /payments/validate-coupon and updates
  // `applied` to whatever that code currently resolves to - a real coupon,
  // this member's own referral discount, or neither. Silent (no error
  // toast) since a bare referral code with no matching Coupon record is
  // expected, not a failure. Always call this instead of trusting stale
  // `applied` state, so editing the field (e.g. after using Back) is
  // reflected rather than leaving the previous code's result on screen.
  const matchReferralCode = (rawCode, token) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return setApplied(null);
    api
      .post('/payments/validate-coupon', token ? { code, duration, pendingToken: token } : withPendingToken({ code, duration }))
      .then((r) => setApplied(appliedFrom(r.data)))
      .catch(() => setApplied(null));
  };

  const validateStep1 = () => {
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email';
    if (!/^[a-z0-9_.]{3,30}$/.test(form.username)) return 'Username must be 3-30 characters: lowercase letters, numbers, "_" or "." only';
    if (!/^[0-9]{10,15}$/.test(form.mobile)) return 'Enter a valid mobile number';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (!form.gender) return 'Select your gender';
    if (!form.coTravelerPreference) return 'Choose who you want to travel with';
    if (!form.agreedToTerms) return 'Please agree to the Terms & Conditions to continue';
    return null;
  };

  const register = async () => {
    const err = validateStep1();
    if (err) return toast('fa-solid fa-triangle-exclamation', err);

    setBusy(true);
    try {
      // No account is created here - see authController.register - just a
      // short-lived pendingToken for these exact details, so re-submitting
      // after using Back (even with edited fields) is always safe to repeat.
      const { data } = await api.post('/auth/register', {
        email: form.email,
        username: form.username,
        mobile: form.mobile,
        password: form.password,
        gender: form.gender,
        coTravelerPreference: form.coTravelerPreference,
        referralCode: form.referralCode || undefined,
      });
      setPendingToken(data.pendingToken);
      setFreshSignup(true);
      toast('fa-solid fa-champagne-glasses', 'Details saved! Choose your plan.');
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // The single code entered at signup doubles as a coupon - matched
      // silently (no error toast) since it's just as likely a plain
      // referral code with no matching coupon at all. Passes the fresh
      // token explicitly since setPendingToken above hasn't re-rendered yet.
      matchReferralCode(form.referralCode, data.pendingToken);
    } catch (e) {
      if (e?.response?.data?.code === 'ACCOUNT_EXISTS') {
        setAccountExists(true);
      } else {
        toast('fa-solid fa-circle-xmark', apiError(e, 'Registration failed'));
      }
    } finally {
      setBusy(false);
    }
  };

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    try {
      const { data } = await api.post('/payments/validate-coupon', withPendingToken({ code, duration }));
      setApplied(appliedFrom(data));
      toast('fa-solid fa-ticket', data.isFree ? 'Coupon applied - FREE!' : `Coupon applied - pay ${rupee(data.finalAmountRupees)}`);
    } catch (e) {
      toast('fa-solid fa-circle-xmark', apiError(e, 'Invalid coupon'));
    }
  };

  const finish = async (details) => {
    let freshUser = null;
    try {
      const { data } = await api.get('/auth/me');
      freshUser = data.user;
      setUser(freshUser);
    } catch {
      // Membership was still activated server-side even if this refresh fails -
      // the success screen just won't show an expiry date in that edge case.
    }
    setOutcome({
      status: 'success',
      planType,
      planLabel: planType === 'trip_pack' ? `Trip Pass - ${packTier} trip${packTier > 1 ? 's' : ''}` : PREF_LABEL[preference],
      duration,
      packTier,
      expiresAt: freshUser?.membershipExpiresAt || null,
      hostCredits: freshUser?.hostCredits ?? null,
      joinCredits: freshUser?.joinCredits ?? null,
      ...details,
    });
    launchConfetti();
  };

  const fail = (title, message, reference) => {
    setOutcome({ status: 'failure', title, message, reference });
  };

  const supportLink = (reference) =>
    `/contact?subject=${encodeURIComponent('Joining / Membership')}&message=${encodeURIComponent(
      reference ? `Payment issue - reference: ${reference}` : 'Payment issue'
    )}`;

  // A brand-new signup has no account yet - these three success paths are
  // the only places that can ever happen, so whenever the response carries
  // a fresh accessToken (only for that pendingToken flow; an
  // already-authenticated member's responses never include one), that's
  // the account actually being created and logged into for the first time.
  const adoptSessionIfNew = (data) => {
    if (data.accessToken) setSession({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
  };

  const pay = async () => {
    setBusy(true);
    let orderData;
    try {
      const body =
        planType === 'trip_pack' ? { planType: 'trip_pack', packTier } : { duration, coupon: applied?.code || undefined };
      const { data } = await api.post('/payments/create-order', withPendingToken(body));
      orderData = data;
    } catch (e) {
      setBusy(false);
      return fail('Couldn\'t Start Payment', apiError(e, 'We couldn\'t start your payment. Please try again in a moment.'));
    }

    if (orderData.isFree) {
      setBusy(false);
      adoptSessionIfNew(orderData);
      toast('fa-solid fa-circle-check', 'Membership activated!');
      return finish({ amountRupees: 0, isFree: true, reference: orderData.payment?._id || '' });
    }

    if (orderData.testMode) {
      try {
        const { data } = await api.post('/payments/confirm-test', withPendingToken({}));
        adoptSessionIfNew(data);
        toast(
          'fa-solid fa-circle-check',
          planType === 'trip_pack' ? 'Trip Pass credits added (test mode)!' : 'Payment successful (test mode)!'
        );
        return finish({ amountRupees: orderData.amount / 100, isTest: true, reference: orderData.orderId });
      } catch (e) {
        return fail('Payment Failed', apiError(e, 'The test payment could not be confirmed.'));
      } finally {
        setBusy(false);
      }
    }

    const ok = await loadRazorpay();
    setBusy(false);
    if (!ok) return fail('Couldn\'t Load Payment Gateway', 'The Razorpay checkout script failed to load. Check your connection and try again.');

    const rzp = new window.Razorpay({
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'SastiTripsWale',
      description:
        planType === 'trip_pack'
          ? `SastiTripsWale Trip Pass - ${tripPackLabel(packTier)}`
          : `SastiTripsWale Membership - ${PREF_LABEL[preference]} (${duration === '1y' ? '1 Year' : '6 Months'})`,
      order_id: orderData.orderId,
      prefill: orderData.prefill,
      theme: { color: '#ff7a1a' },
      handler: async (resp) => {
        try {
          const { data } = await api.post(
            '/payments/verify',
            withPendingToken({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            })
          );
          adoptSessionIfNew(data);
          toast('fa-solid fa-circle-check', planType === 'trip_pack' ? 'Trip Pass credits added!' : 'Payment successful!');
          finish({ amountRupees: orderData.amount / 100, reference: resp.razorpay_payment_id });
        } catch (e) {
          fail(
            'Payment Verification Failed',
            "We couldn't confirm your payment. If money was deducted from your account, it will either be auto-refunded by Razorpay, or our team will verify and activate your membership manually - just reach out with the reference below.",
            resp.razorpay_payment_id
          );
        }
      },
      modal: { ondismiss: () => toast('fa-solid fa-circle-info', "Payment cancelled - you can try again anytime.") },
    });
    rzp.open();
  };

  return (
    <section className="join-section">
      <Seo
        title="Join Free - Become a Verified Member"
        description="Sign up for SastiTripsWale in under a minute - pick Only Male, Only Female or Couples Mode, get ID-verified, then host or join trips. Use a coupon code from an influencer or someone you know to save up to 100% off membership."
        path="/join"
      />
      <div className="container form-page-container">
        <div className="text-center mb-4">
          <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-rocket" /> Join the Tribe</div>
          <h1 className="section-title join-title">Become a <span className="highlight">Member</span></h1>
        </div>

        {/* Step indicator */}
        <div className="steps-head" style={{ maxWidth: 300 }}>
          {[1, 2].map((n, i) => (
            <Fragment key={n}>
              <div className={`step-dot${step === n ? ' active' : step > n ? ' done' : ''}`}>
                {step > n ? <i className="fa-solid fa-check" /> : n}
              </div>
              {i < 1 && <div className={`step-line${step > n ? ' done' : ''}`} />}
            </Fragment>
          ))}
        </div>

        <div className="card join-card">
          {/* STEP 1 - minimal signup */}
          {step === 1 && (
            <div className="form-step active">
              <h3 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Create your account</h3>
              <div className="field-grid-3 mb-3">
                <div className="form-group"><label htmlFor="join-email">Email *</label><input id="join-email" className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" /></div>
                <div className="form-group">
                  <label htmlFor="join-username">Username *</label>
                  <UsernameInput
                    id="join-username"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') }))}
                    placeholder="e.g. sahilkashyap"
                  />
                </div>
                <div className="form-group"><label htmlFor="join-mobile">Mobile number *</label><input id="join-mobile" className="form-input" value={form.mobile} onChange={set('mobile')} placeholder="10-digit mobile" /></div>
                <div className="form-group"><label htmlFor="join-password">Password *</label><PasswordInput id="join-password" value={form.password} onChange={set('password')} placeholder="min 6 characters" /></div>
                <div className="form-group">
                  <label htmlFor="join-gender">Your gender *</label>
                  <CustomSelect
                    id="join-gender"
                    value={form.gender}
                    onChange={setGender}
                    options={[{ value: '', label: 'Select' }, 'Male', 'Female', 'Prefer not to say']}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="join-pref">Who do you want to travel with? *</label>
                  <CustomSelect
                    id="join-pref"
                    value={form.coTravelerPreference}
                    onChange={set('coTravelerPreference')}
                    options={[{ value: '', label: 'Select' }, ...availablePrefs.map((p) => ({ value: p.key, label: p.label }))]}
                  />
                </div>
                <div className="form-group field-grid-span-all">
                  <label htmlFor="join-referral">Referral or coupon code (optional)</label>
                  <input
                    id="join-referral"
                    className="form-input"
                    value={form.referralCode}
                    onChange={(e) => setForm((f) => ({ ...f, referralCode: e.target.value.toUpperCase() }))}
                    placeholder="Got a code from a friend, or a discount coupon?"
                  />
                  <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: 6 }}>
                    {referralsEnabled
                      ? "We'll check it against both - a matching coupon applies automatically on the next step."
                      : 'A matching coupon applies automatically on the next step.'}
                  </p>
                </div>
              </div>

              <div className="form-group">
                <Checkbox
                  checked={form.agreedToTerms}
                  onChange={(e) => setForm((f) => ({ ...f, agreedToTerms: e.target.checked }))}
                >
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</Link>
                  , including the travel safety guidelines
                </Checkbox>
              </div>

              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={register} disabled={busy}>
                {busy ? <span className="spinner" /> : <i className="fa-solid fa-arrow-right" />} Continue to Plan
              </button>
              <p className="auth-switch">Already a member? <Link to="/login">Log in</Link></p>
            </div>
          )}

          {/* STEP 2 - plan + payment */}
          {step === 2 && (
            <div className="form-step active">
              {freshSignup && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ background: 'transparent', color: 'var(--text-3)', padding: '4px 0', marginBottom: 10 }}
                  onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  <i className="fa-solid fa-arrow-left" /> Back
                </button>
              )}
              <h3 className="mb-2" style={{ fontFamily: 'var(--font-display)' }}>Choose your plan</h3>
              <p className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>
                Two ways to get started - pick whichever fits how often you travel. Both unlock hosting and joining trips.
              </p>

              {/* One uniform row - every plan option (2 Membership durations +
                  3 Trip Pass tiers) styled and sized identically, wrapping
                  responsively (auto-fit) rather than a fixed column count -
                  so it can never squeeze a card narrower than it needs. */}
              <div className="plan-duration-grid uniform mb-3">
                {DURATIONS.map((d) => {
                  const price = planPrice(preference, d.key);
                  const activeSel = planType === 'membership' && duration === d.key;
                  return (
                    <button
                      key={`m-${d.key}`}
                      type="button"
                      className="card plan-duration-card"
                      onClick={() => selectMembership(d.key)}
                      style={{
                        borderColor: activeSel ? 'var(--fire)' : 'var(--glass-bdr)',
                        background: activeSel ? 'rgba(255,107,0,0.08)' : 'var(--surface)',
                      }}
                    >
                      {activeSel && <i className="fa-solid fa-circle-check plan-card-check" />}
                      {d.tag && <span className="badge badge-fire plan-duration-tag">{d.tag}</span>}
                      <div className="plan-duration-label">{d.label}</div>
                      <div className="text-muted" style={{ fontSize: '0.66rem', margin: '2px 0' }}>Membership</div>
                      <div className="price-amount plan-duration-price">{rupee(price)}</div>
                    </button>
                  );
                })}
                {TRIP_PACK_TIERS.map((t) => {
                  const activeSel = planType === 'trip_pack' && packTier === t;
                  return (
                    <button
                      key={`t-${t}`}
                      type="button"
                      className="card plan-duration-card"
                      onClick={() => selectTripPack(t)}
                      style={{
                        borderColor: activeSel ? 'var(--fire)' : 'var(--glass-bdr)',
                        background: activeSel ? 'rgba(255,107,0,0.08)' : 'var(--surface)',
                      }}
                    >
                      {activeSel && <i className="fa-solid fa-circle-check plan-card-check" />}
                      <div className="plan-duration-label">{t} Trip{t > 1 ? 's' : ''}</div>
                      <div className="text-muted" style={{ fontSize: '0.66rem', margin: '2px 0' }}>{tripPackLabel(t)}</div>
                      <div className="price-amount plan-duration-price">{rupee(TRIP_PACK_PRICES[t])}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-muted mb-3" style={{ fontSize: '0.72rem' }}>
                <i className="fa-solid fa-id-badge" /> Membership - unlimited trips, clubs &amp; connections, coupons apply, for <strong>{PREF_LABEL[preference]}</strong>.{' '}
                <i className="fa-solid fa-ticket" style={{ marginLeft: 8 }} /> Trip Pass - no membership, pay only for the trips you need, no clubs/connections/coupons.
              </p>

              <div className={`price-card mb-3${applied?.isFree ? ' free' : ''}`}>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                  You pay - {planType === 'trip_pack' ? `${packTier} Trip Pass` : `${DURATIONS.find((d) => d.key === duration)?.label} Membership`}
                </div>
                <div className="price-amount">
                  {rupee(payable)}
                  {applied && payable !== listPrice && <span className="price-strike">{rupee(listPrice)}</span>}
                </div>
                {applied?.isReferral ? (
                  <div style={{ color: '#6ee7b7', fontSize: '0.8rem', fontWeight: 600, marginTop: 4 }}>
                    <i className="fa-solid fa-champagne-glasses" /> Congratulations! You used{' '}
                    {applied.referrerUsername ? `${applied.referrerUsername}'s` : "a friend's"} referral code and
                    got <strong>{applied.discountPct}% off</strong>{applied.isFree ? ' - FREE!' : ''}
                  </div>
                ) : applied?.isFree ? (
                  <div style={{ color: '#6ee7b7', fontSize: '0.85rem', fontWeight: 700 }}>FREE with {applied.code}</div>
                ) : applied ? (
                  <div style={{ color: '#6ee7b7', fontSize: '0.8rem', fontWeight: 600, marginTop: 4 }}>
                    <i className="fa-solid fa-ticket" /> Coupon {applied.code} applied
                  </div>
                ) : null}
              </div>

              {planType === 'membership' && !freshSignup && (
                <div className="search-bar mb-3">
                  <i className="fa-solid fa-ticket" style={{ color: 'var(--text-3)' }} />
                  <input placeholder="Enter coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                  <button className="btn btn-sm btn-outline" type="button" onClick={applyCoupon}>Apply</button>
                </div>
              )}

              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={pay} disabled={busy}>
                {busy ? <span className="spinner" /> : <i className="fa-solid fa-shield-halved" />}
                {applied?.isFree ? ' Activate Free Membership' : ` Pay ${rupee(payable)}`}
              </button>
              <p className="text-muted" style={{ fontSize: '0.72rem', textAlign: 'center', marginTop: 12 }}>
                {planType === 'trip_pack' ? (
                  <><i className="fa-solid fa-lock" /> Secure payment, no coupons applicable. Credits are added instantly and top up any you already have.</>
                ) : (
                  <><i className="fa-solid fa-lock" /> Secure payment. Next: complete your profile to start planning &amp; joining trips.</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={outcome?.status === 'success'}
        onClose={() => navigate('/complete-profile')}
        title={outcome?.planType === 'trip_pack' ? 'Trip Pass activated!' : 'Membership active!'}
      >
        {outcome?.status === 'success' && (
          <>
            <div className="card" style={{ padding: 16, marginBottom: 18, background: 'var(--bg-2)' }}>
              <div className="row-between" style={{ marginBottom: 8 }}>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Plan</span>
                <strong style={{ fontSize: '0.85rem' }}>
                  {outcome.planLabel}
                  {outcome.planType !== 'trip_pack' && ` · ${outcome.duration === '1y' ? '1 Year' : '6 Months'}`}
                </strong>
              </div>
              <div className="row-between" style={{ marginBottom: 8 }}>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Amount paid</span>
                <strong style={{ fontSize: '0.85rem' }}>{outcome.isFree ? 'FREE' : rupee(outcome.amountRupees)}{outcome.isTest && ' (test mode)'}</strong>
              </div>
              {outcome.reference && (
                <div className="row-between" style={{ marginBottom: 8 }}>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Reference</span>
                  <strong style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', textAlign: 'right' }}>{outcome.reference}</strong>
                </div>
              )}
              {outcome.planType === 'trip_pack' ? (
                <div className="row-between">
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Credits available now</span>
                  <strong style={{ fontSize: '0.85rem' }}>
                    {outcome.hostCredits ?? '-'} host · {outcome.joinCredits ?? '-'} join
                  </strong>
                </div>
              ) : (
                outcome.expiresAt && (
                  <div className="row-between">
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>Valid until</span>
                    <strong style={{ fontSize: '0.85rem' }}>{formatDate(outcome.expiresAt)}</strong>
                  </div>
                )
              )}
            </div>
            <p style={{ color: 'var(--text-2)', lineHeight: 1.8 }}>
              One last step - complete your profile (name, city, interests, vehicle &amp; ID). You need a
              complete profile to plan or join trips.
            </p>
            <button className="btn btn-primary btn-lg mt-3" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/complete-profile')}>
              <i className="fa-solid fa-user-gear" /> Complete My Profile
            </button>
          </>
        )}
      </Modal>

      <Modal open={outcome?.status === 'failure'} onClose={() => setOutcome(null)} title={outcome?.title || 'Payment Failed'}>
        {outcome?.status === 'failure' && (
          <>
            <p style={{ color: 'var(--text-2)', lineHeight: 1.8 }}>{outcome.message}</p>
            {outcome.reference && (
              <div className="card" style={{ padding: 12, marginTop: 12, marginBottom: 4, background: 'var(--bg-2)' }}>
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>Reference (quote this to support)</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginTop: 4, wordBreak: 'break-all' }}>{outcome.reference}</div>
              </div>
            )}
            <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 14 }}>
              No membership was activated. You have not been charged unless Razorpay explicitly confirmed a
              successful payment.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setOutcome(null)}>
                <i className="fa-solid fa-rotate-right" /> Try Again
              </button>
              <Link to={supportLink(outcome.reference)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                <i className="fa-solid fa-headset" /> Contact Support
              </Link>
            </div>
          </>
        )}
      </Modal>

      <Modal open={accountExists} onClose={() => setAccountExists(false)} title="You already have an account">
        <p style={{ color: 'var(--text-2)', lineHeight: 1.8 }}>
          That email or mobile number is already registered with SastiTripsWale. Log in instead - or reset your
          password if you don't remember it.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => navigate(`/login?email=${encodeURIComponent(form.email)}`)}
          >
            <i className="fa-solid fa-right-to-bracket" /> Log In
          </button>
          <Link to="/forgot-password" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
            <i className="fa-solid fa-key" /> Forgot Password
          </Link>
        </div>
      </Modal>
    </section>
  );
}
