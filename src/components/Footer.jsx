import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo.jsx';
import { SOCIAL_LINKS } from '../lib/seo.js';

// Google's no-API-key Maps URL API - opens the address as a search/pin
// rather than needing an embedded, billable Maps JS/Embed API key.
const OFFICE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Sector 119, Mohali, Punjab 160055')}`;

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="nav-brand">
              <BrandLogo variant="horizontal" />
            </Link>
            <p>
              India's #1 travel community for bikers, car travelers &amp; backpackers. Travel
              together, split expenses, make lifelong friends.
            </p>
            {/* <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-3)' }}>
              By <strong style={{ color: 'var(--fire-2)' }}>Arya Sahil Keorak</strong>
            </p> */}
            <div className="social-links" style={{ marginTop: 16 }}>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noreferrer" aria-label="YouTube"><i className="fa-brands fa-youtube" /></a>
              {/* WhatsApp temporarily hidden along with the brand's mobile number.
              <a href="https://wa.me/919876543210" aria-label="WhatsApp"><i className="fa-brands fa-whatsapp" /></a> */}
            </div>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/trips">Upcoming Trips</Link></li>
              <li><Link to="/clubs">Travel Clubs</Link></li>
              <li><Link to="/members">Members</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
              <li><Link to="/completed-trips">Completed Trips</Link></li>
              <li><Link to="/testimonials">Reviews</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Get Started</h4>
            <ul>
              <li><Link to="/join">Join Community</Link></li>
              <li><Link to="/plan-trip">Plan a Trip</Link></li>
              <li><Link to="/plan-group-trip">Plan a Group Trip</Link></li>
              <li><Link to="/plan-club">Create a Club</Link></li>
              <li><Link to="/influencers">Become an Influencer</Link></li>
              <li><Link to="/login">Log In</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              {/* Email temporarily hidden along with the brand's mobile number.
              <li><a href="mailto:hello@SastiTripsWale.com"><i className="fa-solid fa-envelope" />  info@sastitripswale.com</a></li> */}
              {/* <li><a href="tel:+919876543210"><i className="fa-solid fa-phone" /> +91 98765 43210</a></li> */}
              <li>
                <a href={OFFICE_MAPS_URL} target="_blank" rel="noreferrer">
                  <i className="fa-solid fa-location-dot" /> Sector 119, Mohali, Punjab 160055
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 SastiTripsWale.com 
            {/* · Made with <i className="fa-solid fa-heart" style={{ color: '#ff5a7a' }} /> by Arya Sahil Keorak */}
          </p>
          <p>Travel Together · Split Expenses · Make New Travel Friends</p>
        </div>
      </div>
    </footer>
  );
}
