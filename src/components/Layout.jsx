import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, Link, NavLink } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import Toaster from './Toaster.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { useScrollReveal } from './useScrollReveal.js';
import { useAuth } from '../store/auth.js';

export default function Layout() {
  const mainRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const location = useLocation();
  const accessToken = useAuth((s) => s.accessToken);

  useScrollReveal(mainRef);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      const denom = document.body.scrollHeight - window.innerHeight;
      const p = denom > 0 ? (window.scrollY / denom) * 100 : 0;
      setProgress(p);
      setShowTop(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div id="scroll-progress" style={{ width: `${progress}%` }} />
      <Navbar />

      <main ref={mainRef}>
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>

      <Footer />

      <div className="fab-group">
        <div style={{ position: 'relative' }}>
          <a
            href="https://wa.me/919876543210?text=Hi! I want to know more about SastiTripsWale"
            target="_blank"
            rel="noreferrer"
            className="fab fab-wa"
          >
            <i className="fa-brands fa-whatsapp" />
            <span className="fab-tooltip">Chat on WhatsApp</span>
          </a>
        </div>
        <div style={{ position: 'relative' }}>
          <Link to="/plan-trip" className="fab fab-trip">
            <i className="fa-solid fa-map-location-dot" />
            <span className="fab-tooltip">Plan a Trip</span>
          </Link>
        </div>
      </div>

      <button
        id="back-to-top"
        className={showTop ? 'visible' : ''}
        title="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <i className="fa-solid fa-arrow-up" />
      </button>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <NavLink to="/" end className="bnav-item">
            <i className="fa-solid fa-house" />
            <span>Home</span>
          </NavLink>
          <NavLink to="/trips" className="bnav-item">
            <i className="fa-solid fa-compass" />
            <span>Trips</span>
          </NavLink>
          <NavLink to="/plan-trip" className="bnav-item">
            <i className="fa-solid fa-circle-plus" />
            <span>Plan</span>
          </NavLink>
          <NavLink to="/members" className="bnav-item">
            <i className="fa-solid fa-users" />
            <span>Members</span>
          </NavLink>
          {accessToken && (
            <NavLink to="/chat" className="bnav-item">
              <i className="fa-solid fa-comment-dots" />
              <span>Chat</span>
            </NavLink>
          )}
          <NavLink to={accessToken ? '/dashboard' : '/join'} className="bnav-item">
            <i className="fa-solid fa-user-plus" />
            <span>{accessToken ? 'Me' : 'Join'}</span>
          </NavLink>
        </div>
      </nav>

      <Toaster />
    </>
  );
}
