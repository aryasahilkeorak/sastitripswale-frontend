import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { CLUB_CATEGORIES, imageUrl, AVATAR_FALLBACK } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import PageHero from '../components/PageHero.jsx';
import ImageCropModal from '../components/ImageCropModal.jsx';

export default function PlanClub() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const photoRef = useRef(null);
  const coverRef = useRef(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState(null);
  const [cover, setCover] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [pendingCover, setPendingCover] = useState(null);
  const [busy, setBusy] = useState(false);

  const selected = CLUB_CATEGORIES.find((c) => c.key === category);
  // Vehicle-ownership gate mirrors the backend check in clubController.js -
  // shown up front so a member isn't surprised by a 403 after filling the form.
  // "Other" has no specific vehicle type requirement, but still needs *some*
  // vehicle on file (matches CATEGORY_VEHICLE.other on the backend).
  const eligible = !selected
    ? false
    : selected.needsVehicle
    ? user?.hasVehicle && user?.vehicleType === selected.needsVehicle
    : Boolean(user?.hasVehicle);

  const submit = async (e) => {
    e.preventDefault();
    if (!category) {
      toast('fa-solid fa-triangle-exclamation', 'Choose a club category');
      return;
    }
    if (!eligible) {
      toast('fa-solid fa-triangle-exclamation', `You need ${selected.needsLabel} on your profile to create a ${selected.label.toLowerCase()}`);
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', description.trim());
      fd.append('category', category);
      if (photo) fd.append('photo', photo);
      if (cover) fd.append('cover', cover);
      const { data } = await api.post('/clubs', fd);
      toast('fa-solid fa-people-group', `"${data.club.name}" is live! Start adding members.`);
      navigate(`/clubs/${data.club._id}`);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHero
        showBack
        tag="Ride Together"
        tagIcon="fa-solid fa-people-group"
        title="Create Your"
        highlight="Travel Club"
        sub="A persistent group for your bikers, car or offroading crew - own it like a WhatsApp group, with admins and full member control."
      />

      <section className="plan-page" style={{ paddingTop: 40 }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <form className="card" style={{ padding: 0, overflow: 'hidden' }} onSubmit={submit}>
            {/* Facebook/LinkedIn-style header: cover banner with the profile photo overlapping it. */}
            <div style={{ position: 'relative', width: '100%', height: 160, background: 'var(--grad-fire)' }}>
              {cover && (
                <img
                  src={URL.createObjectURL(cover)}
                  alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              <button
                type="button"
                className="btn btn-sm"
                style={{ position: 'absolute', right: 10, bottom: 10, borderRadius: '50%', width: 34, height: 34, padding: 0, justifyContent: 'center', background: 'rgba(0,0,0,0.55)', color: '#fff' }}
                onClick={() => coverRef.current?.click()}
                title="Add cover photo"
              >
                <i className="fa-solid fa-camera" />
              </button>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) setPendingCover(f);
                }}
              />
            </div>

            <div style={{ padding: '0 24px 24px' }}>
              <div style={{ position: 'relative', width: 120, margin: '-60px 0 16px' }}>
                <img
                  src={photo ? URL.createObjectURL(photo) : AVATAR_FALLBACK}
                  alt=""
                  style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--surface)', display: 'block' }}
                />
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ position: 'absolute', right: 0, bottom: 0, borderRadius: '50%', width: 34, height: 34, padding: 0, justifyContent: 'center', background: 'var(--fire)', color: '#fff' }}
                  onClick={() => photoRef.current?.click()}
                  title="Add club photo"
                >
                  <i className="fa-solid fa-camera" />
                </button>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) setPendingPhoto(f);
                  }}
                />
              </div>
              <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 0, marginBottom: 20 }}>
                <i className="fa-solid fa-circle-info" /> Both photos are optional - use the camera icons above to add them.
              </p>

              <div className="form-group">
                <label>Club category *</label>
              <div className="filter-chips">
                {CLUB_CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c.key}
                    className={`chip${category === c.key ? ' active' : ''}`}
                    onClick={() => setCategory(c.key)}
                  >
                    <i className={c.icon} /> {c.label}
                  </button>
                ))}
              </div>
              {selected && selected.needsVehicle && (
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: 8 }}>
                  <i className="fa-solid fa-circle-info" /> Requires {selected.needsLabel} on your profile ({selected.needsVehicle}).
                  {!eligible && (
                    <>
                      {' '}You currently have {user?.hasVehicle ? user.vehicleType : 'no vehicle'} on file - update it in{' '}
                      <Link to="/edit-profile">Edit Profile</Link> first.
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Club name *</label>
              <input className="form-input" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Delhi Royal Enfield Riders" />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea className="form-input" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this club about? Who should join?" />
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={busy || !category}>
              {busy ? <span className="spinner" /> : <i className="fa-solid fa-people-group" />} Create Club
            </button>
            </div>
          </form>
        </div>
      </section>

      <ImageCropModal
        file={pendingPhoto}
        title="Crop club photo"
        onCancel={() => setPendingPhoto(null)}
        onCropped={(cropped) => {
          setPendingPhoto(null);
          setPhoto(cropped);
        }}
      />
      <ImageCropModal
        file={pendingCover}
        aspect={3}
        guide="rect"
        title="Crop cover photo"
        onCancel={() => setPendingCover(null)}
        onCropped={(cropped) => {
          setPendingCover(null);
          setCover(cropped);
        }}
      />
    </>
  );
}
