import { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo.jsx';

const MIN_MS = 700;
const FADE_MS = 650; // matches the #preloader opacity transition duration in style.scss

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
        <i className="fa-solid fa-location-dot pre-pin" />
        <div className="pre-route-line" />
        <i className="fa-solid fa-plane pre-plane" />
        <i className="fa-solid fa-location-dot pre-pin" />
      </div>
      <div className="pre-logo-pulse">
        <BrandLogo variant="horizontal" />
      </div>
    </div>
  );
}
