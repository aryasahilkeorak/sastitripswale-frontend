import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { toast } from '../lib/toast.js';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuth((s) => s.setSession);
  const setViewMode = useAuth((s) => s.setViewMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [roleChoice, setRoleChoice] = useState(null); // logged-in user, awaiting admin/user pick

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setSession({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      toast('fa-solid fa-hand', `Welcome back, ${data.user.fullName.split(' ')[0]}!`);
      if (data.user.role === 'admin' || data.user.role === 'superadmin') {
        setRoleChoice(data.user);
      } else {
        navigate(location.state?.from || '/dashboard', { replace: true });
      }
    } catch (e2) {
      setErr(apiError(e2, 'Login failed'));
    } finally {
      setBusy(false);
    }
  };

  const continueAs = (mode) => {
    setViewMode(mode);
    navigate(mode === 'admin' ? '/admin' : (location.state?.from || '/dashboard'), { replace: true });
  };

  if (roleChoice) {
    return (
      <div className="auth-wrap">
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
      <div className="page-hero-bg" />
      <div className="auth-card">
        <h1>Welcome back <i className="fa-solid fa-hand" /></h1>
        <p className="muted">Log in to plan trips, join groups and connect.</p>

        {err && (
          <div className="badge badge-red" style={{ display: 'block', padding: '10px 14px', marginBottom: 16 }}>
            {err}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <Link to="/forgot-password" style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>
              Forgot password?
            </Link>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? <span className="spinner" /> : <i className="fa-solid fa-right-to-bracket" />} Log In
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/join">Join the community →</Link>
        </p>
      </div>
    </div>
  );
}
