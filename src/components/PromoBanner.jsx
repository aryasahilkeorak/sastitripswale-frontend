import { Link } from 'react-router-dom';

// Slim promotional strip - OTA-style "offer banner" placement, but the
// content is always a real, already-built feature (never invented copy).
export default function PromoBanner({ icon = 'fa-solid fa-gift', message, cta, to }) {
  return (
    <Link to={to} className="promo-banner">
      <span className="promo-banner-icon"><i className={icon} /></span>
      <span className="promo-banner-msg">{message}</span>
      <span className="promo-banner-cta">{cta} <i className="fa-solid fa-arrow-right" /></span>
    </Link>
  );
}
