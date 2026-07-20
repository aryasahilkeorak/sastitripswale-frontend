import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { rupee, dateRange, routeLabel } from '../lib/helpers.js';
import { toast } from '../lib/toast.js';
import PageHero from '../components/PageHero.jsx';
import { useCanTrip, handleGateError } from '../components/useCanTrip.js';
import CustomSelect from '../components/CustomSelect.jsx';
import CustomDatePicker from '../components/CustomDatePicker.jsx';
import CustomNumberStepper from '../components/CustomNumberStepper.jsx';
import ChipListInput from '../components/ChipListInput.jsx';

const TIPS = [
  'Add a clear route (start, via stops, destination) and realistic dates.',
  'Keep the per-head budget honest — it builds trust.',
  'Mention pickup location and vehicle type.',
  'Review join requests promptly — quick hosts get more interest.',
];

const POPULAR = ['Leh-Ladakh', 'Spiti Valley', 'Goa', 'Kedarnath', 'Coorg', 'Jaisalmer', 'Meghalaya', 'Manali'];

const EMPTY = {
  origin: '', viaStops: [], destination: '', startDate: '', endDate: '', budgetPerHead: '', totalSeats: 4,
  vehicleType: '', tripType: 'mixed', pickupLocation: '', description: '',
  isCouplesMode: false,
};

export default function PlanTrip() {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const canTrip = useCanTrip();
  const isMember = user?.membershipActive || user?.role === 'admin';
  const profileDone = user?.profileComplete || user?.role === 'admin';
  const canPlan = isMember && profileDone;

  const [form, setForm] = useState(EMPTY);
  const [trips, setTrips] = useState([]);
  const [busy, setBusy] = useState(false);
  const hasPartnerInfo = Boolean(user?.partnerMobile && user?.partnerDocUrl);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleCouplesMode = (e) => {
    const on = e.target.checked;
    setForm((f) => ({ ...f, isCouplesMode: on, vehicleType: on ? 'Car' : f.vehicleType }));
  };

  const loadMine = () => api.get('/trips/my').then((r) => setTrips(r.data.trips)).catch(() => {});
  useEffect(() => {
    loadMine();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!canTrip()) return;
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast('fa-solid fa-triangle-exclamation', 'End date must be after start date');
      return;
    }
    if (form.isCouplesMode && (Number(form.totalSeats) < 4 || Number(form.totalSeats) % 2 !== 0)) {
      toast('fa-solid fa-triangle-exclamation', 'Couples mode needs an even number of seats (4 or more)');
      return;
    }
    if (form.isCouplesMode && !hasPartnerInfo) {
      toast('fa-solid fa-triangle-exclamation', "Add your partner's mobile number and ID document in your profile first");
      return;
    }
    setBusy(true);
    try {
      await api.post('/trips', form);
      toast('fa-solid fa-map-location-dot', 'Trip posted! A destination photo will appear shortly.');
      setForm(EMPTY);
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
      <PageHero tag="Organize" tagIcon="fa-solid fa-map-location-dot" title="Plan a" highlight="Trip" sub="Create a trip, set the budget, and let verified travelers request to join." />

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
              <p className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>
                <i className="fa-solid fa-image" /> A destination photo is added automatically — no upload needed.
              </p>

              <div className="form-group"><label>Starting from *</label><input className="form-input" required value={form.origin} onChange={set('origin')} placeholder="e.g. Chandigarh" /></div>

              <div className="form-group">
                <label>Via stops (optional)</label>
                <ChipListInput values={form.viaStops} onChange={(viaStops) => setForm((f) => ({ ...f, viaStops }))} placeholder="e.g. Solan" />
              </div>

              <div className="form-group"><label>Destination *</label><input className="form-input" required value={form.destination} onChange={set('destination')} placeholder="e.g. Shimla" /></div>

              <div className="form-row">
                <div className="form-group"><label>Start date *</label><CustomDatePicker value={form.startDate} onChange={set('startDate')} /></div>
                <div className="form-group"><label>End date *</label><CustomDatePicker value={form.endDate} onChange={set('endDate')} min={form.startDate} /></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Budget / head (₹) *</label>
                  <CustomNumberStepper value={form.budgetPerHead || 0} onChange={set('budgetPerHead')} min={0} step={100} prefix="₹" />
                </div>
                <div className="form-group">
                  <label>Total seats *</label>
                  <CustomNumberStepper value={form.totalSeats} onChange={set('totalSeats')} min={1} max={100} step={form.isCouplesMode ? 2 : 1} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Vehicle type</label>
                  <CustomSelect
                    value={form.vehicleType}
                    onChange={set('vehicleType')}
                    disabled={form.isCouplesMode}
                    options={[{ value: '', label: 'Select' }, 'Bike', 'Car', 'Bus', 'Train', 'Mixed']}
                  />
                </div>
                <div className="form-group"><label>Trip type</label>
                  <CustomSelect
                    value={form.tripType}
                    onChange={set('tripType')}
                    options={[
                      { value: 'mixed', label: 'Mixed' },
                      { value: 'bike', label: 'Bike' },
                      { value: 'car', label: 'Car' },
                      { value: 'trek', label: 'Trek' },
                      { value: 'beach', label: 'Beach' },
                      { value: 'mountain', label: 'Mountain' },
                    ]}
                  />
                </div>
              </div>

              <div className="couples-safety-box">
                <div className="couples-safety-header">
                  <span className="couples-safety-icon"><i className="fa-solid fa-heart" /></span>
                  <div>
                    <label className={`perm-check${form.isCouplesMode ? ' checked' : ''}`} style={{ background: 'transparent', border: 'none', padding: 0 }}>
                      <input type="checkbox" className="perm-check-input" checked={form.isCouplesMode} onChange={toggleCouplesMode} />
                      <strong>Couples Mode</strong>
                    </label>
                  </div>
                </div>
                <p className="text-muted" style={{ fontSize: '0.8rem', margin: '10px 0 0' }}>
                  For couples traveling together — needs a car with 4+ seats. Fuel &amp; toll cost splits between the host couple and joining couple(s), cheaper and comfier than public transport.
                </p>
                {form.isCouplesMode && (
                  hasPartnerInfo ? (
                    <div className="couples-safety-alert success" style={{ marginBottom: 0 }}>
                      <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7' }} />
                      <span>Using your saved partner details — update anytime in your profile.</span>
                    </div>
                  ) : (
                    <div className="couples-safety-alert" style={{ marginBottom: 0 }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ color: '#fca5a5' }} />
                      <span>
                        Add your partner's mobile number and ID document in your{' '}
                        <Link to="/complete-profile" style={{ color: 'var(--fire-2)', textDecoration: 'underline' }}>profile</Link> to enable Couples Mode.
                      </span>
                    </div>
                  )
                )}
              </div>

              <div className="form-group"><label>Pickup location</label><input className="form-input" value={form.pickupLocation} onChange={set('pickupLocation')} placeholder="Exact meeting point" /></div>
              <div className="form-group"><label>Description</label><textarea className="form-input" value={form.description} onChange={set('description')} placeholder="Plan, what to expect…" /></div>

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
                        <strong style={{ fontSize: '0.9rem' }}>{routeLabel(t)}</strong>
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
