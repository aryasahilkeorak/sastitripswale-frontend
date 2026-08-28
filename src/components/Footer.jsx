import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo.jsx';
import { SOCIAL_LINKS } from '../lib/seo.js';
import { useT } from '../i18n/index.js';

// Google's no-API-key Maps URL API - opens the address as a search/pin
// rather than needing an embedded, billable Maps JS/Embed API key.
const OFFICE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Sector 119, Mohali, Punjab 160055')}`;

export default function Footer() {
  const t = useT();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="nav-brand">
              <BrandLogo variant="horizontal" />
            </Link>
            <p>{t('footer.tagline')}</p>
            <div className="social-links" style={{ marginTop: 16 }}>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noreferrer" aria-label="YouTube"><i className="fa-brands fa-youtube" /></a>
              {/* WhatsApp temporarily hidden along with the brand's mobile number.
              <a href="https://wa.me/919876543210" aria-label="WhatsApp"><i className="fa-brands fa-whatsapp" /></a> */}
            </div>
          </div>
          <div className="footer-col">
            <h4>{t('footer.exploreHeading')}</h4>
            <ul>
              <li><Link to="/">{t('nav.home')}</Link></li>
              <li><Link to="/trips">{t('footer.upcomingTrips')}</Link></li>
              <li><Link to="/clubs">{t('footer.travelClubs')}</Link></li>
              <li><Link to="/members">{t('nav.members')}</Link></li>
              <li><Link to="/gallery">{t('nav.gallery')}</Link></li>
              <li><Link to="/completed-trips">{t('nav.completedTrips')}</Link></li>
              <li><Link to="/testimonials">{t('footer.reviews')}</Link></li>
              <li><Link to="/pricing">{t('footer.pricing')}</Link></li>
              <li><Link to="/faq">{t('footer.faq')}</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t('footer.getStartedHeading')}</h4>
            <ul>
              <li><Link to="/join">{t('nav.joinCommunity')}</Link></li>
              <li><Link to="/plan-trip">{t('menu.planTrip')}</Link></li>
              <li><Link to="/plan-group-trip">{t('menu.planGroupTrip')}</Link></li>
              <li><Link to="/plan-club">{t('menu.createClub')}</Link></li>
              <li><Link to="/influencers">{t('footer.becomeInfluencer')}</Link></li>
              <li><Link to="/login">{t('footer.logIn')}</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t('footer.companyLegalHeading')}</h4>
            <ul>
              <li><Link to="/about">{t('footer.aboutUs')}</Link></li>
              <li><Link to="/how-it-works">{t('nav.howItWorks')}</Link></li>
              <li><Link to="/contact">{t('nav.contact')}</Link></li>
              <li><Link to="/terms">{t('footer.terms')}</Link></li>
              <li><Link to="/privacy">{t('footer.privacy')}</Link></li>
              <li><Link to="/refund-policy">{t('footer.refundPolicy')}</Link></li>
              <li><Link to="/shipping-policy">{t('footer.shippingPolicy')}</Link></li>
              <li><a href="mailto:support@sastitripswale.com"><i className="fa-solid fa-envelope" /> support@sastitripswale.com</a></li>
              {/* Phone temporarily hidden along with the brand's mobile number.
              <li><a href="tel:+919876543210"><i className="fa-solid fa-phone" /> +91 98765 43210</a></li> */}
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
          <p>{t('footer.footerTagline2')}</p>
        </div>
      </div>
    </footer>
  );
}
