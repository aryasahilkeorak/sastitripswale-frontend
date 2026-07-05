import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="nav-brand" style={{ fontSize: '1.4rem' }}>
              <div className="nav-brand-icon"><i className="fa-solid fa-motorcycle" /></div>
              <span className="nav-brand-text">SastiTripWale</span>
            </Link>
            <p>
              India's #1 travel community for bikers, car travelers &amp; backpackers. Travel
              together, split expenses, make lifelong friends.
            </p>
            <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-3)' }}>
              By <strong style={{ color: 'var(--fire-2)' }}>Arya Sahil Keorak</strong>
            </p>
            <div className="social-links" style={{ marginTop: 16 }}>
              <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
              <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
              <a href="#" aria-label="YouTube"><i className="fa-brands fa-youtube" /></a>
              <a href="https://wa.me/919876543210" aria-label="WhatsApp"><i className="fa-brands fa-whatsapp" /></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/trips">Upcoming Trips</Link></li>
              <li><Link to="/members">Members</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
              <li><Link to="/completed-trips">Completed Trips</Link></li>
              <li><Link to="/plan-trip">Plan a Trip</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Community</h4>
            <ul>
              <li><Link to="/join">Join Community</Link></li>
              <li><Link to="/testimonials">Reviews</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:hello@sastitripwale.com"><i className="fa-solid fa-envelope" /> hello@sastitripwale.com</a></li>
              <li><a href="tel:+919876543210"><i className="fa-solid fa-phone" /> +91 98765 43210</a></li>
              <li><a href="#"><i className="fa-solid fa-location-dot" /> Delhi, India</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 SastiTripWale.com · Made with <i className="fa-solid fa-heart" style={{ color: '#ff5a7a' }} /> by Arya Sahil Keorak</p>
          <p>Travel Together · Split Expenses · Make New Travel Friends</p>
        </div>
      </div>
    </footer>
  );
}
