import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { rupee, dateRange, routeLabel, todayISO } from '../lib/helpers.js';
import { suggestMileageForUser } from '../lib/vehicleMileage.js';
import { toast } from '../lib/toast.js';
import { confirm } from '../lib/confirm.js';
import PageHero from '../components/PageHero.jsx';
import ProfileGateCard from '../components/ProfileGateCard.jsx';
import { useCanTrip, handleGateError } from '../components/useCanTrip.js';
import CustomSelect from '../components/CustomSelect.jsx';
import CustomDatePicker from '../components/CustomDatePicker.jsx';
import CustomNumberStepper from '../components/CustomNumberStepper.jsx';
import ChipListInput from '../components/ChipListInput.jsx';
import PlaceAutocomplete from '../components/PlaceAutocomplete.jsx';

// Each vehicle's own fuel/toll cost splits among its own occupants - a
// bike's cost splits 2 ways (rider + pillion), a car's 4 ways.
const VEHICLE_CAPACITY = { Bike: 2, Car: 4 };

const FUEL_TYPES = [
  { value: 'Petrol', label: 'Petrol' },
  { value: 'Diesel', label: 'Diesel' },
  { value: 'CNG', label: 'CNG' },
];

const TIPS = [
  'The vehicle count updates automatically as people join your group.',
  'Mention a clear pickup point so vehicles can group up before departure.',
  'Review join requests promptly so riders can plan their own vehicle.',
];

const EMPTY = {
  vehicleType: 'Bike', origin: '', viaStops: [], destination: '', startDate: '', endDate: '',
  budgetPerHead: '', pickupLocation: '', description: '',
};

export default function PlanGroupTrip() {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const canTrip = useCanTrip();
  const isMember = user?.membershipActive || user?.role === 'admin';
  const profileDone = user?.profileComplete || user?.role === 'admin';
  const canPlan = isMember && profileDone;

  const [form, setForm] = useState(EMPTY);
  const [groupTrips, setGroupTrips] = useState([]);
  const [busy, setBusy] = useState(false);

  // Cost estimator - a planning aid, not part of the group trip itself, so
  // it's kept separate from `form`. Same endpoint PlanTrip.jsx uses.
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

  const loadMine = () => api.get('/group-trips/my').then((r) => setGroupTrips(r.data.groupTrips)).catch(() => {});
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
    const capacity = VEHICLE_CAPACITY[form.vehicleType] || 1;
    const perHead = Math.round(costEstimate.totalCost / capacity);
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
    setBusy(true);
    try {
      await api.post('/group-trips', form);
      toast('fa-solid fa-people-group', 'Group trip posted!');
      setForm(EMPTY);
      loadMine();
    } catch (err) {
      if (!handleGateError(err, navigate)) toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!(await confirm({ message: 'Delete this group trip?', danger: true, confirmLabel: 'Delete' }))) return;
    try {
      await api.delete(`/group-trips/${id}`);
      toast('fa-solid fa-trash', 'Group trip deleted');
      loadMine();
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    }
  };

  return (
    <>
      <PageHero
        showBack
        tag="Ride Together"
        tagIcon="fa-solid fa-people-group"
        title="Plan a"
        highlight="Group Trip"
        sub="Bikers group, cars group - post your ride and we'll work out how many vehicles are needed as people join."
      />

      <section className="plan-page" style={{ paddingTop: 40 }}>
        <div className="container">
          <ProfileGateCard action="post trips" />

          <div className="detail-grid">
            <form className="card" style={{ padding: 20 }} onSubmit={submit}>
              <h3 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Group trip details</h3>

              <div className="form-group"><label>Group type *</label>
                <CustomSelect
                  value={form.vehicleType}
                  onChange={set('vehicleType')}
                  options={[{ value: 'Bike', label: 'Bikers Group' }, { value: 'Car', label: 'Cars Group' }]}
                />
              </div>

              <div className="form-group"><label>Starting from *</label><PlaceAutocomplete className="form-input" required value={form.origin} onChange={set('origin')} placeholder="e.g. Chandigarh" /></div>

              <div className="form-group">
                <label>Via stops (optional)</label>
                <ChipListInput values={form.viaStops} onChange={(viaStops) => setForm((f) => ({ ...f, viaStops }))} placeholder="e.g. Solan" />
              </div>

              <div className="form-group"><label>Destination *</label><PlaceAutocomplete className="form-input" required value={form.destination} onChange={set('destination')} placeholder="e.g. Manali" /></div>

              <div className="form-row">
                <div className="form-group"><label>Start date *</label><CustomDatePicker value={form.startDate} onChange={set('startDate')} min={todayISO()} /></div>
                <div className="form-group"><label>End date *</label><CustomDatePicker value={form.endDate} onChange={set('endDate')} min={form.startDate || todayISO()} /></div>
              </div>

              <div className="form-group">
                <label>Budget / head (₹) *</label>
                <CustomNumberStepper value={form.budgetPerHead || 0} onChange={set('budgetPerHead')} min={0} step={100} prefix="₹" />
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
                        ? `Uses the route distance and a bike's mileage to suggest a per-head fuel cost - each bike splits its own fuel among its ${VEHICLE_CAPACITY[form.vehicleType]} occupants (bikes are toll-exempt on most highways).`
                        : `Uses the route distance and a vehicle's mileage to suggest a per-head cost - each ${form.vehicleType.toLowerCase()} splits its own fuel & toll among its ${VEHICLE_CAPACITY[form.vehicleType]} occupants.`}
                    </p>
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: 14 }}>
                  <div className="form-group">
                    <label>Vehicle mileage (km/l)</label>
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
                      <span>Total (per {form.vehicleType.toLowerCase()})</span>
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
                      <i className="fa-solid fa-wand-magic-sparkles" /> Use {rupee(Math.round(costEstimate.totalCost / VEHICLE_CAPACITY[form.vehicleType]))}/head as budget
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group"><label>Pickup location</label><input className="form-input" value={form.pickupLocation} onChange={set('pickupLocation')} placeholder="Exact meeting point" /></div>
              <div className="form-group"><label>Description</label><textarea className="form-input" value={form.description} onChange={set('description')} placeholder="Plan, route, what to expect…" /></div>

              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={busy || !canPlan}>
                {busy ? <span className="spinner" /> : <i className="fa-solid fa-paper-plane" />} Post Group Trip
              </button>
            </form>

            <div>
              <div className="card" style={{ padding: 16, marginBottom: 20 }}>
                <h3 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>My group trips</h3>
                {groupTrips.length === 0 ? (
                  <div className="empty-state-sm"><i className="fa-solid fa-people-group" /><p>No group trips yet. Create your first!</p></div>
                ) : (
                  groupTrips.map((t) => (
                    <div key={t._id} className="notif-item" style={{ alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.9rem' }}>{routeLabel(t)}</strong>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{dateRange(t.startDate, t.endDate)}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {rupee(t.budgetPerHead)}/head · {t.currentHeadcount} traveler{t.currentHeadcount === 1 ? '' : 's'} · {t.vehiclesNeeded} {t.vehicleType.toLowerCase()}{t.vehiclesNeeded > 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/group-trips/${t._id}`} className="btn btn-sm btn-outline"><i className="fa-solid fa-eye" /></Link>
                        <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }} onClick={() => remove(t._id)}><i className="fa-solid fa-trash" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="card" style={{ padding: 16 }}>
                <h4 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}><i className="fa-solid fa-lightbulb" /> Tips</h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {TIPS.map((t) => (
                    <li key={t} style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}><i className="fa-solid fa-circle-check" style={{ color: 'var(--fire)' }} /> {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
