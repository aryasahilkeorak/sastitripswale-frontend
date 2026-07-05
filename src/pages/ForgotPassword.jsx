import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api.post('/auth/forgot-password', { email });
      setDone(true);
    } catch (e2) {
      setErr(apiError(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="page-hero-bg" />
      <div className="auth-card">
        <h1>Reset password</h1>
        {done ? (
          <>
            <p className="muted">
              If an account exists for <strong>{email}</strong>, we've sent a reset link. Check your
              inbox (and spam).
            </p>
            <Link to="/login" className="btn btn-outline mt-3" style={{ width: '100%', justifyContent: 'center' }}>
              Back to login
            </Link>
          </>
        ) : (
          <>
            <p className="muted">Enter your email and we'll send a reset link.</p>
            {err && <div className="badge badge-red" style={{ display: 'block', padding: '10px 14px', marginBottom: 16 }}>{err}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
                {busy ? <span className="spinner" /> : <i className="fa-solid fa-paper-plane" />} Send reset link
              </button>
            </form>
            <p className="auth-switch">
              <Link to="/login">← Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
