import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomDatePicker from './CustomDatePicker.jsx';
import CustomNumberStepper from './CustomNumberStepper.jsx';
import { useT } from '../i18n/index.js';

const todayISO = () => new Date().toISOString().slice(0, 10);

const TYPES = [
  { key: 'all', labelKey: 'homeSearchWidget.typeAll', icon: 'fa-solid fa-compass' },
  { key: 'bike', labelKey: 'homeSearchWidget.typeBike', icon: 'fa-solid fa-motorcycle' },
  { key: 'car', labelKey: 'homeSearchWidget.typeCar', icon: 'fa-solid fa-car' },
  { key: 'trek', labelKey: 'homeSearchWidget.typeTrek', icon: 'fa-solid fa-person-hiking' },
  { key: 'beach', labelKey: 'homeSearchWidget.typeBeach', icon: 'fa-solid fa-umbrella-beach' },
  { key: 'mountain', labelKey: 'homeSearchWidget.typeMountain', icon: 'fa-solid fa-mountain' },
  { key: 'couples', labelKey: 'homeSearchWidget.typeCouples', icon: 'fa-solid fa-heart' },
  { key: 'budget', labelKey: 'homeSearchWidget.typeBudget', icon: 'fa-solid fa-wallet' },
];

// The Home hero's "search box on the banner" widget - same OTA landing
// pattern as MakeMyTrip/EaseMyTrip, but it's just a new entry point into the
// existing /trips search (which already reads all of these from the URL).
export default function HomeSearchWidget() {
  const t = useT();
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
        {TYPES.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`hsw-type${type === opt.key ? ' active' : ''}`}
            onClick={() => setType(opt.key)}
          >
            <i className={opt.icon} /> {t(opt.labelKey)}
          </button>
        ))}
      </div>

      <form className="hsw-fields" onSubmit={search}>
        <div className="hsw-field">
          <label>{t('homeSearchWidget.leavingFrom')}</label>
          <div className="hsw-input">
            <i className="fa-regular fa-circle-dot" />
            <input placeholder={t('homeSearchWidget.anyCity')} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
        </div>
        <div className="hsw-field">
          <label>{t('homeSearchWidget.goingTo')}</label>
          <div className="hsw-input">
            <i className="fa-solid fa-location-dot" />
            <input placeholder={t('homeSearchWidget.anyDestination')} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="hsw-field">
          <label>{t('homeSearchWidget.date')}</label>
          <CustomDatePicker value={date} onChange={(e) => setDate(e.target.value)} min={todayISO()} placeholder={t('homeSearchWidget.anyDate')} />
        </div>
        <div className="hsw-field hsw-field-seats">
          <label>{t('homeSearchWidget.seats')}</label>
          <CustomNumberStepper value={seats} onChange={(e) => setSeats(e.target.value)} min={1} max={10} />
        </div>
        <button type="submit" className="btn btn-primary btn-lg hsw-search-btn">
          <i className="fa-solid fa-magnifying-glass" /> {t('homeSearchWidget.searchTrips')}
        </button>
      </form>
    </div>
  );
}
