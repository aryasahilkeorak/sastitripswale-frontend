import { useRef, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { useAuth } from '../../store/auth.js';
import { imageUrl, formatDate, AVATAR_FALLBACK } from '../../lib/helpers.js';
import { toast } from '../../lib/toast.js';
import PasswordInput from '../../components/PasswordInput.jsx';
import ProfileHeaderPhotos from '../../components/ProfileHeaderPhotos.jsx';
import ImageCropModal from '../../components/ImageCropModal.jsx';

export default function AdminProfile() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const isSuper = user?.role === 'superadmin';

  const adminAvatarRef = useRef(null);
  const [pendingAdminAvatar, setPendingAdminAvatar] = useState(null);
  const [adminAvatarBusy, setAdminAvatarBusy] = useState(false);

  // Uploads straight away instead of going through the "Edit admin profile"
  // form's Save button below - this hero photo (adminAvatarUrl) is a
  // separate field from that form's member-facing avatar, so there's no
  // reason to make changing it wait on unrelated fields being saved too.
  const uploadAdminAvatar = async (cropped) => {
    setPendingAdminAvatar(null);
    setAdminAvatarBusy(true);
    try {
      const fd = new FormData();
      fd.append('adminAvatar', cropped);
      const { data } = await api.put('/members/profile', fd);
      setUser(data.user);
      toast('fa-solid fa-circle-check', 'Admin photo updated');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setAdminAvatarBusy(false);
    }
  };

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
  });
  const [avatar, setAvatar] = useState(null);
  const [cover, setCover] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const setPw = (k) => (e) => setPwForm((f) => ({ ...f, [k]: e.target.value }));

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [tfaForm, setTfaForm] = useState({ password: '', pin: '', confirmPin: '' });
  const [tfaBusy, setTfaBusy] = useState(false);
  const setTfa = (k) => (e) => setTfaForm((f) => ({ ...f, [k]: e.target.value }));
  const [disablePassword, setDisablePassword] = useState('');
  const [disableBusy, setDisableBusy] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (avatar) fd.append('avatar', avatar);
      if (cover) fd.append('cover', cover);
      const { data } = await api.put('/members/profile', fd);
      setUser(data.user);
      setAvatar(null);
      setCover(null);
      setEditing(false);
      toast('fa-solid fa-circle-check', 'Profile updated');
    } catch (err) { toast('fa-solid fa-circle-xmark', apiError(err)); }
    finally { setBusy(false); }
  };

  // Discards any unsaved edits (typed fields, staged avatar/cover) rather
  // than just re-locking the form with changes still sitting in state.
  const cancelEdit = () => {
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      mobile: user?.mobile || '',
    });
    setAvatar(null);
    setCover(null);
    setEditing(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) return toast('fa-solid fa-triangle-exclamation', 'New password must be at least 6 characters');
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast('fa-solid fa-triangle-exclamation', 'New passwords do not match');
    setPwBusy(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast('fa-solid fa-circle-check', 'Password updated');
    } catch (err) { toast('fa-solid fa-circle-xmark', apiError(err)); }
    finally { setPwBusy(false); }
  };

  const setupTwoFactor = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(tfaForm.pin)) return toast('fa-solid fa-triangle-exclamation', 'PIN must be exactly 6 digits');
    if (tfaForm.pin !== tfaForm.confirmPin) return toast('fa-solid fa-triangle-exclamation', 'PINs do not match');
    setTfaBusy(true);
    try {
      const { data } = await api.post('/auth/2fa/setup', { password: tfaForm.password, pin: tfaForm.pin });
      setUser(data.user);
      setTwoFactorEnabled(true);
      setTfaForm({ password: '', pin: '', confirmPin: '' });
      toast('fa-solid fa-circle-check', twoFactorEnabled ? 'PIN updated' : 'Two-factor authentication enabled');
    } catch (err) { toast('fa-solid fa-circle-xmark', apiError(err)); }
    finally { setTfaBusy(false); }
  };

  const disableTwoFactor = async (e) => {
    e.preventDefault();
    setDisableBusy(true);
    try {
      const { data } = await api.post('/auth/2fa/disable', { password: disablePassword });
      setUser(data.user);
      setTwoFactorEnabled(false);
      setDisablePassword('');
      setShowDisableForm(false);
      toast('fa-solid fa-circle-check', 'Two-factor authentication disabled');
    } catch (err) { toast('fa-solid fa-circle-xmark', apiError(err)); }
    finally { setDisableBusy(false); }
  };

  return (
    <>
      {/* Special admin identity hero - this photo (adminAvatarUrl) is
          separate from the member-facing avatar edited below; it's what
          shows in the admin header and, for the founder, on the public
          About page. */}
      <div className="admin-profile-hero mb-4">
        <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
          {/* adminAvatarUrl only - no `|| user?.avatarUrl` fallback. That
              fallback was what made this look linked to the member avatar
              below: with no dedicated admin photo set, it silently mirrored
              whatever avatarUrl was, so editing the member photo appeared to
              also change this one. Shows the generic placeholder instead
              until a dedicated photo is uploaded via the camera button. */}
          <img
            className="profile-avatar"
            src={imageUrl(user?.adminAvatarUrl, AVATAR_FALLBACK)}
            alt={user?.fullName}
            onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
          />
          <button
            type="button"
            className="btn btn-sm"
            style={{ position: 'absolute', right: 0, bottom: 0, borderRadius: '50%', width: 30, height: 30, padding: 0, justifyContent: 'center', background: 'var(--fire)', color: '#fff' }}
            onClick={() => adminAvatarRef.current?.click()}
            disabled={adminAvatarBusy}
            title="Change admin photo"
          >
            {adminAvatarBusy ? <span className="spinner" /> : <i className="fa-solid fa-camera" />}
          </button>
          <input
            ref={adminAvatarRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) setPendingAdminAvatar(f);
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <span className={`role-badge ${isSuper ? 'super' : 'admin'}`} style={{ marginBottom: 8 }}>
            <i className={isSuper ? 'fa-solid fa-crown' : 'fa-solid fa-shield-halved'} /> {isSuper ? 'Super Admin' : 'Admin'}
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 800 }}>{user?.fullName}</h1>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>{user?.email} · {user?.mobile}</p>
          <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
            <i className="fa-solid fa-shield-halved" style={{ color: 'var(--fire)' }} /> Platform administrator since {formatDate(user?.createdAt)}
          </p>
          <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: 8 }}>
            This photo is separate from your member profile photo below - it's what shows here and (as
            founder) on the public About page, never in the member directory or chat.
          </p>
        </div>
      </div>

      <ImageCropModal
        file={pendingAdminAvatar}
        title="Crop admin photo"
        onCancel={() => setPendingAdminAvatar(null)}
        onCropped={uploadAdminAvatar}
      />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <form className="card" style={{ padding: 24 }} onSubmit={save}>
          <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Edit admin profile</h4>
          <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: -8, marginBottom: 12 }}>
            Your member profile photo &amp; cover, shown wherever you appear as a regular member (directory,
            chat, trips) - separate from the admin/founder photo shown above.
          </p>
          <ProfileHeaderPhotos
            avatarFile={avatar}
            coverFile={cover}
            currentAvatarUrl={user?.avatarUrl}
            currentCoverUrl={user?.coverUrl}
            onAvatarChange={setAvatar}
            onCoverChange={setCover}
            editable={editing}
          />
          <div className="form-group"><label>Full name</label><input className="form-input" value={form.fullName} onChange={set('fullName')} disabled={!editing} /></div>
          <div className="form-row">
            <div className="form-group"><label>Email</label><input className="form-input" type="email" value={form.email} onChange={set('email')} disabled={!editing} /></div>
            <div className="form-group"><label>Mobile</label><input className="form-input" value={form.mobile} onChange={set('mobile')} disabled={!editing} /></div>
          </div>

          {editing ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : <i className="fa-solid fa-floppy-disk" />} Save changes</button>
              <button type="button" className="btn btn-outline" onClick={cancelEdit} disabled={busy}>
                <i className="fa-solid fa-xmark" /> Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-outline" onClick={() => setEditing(true)}>
              <i className="fa-solid fa-pen" /> Edit
            </button>
          )}
        </form>

        <div className="card" style={{ padding: 24 }}>
          <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Capabilities</h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'View & manage all members and their documents',
              'Verify or ban members',
              'Manage trips, coupons and reviews',
              'Handle help & complaint queries',
              ...(isSuper ? ['Add new admins', 'Permanently delete users'] : []),
            ].map((cap) => (
              <li key={cap} style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7' }} /> {cap}
              </li>
            ))}
          </ul>
        </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <form className="card" style={{ padding: 24 }} onSubmit={changePassword}>
            <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Change password</h4>
            <div className="form-group"><label>Current password</label><PasswordInput value={pwForm.currentPassword} onChange={setPw('currentPassword')} required /></div>
            <div className="form-row">
              <div className="form-group"><label>New password</label><PasswordInput value={pwForm.newPassword} onChange={setPw('newPassword')} placeholder="min 6 characters" required /></div>
              <div className="form-group"><label>Confirm new password</label><PasswordInput value={pwForm.confirmPassword} onChange={setPw('confirmPassword')} required /></div>
            </div>
            <button className="btn btn-primary" disabled={pwBusy}>{pwBusy ? <span className="spinner" /> : <i className="fa-solid fa-key" />} Update password</button>
          </form>

          <div className="card" style={{ padding: 24 }}>
            <div className="row-between mb-2">
              <h4 style={{ fontFamily: 'var(--font-display)' }}>Two-factor authentication</h4>
              <span className={`badge ${twoFactorEnabled ? 'badge-green' : 'badge-red'}`}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
              {twoFactorEnabled
                ? "A 6-digit PIN is required after your password on every login. You can change it below or turn 2FA off."
                : 'Set a 6-digit PIN to require it after your password on every future login.'}
            </p>

            <form onSubmit={setupTwoFactor}>
              <div className="form-group"><label>Current password</label><PasswordInput value={tfaForm.password} onChange={setTfa('password')} required /></div>
              <div className="form-row">
                <div className="form-group">
                  <label>{twoFactorEnabled ? 'New PIN' : '6-digit PIN'}</label>
                  <input
                    className="form-input" inputMode="numeric" maxLength={6}
                    style={{ letterSpacing: '0.3em' }}
                    value={tfaForm.pin}
                    onChange={(e) => setTfaForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="••••••" required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm PIN</label>
                  <input
                    className="form-input" inputMode="numeric" maxLength={6}
                    style={{ letterSpacing: '0.3em' }}
                    value={tfaForm.confirmPin}
                    onChange={(e) => setTfaForm((f) => ({ ...f, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="••••••" required
                  />
                </div>
              </div>
              <button className="btn btn-primary" disabled={tfaBusy}>
                {tfaBusy ? <span className="spinner" /> : <i className="fa-solid fa-shield-halved" />} {twoFactorEnabled ? 'Update PIN' : 'Enable 2FA'}
              </button>
            </form>

            {twoFactorEnabled && (
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {!showDisableForm ? (
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowDisableForm(true)}>
                    <i className="fa-solid fa-toggle-off" /> Turn off 2FA
                  </button>
                ) : (
                  <form onSubmit={disableTwoFactor} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Confirm password to disable</label>
                      <PasswordInput value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} required />
                    </div>
                    <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} disabled={disableBusy}>
                      {disableBusy ? <span className="spinner" /> : <i className="fa-solid fa-xmark" />} Disable
                    </button>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => { setShowDisableForm(false); setDisablePassword(''); }}>Cancel</button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
