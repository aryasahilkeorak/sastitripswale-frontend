import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';

const INTERESTS = ['Mountains', 'Beaches', 'Camping', 'Trekking', 'Road Trips', 'Backpacking', 'Photography', 'Food Travel', 'Night Rides'];

export default function CompleteProfile() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);

  useEffect(() => {
    if (user?.profileComplete) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const [form, setForm] = useState({
    fullName: '', city: '', state: '', profession: '', bio: '',
    gender: '', emergencyContact: '', hasVehicle: false, vehicleType: '', vehicleModel: '',
  });
  const [interests, setInterests] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [busy, setBusy] = useState(false);

  // Prefill from the account (name may be the email prefix, city/gender if any).
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      fullName: user.fullName && !user.fullName.includes('@') ? user.fullName : '',
      city: user.city || '',
      state: user.state || '',
      gender: user.gender || '',
    }));
    setInterests(user.travelInterests || []);
  }, [user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const toggleInterest = (t) => setInterests((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));

  const onAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) return toast('fa-solid fa-triangle-exclamation', 'Please enter your full name');
    if (!form.city.trim()) return toast('fa-solid fa-triangle-exclamation', 'Please enter your city');
    if (!form.gender) return toast('fa-solid fa-triangle-exclamation', 'Please select your gender');
    if (interests.length === 0) return toast('fa-solid fa-triangle-exclamation', 'Pick at least one travel interest');
    if (form.hasVehicle && !form.vehicleType) return toast('fa-solid fa-triangle-exclamation', 'Select your vehicle type');
    if (!aadhaarFile) return toast('fa-solid fa-triangle-exclamation', 'Aadhaar document is required for verification');

    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('travelInterests', JSON.stringify(interests));
      if (avatarFile) fd.append('avatar', avatarFile);
      if (aadhaarFile) fd.append('aadhaar', aadhaarFile);
      if (panFile) fd.append('pan', panFile);

      const { data } = await api.put('/members/complete-profile', fd);
      setUser(data.user);
      toast('fa-solid fa-circle-check', 'Profile complete! You can now plan and join trips.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="cp-section">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="text-center mb-4">
          <div className="section-tag" style={{ margin: '0 auto 12px' }}><i className="fa-solid fa-user-gear" /> Almost there</div>
          <h1 className="section-title" style={{ fontSize: '2rem' }}>Complete Your <span className="highlight">Profile</span></h1>
          <p className="section-sub" style={{ margin: '10px auto 0' }}>
            Required to plan or join trips. Your ID is used only for verification.
          </p>
        </div>

        <form className="card cp-form" onSubmit={submit}>
          <div className="upload-box mb-3" onClick={() => document.getElementById('cp-avatar')?.click()}>
            <img className="avatar-preview" src={avatarPreview || imageUrl(user?.avatarUrl, AVATAR_FALLBACK)} alt="" />
            <div className="upload-label">{avatarFile ? avatarFile.name : 'Upload profile photo (optional)'}</div>
            <input id="cp-avatar" type="file" accept="image/*" onChange={onAvatar} />
          </div>

          <div className="form-group"><label>Full name *</label><input className="form-input" value={form.fullName} onChange={set('fullName')} /></div>
          <div className="form-row">
            <div className="form-group"><label>City *</label><input className="form-input" value={form.city} onChange={set('city')} /></div>
            <div className="form-group"><label>State</label><input className="form-input" value={form.state} onChange={set('state')} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Gender *</label>
              <select className="form-input" value={form.gender} onChange={set('gender')}>
                <option value="">Select</option><option>Male</option><option>Female</option><option>Prefer not to say</option>
              </select>
            </div>
            <div className="form-group"><label>Profession</label><input className="form-input" value={form.profession} onChange={set('profession')} /></div>
          </div>
          <div className="form-group"><label>Emergency contact</label><input className="form-input" value={form.emergencyContact} onChange={set('emergencyContact')} placeholder="A family member's number" /></div>
          <div className="form-group"><label>Short bio</label><textarea className="form-input" value={form.bio} onChange={set('bio')} placeholder="Tell co-travelers about yourself" /></div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.hasVehicle} onChange={set('hasVehicle')} /> I own a vehicle
            </label>
          </div>
          {form.hasVehicle && (
            <div className="form-row">
              <div className="form-group"><label>Vehicle type *</label>
                <select className="form-input" value={form.vehicleType} onChange={set('vehicleType')}>
                  <option value="">Select</option><option>Bike</option><option>Car</option><option>Bus</option><option>Other</option>
                </select>
              </div>
              <div className="form-group"><label>Vehicle model</label><input className="form-input" value={form.vehicleModel} onChange={set('vehicleModel')} /></div>
            </div>
          )}

          <div className="form-group">
            <label>Travel interests * (pick at least one)</label>
            <div className="interest-grid">
              {INTERESTS.map((t) => (
                <span key={t} className={`interest-chip${interests.includes(t) ? ' selected' : ''}`} onClick={() => toggleInterest(t)}>{t}</span>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Aadhaar (required) *</label>
              <div className="upload-box" onClick={() => document.getElementById('cp-aadhaar')?.click()}>
                <div className="upload-label">{aadhaarFile ? <><i className="fa-solid fa-check" style={{ color: 'var(--fire)' }} /> {aadhaarFile.name}</> : 'Upload Aadhaar'}</div>
                <input id="cp-aadhaar" type="file" accept="image/*,application/pdf" onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="form-group">
              <label>PAN (optional)</label>
              <div className="upload-box" onClick={() => document.getElementById('cp-pan')?.click()}>
                <div className="upload-label">{panFile ? <><i className="fa-solid fa-check" style={{ color: 'var(--fire)' }} /> {panFile.name}</> : 'Upload PAN'}</div>
                <input id="cp-pan" type="file" accept="image/*,application/pdf" onChange={(e) => setPanFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? <span className="spinner" /> : <i className="fa-solid fa-check-double" />} Save &amp; Finish
          </button>
        </form>
      </div>
    </section>
  );
}
