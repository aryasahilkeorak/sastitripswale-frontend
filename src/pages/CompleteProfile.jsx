import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { toast } from '../lib/toast.js';
import CustomSelect from '../components/CustomSelect.jsx';
import AvatarUploadField from '../components/AvatarUploadField.jsx';

const INTERESTS = ['Mountains', 'Beaches', 'Camping', 'Trekking', 'Road Trips', 'Backpacking', 'Photography', 'Food Travel', 'Night Rides'];

function DocBox({ id, label, file, onChange }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="upload-box" onClick={() => document.getElementById(id)?.click()}>
        <div className="upload-label">
          {file ? <><i className="fa-solid fa-check" style={{ color: 'var(--fire)' }} /> {file.name}</> : 'Upload photo'}
        </div>
        <input id={id} type="file" accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      </div>
    </div>
  );
}

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
    relationshipStatus: '',
  });
  const [interests, setInterests] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [dlFront, setDlFront] = useState(null);
  const [dlBack, setDlBack] = useState(null);
  const [rcFront, setRcFront] = useState(null);
  const [rcBack, setRcBack] = useState(null);
  const [partnerMobile, setPartnerMobile] = useState('');
  const [partnerDoc, setPartnerDoc] = useState(null);
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
      relationshipStatus: user.relationshipStatus || '',
    }));
    setInterests(user.travelInterests || []);
    setPartnerMobile(user.partnerMobile || '');
  }, [user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const toggleInterest = (t) => setInterests((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) return toast('fa-solid fa-triangle-exclamation', 'Please enter your full name');
    if (!form.city.trim()) return toast('fa-solid fa-triangle-exclamation', 'Please enter your city');
    if (!form.gender) return toast('fa-solid fa-triangle-exclamation', 'Please select your gender');
    if (interests.length === 0) return toast('fa-solid fa-triangle-exclamation', 'Pick at least one travel interest');
    if (form.hasVehicle && !form.vehicleType) return toast('fa-solid fa-triangle-exclamation', 'Select your vehicle type');
    if (!aadhaarFront || !aadhaarBack) return toast('fa-solid fa-triangle-exclamation', 'Aadhaar front and back photos are required for verification');
    if (form.hasVehicle && (!dlFront || !dlBack || !rcFront || !rcBack)) {
      return toast('fa-solid fa-triangle-exclamation', 'Driving Licence and RC (front & back) are mandatory for vehicle owners');
    }
    if (partnerMobile.trim() && !/^[0-9]{10,15}$/.test(partnerMobile.trim())) {
      return toast('fa-solid fa-triangle-exclamation', "Enter a valid partner's mobile number, or leave it blank");
    }

    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('travelInterests', JSON.stringify(interests));
      fd.append('partnerMobile', partnerMobile.trim());
      if (avatarFile) fd.append('avatar', avatarFile);
      if (aadhaarFront) fd.append('aadhaarFront', aadhaarFront);
      if (aadhaarBack) fd.append('aadhaarBack', aadhaarBack);
      if (panFile) fd.append('pan', panFile);
      if (dlFront) fd.append('dlFront', dlFront);
      if (dlBack) fd.append('dlBack', dlBack);
      if (rcFront) fd.append('rcFront', rcFront);
      if (rcBack) fd.append('rcBack', rcBack);
      if (partnerDoc) fd.append('partnerDoc', partnerDoc);

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
          <AvatarUploadField value={avatarFile} currentUrl={user?.avatarUrl} onChange={setAvatarFile} label="Upload profile photo (optional)" />

          <div className="form-group"><label>Full name *</label><input className="form-input" value={form.fullName} onChange={set('fullName')} /></div>
          <div className="form-row">
            <div className="form-group"><label>City *</label><input className="form-input" value={form.city} onChange={set('city')} /></div>
            <div className="form-group"><label>State</label><input className="form-input" value={form.state} onChange={set('state')} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Gender *</label>
              <CustomSelect
                value={form.gender}
                onChange={set('gender')}
                options={[{ value: '', label: 'Select' }, 'Male', 'Female', 'Prefer not to say']}
              />
            </div>
            <div className="form-group"><label>Profession</label><input className="form-input" value={form.profession} onChange={set('profession')} /></div>
          </div>
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
                <CustomSelect
                  value={form.vehicleType}
                  onChange={set('vehicleType')}
                  options={[{ value: '', label: 'Select' }, 'Bike', 'Car', 'Bus', 'Other']}
                />
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

          <p className="text-muted" style={{ fontSize: '0.78rem', margin: '0 0 8px' }}>
            <i className="fa-solid fa-id-card" /> Aadhaar (required) — both sides
          </p>
          <div className="form-row">
            <DocBox id="cp-aadhaar-front" label="Aadhaar — front *" file={aadhaarFront} onChange={setAadhaarFront} />
            <DocBox id="cp-aadhaar-back" label="Aadhaar — back *" file={aadhaarBack} onChange={setAadhaarBack} />
          </div>
          <div className="form-group">
            <DocBox id="cp-pan" label="PAN (optional)" file={panFile} onChange={setPanFile} />
          </div>

          {form.hasVehicle && (
            <>
              <p className="text-muted" style={{ fontSize: '0.78rem', margin: '0 0 8px' }}>
                <i className="fa-solid fa-car" /> Vehicle owners must also upload their Driving Licence and RC (both sides)
              </p>
              <div className="form-row">
                <DocBox id="cp-dl-front" label="Driving Licence — front *" file={dlFront} onChange={setDlFront} />
                <DocBox id="cp-dl-back" label="Driving Licence — back *" file={dlBack} onChange={setDlBack} />
              </div>
              <div className="form-row">
                <DocBox id="cp-rc-front" label="RC — front *" file={rcFront} onChange={setRcFront} />
                <DocBox id="cp-rc-back" label="RC — back *" file={rcBack} onChange={setRcBack} />
              </div>
            </>
          )}

          {form.relationshipStatus && form.relationshipStatus !== 'single' && form.relationshipStatus !== 'prefer_not_to_say' ? (
            <div className="couples-safety-box">
              <div className="couples-safety-header">
                <span className="couples-safety-icon"><i className="fa-solid fa-heart" /></span>
                <div>
                  <strong>Couples Mode</strong>
                  <span className="badge badge-magenta" style={{ marginLeft: 8 }}>Optional</span>
                </div>
              </div>
              <p className="text-muted" style={{ fontSize: '0.8rem', margin: '8px 0 16px' }}>
                <i className="fa-solid fa-shield-halved" /> Only needed if you plan to host or join Couples Mode trips.
                We ask for your partner's mobile number and a government ID once, purely for safety verification —
                it's visible to platform admins only and never shown to other travelers.
              </p>
              <div className="form-group"><label>Partner's mobile number</label><input className="form-input" value={partnerMobile} onChange={(e) => setPartnerMobile(e.target.value)} placeholder="10-digit mobile number" /></div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Partner's government ID</label>
                <div className="upload-box" onClick={() => document.getElementById('cp-partner-doc')?.click()}>
                  <div className="upload-label">
                    {partnerDoc ? <><i className="fa-solid fa-check" style={{ color: 'var(--fire)' }} /> {partnerDoc.name}</> : user?.partnerDocUrl ? 'Replace uploaded ID' : 'Upload ID document'}
                  </div>
                  <input id="cp-partner-doc" type="file" accept="image/*,application/pdf" onChange={(e) => setPartnerDoc(e.target.files?.[0] || null)} />
                </div>
                {user?.partnerDocUrl && !partnerDoc && (
                  <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: 6 }}>
                    <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7' }} /> ID already on file.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted" style={{ fontSize: '0.78rem', margin: '-4px 0 4px' }}>
              <i className="fa-solid fa-heart" /> Tell us if you're in a relationship or married to unlock Couples Mode for trips.
            </p>
          )}

          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? <span className="spinner" /> : <i className="fa-solid fa-check-double" />} Save &amp; Finish
          </button>
        </form>
      </div>
    </section>
  );
}
