import { useRef, useState } from 'react';
import { api, apiError } from '../lib/api.js';
import { toast } from '../lib/toast.js';
import { isVehicleModelYearMistake, VEHICLE_MODEL_YEAR_MISTAKE_MSG } from '../lib/helpers.js';
import CustomSelect from './CustomSelect.jsx';
import StateCitySelect from './StateCitySelect.jsx';
import ProfileHeaderPhotos from './ProfileHeaderPhotos.jsx';

// Shared "edit profile" form - used both in the Dashboard Settings tab and
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
  const [cover, setCover] = useState(null);
  const [partnerMobile, setPartnerMobile] = useState(user?.partnerMobile || '');
  const [partnerDoc, setPartnerDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
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
    if (isVehicleModelYearMistake(form.vehicleModel)) return toast('fa-solid fa-triangle-exclamation', VEHICLE_MODEL_YEAR_MISTAKE_MSG);
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('partnerMobile', partnerMobile.trim());
      if (avatar) fd.append('avatar', avatar);
      if (cover) fd.append('cover', cover);
      if (partnerDoc) fd.append('partnerDoc', partnerDoc);
      const { data } = await api.put('/members/profile', fd);
      onSaved?.(data.user);
      setEditing(false);
      toast('fa-solid fa-circle-check', 'Profile updated!');
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" style={{ padding: 16 }} onSubmit={save}>
      <div className="row-between mb-3">
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Your details</span>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditing((v) => !v)}>
          <i className={`fa-solid ${editing ? 'fa-lock' : 'fa-pen'}`} /> {editing ? 'Lock' : 'Edit'}
        </button>
      </div>
      <ProfileHeaderPhotos
        avatarFile={avatar}
        coverFile={cover}
        currentAvatarUrl={user?.avatarUrl}
        currentCoverUrl={user?.coverUrl}
        onAvatarChange={setAvatar}
        onCoverChange={setCover}
      />
      <div className="form-group"><label>Full name</label><input className="form-input" value={form.fullName} onChange={set('fullName')} disabled={!editing} /></div>
      <div className="form-group"><label>Profession</label><input className="form-input" value={form.profession} onChange={set('profession')} disabled={!editing} /></div>
      <StateCitySelect
        state={form.state}
        city={form.city}
        onStateChange={(v) => setForm((f) => ({ ...f, state: v, city: '' }))}
        onCityChange={(v) => setForm((f) => ({ ...f, city: v }))}
        disabled={!editing}
      />
      <div className="form-row">
        <div className="form-group"><label>Email</label><input className="form-input" type="email" value={form.email} onChange={set('email')} disabled={!editing} /></div>
        <div className="form-group"><label>Mobile</label><input className="form-input" value={form.mobile} onChange={set('mobile')} disabled={!editing} /></div>
      </div>
      <div className="form-group"><label>WhatsApp</label><input className="form-input" value={form.whatsapp} onChange={set('whatsapp')} disabled={!editing} /></div>
      <div className="form-group">
        <label>Username</label>
        <input className="form-input" value={form.username} onChange={set('username')} placeholder="e.g. sahil.k" disabled={!editing} />
        <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: 6 }}>
          Lets other members add you to chat groups by username instead of your User ID.
        </p>
      </div>
      <div className="form-group"><label>Bio</label><textarea className="form-input" value={form.bio} onChange={set('bio')} disabled={!editing} /></div>

      <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>Social links</label>
      <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: -4, marginBottom: 10 }}>
        Just your username on each platform - we add the link automatically.
      </p>
      <div className="form-row">
        <div className="form-group"><label><i className="fa-brands fa-instagram" /> Instagram</label><input className="form-input" value={form.instagram} onChange={set('instagram')} placeholder="username" disabled={!editing} /></div>
        <div className="form-group"><label><i className="fa-brands fa-facebook" /> Facebook</label><input className="form-input" value={form.facebook} onChange={set('facebook')} placeholder="username" disabled={!editing} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label><i className="fa-brands fa-x-twitter" /> X (Twitter)</label><input className="form-input" value={form.twitter} onChange={set('twitter')} placeholder="username" disabled={!editing} /></div>
        <div className="form-group"><label><i className="fa-brands fa-youtube" /> YouTube</label><input className="form-input" value={form.youtube} onChange={set('youtube')} placeholder="channel handle" disabled={!editing} /></div>
      </div>
      <div className="form-group"><label><i className="fa-brands fa-linkedin" /> LinkedIn</label><input className="form-input" value={form.linkedin} onChange={set('linkedin')} placeholder="username" disabled={!editing} /></div>
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
          disabled={!editing}
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
            <i className="fa-solid fa-shield-halved" /> Needed to host or join Couples Mode trips - visible to
            platform admins only, never shown to other travelers.
          </p>
          <div className="form-group"><label>Partner's mobile number</label><input className="form-input" value={partnerMobile} onChange={(e) => setPartnerMobile(e.target.value)} placeholder="10-digit mobile number" disabled={!editing} /></div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Partner's government ID</label>
            <div className="upload-box upload-box-doc" onClick={() => partnerDocRef.current?.click()}>
              <div className="upload-label">
                {partnerDoc ? <><i className="fa-solid fa-check" style={{ color: 'var(--fire)' }} /> <span className="upload-filename">{partnerDoc.name}</span></> : user?.partnerDocUrl ? 'Replace uploaded ID' : 'Upload ID document'}
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
      {editing && (
        <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : <i className="fa-solid fa-floppy-disk" />} Save Changes</button>
      )}
    </form>
  );
}
