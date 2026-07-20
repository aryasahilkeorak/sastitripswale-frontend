import { useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { useAuth } from '../../store/auth.js';
import { imageUrl, formatDate, AVATAR_FALLBACK } from '../../lib/helpers.js';
import { toast } from '../../lib/toast.js';
import PasswordInput from '../../components/PasswordInput.jsx';
import AvatarUploadField from '../../components/AvatarUploadField.jsx';

export default function AdminProfile() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const isSuper = user?.role === 'superadmin';

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    username: user?.username || '',
    whatsapp: user?.whatsapp || '',
    city: user?.city || '',
    instagram: user?.instagram || '',
    facebook: user?.facebook || '',
    twitter: user?.twitter || '',
    youtube: user?.youtube || '',
    linkedin: user?.linkedin || '',
  });
  const [avatar, setAvatar] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const setPw = (k) => (e) => setPwForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (form.username.trim() && !/^[a-z0-9_.]{3,30}$/i.test(form.username.trim())) {
      return toast('fa-solid fa-triangle-exclamation', 'Username must be 3-30 characters: letters, numbers, dots or underscores');
    }
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (avatar) fd.append('avatar', avatar);
      const { data } = await api.put('/members/profile', fd);
      setUser(data.user);
      setAvatar(null);
      toast('fa-solid fa-circle-check', 'Profile updated');
    } catch (err) { toast('fa-solid fa-circle-xmark', apiError(err)); }
    finally { setBusy(false); }
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

  return (
    <>
      {/* Special admin identity hero */}
      <div className="admin-profile-hero mb-4">
        <img className="profile-avatar" src={avatar ? URL.createObjectURL(avatar) : imageUrl(user?.avatarUrl, AVATAR_FALLBACK)} alt={user?.fullName} onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <span className={`role-badge ${isSuper ? 'super' : 'admin'}`} style={{ marginBottom: 8 }}>
            <i className={isSuper ? 'fa-solid fa-crown' : 'fa-solid fa-shield-halved'} /> {isSuper ? 'Super Admin' : 'Admin'}
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 800 }}>{user?.fullName}</h1>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>{user?.email} · {user?.mobile}</p>
          <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 4 }}>
            <i className="fa-solid fa-shield-halved" style={{ color: 'var(--fire)' }} /> Platform administrator since {formatDate(user?.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid-2">
        <form className="card" style={{ padding: 24 }} onSubmit={save}>
          <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Edit admin profile</h4>
          <AvatarUploadField value={avatar} currentUrl={user?.avatarUrl} onChange={setAvatar} />
          <div className="form-group"><label>Full name</label><input className="form-input" value={form.fullName} onChange={set('fullName')} /></div>
          <div className="form-row">
            <div className="form-group"><label>Email</label><input className="form-input" type="email" value={form.email} onChange={set('email')} /></div>
            <div className="form-group"><label>Mobile</label><input className="form-input" value={form.mobile} onChange={set('mobile')} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>City</label><input className="form-input" value={form.city} onChange={set('city')} /></div>
            <div className="form-group"><label>WhatsApp</label><input className="form-input" value={form.whatsapp} onChange={set('whatsapp')} /></div>
          </div>
          <div className="form-group"><label>Username</label><input className="form-input" value={form.username} onChange={set('username')} placeholder="e.g. sahil.k" /></div>

          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>Social links</label>
          <div className="form-row">
            <div className="form-group"><label><i className="fa-brands fa-instagram" /> Instagram</label><input className="form-input" value={form.instagram} onChange={set('instagram')} placeholder="username" /></div>
            <div className="form-group"><label><i className="fa-brands fa-facebook" /> Facebook</label><input className="form-input" value={form.facebook} onChange={set('facebook')} placeholder="username" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label><i className="fa-brands fa-x-twitter" /> X (Twitter)</label><input className="form-input" value={form.twitter} onChange={set('twitter')} placeholder="username" /></div>
            <div className="form-group"><label><i className="fa-brands fa-youtube" /> YouTube</label><input className="form-input" value={form.youtube} onChange={set('youtube')} placeholder="channel handle" /></div>
          </div>
          <div className="form-group"><label><i className="fa-brands fa-linkedin" /> LinkedIn</label><input className="form-input" value={form.linkedin} onChange={set('linkedin')} placeholder="username" /></div>

          <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : <i className="fa-solid fa-floppy-disk" />} Save changes</button>
        </form>

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
      </div>
    </>
  );
}
