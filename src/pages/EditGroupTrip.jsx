import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { toast } from '../lib/toast.js';
import { rupee, todayISO } from '../lib/helpers.js';
import { suggestMileageForUser } from '../lib/vehicleMileage.js';
import Loader from '../components/Loader.jsx';
import PageHero from '../components/PageHero.jsx';
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

const EMPTY = {
  vehicleType: 'Bike', origin: '', viaStops: [], destination: '', startDate: '', endDate: '',
  budgetPerHead: '', pickupLocation: '', description: '',
};

export default function EditGroupTrip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const [mileageKmpl, setMileageKmpl] = useState(() => suggestMileageForUser(user, '').kmpl);
  const [fuelType, setFuelType] = useState(() => suggestMileageForUser(user, '').fuelType);
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

  useEffect(() => {
    setLoading(true);
    api
      .get(`/group-trips/${id}`)
      .then((r) => {
        const t = r.data.groupTrip;
        setTrip(t);
        setForm({
          vehicleType: t.vehicleType || 'Bike',
          origin: t.origin || '',
          viaStops: t.viaStops || [],
          destination: t.destination || '',
          startDate: t.startDate ? t.startDate.slice(0, 10) : '',
          endDate: t.endDate ? t.endDate.slice(0, 10) : '',
          budgetPerHead: t.budgetPerHead || '',
          pickupLocation: t.pickupLocation || '',
          description: t.description || '',
        });
      })
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isOrganizer = user && trip?.organizer && String(trip.organizer._id) === String(user.id);
  const canEdit = isOrganizer || user?.role === 'admin' || user?.role === 'superadmin';

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
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast('fa-solid fa-triangle-exclamation', 'End date must be after start date');
      return;
    }
    setBusy(true);
    try {
      await api.put(`/group-trips/${id}`, form);
      toast('fa-solid fa-circle-check', 'Group trip updated!');
      navigate(`/group-trips/${id}`);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div style={{ paddingTop: 120 }}><Loader label="Loading group trip…" /></div>;
  if (!trip)
    return (
      <div className="empty-state" style={{ paddingTop: 160 }}>
        <i className="fa-solid fa-triangle-exclamation" />
        <p>Group trip not found.</p>
        <Link to="/trips?mode=group" className="btn btn-primary mt-3">Browse group trips</Link>
      </div>
    );
  if (!canEdit)
    return (
      <div className="empty-state" style={{ paddingTop: 160 }}>
        <i className="fa-solid fa-lock" />
        <p>Only the organizer can edit this group trip.</p>
        <Link to={`/group-trips/${id}`} className="btn btn-primary mt-3">Back to group trip</Link>
      </div>
    );

  return (
    <>
      <PageHero showBack tag="Organize" tagIcon="fa-solid fa-pen-to-square" title="Edit" highlight="Group Trip" sub="Update the route, dates or budget." />

      <section className="plan-page" style={{ paddingTop: 40 }}>
        <div className="container" style={{ maxWidth: 640 }}>
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

            <div style={{ display: 'flex', gap: 10 }}>
              <Link to={`/group-trips/${id}`} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</Link>
              <button className="btn btn-primary btn-lg" style={{ flex: 2, justifyContent: 'center' }} disabled={busy}>
                {busy ? <span className="spinner" /> : <i className="fa-solid fa-floppy-disk" />} Save Changes
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
