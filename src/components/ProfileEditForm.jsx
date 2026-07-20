import { useRef, useState } from 'react';
import { api, apiError } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import CustomSelect from './CustomSelect.jsx';
import AvatarUploadField from './AvatarUploadField.jsx';

// Shared "edit profile" form — used both in the Dashboard Settings tab and
// in the Instagram-style edit-profile modal opened from a member's own
// profile page. Saves via PUT /members/profile either way.
export default function ProfileEditForm({ user, onSaved }) {
  const partnerDocRef = useRef(null);
  const [form, setForm] = useState({
    fullName: user?.fullName || '', profession: user?.profession || '', city: user?.city || '',
    state: user?.state || '', whatsapp: user?.whatsapp || '', instagram: user?.instagram || '',
    facebook: user?.facebook || '', twitter: user?.twitter || '', youtube: user?.youtube || '', linkedin: user?.linkedin || '',
    vehicleModel: user?.vehicleModel || '', bio: user?.bio || '',
    relationshipStatus: user?.relationshipStatus || '', username: user?.username || '',
    email: user?.email || '', mobile: user?.mobile || '',
  });
  const [avatar, setAvatar] = useState(null);
  const [partnerMobile, setPartnerMobile] = useState(user?.partnerMobile || '');
  const [partnerDoc, setPartnerDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const showCouplesBox = form.relationshipStatus === 'in_a_relationship' || form.relationshipStatus === 'married';

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (partnerMobile.trim() && !/^[0-9]{10,15}$/.test(partnerMobile.trim())) {
      return toast('fa-solid fa-triangle-exclamation', "Enter a valid partner's mobile number, or leave it blank");
    }
    if (form.username.trim() && !/^[a-z0-9_.]{3,30}$/i.test(form.username.trim())) {
      return toast('fa-solid fa-triangle-exclamation', 'Username must be 3-30 characters: letters, numbers, dots or underscores');
    }
    if (!form.email.trim()) return toast('fa-solid fa-triangle-exclamation', 'Email cannot be empty');
    if (!/^[0-9]{10,15}$/.test(form.mobile.trim())) return toast('fa-solid fa-triangle-exclamation', 'Enter a valid mobile number');
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('partnerMobile', partnerMobile.trim());
      if (avatar) fd.append('avatar', avatar);
      if (partnerDoc) fd.append('partnerDoc', partnerDoc);
      const { data } = await api.put('/members/profile', fd);
      onSaved?.(data.user);
      toast('fa-solid fa-circle-check', 'Profile updated!');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" style={{ padding: 24 }} onSubmit={save}>
      <AvatarUploadField value={avatar} currentUrl={user?.avatarUrl} onChange={setAvatar} />
      <div className="form-group"><label>Full name</label><input className="form-input" value={form.fullName} onChange={set('fullName')} /></div>
      <div className="form-row">
        <div className="form-group"><label>Profession</label><input className="form-input" value={form.profession} onChange={set('profession')} /></div>
        <div className="form-group"><label>Vehicle model</label><input className="form-input" value={form.vehicleModel} onChange={set('vehicleModel')} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>City</label><input className="form-input" value={form.city} onChange={set('city')} /></div>
        <div className="form-group"><label>State</label><input className="form-input" value={form.state} onChange={set('state')} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label>Email</label><input className="form-input" type="email" value={form.email} onChange={set('email')} /></div>
        <div className="form-group"><label>Mobile</label><input className="form-input" value={form.mobile} onChange={set('mobile')} /></div>
      </div>
      <div className="form-group"><label>WhatsApp</label><input className="form-input" value={form.whatsapp} onChange={set('whatsapp')} /></div>
      <div className="form-group">
        <label>Username</label>
        <input className="form-input" value={form.username} onChange={set('username')} placeholder="e.g. sahil.k" />
        <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: 6 }}>
          Lets other members add you to chat groups by username instead of your User ID.
        </p>
      </div>
      <div className="form-group"><label>Bio</label><textarea className="form-input" value={form.bio} onChange={set('bio')} /></div>

      <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>Social links</label>
      <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: -4, marginBottom: 10 }}>
        Just your username on each platform — we add the link automatically.
      </p>
      <div className="form-row">
        <div className="form-group"><label><i className="fa-brands fa-instagram" /> Instagram</label><input className="form-input" value={form.instagram} onChange={set('instagram')} placeholder="username" /></div>
        <div className="form-group"><label><i className="fa-brands fa-facebook" /> Facebook</label><input className="form-input" value={form.facebook} onChange={set('facebook')} placeholder="username" /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label><i className="fa-brands fa-x-twitter" /> X (Twitter)</label><input className="form-input" value={form.twitter} onChange={set('twitter')} placeholder="username" /></div>
        <div className="form-group"><label><i className="fa-brands fa-youtube" /> YouTube</label><input className="form-input" value={form.youtube} onChange={set('youtube')} placeholder="channel handle" /></div>
      </div>
      <div className="form-group"><label><i className="fa-brands fa-linkedin" /> LinkedIn</label><input className="form-input" value={form.linkedin} onChange={set('linkedin')} placeholder="username" /></div>
      <div className="form-group">
        <label>Relationship status</label>
        <CustomSelect
          value={form.relationshipStatus}
          onChange={set('relationshipStatus')}
          options={[
            { value: '', label: 'Select' },
            { value: 'single', label: 'Single' },
            { value: 'in_a_relationship', label: 'In a relationship' },
            { value: 'married', label: 'Married' },
            { value: 'prefer_not_to_say', label: 'Prefer not to say' },
          ]}
        />
      </div>
      {showCouplesBox ? (
        <div className="couples-safety-box">
          <div className="couples-safety-header">
            <span className="couples-safety-icon"><i className="fa-solid fa-heart" /></span>
            <div>
              <strong>Couples Mode</strong>
              <span className="badge badge-magenta" style={{ marginLeft: 8 }}>Optional</span>
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: '0.8rem', margin: '8px 0 16px' }}>
            <i className="fa-solid fa-shield-halved" /> Needed to host or join Couples Mode trips — visible to
            platform admins only, never shown to other travelers.
          </p>
          <div className="form-group"><label>Partner's mobile number</label><input className="form-input" value={partnerMobile} onChange={(e) => setPartnerMobile(e.target.value)} placeholder="10-digit mobile number" /></div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Partner's government ID</label>
            <div className="upload-box" onClick={() => partnerDocRef.current?.click()}>
              <div className="upload-label">
                {partnerDoc ? <><i className="fa-solid fa-check" style={{ color: 'var(--fire)' }} /> {partnerDoc.name}</> : user?.partnerDocUrl ? 'Replace uploaded ID' : 'Upload ID document'}
              </div>
              <input ref={partnerDocRef} type="file" accept="image/*,application/pdf" onChange={(e) => setPartnerDoc(e.target.files?.[0] || null)} />
            </div>
            {user?.partnerDocUrl && !partnerDoc && (
              <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: 6 }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7' }} /> ID already on file.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-muted" style={{ fontSize: '0.78rem', margin: '-4px 0 12px' }}>
          <i className="fa-solid fa-heart" /> Set your status to "In a relationship" or "Married" to unlock Couples Mode.
        </p>
      )}
      <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : <i className="fa-solid fa-floppy-disk" />} Save Changes</button>
    </form>
  );
}
