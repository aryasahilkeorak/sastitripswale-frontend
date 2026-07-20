import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { toast } from '../lib/toast.js';
import Loader from '../components/Loader.jsx';
import PageHero from '../components/PageHero.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import CustomDatePicker from '../components/CustomDatePicker.jsx';
import CustomNumberStepper from '../components/CustomNumberStepper.jsx';
import ChipListInput from '../components/ChipListInput.jsx';

const EMPTY = {
  origin: '', viaStops: [], destination: '', startDate: '', endDate: '', budgetPerHead: '', totalSeats: 4,
  vehicleType: '', tripType: 'mixed', pickupLocation: '', description: '',
  isCouplesMode: false,
};

export default function EditTrip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const hasPartnerInfo = Boolean(user?.partnerMobile && user?.partnerDocUrl);

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/trips/${id}`)
      .then((r) => {
        const t = r.data.trip;
        setTrip(t);
        setForm({
          origin: t.origin || '',
          viaStops: t.viaStops || [],
          destination: t.destination || '',
          startDate: t.startDate ? t.startDate.slice(0, 10) : '',
          endDate: t.endDate ? t.endDate.slice(0, 10) : '',
          budgetPerHead: t.budgetPerHead || '',
          totalSeats: t.totalSeats || 4,
          vehicleType: t.vehicleType || '',
          tripType: t.tripType || 'mixed',
          pickupLocation: t.pickupLocation || '',
          description: t.description || '',
          isCouplesMode: Boolean(t.isCouplesMode),
        });
      })
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleCouplesMode = (e) => {
    const on = e.target.checked;
    setForm((f) => ({ ...f, isCouplesMode: on, vehicleType: on ? 'Car' : f.vehicleType }));
  };

  const isOrganizer = user && trip?.organizer && String(trip.organizer._id) === String(user.id);
  const canEdit = isOrganizer || user?.role === 'admin' || user?.role === 'superadmin';

  const submit = async (e) => {
    e.preventDefault();
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast('fa-solid fa-triangle-exclamation', 'End date must be after start date');
      return;
    }
    if (form.isCouplesMode && (Number(form.totalSeats) < 4 || Number(form.totalSeats) % 2 !== 0)) {
      toast('fa-solid fa-triangle-exclamation', 'Couples mode needs an even number of seats (4 or more)');
      return;
    }
    if (form.isCouplesMode && !trip.isCouplesMode && !hasPartnerInfo) {
      toast('fa-solid fa-triangle-exclamation', "Add your partner's mobile number and ID document in your profile first");
      return;
    }
    setBusy(true);
    try {
      await api.put(`/trips/${id}`, form);
      toast('fa-solid fa-circle-check', 'Trip updated!');
      navigate(`/trips/${id}`);
    } catch (err) {
      toast('fa-solid fa-circle-xmark', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div style={{ paddingTop: 120 }}><Loader label="Loading trip…" /></div>;
  if (!trip)
    return (
      <div className="empty-state" style={{ paddingTop: 160 }}>
        <i className="fa-solid fa-triangle-exclamation" />
        <p>Trip not found.</p>
        <Link to="/trips" className="btn btn-primary mt-3">Browse trips</Link>
      </div>
    );
  if (!canEdit)
    return (
      <div className="empty-state" style={{ paddingTop: 160 }}>
        <i className="fa-solid fa-lock" />
        <p>Only the trip organizer can edit this trip.</p>
        <Link to={`/trips/${id}`} className="btn btn-primary mt-3">Back to trip</Link>
      </div>
    );

  return (
    <>
      <PageHero tag="Organize" tagIcon="fa-solid fa-pen-to-square" title="Edit" highlight="Trip" sub="Update the route, dates, budget or seats for your trip." />

      <section className="plan-page" style={{ paddingTop: 40 }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <form className="card" style={{ padding: 28 }} onSubmit={submit}>
            <h3 className="mb-3" style={{ fontFamily: 'var(--font-display)' }}>Trip details</h3>

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
                For couples traveling together — needs a car with 4+ seats. Fuel &amp; toll cost splits between the host couple and joining couple(s).
              </p>
              {form.isCouplesMode && !trip.isCouplesMode && (
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

            <div style={{ display: 'flex', gap: 10 }}>
              <Link to={`/trips/${id}`} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancel</Link>
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
