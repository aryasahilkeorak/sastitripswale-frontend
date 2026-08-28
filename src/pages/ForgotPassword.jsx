import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import Seo from '../components/Seo.jsx';
import CustomDatePicker from '../components/CustomDatePicker.jsx';

export default function ForgotPassword() {
  // 'link' = classic email-link reset. 'verify' = an alternative for
  // someone who's also lost access to their inbox - proves identity with
  // email + date of birth instead, but still only ever ends in the same
  // link being emailed (see authController.verifyIdentityForReset) - so
  // this can't skip the "click the link" step, just reach it another way.
  const [mode, setMode] = useState('link');

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const [dob, setDob] = useState('');
  const [verifyResult, setVerifyResult] = useState(null); // true | false | null

  const submitLink = async (e) => {
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

  const submitVerify = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    setVerifyResult(null);
    try {
      const { data } = await api.post('/auth/verify-identity', { email, dateOfBirth: dob });
      setVerifyResult(data.verified);
    } catch (e2) {
      setErr(apiError(e2));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setErr('');
    setDone(false);
    setVerifyResult(null);
  };

  return (
    <div className="auth-wrap">
      <Seo noindex path="/forgot-password" title="Forgot Password" />
      <div className="page-hero-bg" />
      <div className="auth-card">
        <h1>Reset password</h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'link' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => switchMode('link')}
          >
            Email link
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'verify' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => switchMode('verify')}
          >
            No inbox access?
          </button>
        </div>

        {err && <div className="badge badge-red" style={{ display: 'block', padding: '10px 14px', marginBottom: 16 }}>{err}</div>}

        {mode === 'link' ? (
          done ? (
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
              <form onSubmit={submitLink}>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
                  {busy ? <span className="spinner" /> : <i className="fa-solid fa-paper-plane" />} Send reset link
                </button>
              </form>
            </>
          )
        ) : verifyResult === true ? (
          <>
            <p className="muted">
              Verified - we've sent a reset link to <strong>{email}</strong>. Check your inbox (and spam) and
              click it to set a new password.
            </p>
            <Link to="/login" className="btn btn-outline mt-3" style={{ width: '100%', justifyContent: 'center' }}>
              Back to login
            </Link>
          </>
        ) : (
          <>
            <p className="muted">
              Verify your identity with your email and date of birth - if they match, we'll email you a reset
              link (same as the link option, just reached a different way).
            </p>
            {verifyResult === false && (
              <div className="badge badge-red" style={{ display: 'block', padding: '10px 14px', marginBottom: 16 }}>
                We couldn't verify those details. Double-check your email and date of birth, or use the email
                link option instead.
              </div>
            )}
            <form onSubmit={submitVerify}>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="form-group">
                <label>Date of birth</label>
                <CustomDatePicker value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
                {busy ? <span className="spinner" /> : <i className="fa-solid fa-shield-halved" />} Verify identity
              </button>
            </form>
            <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: 10 }}>
              Only works if you've saved a date of birth in your profile - most members haven't, since it's an
              optional field. If this doesn't work, contact support instead.
            </p>
          </>
        )}

        <p className="auth-switch">
          <Link to="/login">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
