import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { rupee, dateRange, routeLabel, BUDGET_INCLUDES, GENDER_PREFERENCE, todayISO } from '../lib/helpers.js';
import { suggestMileageForUser } from '../lib/vehicleMileage.js';
import { toast } from '../lib/toast.js';
import PageHero from '../components/PageHero.jsx';
import ProfileGateCard from '../components/ProfileGateCard.jsx';
import { useCanTrip, handleGateError } from '../components/useCanTrip.js';
import CustomSelect from '../components/CustomSelect.jsx';
import CustomDatePicker from '../components/CustomDatePicker.jsx';
import CustomNumberStepper from '../components/CustomNumberStepper.jsx';
import ChipListInput from '../components/ChipListInput.jsx';
import PlaceAutocomplete from '../components/PlaceAutocomplete.jsx';

const FUEL_TYPES = [
  { value: 'Petrol', label: 'Petrol' },
  { value: 'Diesel', label: 'Diesel' },
  { value: 'CNG', label: 'CNG' },
  { value: 'Electric', label: 'Electric' },
  { value: 'Hybrid', label: 'Hybrid' },
];

const TIPS = [
  'Add a clear route (start, via stops, destination) and realistic dates.',
  'Keep the per-head budget honest - it builds trust.',
  'Mention pickup location and vehicle type.',
  'Review join requests promptly - quick hosts get more interest.',
];

const POPULAR = ['Leh-Ladakh', 'Spiti Valley', 'Goa', 'Kedarnath', 'Coorg', 'Jaisalmer', 'Meghalaya', 'Manali'];

const EMPTY = {
  origin: '', viaStops: [], destination: '', startDate: '', endDate: '', budgetPerHead: '', totalSeats: 4,
  vehicleType: '', budgetIncludes: 'fuel_toll', genderPreference: 'Any', pickupLocation: '', description: '',
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

  // Cost estimator - a planning aid, not part of the trip itself, so it's
  // kept separate from `form`. Seeded from a vehicle the host already
  // registered (Dashboard > My Vehicles) matching this trip's vehicle
  // type, if one has a mileage on file - otherwise falls back to a guess
  // from their legacy profile vehicle model, then a generic default. The
  // host can always override both fields.
  const [mileageKmpl, setMileageKmpl] = useState(() => suggestMileageForUser(user, form.vehicleType).kmpl);
  const [fuelType, setFuelType] = useState(() => suggestMileageForUser(user, form.vehicleType).fuelType);
  const [costEstimate, setCostEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    const s = suggestMileageForUser(user, form.vehicleType);
    setMileageKmpl(s.kmpl);
    setFuelType(s.fuelType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.vehicleType]);

  // A previous estimate is only valid for the route/vehicle it was
  // calculated for - clear it as soon as any of those change, so a stale
  // number can never linger on screen looking like it "didn't update".
  useEffect(() => {
    setCostEstimate(null);
  }, [form.vehicleType, form.origin, form.destination, form.viaStops]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // A bike only fits the rider plus one pillion - totalSeats counts
  // co-traveler slots only (the organizer doesn't occupy one outside
  // Couples Mode), so "1 pillion seat" means totalSeats: 1, not 2.
  const setVehicleType = (e) => {
    const vehicleType = e.target.value;
    setForm((f) => ({
      ...f,
      vehicleType,
      totalSeats: vehicleType === 'Bike' ? 1 : f.totalSeats,
    }));
  };

  const toggleCouplesMode = (e) => {
    const on = e.target.checked;
    setForm((f) => ({ ...f, isCouplesMode: on, vehicleType: on ? 'Car' : f.vehicleType }));
  };

  const loadMine = () => api.get('/trips/my').then((r) => setTrips(r.data.trips)).catch(() => {});
  useEffect(() => {
    loadMine();
  }, []);

  const runEstimate = async () => {
    if (!form.origin.trim() || !form.destination.trim()) {
      toast('fa-solid fa-triangle-exclamation', 'Enter a starting point and destination first');
      return;
    }
    if (!mileageKmpl || mileageKmpl <= 0) {
      toast('fa-solid fa-triangle-exclamation', 'Enter the vehicle’s mileage (km/l)');
      return;
    }
    setEstimating(true);
    setCostEstimate(null);
    try {
      const { data } = await api.post('/trips/estimate-cost', {
        origin: form.origin,
        viaStops: form.viaStops,
        destination: form.destination,
        mileageKmpl,
        fuelType,
        vehicleType: form.vehicleType,
      });
      setCostEstimate(data.estimate);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setEstimating(false);
    }
  };

  const applyCostSuggestion = () => {
    if (!costEstimate) return;
    const perHead = Math.round(costEstimate.totalCost / (Number(form.totalSeats) || 1));
    setForm((f) => ({ ...f, budgetPerHead: perHead }));
    toast('fa-solid fa-wand-magic-sparkles', `Budget/head set to ${rupee(perHead)}`);
  };

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
      <PageHero showBack tag="Organize" tagIcon="fa-solid fa-map-location-dot" title="Plan a" highlight="Trip" sub="Create a trip, set the budget, and let verified travelers request to join." />

      <section className="plan-page" style={{ paddingTop: 40 }}>
        <div className="container">
          <ProfileGateCard action="post trips" />

          <Link to="/plan-group-trip" className="btn btn-outline mb-4" style={{ width: '100%', justifyContent: 'center' }}>
            <i className="fa-solid fa-people-group" /> Plan a Group Trip instead
          </Link>

          <div className="detail-grid">
            {/* Create form */}
            <form className="card" style={{ padding: 20 }} onSubmit={submit}>
              <h3 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Trip details</h3>
              <p className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>
                <i className="fa-solid fa-image" /> A destination photo is added automatically - no upload needed.
              </p>

              <div className="form-group"><label>Starting from *</label><PlaceAutocomplete className="form-input" required value={form.origin} onChange={set('origin')} placeholder="e.g. Chandigarh" /></div>

              <div className="form-group">
                <label>Via stops (optional)</label>
                <ChipListInput values={form.viaStops} onChange={(viaStops) => setForm((f) => ({ ...f, viaStops }))} placeholder="e.g. Solan" />
              </div>

              <div className="form-group"><label>Destination *</label><PlaceAutocomplete className="form-input" required value={form.destination} onChange={set('destination')} placeholder="e.g. Shimla" /></div>

              <div className="form-row">
                <div className="form-group"><label>Start date *</label><CustomDatePicker value={form.startDate} onChange={set('startDate')} min={todayISO()} /></div>
                <div className="form-group"><label>End date *</label><CustomDatePicker value={form.endDate} onChange={set('endDate')} min={form.startDate || todayISO()} /></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Budget / head (₹) *</label>
                  <CustomNumberStepper value={form.budgetPerHead || 0} onChange={set('budgetPerHead')} min={0} step={100} prefix="₹" />
                </div>
                <div className="form-group">
                  <label>Total seats *</label>
                  <CustomNumberStepper value={form.totalSeats} onChange={set('totalSeats')} min={1} max={form.vehicleType === 'Bike' ? 1 : 100} step={form.isCouplesMode ? 2 : 1} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Vehicle type</label>
                  <CustomSelect
                    value={form.vehicleType}
                    onChange={setVehicleType}
                    disabled={form.isCouplesMode}
                    options={[{ value: '', label: 'Select' }, 'Bike', 'Car', 'Bus', 'Train', 'Mixed']}
                  />
                </div>
                <div className="form-group"><label>Budget includes</label>
                  <CustomSelect
                    value={form.budgetIncludes}
                    onChange={set('budgetIncludes')}
                    options={BUDGET_INCLUDES}
                  />
                </div>
              </div>

              <div className="cost-estimator-box">
                <div className="couples-safety-header">
                  <span className="couples-safety-icon" style={{ background: 'rgba(255,107,0,0.15)', color: 'var(--fire)' }}>
                    <i className="fa-solid fa-gas-pump" />
                  </span>
                  <div>
                    <strong>{form.vehicleType === 'Bike' ? 'Estimate fuel cost' : 'Estimate fuel & toll cost'}</strong>
                    <p className="text-muted" style={{ fontSize: '0.78rem', margin: '2px 0 0' }}>
                      {form.vehicleType === 'Bike'
                        ? "Uses the route distance and your bike's mileage to suggest a round-trip fuel cost - bikes are toll-exempt on most highways."
                        : "Uses the route distance and your vehicle's mileage to suggest a round-trip fuel + toll cost."}
                    </p>
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: 14 }}>
                  <div className="form-group">
                    <label>Enter Your Vehicle's mileage (km/l)</label>
                    <CustomNumberStepper value={mileageKmpl} onChange={(e) => setMileageKmpl(Number(e.target.value))} min={1} max={100} />
                  </div>
                  <div className="form-group">
                    <label>Fuel type</label>
                    <CustomSelect value={fuelType} onChange={(e) => setFuelType(e.target.value)} options={FUEL_TYPES} />
                  </div>
                </div>

                <button type="button" className="btn btn-outline btn-sm" onClick={runEstimate} disabled={estimating} style={{ width: '100%', justifyContent: 'center' }}>
                  {estimating ? <span className="spinner" /> : <i className="fa-solid fa-calculator" />} Calculate estimated cost
                </button>

                {costEstimate && (
                  <div className="cost-estimator-result">
                    <div className="row-between" style={{ fontSize: '0.85rem' }}>
                      <span className="text-muted">Distance (round trip)</span>
                      <strong>{costEstimate.roundTripKm} km</strong>
                    </div>
                    <div className="row-between" style={{ fontSize: '0.85rem' }}>
                      <span className="text-muted">Estimated fuel cost</span>
                      <strong>{rupee(costEstimate.fuelCost)}</strong>
                    </div>
                    {!costEstimate.assumptions.tollExempt && (
                      <div className="row-between" style={{ fontSize: '0.85rem' }}>
                        <span className="text-muted">
                          {costEstimate.assumptions.tollSource === 'osm'
                            ? `Toll cost (${costEstimate.assumptions.tollBoothCount} plaza${costEstimate.assumptions.tollBoothCount === 1 ? '' : 's'} on route)`
                            : 'Estimated toll cost'}
                        </span>
                        <strong>{rupee(costEstimate.tollCost)}</strong>
                      </div>
                    )}
                    <div className="row-between" style={{ fontSize: '0.95rem', marginTop: 6, paddingTop: 10, borderTop: '1px solid var(--glass-bdr)' }}>
                      <span>Total (whole vehicle)</span>
                      <strong className="trip-price" style={{ fontSize: '1.1rem' }}>{rupee(costEstimate.totalCost)}</strong>
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.72rem', margin: '10px 0 12px' }}>
                      <i className="fa-solid fa-circle-info" /> Fuel cost assumes ~₹{costEstimate.assumptions.fuelPricePerLitre}/L.{' '}
                      {costEstimate.assumptions.tollExempt
                        ? 'Two-wheelers are toll-exempt on most Indian highways.'
                        : costEstimate.assumptions.tollSource === 'osm'
                        ? 'Toll cost is based on real toll plazas identified on this route via OpenStreetMap. This is not the final amount - the actual charge may be approximately 20% higher or lower.'
                        : `Toll cost is an approximation (~₹${costEstimate.assumptions.avgTollPerKm}/km) - live plaza data wasn't available for this route.`}{' '}
                      Actual costs vary by route and current prices.
                    </p>
                    <button type="button" className="btn btn-primary btn-sm" onClick={applyCostSuggestion} style={{ width: '100%', justifyContent: 'center' }}>
                      <i className="fa-solid fa-wand-magic-sparkles" /> Use {rupee(Math.round(costEstimate.totalCost / (Number(form.totalSeats) || 1)))}/head as budget
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group"><label>Who can join</label>
                <CustomSelect
                  value={form.genderPreference}
                  onChange={set('genderPreference')}
                  options={GENDER_PREFERENCE}
                />
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
                  For couples traveling together - needs a car with 4+ seats. Fuel &amp; toll cost splits between the host couple and joining couple(s), cheaper and comfier than public transport.
                </p>
                {form.isCouplesMode && (
                  hasPartnerInfo ? (
                    <div className="couples-safety-alert success" style={{ marginBottom: 0 }}>
                      <i className="fa-solid fa-circle-check" style={{ color: '#6ee7b7' }} />
                      <span>Using your saved partner details - update anytime in your profile.</span>
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
              <div className="card" style={{ padding: 16, marginBottom: 20 }}>
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

              <div className="card" style={{ padding: 16, marginBottom: 20 }}>
                <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}><i className="fa-solid fa-lightbulb" /> Tips</h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {TIPS.map((t) => (
                    <li key={t} style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}><i className="fa-solid fa-circle-check" style={{ color: 'var(--fire)' }} /> {t}</li>
                  ))}
                </ul>
              </div>

              <div className="card" style={{ padding: 16 }}>
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
