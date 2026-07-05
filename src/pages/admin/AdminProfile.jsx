import { useRef, useState } from 'react';
import { api, apiError } from '../../lib/api.js';
import { useAuth } from '../../store/auth.js';
import { imageUrl, formatDate, AVATAR_FALLBACK } from '../../lib/helpers.js';
import { toast } from '../../lib/toast.js';

export default function AdminProfile() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const isSuper = user?.role === 'superadmin';
  const fileRef = useRef(null);

  const [form, setForm] = useState({ fullName: user?.fullName || '', whatsapp: user?.whatsapp || '', city: user?.city || '' });
  const [avatar, setAvatar] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
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
          <div className="upload-box mb-3" onClick={() => fileRef.current?.click()}>
            <img className="avatar-preview" src={avatar ? URL.createObjectURL(avatar) : imageUrl(user?.avatarUrl, AVATAR_FALLBACK)} alt="" />
            <div className="upload-label">{avatar ? avatar.name : 'Change photo'}</div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
          </div>
          <div className="form-group"><label>Full name</label><input className="form-input" value={form.fullName} onChange={set('fullName')} /></div>
          <div className="form-row">
            <div className="form-group"><label>City</label><input className="form-input" value={form.city} onChange={set('city')} /></div>
            <div className="form-group"><label>WhatsApp</label><input className="form-input" value={form.whatsapp} onChange={set('whatsapp')} /></div>
          </div>
          <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : <i className="fa-solid fa-floppy-disk" />} Save changes</button>
        </form>

        <div className="card" style={{ padding: 24, alignSelf: 'flex-start' }}>
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
    </>
  );
}
