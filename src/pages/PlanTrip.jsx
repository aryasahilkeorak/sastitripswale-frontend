import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { imageUrl, rupee, dateRange } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import PageHero from '../components/PageHero.jsx';
import { useCanTrip, handleGateError } from '../components/useCanTrip.js';

const TIPS = [
  'Add a clear destination and realistic dates.',
  'Keep the per-head budget honest — it builds trust.',
  'Share a WhatsApp group link so members can coordinate.',
  'Mention pickup location and vehicle type.',
  'Add a cover photo — trips with photos get 3× interest.',
];

const POPULAR = ['Leh-Ladakh', 'Spiti Valley', 'Goa', 'Kedarnath', 'Coorg', 'Jaisalmer', 'Meghalaya', 'Manali'];

const EMPTY = {
  destination: '', title: '', startDate: '', endDate: '', budgetPerHead: '', totalSeats: 4,
  vehicleType: '', tripType: 'mixed', pickupLocation: '', whatsappGroup: '', description: '',
};

export default function PlanTrip() {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const canTrip = useCanTrip();
  const isMember = user?.membershipActive || user?.role === 'admin';
  const profileDone = user?.profileComplete || user?.role === 'admin';
  const canPlan = isMember && profileDone;

  const [form, setForm] = useState(EMPTY);
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [trips, setTrips] = useState([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const loadMine = () => api.get('/trips/my').then((r) => setTrips(r.data.trips)).catch(() => {});
  useEffect(() => {
    loadMine();
  }, []);

  const onCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCover(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canTrip()) return;
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast('fa-solid fa-triangle-exclamation', 'End date must be after start date');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (cover) fd.append('cover', cover);
      await api.post('/trips', fd);
      toast('fa-solid fa-map-location-dot', 'Trip posted! Members will start joining soon.');
      setForm(EMPTY);
      setCover(null);
      setCoverPreview('');
      loadMine();
    } catch (err) {
      if (!handleGateError(err, navigate)) toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await api.delete(`/trips/${id}`);
      toast('fa-solid fa-trash', 'Trip deleted');
      loadMine();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  return (
    <>
      <PageHero tag="Organize" tagIcon="fa-solid fa-map-location-dot" title="Plan a" highlight="Trip" sub="Create a trip, set the budget, and let verified travelers join you." />

      <section className="plan-page" style={{ paddingTop: 40 }}>
        <div className="container">
          {!isMember ? (
            <div className="card mb-4" style={{ padding: 24, borderColor: 'rgba(255,107,0,0.3)' }}>
              <strong>Membership required.</strong>
              <p className="text-muted mt-2">Activate a membership (free with coupon FREEJOIN) to post trips.</p>
              <Link to="/join" className="btn btn-primary mt-3"><i className="fa-solid fa-crown" /> View Plans</Link>
            </div>
          ) : !profileDone ? (
            <div className="card mb-4" style={{ padding: 24, borderColor: 'rgba(255,107,0,0.3)' }}>
              <strong>Complete your profile first.</strong>
              <p className="text-muted mt-2">Add your name, city, interests, vehicle and ID to plan trips.</p>
              <Link to="/complete-profile" className="btn btn-primary mt-3"><i className="fa-solid fa-user-gear" /> Complete Profile</Link>
            </div>
          ) : null}

          <div className="detail-grid">
            {/* Create form */}
            <form className="card" style={{ padding: 28 }} onSubmit={submit}>
              <h3 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Trip details</h3>

              <div className="upload-box mb-3" onClick={() => fileRef.current?.click()}>
                {coverPreview ? (
                  <img src={coverPreview} alt="cover" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 10, marginBottom: 8 }} />
                ) : (
                  <i className="fa-solid fa-image" style={{ fontSize: '1.8rem', color: 'var(--fire)' }} />
                )}
                <div className="upload-label">{cover ? cover.name : 'Upload cover photo'}</div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onCover} />
              </div>

              <div className="form-group"><label>Destination *</label><input className="form-input" required value={form.destination} onChange={set('destination')} placeholder="e.g. Spiti Valley, HP" /></div>
              <div className="form-group"><label>Trip title</label><input className="form-input" value={form.title} onChange={set('title')} placeholder="e.g. Spiti Winter Circuit" /></div>

              <div className="form-row">
                <div className="form-group"><label>Start date *</label><input className="form-input" type="date" required value={form.startDate} onChange={set('startDate')} /></div>
                <div className="form-group"><label>End date *</label><input className="form-input" type="date" required value={form.endDate} onChange={set('endDate')} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Budget / head (₹) *</label><input className="form-input" type="number" min="0" required value={form.budgetPerHead} onChange={set('budgetPerHead')} /></div>
                <div className="form-group"><label>Total seats *</label><input className="form-input" type="number" min="1" required value={form.totalSeats} onChange={set('totalSeats')} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Vehicle type</label>
                  <select className="form-input" value={form.vehicleType} onChange={set('vehicleType')}>
                    <option value="">Select</option><option>Bike</option><option>Car</option><option>Bus</option><option>Train</option><option>Mixed</option>
                  </select>
                </div>
                <div className="form-group"><label>Trip type</label>
                  <select className="form-input" value={form.tripType} onChange={set('tripType')}>
                    <option value="mixed">Mixed</option><option value="bike">Bike</option><option value="car">Car</option><option value="trek">Trek</option><option value="beach">Beach</option><option value="mountain">Mountain</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Pickup location</label><input className="form-input" value={form.pickupLocation} onChange={set('pickupLocation')} /></div>
                <div className="form-group"><label>WhatsApp group link</label><input className="form-input" value={form.whatsappGroup} onChange={set('whatsappGroup')} placeholder="https://chat.whatsapp.com/…" /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea className="form-input" value={form.description} onChange={set('description')} placeholder="Route, plan, what to expect…" /></div>

              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={busy || !canPlan}>
                {busy ? <span className="spinner" /> : <i className="fa-solid fa-paper-plane" />} Post Trip
              </button>
            </form>

            {/* Right column */}
            <div>
              <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                <h3 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>My posted trips</h3>
                {trips.length === 0 ? (
                  <div className="empty-state-sm"><i className="fa-solid fa-map-pin" /><p>No trips yet. Create your first!</p></div>
                ) : (
                  trips.map((t) => (
                    <div key={t._id} className="notif-item" style={{ alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.9rem' }}>{t.title || t.destination}</strong>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{dateRange(t.startDate, t.endDate)}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{rupee(t.budgetPerHead)}/head · {t.filledSeats}/{t.totalSeats} joined</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/trips/${t._id}`} className="btn btn-sm btn-outline"><i className="fa-solid fa-eye" /></Link>
                        <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => remove(t._id)}><i className="fa-solid fa-trash" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}><i className="fa-solid fa-lightbulb" /> Tips</h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {TIPS.map((t) => (
                    <li key={t} style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}><i className="fa-solid fa-circle-check" style={{ color: 'var(--fire)' }} /> {t}</li>
                  ))}
                </ul>
              </div>

              <div className="card" style={{ padding: 24 }}>
                <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Popular destinations</h4>
                <div className="filter-chips" style={{ marginBottom: 0 }}>
                  {POPULAR.map((p) => (
                    <button key={p} type="button" className="chip" onClick={() => setForm((f) => ({ ...f, destination: p }))}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
