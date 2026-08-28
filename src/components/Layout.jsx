import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, Link, NavLink } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import Toaster from './Toaster.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { useScrollReveal } from './useScrollReveal.js';
import { useAuth } from '../store/auth.js';

export default function Layout() {
  const mainRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const location = useLocation();
  const accessToken = useAuth((s) => s.accessToken);
  const user = useAuth((s) => s.user);
  // "My Profile" is just /members/:yourId (same page as anyone else's
  // profile) - without this, the bottom nav's route-prefix match lights up
  // "Members" instead of "Me" while viewing your own profile.
  const onOwnProfile =
    Boolean(user?.id) &&
    (location.pathname === `/members/${user.id}` || (user?.username && location.pathname === `/members/${user.username}`));

  // Scroll-triggered fade-ins read as sluggish rather than polished in the
  // logged-in mobile app views (Dashboard, Members slider, etc.) - skip
  // them there, but keep them for the public marketing pages / desktop.
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useScrollReveal(mainRef, Boolean(accessToken) && isMobile);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // An open chat thread (mobile) fills the screen with its own fixed
  // header/thread/composer layout - the bottom tab bar and FAB would just
  // sit on top of the message composer instead of adding anything useful.
  const isChatThreadOpen = /^\/chat\/[^/]+$/.test(location.pathname);
  // The whole Chat page (list or thread) is a fixed-height app view -
  // height: calc(100vh - ...) in app.scss - a footer below it would just
  // add unwanted page scroll rather than ever actually being reachable.
  const isChatPage = location.pathname.startsWith('/chat');

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
      {/* Desktop's two-pane chat layout keeps the site navbar - only the
          mobile full-screen thread view replaces it with the chat's own
          back/title header. */}
      {!(isChatThreadOpen && isMobile) && <Navbar />}

      <main ref={mainRef}>
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>

      {!isChatPage && (
        <div className={`footer-wrap${location.pathname === '/' ? ' is-home' : ''}`}>
          <Footer />
        </div>
      )}

      {!isChatThreadOpen && (
        <div className="fab-group">
          {/* WhatsApp FAB temporarily hidden along with the brand's mobile number.
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
          </div> */}
          <div style={{ position: 'relative' }}>
            <Link to="/plan-trip" className="fab fab-trip">
              <i className="fa-solid fa-map-location-dot" />
              <span className="fab-tooltip">Plan a Trip</span>
            </Link>
          </div>
        </div>
      )}

      {/* <button
        id="back-to-top"
        className={showTop ? 'visible' : ''}
        title="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <i className="fa-solid fa-arrow-up" />
      </button> */}

      {!isChatThreadOpen && (
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
            <NavLink to="/members" className={({ isActive }) => `bnav-item${isActive && !onOwnProfile ? ' active' : ''}`}>
              <i className="fa-solid fa-users" />
              <span>Members</span>
            </NavLink>
            {accessToken && (
              <NavLink to="/chat" className="bnav-item">
                <i className="fa-solid fa-comment-dots" />
                <span>Chat</span>
              </NavLink>
            )}
            <NavLink to={accessToken ? '/dashboard' : '/join'} className={({ isActive }) => `bnav-item${isActive || onOwnProfile ? ' active' : ''}`}>
              <i className="fa-solid fa-user-plus" />
              <span>{accessToken ? 'Me' : 'Join'}</span>
            </NavLink>
          </div>
        </nav>
      )}

      <Toaster />
      <ConfirmDialog />
    </>
  );
}
