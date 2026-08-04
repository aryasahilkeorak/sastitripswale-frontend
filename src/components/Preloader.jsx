import { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo.jsx';

const MIN_MS = 5000;
const FADE_MS = 650; // matches the #preloader opacity transition duration in style.scss

// Route arc shared with the `.pre-car` offset-path in style.scss —
// keep both in sync if this changes.
const ROUTE_PATH = 'M14 44 C 50 44 46 12 110 12 C 174 12 170 44 206 44';

// Shown until both a minimum splash time has elapsed AND the page has
// actually finished loading (images/fonts, not just the initial JS mount).
export default function Preloader() {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_MS));
    const pageLoad =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));

    Promise.all([minDelay, pageLoad]).then(() => {
      setHidden(true);
      setTimeout(() => setRemoved(true), FADE_MS);
    });
  }, []);

  if (removed) return null;

  return (
    <div id="preloader" className={hidden ? 'hidden' : ''} aria-hidden={hidden}>
      <div className="pre-route">
        <svg className="pre-route-svg" viewBox="0 0 220 60" aria-hidden="true">
          <path className="pre-route-path" d={ROUTE_PATH} />
        </svg>
        <span className="pre-pin pre-pin-start">
          <i className="fa-solid fa-location-dot" />
          <span className="pre-pin-ping" />
        </span>
        <span className="pre-pin pre-pin-end">
          <i className="fa-solid fa-location-dot" />
          <span className="pre-pin-ping" />
        </span>
        <i className="fa-solid fa-car-side pre-car" />
      </div>
      <div className="pre-logo-pulse">
        <BrandLogo variant="horizontal" />
      </div>
      <div className="pre-progress">
        <span />
      </div>
    </div>
  );
}
