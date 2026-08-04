import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomDatePicker from './CustomDatePicker.jsx';
import CustomNumberStepper from './CustomNumberStepper.jsx';

const todayISO = () => new Date().toISOString().slice(0, 10);

const TYPES = [
  { key: 'all', label: 'All', icon: 'fa-solid fa-compass' },
  { key: 'bike', label: 'Bike', icon: 'fa-solid fa-motorcycle' },
  { key: 'car', label: 'Car', icon: 'fa-solid fa-car' },
  { key: 'trek', label: 'Trek', icon: 'fa-solid fa-person-hiking' },
  { key: 'beach', label: 'Beach', icon: 'fa-solid fa-umbrella-beach' },
  { key: 'mountain', label: 'Mountain', icon: 'fa-solid fa-mountain' },
  { key: 'couples', label: 'Couples', icon: 'fa-solid fa-heart' },
  { key: 'budget', label: 'Under ₹3K', icon: 'fa-solid fa-wallet' },
];

// The Home hero's "search box on the banner" widget — same OTA landing
// pattern as MakeMyTrip/EaseMyTrip, but it's just a new entry point into the
// existing /trips search (which already reads all of these from the URL).
export default function HomeSearchWidget() {
  const navigate = useNavigate();
  const [type, setType] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [seats, setSeats] = useState(1);

  const search = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (type !== 'all') params.set('type', type);
    if (from.trim()) params.set('from', from.trim());
    if (to.trim()) params.set('to', to.trim());
    if (date) params.set('date', date);
    if (seats > 1) params.set('seats', String(seats));
    const qs = params.toString();
    navigate(qs ? `/trips?${qs}` : '/trips');
  };

  return (
    <div className="home-search-widget">
      <div className="hsw-types">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`hsw-type${type === t.key ? ' active' : ''}`}
            onClick={() => setType(t.key)}
          >
            <i className={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      <form className="hsw-fields" onSubmit={search}>
        <div className="hsw-field">
          <label>Leaving from</label>
          <div className="hsw-input">
            <i className="fa-regular fa-circle-dot" />
            <input placeholder="Any city" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
        </div>
        <div className="hsw-field">
          <label>Going to</label>
          <div className="hsw-input">
            <i className="fa-solid fa-location-dot" />
            <input placeholder="Any destination" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="hsw-field">
          <label>Date</label>
          <CustomDatePicker value={date} onChange={(e) => setDate(e.target.value)} min={todayISO()} placeholder="Any date" />
        </div>
        <div className="hsw-field hsw-field-seats">
          <label>Seats</label>
          <CustomNumberStepper value={seats} onChange={(e) => setSeats(e.target.value)} min={1} max={10} />
        </div>
        <button type="submit" className="btn btn-primary btn-lg hsw-search-btn">
          <i className="fa-solid fa-magnifying-glass" /> Search Trips
        </button>
      </form>
    </div>
  );
}
