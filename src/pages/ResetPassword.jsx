import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import PasswordInput from '../components/PasswordInput.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setErr('Passwords do not match');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await api.post('/auth/reset-password', { token, password });
      toast('fa-solid fa-circle-check', 'Password updated! Please log in.');
      navigate('/login', { replace: true });
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
        <h1>Set a new password</h1>
        {!token ? (
          <>
            <p className="muted">This reset link is invalid or missing a token.</p>
            <Link to="/forgot-password" className="btn btn-outline mt-3" style={{ width: '100%', justifyContent: 'center' }}>
              Request a new link
            </Link>
          </>
        ) : (
          <>
            <p className="muted">Choose a strong password (min 6 characters).</p>
            {err && <div className="badge badge-red" style={{ display: 'block', padding: '10px 14px', marginBottom: 16 }}>{err}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label>New password</label>
                <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Confirm password</label>
                <PasswordInput required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
                {busy ? <span className="spinner" /> : <i className="fa-solid fa-lock" />} Update password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
