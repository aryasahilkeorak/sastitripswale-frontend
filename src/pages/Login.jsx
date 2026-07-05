import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { toast } from '../lib/toast.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setSession({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      toast('👋', `Welcome back, ${data.user.fullName.split(' ')[0]}!`);
      const dest = location.state?.from || (data.user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(dest, { replace: true });
    } catch (e2) {
      setErr(apiError(e2, 'Login failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="page-hero-bg" />
      <div className="auth-card">
        <h1>Welcome back 👋</h1>
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
            <input className="form-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <Link to="/forgot-password" style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>
              Forgot password?
            </Link>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? <span className="spinner" /> : <i className="ri-login-box-line" />} Log In
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/join">Join the community →</Link>
        </p>
      </div>
    </div>
  );
}
