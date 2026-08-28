import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { toast } from '../lib/toast.js';
import PasswordInput from '../components/PasswordInput.jsx';
import Seo from '../components/Seo.jsx';
import { useT } from '../i18n/index.js';

export default function Login() {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setSession = useAuth((s) => s.setSession);
  const setViewMode = useAuth((s) => s.setViewMode);
  // Prefilled when arriving from Join after "you already have an account" -
  // saves re-typing the email they just entered there.
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [roleChoice, setRoleChoice] = useState(null); // logged-in user, awaiting admin/user pick

  // 2FA (admin PIN) step - set once /auth/login reports twoFactorRequired.
  const [twoFactorToken, setTwoFactorToken] = useState(null);
  const [pin, setPin] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [pinErr, setPinErr] = useState('');

  const onLoggedIn = (user) => {
    toast('fa-solid fa-hand', `Welcome back, ${user.fullName.split(' ')[0]}!`);
    if (user.role === 'admin' || user.role === 'superadmin') {
      setRoleChoice(user);
    } else {
      navigate(location.state?.from || '/dashboard', { replace: true });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.twoFactorRequired) {
        setTwoFactorToken(data.twoFactorToken);
        return;
      }
      setSession({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      onLoggedIn(data.user);
    } catch (e2) {
      setErr(apiError(e2, 'Login failed'));
    } finally {
      setBusy(false);
    }
  };

  const submitPin = async (e) => {
    e.preventDefault();
    setPinBusy(true);
    setPinErr('');
    try {
      const { data } = await api.post('/auth/verify-2fa', { twoFactorToken, pin });
      setSession({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      setTwoFactorToken(null);
      onLoggedIn(data.user);
    } catch (e2) {
      setPinErr(apiError(e2, 'Incorrect PIN'));
    } finally {
      setPinBusy(false);
    }
  };

  const continueAs = (mode) => {
    setViewMode(mode);
    navigate(mode === 'admin' ? '/admin' : (location.state?.from || '/dashboard'), { replace: true });
  };

  if (twoFactorToken) {
    return (
      <div className="auth-wrap">
        <Seo noindex path="/login" title="Log In" />
        <div className="page-hero-bg" />
        <div className="auth-card text-center">
          <h1><i className="fa-solid fa-shield-halved" /> Enter your PIN</h1>
          <p className="muted">This account has two-factor authentication enabled. Enter your 6-digit admin PIN to continue.</p>

          {pinErr && (
            <div className="badge badge-red" style={{ display: 'block', padding: '10px 14px', margin: '16px 0' }}>
              {pinErr}
            </div>
          )}

          <form onSubmit={submitPin} style={{ marginTop: 16 }}>
            <div className="form-group">
              <input
                className="form-input"
                style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.4em' }}
                inputMode="numeric"
                autoFocus
                maxLength={6}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
              />
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={pinBusy || pin.length !== 6}>
              {pinBusy ? <span className="spinner" /> : <i className="fa-solid fa-unlock" />} Verify PIN
            </button>
          </form>

          <button
            type="button"
            className="btn btn-sm"
            style={{ marginTop: 16, background: 'transparent', color: 'var(--text-3)' }}
            onClick={() => { setTwoFactorToken(null); setPin(''); setPinErr(''); }}
          >
            <i className="fa-solid fa-arrow-left" /> Back to login
          </button>
        </div>
      </div>
    );
  }

  if (roleChoice) {
    return (
      <div className="auth-wrap">
        <Seo noindex path="/login" title="Log In" />
        <div className="page-hero-bg" />
        <div className="auth-card text-center">
          <h1>Welcome back, {roleChoice.fullName.split(' ')[0]} <i className="fa-solid fa-hand" /></h1>
          <p className="muted">Your account has admin access. How do you want to continue?</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => continueAs('admin')}>
              <i className="fa-solid fa-shield-halved" /> Continue as Admin
            </button>
            <button className="btn btn-outline btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => continueAs('user')}>
              <i className="fa-solid fa-user" /> Continue as User
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <Seo noindex path="/login" title="Log In" />
      <div className="page-hero-bg" />
      <div className="auth-card">
        <h1>{t('login.welcomeBack')} <i className="fa-solid fa-hand" /></h1>
        <p className="muted">{t('login.subtitle')}</p>

        {err && (
          <div className="badge badge-red" style={{ display: 'block', padding: '10px 14px', marginBottom: 16 }}>
            {err}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="login-email">{t('login.email')}</label>
            <input id="login-email" className="form-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">{t('login.password')}</label>
            <PasswordInput id="login-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <Link to="/forgot-password" style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>
              {t('login.forgotPassword')}
            </Link>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? <span className="spinner" /> : <i className="fa-solid fa-right-to-bracket" />} {t('login.logIn')}
          </button>
        </form>

        <p className="auth-switch">
          {t('login.newHere')} <Link to="/join">{t('login.joinCommunityLink')}</Link>
        </p>
      </div>
    </div>
  );
}
